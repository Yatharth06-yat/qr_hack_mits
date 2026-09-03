const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();
const QRCode = require('qrcode');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
// Serve the React production build from dist/
app.use(express.static(path.join(__dirname, 'dist')));

let supabase = null;

// Database setup (Local SQLite Database)
const dbPath = path.join(__dirname, 'hackathon.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  // Teams Table
  db.run(`
    CREATE TABLE IF NOT EXISTS teams (
      id TEXT PRIMARY KEY,
      team_code TEXT UNIQUE NOT NULL,
      team_name TEXT NOT NULL,
      college_name TEXT NOT NULL,
      leader_name TEXT NOT NULL,
      leader_email TEXT NOT NULL,
      leader_phone TEXT,
      qr_token TEXT UNIQUE NOT NULL,
      registration_verified INTEGER DEFAULT 0,
      goibibo_registered INTEGER DEFAULT 0,
      food_token_issued INTEGER DEFAULT 0,
      kit_issued INTEGER DEFAULT 0,
      undertaking_completed INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Team Members Table
  db.run(`
    CREATE TABLE IF NOT EXISTS team_members (
      id TEXT PRIMARY KEY,
      team_id TEXT NOT NULL,
      member_code TEXT,
      name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      is_present INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (team_id) REFERENCES teams (id) ON DELETE CASCADE
    )
  `);

  // Documents Table
  db.run(`
    CREATE TABLE IF NOT EXISTS documents (
      id TEXT PRIMARY KEY,
      team_id TEXT NOT NULL,
      document_type TEXT NOT NULL,
      version INTEGER DEFAULT 1,
      storage_path TEXT,
      file_name TEXT,
      status TEXT DEFAULT 'submitted',
      rejection_reason TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      approved_at DATETIME,
      FOREIGN KEY (team_id) REFERENCES teams (id) ON DELETE CASCADE
    )
  `);

  // Audit Logs Table
  db.run(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      team_id TEXT,
      user_id TEXT,
      action TEXT NOT NULL,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
});

// Helper functions for DB queries
function dbAll(query, params = []) {
  return new Promise((resolve, reject) => {
    db.all(query, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

function dbGet(query, params = []) {
  return new Promise((resolve, reject) => {
    db.get(query, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

function dbRun(query, params = []) {
  return new Promise((resolve, reject) => {
    db.run(query, params, function (err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

function generateId() {
  return 'uuid-' + Math.random().toString(36).substr(2, 9) + '-' + Date.now().toString(36);
}

function generateQrToken() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let token = 'HACK-';
  for (let i = 0; i < 10; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

async function logAudit(team_id, user_id, action, description) {
  const id = generateId();
  if (supabase) {
    try {
      await supabase.from('audit_logs').insert([{ id, team_id: team_id || null, user_id: user_id || 'Staff_System', action, description }]);
    } catch (e) {}
  }
  dbRun(
    `INSERT INTO audit_logs (id, team_id, user_id, action, description, created_at) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
    [id, team_id || null, user_id || 'Staff_System', action, description]
  ).catch(console.error);
}

// ----------------------------------------------------
// API ROUTES
// ----------------------------------------------------

// 1. Get All Teams
app.get('/api/teams', async (req, res) => {
  try {
    if (supabase) {
      const { data: teams, error } = await supabase.from('teams').select('*').order('created_at', { ascending: false });
      if (!error && teams) {
        for (let team of teams) {
          const { data: members } = await supabase.from('team_members').select('*').eq('team_id', team.id);
          const { data: documents } = await supabase.from('documents').select('*').eq('team_id', team.id);
          team.members = members || [];
          team.documents = documents || [];
        }
        return res.json({ success: true, teams });
      }
    }

    const teams = await dbAll(`SELECT * FROM teams ORDER BY created_at DESC`);
    for (let team of teams) {
      team.members = await dbAll(`SELECT * FROM team_members WHERE team_id = ?`, [team.id]);
      team.documents = await dbAll(`SELECT * FROM documents WHERE team_id = ?`, [team.id]);
    }
    res.json({ success: true, teams });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch teams' });
  }
});

