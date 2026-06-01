import { supabase } from './supabase.js';

export async function logPhoneCallAttempt({ callerNumber, vapiCallId, userId, schoolId, outcome }) {
  const { error } = await supabase.from('phone_call_attempts').insert({
    caller_number: callerNumber,
    vapi_call_id: vapiCallId ?? null,
    user_id: userId ?? null,
    school_id: schoolId ?? null,
    outcome,
  });
  if (error) throw error;
}

export async function countRecentPhoneAttempts(callerNumber, minutes = 60) {
  const since = new Date(Date.now() - minutes * 60 * 1000).toISOString();
  const { count, error } = await supabase
    .from('phone_call_attempts')
    .select('id', { count: 'exact', head: true })
    .eq('caller_number', callerNumber)
    .gte('created_at', since)
    .limit(100);
  if (error) throw error;
  return count ?? 0;
}
