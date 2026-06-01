import { supabase } from './supabase.js';

const EVENT_COLS = 'id, source, event_type, external_id, payload, status, error_message, school_id, invite_id, created_at, updated_at';

function toAutomationEvent(row) {
  if (!row) return null;
  return {
    id: row.id,
    source: row.source,
    eventType: row.event_type,
    externalId: row.external_id,
    payload: row.payload,
    status: row.status,
    errorMessage: row.error_message,
    schoolId: row.school_id,
    inviteId: row.invite_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function insertAutomationEvent(fields) {
  const { data, error } = await supabase
    .from('automation_events')
    .insert({
      source: fields.source,
      event_type: fields.eventType,
      external_id: fields.externalId ?? null,
      payload: fields.payload ?? {},
      status: fields.status ?? 'received',
      error_message: fields.errorMessage ?? null,
      school_id: fields.schoolId ?? null,
      invite_id: fields.inviteId ?? null,
    })
    .select(EVENT_COLS)
    .single();
  if (error) throw error;
  return toAutomationEvent(data);
}

export async function updateAutomationEvent(id, fields) {
  const row = {};
  if (fields.status !== undefined) row.status = fields.status;
  if (fields.errorMessage !== undefined) row.error_message = fields.errorMessage;
  if (fields.schoolId !== undefined) row.school_id = fields.schoolId;
  if (fields.inviteId !== undefined) row.invite_id = fields.inviteId;
  const { error } = await supabase.from('automation_events').update(row).eq('id', id);
  if (error) throw error;
}
