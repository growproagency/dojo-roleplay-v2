import assert from 'node:assert/strict';
import test from 'node:test';
import { buildLeaderboard, resolveLeaderboardFilters } from '../src/services/leaderboardRanking.service.js';
import { leaderboardQuerySchema } from '../src/schemas/leaderboard.schema.js';

const stat = (difficulty, count, average) => ({ difficulty, call_count: count, score_sum: count * average, best_score: average });
const user = (id, ...stats) => ({ user_id: id, user_name: `Staff ${id}`, school_id: 1, difficulty_stats: stats });

test('75% on Hard outranks 80% on Easy without changing raw scores', () => {
  const result = buildLeaderboard([user(1, stat('easy', 5, 80)), user(2, stat('hard', 5, 75))]);
  assert.deepEqual(result.data.map(r => [r.userId, r.rank, r.avgPoints, r.avgScore]), [[2, 1, 97.5, 75], [1, 2, 80, 80]]);
});

test('mixed difficulties average per-call points rather than averaging difficulty averages', () => {
  const { data: [row] } = buildLeaderboard([user(1, stat('easy', 2, 80), stat('medium', 1, 80), stat('hard', 3, 75))]);
  assert.equal(row.avgPoints, 90.8);
  assert.equal(row.avgScore, 77.5);
  assert.equal(row.scoredCalls, 6);
  assert.deepEqual(row.difficultyCounts, { easy: 2, medium: 1, hard: 3, legacy: 0 });
  assert.equal(row.hardModeParticipant, true);
});

test('five-call qualification excludes high-scoring newcomers from podium ranks', () => {
  const result = buildLeaderboard([user(1, stat('easy', 5, 80)), user(2, stat('hard', 4, 100))], { userId: 2 });
  assert.equal(result.data[0].userId, 1);
  assert.equal(result.currentUser.rank, null);
  assert.equal(result.currentUser.qualified, false);
  assert.equal(result.currentUser.avgPoints, 130);
  assert.equal(result.meta.qualifiedTotal, 1);
});

test('displayed ties share competition rank and stay consistent across pages', () => {
  const rows = [user(3, stat('easy', 5, 79)), user(2, stat('easy', 5, 80.04)), user(1, stat('easy', 5, 80))];
  assert.deepEqual(buildLeaderboard(rows).data.map(r => r.rank), [1, 1, 3]);
  const result = buildLeaderboard(rows, { page: 2, limit: 1, userId: 3 });
  assert.equal(result.data[0].rank, 1);
  assert.equal(result.currentUser.rank, 3);
  assert.equal(result.meta.totalPages, 3);
});

test('legacy calls use base points; zero scores remain valid; empty users do not rank', () => {
  const result = buildLeaderboard([user(1, stat(null, 5, 70)), user(2, stat('hard', 5, 0)), user(3)]);
  assert.equal(result.data[0].avgPoints, 70);
  assert.equal(result.data[0].difficultyCounts.legacy, 5);
  assert.equal(result.data[1].avgPoints, 0);
  assert.equal(result.data[1].rank, 2);
  assert.equal(result.meta.total, 2);
  assert.equal(buildLeaderboard([]).currentUser, null);
});

test('filters use rolling dates, retain scenario/difficulty, and restrict school overrides to admins', () => {
  const now = Date.parse('2026-11-12T00:00:00Z');
  const filters = { schoolId: 999, scenario: 'new_student', difficulty: 'hard', range: '7d' };
  assert.deepEqual(resolveLeaderboardFilters({ schoolId: 1, isGlobalAdmin: false, filters }, now), {
    schoolId: 1, scenario: 'new_student', difficulty: 'hard', fromDate: '2026-11-05T00:00:00.000Z',
  });
  assert.equal(resolveLeaderboardFilters({ schoolId: null, isGlobalAdmin: true, filters }, now).schoolId, 999);
  assert.equal(resolveLeaderboardFilters({ schoolId: 2, isGlobalAdmin: true, filters }, now).schoolId, 2);
  assert.equal(resolveLeaderboardFilters({ schoolId: null, isGlobalAdmin: false, filters }, now).schoolId, null);
  assert.equal(resolveLeaderboardFilters({ filters: { range: 'all' } }, now).fromDate, null);
  assert.equal(resolveLeaderboardFilters({ filters: {} }, now).fromDate, '2026-10-13T00:00:00.000Z');
});

test('query validation supplies bounded pagination and rejects invalid filters', () => {
  const { value, error } = leaderboardQuerySchema.validate({ extra: 'ignored' });
  assert.equal(error, undefined);
  assert.deepEqual(value, { range: '30d', page: 1, limit: 25 });
  for (const query of [{ limit: 101 }, { page: 0 }, { range: 'forever' }, { difficulty: 'extreme' }, { schoolId: -1 }, { from: 'invalid' }]) {
    assert.ok(leaderboardQuerySchema.validate(query).error);
  }
});
