import { DIFFICULTY_MULTIPLIERS, MINIMUM_SCORED_CALLS } from '../utils/leaderboardRules.js';
export { DIFFICULTY_MULTIPLIERS, MINIMUM_SCORED_CALLS };
const round = value => Math.round((value + Number.EPSILON) * 10) / 10;

export function resolveLeaderboardFilters({ schoolId, isGlobalAdmin, filters }, now = Date.now()) {
  const days = { '7d': 7, '30d': 30, '90d': 90 }[filters.range ?? '30d'];
  return {
    schoolId: isGlobalAdmin ? (schoolId ?? filters.schoolId ?? null) : schoolId,
    scenario: filters.scenario ?? null, difficulty: filters.difficulty ?? null,
    fromDate: filters.from ?? (days ? new Date(now - days * 86400000).toISOString() : null),
  };
}

function summarize(row) {
  const counts = { easy: 0, medium: 0, hard: 0, legacy: 0 };
  let scoredCalls = 0, scoreSum = 0, pointSum = 0, bestScore = null;
  for (const stat of row.difficulty_stats) {
    const difficulty = Object.hasOwn(counts, stat.difficulty) ? stat.difficulty : 'legacy';
    const count = Number(stat.call_count);
    counts[difficulty] += count;
    scoredCalls += count;
    scoreSum += Number(stat.score_sum);
    pointSum += Number(stat.score_sum) * DIFFICULTY_MULTIPLIERS[difficulty];
    bestScore = Math.max(bestScore ?? 0, Number(stat.best_score));
  }
  return {
    userId: row.user_id, userName: row.user_name, userEmail: row.user_email,
    schoolId: row.school_id, lastCallAt: row.last_call_at,
    scoredCalls, difficultyCounts: counts, bestScore: bestScore == null ? null : round(bestScore),
    avgScore: scoredCalls ? round(scoreSum / scoredCalls) : null,
    avgPoints: scoredCalls ? round(pointSum / scoredCalls) : null,
    qualified: scoredCalls >= MINIMUM_SCORED_CALLS, hardModeParticipant: counts.hard > 0,
  };
}

export function buildLeaderboard(aggregates, { page = 1, limit = 25, userId } = {}) {
  const rows = aggregates.map(summarize).filter(row => row.scoredCalls > 0);
  rows.sort((a, b) => Number(b.qualified) - Number(a.qualified)
    || b.avgPoints - a.avgPoints || a.userId - b.userId);
  let previousPoints, previousRank;
  rows.forEach((row, index) => {
    row.rank = row.qualified ? (row.avgPoints === previousPoints ? previousRank : index + 1) : null;
    if (row.qualified) { previousPoints = row.avgPoints; previousRank = row.rank; }
  });
  const difficultyCounts = { easy: 0, medium: 0, hard: 0, legacy: 0 };
  rows.forEach(row => Object.keys(difficultyCounts).forEach(key => { difficultyCounts[key] += row.difficultyCounts[key]; }));
  return {
    data: rows.slice((page - 1) * limit, page * limit),
    meta: { total: rows.length, page, limit, totalPages: Math.ceil(rows.length / limit),
      qualifiedTotal: rows.filter(row => row.qualified).length,
      minimumScoredCalls: MINIMUM_SCORED_CALLS, multipliers: DIFFICULTY_MULTIPLIERS,
      difficultyCounts },
    currentUser: rows.find(row => row.userId === userId) ?? null,
  };
}
