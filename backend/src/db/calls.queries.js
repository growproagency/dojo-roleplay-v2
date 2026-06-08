import { supabase } from './supabase.js';

const CALLS_SELECT = 'id, user_id, school_id, scenario, difficulty, vapi_call_id, status, duration_seconds, recording_url, transcription, transcript_turns, cost_usd, cost_breakdown, created_at, updated_at, scorecards(overall_score), users(name, email)';

function toCall(row) {
  if (!row) return null;
  const sc = row.scorecards;
  const u = row.users;
  return {
    id: row.id,
    userId: row.user_id,
    schoolId: row.school_id ?? null,
    scenario: row.scenario,
    difficulty: row.difficulty,
    vapiCallId: row.vapi_call_id,
    status: row.status,
    durationSeconds: row.duration_seconds,
    recordingUrl: row.recording_url,
    transcription: row.transcription,
    transcriptTurns: row.transcript_turns,
    costUsd: row.cost_usd != null ? Number(row.cost_usd) : null,
    costBreakdown: row.cost_breakdown ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    overallScore: Array.isArray(sc) ? (sc[0]?.overall_score ?? null) : (sc?.overall_score ?? null),
    userName: Array.isArray(u) ? (u[0]?.name ?? null) : (u?.name ?? null),
    userEmail: Array.isArray(u) ? (u[0]?.email ?? null) : (u?.email ?? null),
  };
}

export async function findCallsByUser(userId) {
  const { data, error } = await supabase
    .from('calls')
    .select(CALLS_SELECT)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(100);
  if (error) throw error;
  return (data || []).map(toCall);
}

export async function findCallsBySchool(schoolId) {
  const { data, error } = await supabase
    .from('calls')
    .select(CALLS_SELECT)
    .eq('school_id', schoolId)
    .order('created_at', { ascending: false })
    .limit(100);
  if (error) throw error;
  return (data || []).map(toCall);
}

export async function findCallsBySchoolAndUser(schoolId, userId) {
  const { data, error } = await supabase
    .from('calls')
    .select(CALLS_SELECT)
    .eq('school_id', schoolId)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(100);
  if (error) throw error;
  return (data || []).map(toCall);
}

export async function getSchoolCallUsageSince(schoolId, since) {
  const { data, error } = await supabase
    .from('calls')
    .select('id, duration_seconds')
    .eq('school_id', schoolId)
    .gte('created_at', since.toISOString())
    .limit(10000);
  if (error) throw error;
  const rows = data || [];
  return {
    calls: rows.length,
    durationSeconds: rows.reduce((sum, row) => sum + Number(row.duration_seconds || 0), 0),
  };
}

export async function findUsageCalls() {
  const { data, error } = await supabase
    .from('calls')
    .select('id, user_id, school_id, scenario, difficulty, status, duration_seconds, cost_usd, created_at, scorecards(overall_score), users(name, email)')
    .order('created_at', { ascending: false })
    .limit(10000);
  if (error) throw error;
  return (data || []).map(toCall);
}

export async function findCallById(id) {
  const DETAIL_SELECT = 'id, user_id, school_id, scenario, difficulty, vapi_call_id, status, duration_seconds, recording_url, transcription, transcript_turns, cost_usd, cost_breakdown, created_at, updated_at, users(name, email)';
  const { data, error } = await supabase
    .from('calls')
    .select(DETAIL_SELECT)
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const u = data.users;
  return {
    id: data.id,
    userId: data.user_id,
    schoolId: data.school_id ?? null,
    scenario: data.scenario,
    difficulty: data.difficulty,
    vapiCallId: data.vapi_call_id,
    status: data.status,
    durationSeconds: data.duration_seconds,
    recordingUrl: data.recording_url,
    transcription: data.transcription,
    transcriptTurns: data.transcript_turns,
    costUsd: data.cost_usd != null ? Number(data.cost_usd) : null,
    costBreakdown: data.cost_breakdown ?? null,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    userName: Array.isArray(u) ? (u[0]?.name ?? null) : (u?.name ?? null),
    userEmail: Array.isArray(u) ? (u[0]?.email ?? null) : (u?.email ?? null),
  };
}

export async function findCallByVapiId(vapiCallId) {
  const { data, error } = await supabase
    .from('calls')
    .select('id, user_id, school_id, scenario, difficulty, vapi_call_id, status, transcription, transcript_turns, cost_usd')
    .eq('vapi_call_id', vapiCallId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return {
    id: data.id,
    userId: data.user_id,
    schoolId: data.school_id ?? null,
    scenario: data.scenario,
    difficulty: data.difficulty,
    vapiCallId: data.vapi_call_id,
    status: data.status,
    transcription: data.transcription,
    transcriptTurns: data.transcript_turns,
    costUsd: data.cost_usd != null ? Number(data.cost_usd) : null,
  };
}

export async function insertCall(fields) {
  const row = {
    user_id: fields.userId,
    scenario: fields.scenario,
    difficulty: fields.difficulty,
    vapi_call_id: fields.vapiCallId ?? null,
    status: fields.status ?? 'in_progress',
  };
  if (fields.schoolId != null) row.school_id = fields.schoolId;
  const { data, error } = await supabase
    .from('calls')
    .insert(row)
    .select('id')
    .single();
  if (error) throw error;
  return data.id;
}

export async function updateCall(id, fields) {
  const keyMap = {
    status: 'status',
    durationSeconds: 'duration_seconds',
    recordingUrl: 'recording_url',
    transcription: 'transcription',
    transcriptTurns: 'transcript_turns',
    costUsd: 'cost_usd',
    costBreakdown: 'cost_breakdown',
    vapiCallId: 'vapi_call_id',
  };
  const row = {};
  for (const [k, v] of Object.entries(fields)) {
    if (v === undefined) continue;
    row[keyMap[k] ?? k] = v;
  }
  if (Object.keys(row).length === 0) return;
  const { error } = await supabase.from('calls').update(row).eq('id', id);
  if (error) throw error;
}
