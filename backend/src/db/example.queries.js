// db/example.queries.js
// Database access layer — Supabase calls only.
// No business logic, no HTTP concerns.
// If you ever swap Supabase for another database, this is the only file you change.
//
// Replace "example" with your resource name (e.g. posts.queries.js).
import { supabase } from './supabase.js';

export const findAll = async ({ limit = 20, offset = 0 }) => {
  const { data, error, count } = await supabase
    .from('examples') // replace with your table name
    .select('id, title, body, created_at, user_id', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;
  return { data, count };
};

export const findById = async (id) => {
  const { data, error } = await supabase
    .from('examples')
    .select('id, title, body, created_at, user_id')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
};

export const findByUserId = async (userId, { limit = 20, offset = 0 }) => {
  const { data, error, count } = await supabase
    .from('examples')
    .select('id, title, body, created_at', { count: 'exact' })
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;
  return { data, count };
};

export const insert = async (record) => {
  const { data, error } = await supabase
    .from('examples')
    .insert(record)
    .select('id, title, body, created_at, user_id')
    .single();

  if (error) throw error;
  return data;
};

export const update = async (id, updates) => {
  const { data, error } = await supabase
    .from('examples')
    .update(updates)
    .eq('id', id)
    .select('id, title, body, created_at, user_id')
    .single();

  if (error) throw error;
  return data;
};

export const remove = async (id) => {
  const { error } = await supabase
    .from('examples')
    .delete()
    .eq('id', id);

  if (error) throw error;
};
