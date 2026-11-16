import { supabase } from './supabase.js';

export async function findReportSchool(schoolId) {
  const { data, error } = await supabase.from('schools')
    .select('id, name, reporting_timezone').eq('id', schoolId).maybeSingle();
  if (error) throw error;
  return data;
}

export async function updateReportingTimezone(schoolId, timezone) {
  const { error } = await supabase.from('schools').update({ reporting_timezone: timezone }).eq('id', schoolId);
  if (error) throw error;
}

export async function findReportMembers(schoolId, offset = 0) {
  const { data, error } = await supabase.from('users').select('id, name, email')
    .eq('school_id', schoolId).order('id').range(offset, offset + 99).limit(100);
  if (error) throw error;
  return data || [];
}

export async function findReportCalls({ schoolId, userId, from, until, offset = 0 }) {
  let query = supabase.from('calls')
    .select('id, user_id, school_id, scenario, scenario_title, difficulty, status, duration_seconds, created_at, users(name, email), scorecards(overall_score, categories, highlights, missed_opportunities, suggestions)')
    .eq('school_id', schoolId).gte('created_at', from).lt('created_at', until)
    .order('id').range(offset, offset + 99).limit(100);
  if (userId) query = query.eq('user_id', userId);
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}
