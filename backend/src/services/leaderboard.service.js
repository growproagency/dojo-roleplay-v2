import { findLeaderboardAggregates } from '../db/leaderboard.queries.js';
import { buildLeaderboard, resolveLeaderboardFilters } from './leaderboardRanking.service.js';

async function loadAggregates(filters, offset = 0) {
  const rows = await findLeaderboardAggregates({ ...filters, offset });
  if (rows.length < 100) return rows;
  return rows.concat(await loadAggregates(filters, offset + 100));
}

export async function getLeaderboard({ schoolId, isGlobalAdmin, userId, filters }) {
  const scope = resolveLeaderboardFilters({ schoolId, isGlobalAdmin, filters });
  const rows = !isGlobalAdmin && !scope.schoolId ? [] : await loadAggregates(scope);
  return buildLeaderboard(rows, { ...filters, userId });
}
