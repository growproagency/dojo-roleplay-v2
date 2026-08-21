import { supabase } from './supabase.js';

const COLUMNS = 'id, school_id, user_id, email, category, subject, message, page_url, status, created_at, updated_at';

export async function findSupportRequestsByUser(userId, limit = 20) {
  const { data, error } = await supabase.from('support_requests').select(COLUMNS)
    .eq('user_id', userId).order('created_at', { ascending: false }).limit(Math.min(limit, 100));
  if (error) throw error;
  return data;
}

export async function insertSupportRequest(record) {
  const { data, error } = await supabase.from('support_requests').insert(record).select(COLUMNS).single();
  if (error) throw error;
  return data;
}

export async function findAllSupportRequests({ status, limit = 100 } = {}) {
  let query = supabase.from('support_requests').select(`${COLUMNS}, schools(name)`)
    .order('created_at', { ascending: false }).limit(Math.min(limit, 100));
  if (status) query = query.eq('status', status);
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function updateSupportRequestById(id, updates) {
  const { data, error } = await supabase.from('support_requests')
    .update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id)
    .select(`${COLUMNS}, schools(name)`).single();
  if (error) throw error;
  return data;
}
