import { supabase } from './supabase.js';

const LEADERBOARD_CALL_COLS = 'id, user_id, school_id, scenario, status, created_at, users!inner(name, email)';

export async function findLeaderboardCalls({ schoolId, scenario, fromDate, isGlobalAdmin }) {
  let query = supabase
    .from('calls')
    .select(LEADERBOARD_CALL_COLS)
    .order('created_at', { ascending: false })
    .limit(1000);

  if (schoolId) query = query.eq('school_id', schoolId);
  if (!isGlobalAdmin && !schoolId) query = query.limit(0);
  if (scenario) query = query.eq('scenario', scenario);
  if (fromDate) query = query.gte('created_at', fromDate);

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function findLeaderboardScorecards() {
  const { data, error } = await supabase
    .from('scorecards')
    .select('call_id, overall_score')
    .limit(10000);
  if (error) throw error;
  return data || [];
}
