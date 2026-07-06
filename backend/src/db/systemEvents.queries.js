import { supabase } from './supabase.js';

const SYSTEM_EVENT_COLS = 'id, source, event_type, severity, status, message, details, user_id, school_id, call_id, external_id, created_at, resolved_at';

function toSystemEvent(row) {
  if (!row) return null;
  return {
    id: row.id,
    source: row.source,
    eventType: row.event_type,
    severity: row.severity,
    status: row.status,
    message: row.message,
    details: row.details ?? {},
    userId: row.user_id,
    schoolId: row.school_id,
    callId: row.call_id,
    externalId: row.external_id,
    createdAt: row.created_at,
    resolvedAt: row.resolved_at,
  };
}

export async function insertSystemEvent(fields) {
  const { data, error } = await supabase
    .from('system_events')
    .insert({
      source: fields.source,
      event_type: fields.eventType,
      severity: fields.severity ?? 'error',
      status: fields.status ?? 'open',
      message: fields.message,
      details: fields.details ?? {},
      user_id: fields.userId ?? null,
      school_id: fields.schoolId ?? null,
      call_id: fields.callId ?? null,
      external_id: fields.externalId ?? null,
    })
    .select(SYSTEM_EVENT_COLS)
    .single();
  if (error) throw error;
  return toSystemEvent(data);
}

export async function findSystemEvents({ status, source, severity, schoolId, callId, limit = 50 } = {}) {
  let query = supabase
    .from('system_events')
    .select(SYSTEM_EVENT_COLS)
    .order('created_at', { ascending: false })
    .limit(Math.min(Math.max(Number(limit) || 50, 1), 100));

  if (status) query = query.eq('status', status);
  if (source) query = query.eq('source', source);
  if (severity) query = query.eq('severity', severity);
  if (schoolId) query = query.eq('school_id', schoolId);
  if (callId) query = query.eq('call_id', callId);

  const { data, error } = await query;
  if (error) throw error;
  return (data || []).map(toSystemEvent);
}

export async function findSystemEventById(id) {
  const { data, error } = await supabase
    .from('system_events')
    .select(SYSTEM_EVENT_COLS)
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return toSystemEvent(data);
}

export async function resolveSystemEvent(id) {
  const { error } = await supabase
    .from('system_events')
    .update({ status: 'resolved', resolved_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}
