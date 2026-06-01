import { supabase } from './supabase.js';

const SCORECARD_COLS = 'id, call_id, overall_score, categories, highlights, missed_opportunities, suggestions, summary, created_at';

function toScorecard(row) {
  if (!row) return null;
  return {
    id: row.id,
    callId: row.call_id,
    overallScore: row.overall_score,
    categories: row.categories,
    highlights: row.highlights,
    missedOpportunities: row.missed_opportunities,
    suggestions: row.suggestions,
    summary: row.summary,
    createdAt: row.created_at,
  };
}

export async function findScorecardByCallId(callId) {
  const { data, error } = await supabase
    .from('scorecards')
    .select(SCORECARD_COLS)
    .eq('call_id', callId)
    .maybeSingle();
  if (error) throw error;
  return toScorecard(data);
}

export async function insertScorecard(fields) {
  const { data, error } = await supabase
    .from('scorecards')
    .insert({
      call_id: fields.callId,
      overall_score: fields.overallScore,
      categories: fields.categories,
      highlights: fields.highlights,
      missed_opportunities: fields.missedOpportunities,
      suggestions: fields.suggestions,
      summary: fields.summary ?? null,
      model: fields.model ?? null,
      cost_usd: fields.costUsd ?? null,
    })
    .select('id')
    .single();
  if (error) throw error;
  return data.id;
}