// 2. Register Team
app.post('/api/register', async (req, res) => {
  try {
    const { team_name, college_name, leader_name, leader_email, leader_phone, members } = req.body;

    if (!team_name || !college_name || !leader_name || !leader_email) {
      return res.status(400).json({ success: false, error: 'Missing required team fields' });
    }

    const teamCountRow = await dbGet(`SELECT COUNT(*) as count FROM teams`);
    const nextNum = (teamCountRow ? teamCountRow.count : 0) + 1;
    const team_code = `HACK-${String(nextNum).padStart(3, '0')}`;
    const qr_token = generateQrToken();
    const team_id = generateId();

    const newTeamPayload = {
      id: team_id,
      team_code,
      team_name,
      college_name,
      leader_name,
      leader_email,
      leader_phone: leader_phone || '',
      qr_token
    };

    if (supabase) {
      await supabase.from('teams').insert([newTeamPayload]);
    }

    await dbRun(
      `INSERT INTO teams (id, team_code, team_name, college_name, leader_name, leader_email, leader_phone, qr_token)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [team_id, team_code, team_name, college_name, leader_name, leader_email, leader_phone || '', qr_token]
    );

    const memberList = members && members.length > 0 ? members : [{ name: leader_name, email: leader_email, phone: leader_phone }];
    for (let i = 0; i < memberList.length; i++) {
      const m = memberList[i];
      const member_id = generateId();
      const member_code = `${team_code}-M${i + 1}`;
      const memPayload = { id: member_id, team_id, member_code, name: m.name, email: m.email || '', phone: m.phone || '' };

      if (supabase) {
        await supabase.from('team_members').insert([memPayload]);
      }
      await dbRun(
        `INSERT INTO team_members (id, team_id, member_code, name, email, phone) VALUES (?, ?, ?, ?, ?, ?)`,
        [member_id, team_id, member_code, m.name, m.email || '', m.phone || '']
      );
    }

    logAudit(team_id, 'System', 'TEAM_REGISTERED', `Registered team ${team_name} (${team_code}) with QR token ${qr_token}`);

    const newTeam = await dbGet(`SELECT * FROM teams WHERE id = ?`, [team_id]);
    newTeam.members = await dbAll(`SELECT * FROM team_members WHERE team_id = ?`, [team_id]);

    res.json({ success: true, team: newTeam });
  } catch (error) {
    console.error('Registration Error:', error);
    res.status(500).json({ success: false, error: 'Team registration failed' });
  }
});

// 3. QR Token Scan Endpoint
app.post('/api/scan', async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ success: false, error: 'QR token is required' });
    }

    const cleanToken = token.trim();
    let team = null;

    if (supabase) {
      const { data } = await supabase.from('teams').select('*').or(`qr_token.eq.${cleanToken},team_code.eq.${cleanToken}`).maybeSingle();
      if (data) team = data;
    }

    if (!team) {
      team = await dbGet(`SELECT * FROM teams WHERE qr_token = ? OR team_code = ?`, [cleanToken, cleanToken]);
    }

    if (!team) {
      return res.status(404).json({
        success: false,
        error: 'Invalid QR Code',
        message: 'No registered team was found for this QR code.'
      });
    }

    let members = [];
    let documents = [];

    if (supabase) {
      const { data: mData } = await supabase.from('team_members').select('*').eq('team_id', team.id);
      const { data: dData } = await supabase.from('documents').select('*').eq('team_id', team.id);
      members = mData || [];
      documents = dData || [];
    }

    if (!members.length) members = await dbAll(`SELECT * FROM team_members WHERE team_id = ?`, [team.id]);
    if (!documents.length) documents = await dbAll(`SELECT * FROM documents WHERE team_id = ? ORDER BY created_at DESC`, [team.id]);

    logAudit(team.id, req.body.staff_id || 'Staff_Desk', 'QR_SCANNED', `Scanned QR token ${cleanToken} for team ${team.team_name}`);

    res.json({
      success: true,
      team,
      members,
      documents
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      error: 'Invalid QR Code',
      message: 'No registered team was found for this QR code.'
    });
  }
});

// 4. Backup Team Search
app.get('/api/search', async (req, res) => {
  try {
    const query = (req.query.q || '').trim();
    if (!query) {
      return res.json({ success: true, teams: [] });
    }

    const searchTerm = `%${query}%`;
    const teams = await dbAll(
      `SELECT * FROM teams WHERE 
       team_code LIKE ? OR 
       team_name LIKE ? OR 
       leader_name LIKE ? OR 
       college_name LIKE ? OR 
       leader_email LIKE ?
       ORDER BY team_code ASC LIMIT 20`,
      [searchTerm, searchTerm, searchTerm, searchTerm, searchTerm]
    );

    for (let team of teams) {
      team.members = await dbAll(`SELECT * FROM team_members WHERE team_id = ?`, [team.id]);
    }

    res.json({ success: true, teams });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Search failed' });
  }
});

// 5. Update Checkpoints (Immediate Persistence)
app.post('/api/checkpoints', async (req, res) => {
  try {
    const { team_id, checkpoint, value, staff_id } = req.body;
    const team = await dbGet(`SELECT * FROM teams WHERE id = ?`, [team_id]);
    if (team && checkpoint) {
      const val = value ? 1 : 0;
      await dbRun(`UPDATE teams SET ${checkpoint} = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [val, team_id]);
      logAudit(team_id, staff_id || 'Staff_Desk', 'CHECKPOINT_UPDATED', `Updated ${checkpoint} -> ${value ? 'TRUE' : 'FALSE'} for ${team.team_name}`);
      const updatedTeam = await dbGet(`SELECT * FROM teams WHERE id = ?`, [team_id]);
      return res.json({ success: true, team: updatedTeam });
    }
    res.status(400).json({ success: false, error: 'Invalid checkpoint request' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.patch('/api/teams/:id/checkpoints', async (req, res) => {
  try {
    const teamId = req.params.id;
    const team = await dbGet(`SELECT * FROM teams WHERE id = ?`, [teamId]);
    if (!team) {
      return res.status(404).json({ success: false, error: 'Team not found' });
    }

    const {
      registration_verified,
      goibibo_registered,
      food_token_issued,
      kit_issued,
      undertaking_completed,
      staff_id
    } = req.body;

    const updates = [];
    const params = [];
    const sbUpdates = {};
    const changedFields = [];

    if (registration_verified !== undefined) {
      const val = registration_verified ? 1 : 0;
      updates.push('registration_verified = ?');
      params.push(val);
      sbUpdates.registration_verified = registration_verified;
      if (team.registration_verified !== val) changedFields.push(`Registration Verified -> ${val ? 'TRUE' : 'FALSE'}`);
    }
    if (goibibo_registered !== undefined) {
      const val = goibibo_registered ? 1 : 0;
      updates.push('goibibo_registered = ?');
      params.push(val);
      sbUpdates.goibibo_registered = goibibo_registered;
      if (team.goibibo_registered !== val) changedFields.push(`Goibibo Registration -> ${val ? 'TRUE' : 'FALSE'}`);
    }
    if (food_token_issued !== undefined) {
      const val = food_token_issued ? 1 : 0;
      updates.push('food_token_issued = ?');
      params.push(val);
      sbUpdates.food_token_issued = food_token_issued;
      if (team.food_token_issued !== val) changedFields.push(`Food Token Issued -> ${val ? 'TRUE' : 'FALSE'}`);
    }
    if (kit_issued !== undefined) {
      const val = kit_issued ? 1 : 0;
      updates.push('kit_issued = ?');
      params.push(val);
      sbUpdates.kit_issued = kit_issued;
      if (team.kit_issued !== val) changedFields.push(`Kit Issued -> ${val ? 'TRUE' : 'FALSE'}`);
    }
    if (undertaking_completed !== undefined) {
      const val = undertaking_completed ? 1 : 0;
      updates.push('undertaking_completed = ?');
      params.push(val);
      sbUpdates.undertaking_completed = undertaking_completed;
      if (team.undertaking_completed !== val) changedFields.push(`Undertaking Completed -> ${val ? 'TRUE' : 'FALSE'}`);
    }

    if (updates.length > 0) {
      updates.push('updated_at = CURRENT_TIMESTAMP');
      params.push(teamId);

      if (supabase && Object.keys(sbUpdates).length > 0) {
        await supabase.from('teams').update(sbUpdates).eq('id', teamId);
      }

      await dbRun(`UPDATE teams SET ${updates.join(', ')} WHERE id = ?`, params);

      if (changedFields.length > 0) {
        logAudit(teamId, staff_id || 'Staff_Desk', 'CHECKPOINTS_UPDATED', `Updated checkpoints: ${changedFields.join(', ')}`);
      }
    }

    const updatedTeam = await dbGet(`SELECT * FROM teams WHERE id = ?`, [teamId]);
    updatedTeam.members = await dbAll(`SELECT * FROM team_members WHERE team_id = ?`, [teamId]);
    res.json({ success: true, team: updatedTeam });
  } catch (error) {
    console.error('Update checkpoints error:', error);
    res.status(500).json({ success: false, error: 'Failed to update checkpoints' });
  }
});

// 6. Update Member Attendance
app.patch('/api/teams/:id/attendance', async (req, res) => {
  try {
    const teamId = req.params.id;
    const { member_id, is_present, mark_all, staff_id } = req.body;

    if (mark_all) {
      if (supabase) {
        await supabase.from('team_members').update({ is_present: true }).eq('team_id', teamId);
      }
      await dbRun(`UPDATE team_members SET is_present = 1, updated_at = CURRENT_TIMESTAMP WHERE team_id = ?`, [teamId]);
      logAudit(teamId, staff_id || 'Staff_Desk', 'ATTENDANCE_MARKED_ALL_PRESENT', 'Marked all team members present');
    } else if (member_id !== undefined) {
      const val = is_present ? 1 : 0;
      if (supabase) {
        await supabase.from('team_members').update({ is_present: !!is_present }).eq('id', member_id);
      }
      await dbRun(`UPDATE team_members SET is_present = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND team_id = ?`, [val, member_id, teamId]);
      const member = await dbGet(`SELECT * FROM team_members WHERE id = ?`, [member_id]);
      logAudit(teamId, staff_id || 'Staff_Desk', 'ATTENDANCE_UPDATED', `Marked member ${member ? member.name : member_id} as ${val ? 'PRESENT' : 'ABSENT'}`);
    }

    const members = await dbAll(`SELECT * FROM team_members WHERE team_id = ?`, [teamId]);
    res.json({ success: true, members });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update attendance' });
  }
});

// 7. Generate Ticket & QR Image
app.get('/api/teams/:id/ticket', async (req, res) => {
  try {
    const teamId = req.params.id;
    const team = await dbGet(`SELECT * FROM teams WHERE id = ? OR team_code = ?`, [teamId, teamId]);
    if (!team) {
      return res.status(404).json({ success: false, error: 'Team not found' });
    }

    const members = await dbAll(`SELECT * FROM team_members WHERE team_id = ?`, [team.id]);
    
    const qrDataUrl = await QRCode.toDataURL(team.qr_token, {
      errorCorrectionLevel: 'H',
      margin: 2,
      scale: 8,
      color: { dark: '#0f172a', light: '#ffffff' }
    });

    res.json({
      success: true,
      ticket: {
        team_id: team.id,
        team_code: team.team_code,
        team_name: team.team_name,
        college_name: team.college_name,
        leader_name: team.leader_name,
        leader_email: team.leader_email,
        qr_token: team.qr_token,
        qr_data_url: qrDataUrl,
        members: members.map(m => m.name)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to generate ticket' });
  }
});

// 8. Submit Document (Health / Discipline Form)
app.post('/api/teams/:id/documents', async (req, res) => {
  try {
    const teamId = req.params.id;
    const { document_type } = req.body;

    if (!document_type || !['health', 'discipline'].includes(document_type)) {
      return res.status(400).json({ success: false, error: 'Invalid document type' });
    }

    const existing = await dbGet(
      `SELECT COUNT(*) as count FROM documents WHERE team_id = ? AND document_type = ?`,
      [teamId, document_type]
    );
    const version = (existing ? existing.count : 0) + 1;
    const doc_id = generateId();
    const fileName = `${teamId}_${document_type}_v${version}.json`;
    const storagePath = `documents/${teamId}/${fileName}`;

    if (supabase) {
      await supabase.from('documents').insert([{ id: doc_id, team_id: teamId, document_type, version, storage_path: storagePath, file_name: fileName, status: 'submitted' }]);
    }

    await dbRun(
      `INSERT INTO documents (id, team_id, document_type, version, storage_path, file_name, status)
       VALUES (?, ?, ?, ?, ?, ?, 'submitted')`,
      [doc_id, teamId, document_type, version, storagePath, fileName]
    );

    logAudit(teamId, 'Team_Leader', 'DOCUMENT_SUBMITTED', `Submitted ${document_type} form version ${version}`);

    const doc = await dbGet(`SELECT * FROM documents WHERE id = ?`, [doc_id]);
    res.json({ success: true, document: doc });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Document submission failed' });
  }
});

// 9. Document Review (Approve / Reject)
app.patch('/api/documents/:id/status', async (req, res) => {
  try {
    const docId = req.params.id;
    const { status, rejection_reason, staff_id } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid status' });
    }

    const doc = await dbGet(`SELECT * FROM documents WHERE id = ?`, [docId]);
    if (!doc) {
      return res.status(404).json({ success: false, error: 'Document not found' });
    }

    const approved_at = status === 'approved' ? new Date().toISOString() : null;
    const reason = status === 'rejected' ? (rejection_reason || 'Information incomplete or missing signature.') : null;

    if (supabase) {
      await supabase.from('documents').update({ status, rejection_reason: reason, approved_at }).eq('id', docId);
    }

    await dbRun(
      `UPDATE documents SET status = ?, rejection_reason = ?, approved_at = ? WHERE id = ?`,
      [status, reason, approved_at, docId]
    );

    logAudit(
      doc.team_id,
      staff_id || 'Admin',
      status === 'approved' ? 'DOCUMENT_APPROVED' : 'DOCUMENT_REJECTED',
      `${doc.document_type.toUpperCase()} form v${doc.version} ${status.toUpperCase()}${reason ? ': ' + reason : ''}`
    );

    const updatedDoc = await dbGet(`SELECT * FROM documents WHERE id = ?`, [docId]);
    res.json({ success: true, document: updatedDoc });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update document status' });
  }
});

// 10. Dashboard Stats Overview
app.get('/api/stats', async (req, res) => {
  try {
    const totalTeams = await dbGet(`SELECT COUNT(*) as count FROM teams`);
    const regVerified = await dbGet(`SELECT COUNT(*) as count FROM teams WHERE registration_verified = 1`);
    const goibiboReg = await dbGet(`SELECT COUNT(*) as count FROM teams WHERE goibibo_registered = 1`);
    const foodIssued = await dbGet(`SELECT COUNT(*) as count FROM teams WHERE food_token_issued = 1`);
    const kitIssued = await dbGet(`SELECT COUNT(*) as count FROM teams WHERE kit_issued = 1`);
    const undertakingComp = await dbGet(`SELECT COUNT(*) as count FROM teams WHERE undertaking_completed = 1`);

    res.json({
      success: true,
      stats: {
        total_teams: totalTeams ? totalTeams.count : 0,
        registration_verified: regVerified ? regVerified.count : 0,
        goibibo_registered: goibiboReg ? goibiboReg.count : 0,
        food_token_issued: foodIssued ? foodIssued.count : 0,
        kit_issued: kitIssued ? kitIssued.count : 0,
        undertaking_completed: undertakingComp ? undertakingComp.count : 0
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to load stats' });
  }
});

// 11. Audit Logs Endpoint
app.get('/api/audit-logs', async (req, res) => {
  try {
    const logs = await dbAll(`SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 50`);
    res.json({ success: true, logs });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch audit logs' });
  }
});

// Catch-all route to serve React SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Hackathon Check-In System server running at http://localhost:${PORT}`);
});
