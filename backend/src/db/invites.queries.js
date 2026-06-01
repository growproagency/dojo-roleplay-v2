import { supabase } from './supabase.js';
import { randomBytes } from 'node:crypto';

const INVITE_COLS = 'id, school_id, email, full_name, role, token, invited_by, expires_at, accepted_at, revoked_at, created_at';

function toInvite(row) {
  if (!row) return null;
  return {
    id: row.id,
    schoolId: row.school_id,
    email: row.email,
    fullName: row.full_name ?? null,
    role: row.role,
    token: row.token,
    invitedBy: row.invited_by,
    expiresAt: row.expires_at,
    acceptedAt: row.accepted_at,
    revokedAt: row.revoked_at,
    createdAt: row.created_at,
  };
}

export async function findInvitesBySchool(schoolId) {
  const { data, error } = await supabase
    .from('school_invites')
    .select(INVITE_COLS)
    .eq('school_id', schoolId)
    .is('accepted_at', null)
    .is('revoked_at', null)
    .order('created_at', { ascending: false })
    .limit(100);
  if (error) throw error;
  return (data || []).map(toInvite);
}

export async function findPlatformInvites() {
  const { data, error } = await supabase
    .from('school_invites')
    .select(INVITE_COLS)
    .is('school_id', null)
    .eq('role', 'global_admin')
    .is('accepted_at', null)
    .is('revoked_at', null)
    .order('created_at', { ascending: false })
    .limit(100);
  if (error) throw error;
  return (data || []).map(toInvite);
}

export async function findInviteByToken(token) {
  const { data, error } = await supabase
    .from('school_invites')
    .select(INVITE_COLS)
    .eq('token', token)
    .maybeSingle();
  if (error) throw error;
  return toInvite(data);
}

export async function findOpenInviteBySchoolAndEmail(schoolId, email) {
  const { data, error } = await supabase
    .from('school_invites')
    .select(INVITE_COLS)
    .eq('school_id', schoolId)
    .eq('email', email)
    .is('accepted_at', null)
    .is('revoked_at', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return toInvite(data);
}

export async function findOpenPlatformInviteByEmail(email) {
  const { data, error } = await supabase
    .from('school_invites')
    .select(INVITE_COLS)
    .is('school_id', null)
    .eq('role', 'global_admin')
    .eq('email', email)
    .is('accepted_at', null)
    .is('revoked_at', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return toInvite(data);
}

export async function insertInvite(fields) {
  const token = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from('school_invites')
    .insert({
      school_id: fields.schoolId,
      email: fields.email,
      full_name: fields.fullName ?? null,
      role: fields.role ?? 'staff',
      token,
      invited_by: fields.invitedBy,
      expires_at: expiresAt,
    })
    .select(INVITE_COLS)
    .single();
  if (error) throw error;
  return toInvite(data);
}

export async function updateInvite(id, fields) {
  const row = {};
  if (fields.fullName !== undefined) row.full_name = fields.fullName;
  const { error } = await supabase.from('school_invites').update(row).eq('id', id);
  if (error) throw error;
}

export async function revokeInvite(id, schoolId) {
  const { error } = await supabase
    .from('school_invites')
    .update({ revoked_at: new Date().toISOString() })
    .eq('id', id)
    .eq('school_id', schoolId);
  if (error) throw error;
}

export async function revokePlatformInvite(id) {
  const { error } = await supabase
    .from('school_invites')
    .update({ revoked_at: new Date().toISOString() })
    .eq('id', id)
    .is('school_id', null)
    .eq('role', 'global_admin');
  if (error) throw error;
}

export async function acceptInvite(token) {
  const { error } = await supabase
    .from('school_invites')
    .update({ accepted_at: new Date().toISOString() })
    .eq('token', token);
  if (error) throw error;
}
