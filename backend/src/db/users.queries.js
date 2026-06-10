import { supabase } from './supabase.js';

const USER_COLS = 'id, email, name, role, avatar_url, school_id, phone_number, supabase_auth_id, created_at, updated_at, last_signed_in';

export function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function toUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role,
    avatarUrl: row.avatar_url,
    schoolId: row.school_id ?? null,
    phoneNumber: row.phone_number ?? null,
    supabaseAuthId: row.supabase_auth_id ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lastSignedIn: row.last_signed_in,
  };
}

export async function findUserById(id) {
  const { data, error } = await supabase
    .from('users')
    .select(USER_COLS)
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return toUser(data);
}

export async function findUserByEmail(email) {
  const normalizedEmail = normalizeEmail(email);
  const { data, error } = await supabase
    .from('users')
    .select(USER_COLS)
    .eq('email', normalizedEmail)
    .maybeSingle();
  if (error) throw error;
  return toUser(data);
}

export async function findUserByPhoneNumber(phone) {
  const normalized = normalizePhoneNumber(phone);
  const candidates = [...new Set([phone, normalized].filter(Boolean))];
  const { data, error } = await supabase
    .from('users')
    .select(USER_COLS)
    .in('phone_number', candidates)
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return toUser(data);
}

function normalizePhoneNumber(phone) {
  if (!phone) return null;
  const trimmed = String(phone).trim();
  if (trimmed.startsWith('+')) return `+${trimmed.slice(1).replace(/\D/g, '')}`;
  const digits = trimmed.replace(/\D/g, '');
  return digits ? `+${digits}` : null;
}

export async function findUsersBySchool(schoolId) {
  const { data, error } = await supabase
    .from('users')
    .select(USER_COLS)
    .eq('school_id', schoolId)
    .order('created_at', { ascending: true })
    .limit(100);
  if (error) throw error;
  return (data || []).map(toUser);
}

export async function findGlobalAdminUsers() {
  const { data, error } = await supabase
    .from('users')
    .select(USER_COLS)
    .in('role', ['global_admin', 'admin'])
    .order('created_at', { ascending: true })
    .limit(100);
  if (error) throw error;
  return (data || []).map(toUser);
}

export async function upsertUser(fields) {
  const row = { email: normalizeEmail(fields.email) };
  if (fields.name !== undefined) row.name = fields.name;
  if (fields.role !== undefined) row.role = fields.role;
  if (fields.avatarUrl !== undefined) row.avatar_url = fields.avatarUrl;
  if (fields.schoolId !== undefined) row.school_id = fields.schoolId;
  if (fields.phoneNumber !== undefined) row.phone_number = fields.phoneNumber || null;
  if (fields.supabaseAuthId !== undefined) row.supabase_auth_id = fields.supabaseAuthId;
  row.last_signed_in = fields.lastSignedIn ?? new Date().toISOString();
  const { error } = await supabase.from('users').upsert(row, { onConflict: 'email' });
  if (error) throw error;
}

export async function updateUser(id, fields) {
  const row = {};
  if (fields.name !== undefined) row.name = fields.name;
  if (fields.phoneNumber !== undefined) row.phone_number = fields.phoneNumber || null;
  if (fields.role !== undefined) row.role = fields.role;
  if (fields.schoolId !== undefined) row.school_id = fields.schoolId;
  if (Object.keys(row).length === 0) return;
  const { error } = await supabase.from('users').update(row).eq('id', id);
  if (error) throw error;
}

export async function removeUserFromSchool(userId) {
  const { error } = await supabase
    .from('users')
    .update({ school_id: null })
    .eq('id', userId);
  if (error) throw error;
}
