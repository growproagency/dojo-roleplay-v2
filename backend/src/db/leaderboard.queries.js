import { supabase } from './supabase.js';

export async function findLeaderboardAggregates({ schoolId, scenario, difficulty, fromDate, offset = 0 }) {
  const { data, error } = await supabase.rpc('leaderboard_aggregates', {
    p_school_id: schoolId, p_scenario: scenario, p_difficulty: difficulty,
    p_from: fromDate, p_offset: offset,
  }).select('user_id, user_name, user_email, school_id, difficulty_stats, last_call_at').limit(100);
  if (error) throw error;
  return data || [];
}
