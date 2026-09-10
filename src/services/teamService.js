import { supabase } from '../lib/supabaseClient';

// 1. Fetch all teams from Supabase
export async function getAllTeams() {
  try {
    const { data: teams, error } = await supabase
      .from('teams')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && teams && teams.length > 0) {
      const { data: members } = await supabase.from('team_members').select('*');
      return teams.map(t => ({
        ...t,
        members: (members || []).filter(m => m.team_id === t.id)
      }));
    }
  } catch (e) {}

  const res = await fetch('/api/teams');
  const json = await res.json();
  return json.teams || [];
}

export const getTeams = getAllTeams;

// 2. Query public.teams where qr_token = scannedToken
export async function getTeamByQrToken(qrToken) {
  if (!qrToken) return null;
  const cleanToken = qrToken.trim();
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanToken);

  try {
    if (isUuid) {
      const { data: team, error } = await supabase
        .from('teams')
        .select('*')
        .eq('qr_token', cleanToken)
        .maybeSingle();

      if (!error && team) return team;
    } else {
      const { data: teamCodeMatch } = await supabase
        .from('teams')
        .select('*')
        .or(`team_code.eq.${cleanToken},team_id.eq.${cleanToken}`)
        .maybeSingle();

      if (teamCodeMatch) return teamCodeMatch;
    }
  } catch (e) {}

  try {
    const res = await fetch('/api/scan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: cleanToken })
    });
    const json = await res.json();
    if (res.ok && json.success) return json.team;
  } catch (e) {}

  return null;
}

export const getTeamByQr = getTeamByQrToken;

// 3. Query public.team_members where team_id = teams.id UUID
export async function getTeamMembers(teamUuid) {
  if (!teamUuid) return [];

  try {
    const { data: members, error } = await supabase
      .from('team_members')
      .select('*')
      .eq('team_id', teamUuid);

    if (!error && members) {
      return members;
    }
  } catch (e) {}

  const res = await fetch('/api/teams');
  const json = await res.json();
  const team = (json.teams || []).find(t => t.id === teamUuid);
  return team ? team.members || [] : [];
}

// 4. Combined Team + Members relational lookup flow
export async function getTeamWithMembersByQrToken(qrToken) {
  const team = await getTeamByQrToken(qrToken);
  if (!team) return null;

  const members = await getTeamMembers(team.id);
  return {
    ...team,
    members: members || []
  };
}

// 5. Query team by UUID id
export async function getTeamById(id) {
  try {
    const { data: team, error } = await supabase
      .from('teams')
      .select('*')
      .eq('id', id)
      .single();

    if (!error && team) {
      const members = await getTeamMembers(id);
      return { ...team, members: members || [] };
    }
  } catch (e) {}

  const res = await fetch(`/api/teams`);
  const json = await res.json();
  const found = (json.teams || []).find(t => t.id === id);
  return found || null;
}

// 6. Search Teams (by TEAM-2026-XXXX, Team Name, College, Leader, Email)
export async function searchTeams(query) {
  if (!query) return getAllTeams();

  const term = `%${query}%`;
  try {
    const { data: teams, error } = await supabase
      .from('teams')
      .select('*')
      .or(`team_code.ilike.${term},team_id.ilike.${term},team_name.ilike.${term},college_name.ilike.${term},leader_name.ilike.${term},leader_email.ilike.${term}`)
      .order('created_at', { ascending: false });

    if (!error && teams) {
      const { data: members } = await supabase.from('team_members').select('*');
      return (teams || []).map(t => ({
        ...t,
        members: (members || []).filter(m => m.team_id === t.id)
      }));
    }
  } catch (e) {}

  const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
  const json = await res.json();
  return json.teams || [];
}

// 7. Update Member Checkpoint — writes to team_members, then syncs teams table
export async function updateCheckpoint(memberId, teamId, checkpointField, value) {
  const isMemberUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(memberId);
  const isTeamUuid   = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(teamId);

  if (!isMemberUuid) {
    console.warn('updateCheckpoint: invalid member UUID', memberId);
    return null;
  }

  const now = new Date().toISOString();

  // Step 1: update the member row
  const { error: memberErr } = await supabase
    .from('team_members')
    .update({ [checkpointField]: value, updated_at: now })
    .eq('id', memberId);

  if (memberErr) {
    console.error('team_members update failed:', memberErr.message);
    throw new Error(memberErr.message);
  }

  // Step 2: recalculate team-level value — true if ANY member has it ticked
  if (isTeamUuid) {
    const { data: allMembers } = await supabase
      .from('team_members')
      .select(`id, ${checkpointField}`)
      .eq('team_id', teamId);

    const teamValue = (allMembers || []).some(
      m => m[checkpointField] === true || m[checkpointField] === 1
    );

    await supabase
      .from('teams')
      .update({ [checkpointField]: teamValue, updated_at: now })
      .eq('id', teamId);
  }

  return true;
}

// 7b. Toggle Team & Members Presence Status
export async function toggleTeamPresence(teamId, newStatus) {
  const now = new Date().toISOString();
  try {
    await supabase
      .from('teams')
      .update({ registration_verified: newStatus, updated_at: now })
      .eq('id', teamId);

    await supabase
      .from('team_members')
      .update({ registration_verified: newStatus, is_present: newStatus, updated_at: now })
      .eq('team_id', teamId);

    return true;
  } catch (e) {
    console.error('toggleTeamPresence failed:', e);
    return false;
  }
}

// 8. Import Teams Batch
export async function importTeams(teamRows) {
  let successCount = 0;
  let failCount = 0;

  for (const row of teamRows) {
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          team_name: row.team_name,
          college_name: row.college_name,
          leader_name: row.leader_name,
          leader_email: row.leader_email,
          leader_phone: row.leader_phone || '',
          members: row.members || []
        })
      });
      if (res.ok) {
        successCount++;
      } else {
        failCount++;
      }
    } catch (e) {
      failCount++;
    }
  }

  return { total: teamRows.length, success: successCount, failed: failCount };
}

// 9. Get Dashboard Statistics
export async function getDashboardStats() {
  try {
    const { data: teams, error } = await supabase.from('teams').select('*');
    if (!error && teams) {
      const { data: members } = await supabase.from('team_members').select('*');
      return {
        totalTeams: teams.length,
        totalMembers: members ? members.length : 0,
        regVerified: teams.filter(t => t.registration_verified).length,
        goibibo: teams.filter(t => t.goibibo_registered).length,
        foodToken: teams.filter(t => t.food_token_issued).length,
        kitIssued: teams.filter(t => t.kit_issued).length,
        undertaking: teams.filter(t => t.undertaking_completed).length
      };
    }
  } catch (e) {}

  const res = await fetch('/api/stats');
  const json = await res.json();
  return {
    totalTeams: json.stats?.total_teams || 0,
    totalMembers: 0,
    regVerified: json.stats?.registration_verified || 0,
    goibibo: json.stats?.goibibo_registered || 0,
    foodToken: json.stats?.food_token_issued || 0,
    kitIssued: json.stats?.kit_issued || 0,
    undertaking: json.stats?.undertaking_completed || 0
  };
}
