import { DIFFICULTY_MULTIPLIERS } from './leaderboardRules.js';

const round = value => Math.round((value + Number.EPSILON) * 10) / 10;
const average = values => values.length ? round(values.reduce((sum, value) => sum + value, 0) / values.length) : null;
const single = value => Array.isArray(value) ? value[0] : value;
const validScore = value => typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 100;
const difficultyFor = call => ['easy', 'medium', 'hard'].includes(call.difficulty) ? call.difficulty : 'legacy';
export const scorecardFor = call => single(call.scorecards);

export function localDateKey(date, timezone) {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date(date));
  const part = type => parts.find(p => p.type === type).value;
  return `${part('year')}-${part('month')}-${part('day')}`;
}

export function shiftMonth(month, offset) {
  const [year, number] = month.split('-').map(Number);
  return new Date(Date.UTC(year, number - 1 + offset, 1)).toISOString().slice(0, 7);
}

export function reportPeriod(month, timezone, now = new Date()) {
  const currentMonth = localDateKey(now, timezone).slice(0, 7);
  const selected = month ?? shiftMonth(currentMonth, -1);
  if (selected > currentMonth) throw new Error('VALIDATION');
  const previous = shiftMonth(selected, -1);
  // Fetch a padded UTC window; local month classification below handles DST and UTC offsets.
  const from = new Date(Date.parse(`${previous}-01T00:00:00Z`) - 2 * 86400000).toISOString();
  const until = new Date(Date.parse(`${shiftMonth(selected, 1)}-01T00:00:00Z`) + 2 * 86400000).toISOString();
  return { month: selected, previousMonth: previous, timezone, from, until,
    label: new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${selected}-01T12:00:00Z`)),
    monthName: new Intl.DateTimeFormat('en-US', { month: 'long', timeZone: 'UTC' }).format(new Date(`${selected}-01T12:00:00Z`)),
    monthToDate: selected === currentMonth, generatedAt: new Date(now).toISOString() };
}

export function callsInMonth(calls, month, timezone, now = new Date()) {
  return calls.filter(call => new Date(call.created_at) <= now && localDateKey(call.created_at, timezone).startsWith(month));
}

export function summarizeActivity(calls, timezone) {
  const scored = calls.filter(call => call.status === 'scored' && validScore(scorecardFor(call)?.overall_score));
  const scores = scored.map(call => scorecardFor(call).overall_score);
  const difficulty = ['easy', 'medium', 'hard', 'legacy'].map(level => {
    const matching = calls.filter(call => difficultyFor(call) === level);
    const rated = scored.filter(call => difficultyFor(call) === level);
    return { difficulty: level, calls: matching.length, scoredCalls: rated.length,
      avgScore: average(rated.map(call => scorecardFor(call).overall_score)) };
  });
  return {
    callsMade: calls.length, completedCalls: calls.filter(call => ['completed', 'scoring', 'scored'].includes(call.status)).length,
    failedCalls: calls.filter(call => call.status === 'failed').length, scoredCalls: scored.length,
    minutesUsed: round(calls.reduce((sum, call) => sum + (Number.isFinite(call.duration_seconds) ? Math.max(0, call.duration_seconds) : 0), 0) / 60),
    missingDurations: calls.filter(call => !Number.isFinite(call.duration_seconds)).length,
    activeDays: new Set(calls.map(call => localDateKey(call.created_at, timezone))).size,
    avgScore: average(scores), bestScore: scores.length ? Math.max(...scores) : null,
    avgPoints: average(scored.map(call => scorecardFor(call).overall_score * DIFFICULTY_MULTIPLIERS[difficultyFor(call)])),
    limitedData: scored.length < 5, difficulty,
  };
}

function feedbackItems(calls, field, eligibleIds = null) {
  const items = new Map();
  for (const call of calls) {
    if (eligibleIds && !eligibleIds.has(call.id)) continue;
    const values = scorecardFor(call)?.[field];
    for (const text of Array.isArray(values) ? values : []) {
      if (typeof text !== 'string' || !text.trim()) continue;
      const key = text.trim().toLowerCase();
      if (!items.has(key)) items.set(key, { text: text.trim(), callIds: [] });
      const item = items.get(key);
      if (!item.callIds.includes(call.id)) item.callIds.push(call.id);
    }
  }
  return [...items.values()].sort((a, b) => b.callIds.length - a.callIds.length).slice(0, 3)
    .map(item => ({ ...item, occurrences: item.callIds.length, callIds: item.callIds.slice(0, 3) }));
}

export function summarizeCoaching(calls) {
  const scored = calls.filter(call => call.status === 'scored' && validScore(scorecardFor(call)?.overall_score));
  const groups = new Map();
  for (const call of scored) {
    const categories = scorecardFor(call).categories;
    for (const cat of Array.isArray(categories) ? categories : []) {
      if (!cat || typeof cat.name !== 'string' || typeof cat.score !== 'number' || !Number.isFinite(cat.score) || cat.score < 0 || cat.score > 10) continue;
      const key = `${call.scenario}:${cat.name.trim().toLowerCase()}`;
      if (!groups.has(key)) groups.set(key, { category: cat.name, scenario: call.scenario_title || call.scenario, scores: [], callIds: new Set() });
      const group = groups.get(key);
      if (!group.callIds.has(call.id)) { group.scores.push(cat.score); group.callIds.add(call.id); }
    }
  }
  const categories = [...groups.values()].map(group => ({ category: group.category, scenario: group.scenario,
    avgScore: average(group.scores), sampleSize: group.callIds.size, callIds: [...group.callIds].slice(0, 3) }));
  const strengths = categories.filter(c => c.avgScore >= 7).sort((a, b) => b.avgScore - a.avgScore || b.sampleSize - a.sampleSize).slice(0, 3);
  const improvements = categories.filter(c => c.avgScore < 7).sort((a, b) => a.avgScore - b.avgScore || b.sampleSize - a.sampleSize).slice(0, 3);
  const weakCalls = new Set(improvements.flatMap(item => item.callIds));
  return { strengths, improvements, highlights: feedbackItems(scored, 'highlights'),
    missedOpportunities: feedbackItems(scored, 'missed_opportunities'),
    nextSteps: feedbackItems(scored, 'suggestions', weakCalls.size ? weakCalls : null) };
}

export function compareActivity(current, previous) {
  const delta = key => previous.callsMade && current[key] != null && previous[key] != null ? round(current[key] - previous[key]) : null;
  return { hasPreviousActivity: previous.callsMade > 0, callsMade: delta('callsMade'), minutesUsed: delta('minutesUsed'),
    avgScore: delta('avgScore'), avgPoints: delta('avgPoints') };
}
