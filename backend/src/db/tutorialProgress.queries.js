import { supabase } from './supabase.js';

const COLS = 'id, user_id, tutorial_key, tutorial_version, status, current_step, completed_at, created_at, updated_at';

function toProgress(row) {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    tutorialKey: row.tutorial_key,
    tutorialVersion: row.tutorial_version,
    status: row.status,
    currentStep: row.current_step,
    completedAt: row.completed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function findTutorialProgress(userId, tutorialKey, tutorialVersion) {
  const { data, error } = await supabase
    .from('user_tutorial_progress')
    .select(COLS)
    .eq('user_id', userId)
    .eq('tutorial_key', tutorialKey)
    .eq('tutorial_version', tutorialVersion)
    .maybeSingle();
  if (error) throw error;
  return toProgress(data);
}

export async function upsertTutorialProgress(userId, tutorialKey, tutorialVersion, fields) {
  const row = {
    user_id: userId,
    tutorial_key: tutorialKey,
    tutorial_version: tutorialVersion,
    status: fields.status,
    current_step: fields.currentStep,
    completed_at: fields.status === 'completed' ? new Date().toISOString() : null,
  };
  const { data, error } = await supabase
    .from('user_tutorial_progress')
    .upsert(row, { onConflict: 'user_id,tutorial_key,tutorial_version' })
    .select(COLS)
    .single();
  if (error) throw error;
  return toProgress(data);
}

