import { createClient } from '@supabase/supabase-js';
import * as XLSX from 'xlsx';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://hsjgkrqlxtlcmbvpambz.supabase.co';
const SUPABASE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_Ldx3ZsgJCub1tzLo2xAbNw_vgN0goK3';

async function exportCertificates() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  console.log('Fetching teams and participants from Supabase...');
  const { data: teams, error: tErr } = await supabase.from('teams').select('*').order('created_at', { ascending: true });
  const { data: members, error: mErr } = await supabase.from('team_members').select('*').order('created_at', { ascending: true });

  if (tErr || mErr) {
    console.error('Error fetching data:', tErr || mErr);
    process.exit(1);
  }

  const teamMap = new Map();
  teams.forEach(t => teamMap.set(t.id, t));

  const rows = [];
  let sNo = 1;

  for (const m of members) {
    const team = teamMap.get(m.team_id) || {};
    const certId = m.id ? `CERT-${m.id.substring(0, 8).toUpperCase()}` : 'CERT-UNKNOWN';

    rows.push({
      'S.No.': sNo++,
      'Certificate ID': certId,
      'Participant Name': m.name || '',
      'Team Name': team.team_name || 'N/A',
      'Team Code': team.team_code || team.team_id || 'N/A',
      'College': team.college_name || 'N/A',
      'Email': m.email && m.email !== 'Not Provided' ? m.email : (team.leader_email || ''),
      'Phone': m.phone && m.phone !== 'Not Provided' ? m.phone : (team.leader_phone || ''),
      'Verification Status': m.registration_verified ? 'Verified' : 'Pending',
      'Issue Date': '2026-09-12',
      'Member UUID': m.id
    });
  }

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);

  ws['!cols'] = [
    { wch: 6 },   // S.No.
    { wch: 18 },  // Certificate ID
    { wch: 28 },  // Participant Name
    { wch: 26 },  // Team Name
    { wch: 14 },  // Team Code
    { wch: 35 },  // College
    { wch: 28 },  // Email
    { wch: 16 },  // Phone
    { wch: 20 },  // Verification Status
    { wch: 14 },  // Issue Date
    { wch: 38 },  // Member UUID
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Participant Certificates');

  const outputPath = path.join(__dirname, 'hackathon_participants_certificate_ids.xlsx');
  XLSX.writeFile(wb, outputPath);

  console.log(`\n✅ Successfully exported ${rows.length} certificates to:`);
  console.log(`   ${outputPath}\n`);
}

exportCertificates();
