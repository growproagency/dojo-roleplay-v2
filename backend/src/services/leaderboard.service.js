import { findLeaderboardCalls, findLeaderboardScorecards } from '../db/leaderboard.queries.js';

export async function getLeaderboard({ schoolId, scenario = null, fromDate = null, isGlobalAdmin = false }) {
  const [callRows, scorecardRows] = await Promise.all([
    findLeaderboardCalls({ schoolId, scenario, fromDate, isGlobalAdmin }),
    findLeaderboardScorecards(),
  ]);

  const scoreByCallId = new Map();
  for (const sc of scorecardRows || []) scoreByCallId.set(sc.call_id, sc.overall_score);

  const userMap = new Map();
  for (const c of callRows || []) {
    const userId = c.user_id;
    if (!userMap.has(userId)) {
      userMap.set(userId, {
        userName: c.users?.name ?? null,
        userEmail: c.users?.email ?? null,
        schoolId: c.school_id ?? null,
        totalCalls: 0,
        scoredCalls: 0,
        scores: [],
        lastCallAt: c.created_at,
      });
    }
    const entry = userMap.get(userId);
    entry.totalCalls++;
    if (c.status === 'scored') entry.scoredCalls++;
    const score = scoreByCallId.get(c.id);
    if (score !== undefined) entry.scores.push(score);
    if (c.created_at > entry.lastCallAt) entry.lastCallAt = c.created_at;
  }

  const rows = Array.from(userMap.entries()).map(([userId, e]) => {
    const avgScore = e.scores.length > 0
      ? Math.round((e.scores.reduce((a, b) => a + b, 0) / e.scores.length) * 10) / 10
      : null;
    const bestScore = e.scores.length > 0 ? Math.round(Math.max(...e.scores) * 10) / 10 : null;
    return { userId, ...e, scores: undefined, avgScore, bestScore };
  });

  rows.sort((a, b) => {
    if (a.avgScore === null && b.avgScore === null) return 0;
    if (a.avgScore === null) return 1;
    if (b.avgScore === null) return -1;
    return b.avgScore - a.avgScore;
  });

  return rows.map((r, i) => ({ rank: i + 1, ...r }));
}
