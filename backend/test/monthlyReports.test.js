import assert from 'node:assert/strict';
import test from 'node:test';
import { callsInMonth, compareActivity, localDateKey, reportPeriod, summarizeActivity, summarizeCoaching, summarizeTeam } from '../src/utils/monthlyReports.js';
import { createMonthlyReportsService as createService } from '../src/services/monthlyReports.service.js';
import { reportParamsSchema, reportQuerySchema, reportTimezoneSchema } from '../src/schemas/monthlyReports.schema.js';

const now = new Date('2026-11-12T12:00:00Z');
const createMonthlyReportsService = db => createService(db, () => now);
const call = (id, overrides = {}) => ({ id, user_id: 1, school_id: 7, created_at: '2026-10-15T12:00:00Z',
  status: 'scored', duration_seconds: 90, difficulty: 'hard', scenario: 'new_student', scenario_title: 'New Student',
  scorecards: { overall_score: 75, categories: [{ name: 'Discovery', score: 6 }],
    highlights: ['Asked about goals'], missed_opportunities: ['Did not confirm next steps'], suggestions: ['Confirm a specific next step'] }, ...overrides });
const actor = { id: 9, role: 'school_admin', schoolId: 7 };

test('calendar month classification handles UTC boundaries, offsets, DST, and leap days', () => {
  const zone = 'America/New_York';
  const calls = [call(1, { created_at: '2026-11-01T03:59:59Z' }), call(2, { created_at: '2026-11-01T04:00:00Z' }),
    call(3, { created_at: '2026-12-01T04:59:59Z' }), call(4, { created_at: '2026-12-01T05:00:00Z' })];
  assert.deepEqual(callsInMonth(calls, '2026-11', zone, new Date('2027-01-01Z')).map(c => c.id), [2, 3]);
  assert.equal(localDateKey('2026-10-31T16:00:00Z', 'Asia/Manila'), '2026-11-01');
  assert.equal(localDateKey('2024-02-29T12:00:00Z', 'UTC'), '2024-02-29');
  const period = reportPeriod(undefined, zone, now);
  assert.equal(period.month, '2026-10');
  assert.equal(period.previousMonth, '2026-09');
  assert.equal(period.label, 'October 2026');
  assert.equal(reportPeriod('2026-01', 'UTC', now).previousMonth, '2025-12');
  assert.equal(reportPeriod('2026-11', 'UTC', now).monthToDate, true);
  assert.throws(() => reportPeriod('2026-12', 'UTC', now), /VALIDATION/);
  assert.equal(callsInMonth([call(5, { created_at: '2026-11-30T00:00:00Z' })], '2026-11', 'UTC', now).length, 0);
});

test('activity includes every call duration but averages only successfully scored calls', () => {
  const m = summarizeActivity([call(1), call(2, { status: 'completed', duration_seconds: null }),
    call(3, { status: 'failed', difficulty: 'easy', duration_seconds: 30 }),
    call(4, { difficulty: 'easy', scorecards: [{ overall_score: 80 }] }),
    call(5, { difficulty: null, scorecards: { overall_score: 0 } }),
    call(6, { scorecards: { overall_score: null } })], 'UTC');
  assert.equal(m.callsMade, 6);
  assert.equal(m.completedCalls, 5);
  assert.equal(m.scoredCalls, 3);
  assert.equal(m.minutesUsed, 6.5);
  assert.equal(m.missingDurations, 1);
  assert.equal(m.avgScore, 51.7);
  assert.equal(m.avgPoints, 59.2);
  assert.equal(m.activeDays, 1);
  assert.equal(m.difficulty.find(d => d.difficulty === 'legacy').avgScore, 0);
  assert.equal(m.failedCalls, 1);
  assert.equal(summarizeActivity([], 'UTC').avgScore, null);
  assert.equal(compareActivity(m, summarizeActivity([], 'UTC')).avgScore, null);
});

test('coaching separates scenario rubrics, deduplicates per call, and keeps evidence IDs', () => {
  const other = call(2, { scenario: 'renewal', scorecards: { overall_score: 90,
    categories: [{ name: 'Discovery', score: 9 }, { name: 'Discovery', score: 9 }],
    highlights: ['Asked about goals', 'Asked about goals'], suggestions: ['Review membership benefits'] } });
  const result = summarizeCoaching([call(1), other, call(3, { status: 'failed' })]);
  assert.equal(result.strengths[0].avgScore, 9);
  assert.equal(result.strengths[0].sampleSize, 1);
  assert.deepEqual(result.improvements[0].callIds, [1]);
  assert.deepEqual(result.nextSteps[0].callIds, [1]);
  assert.equal(result.highlights[0].occurrences, 2);
  assert.deepEqual(result.highlights[0].callIds, [1, 2]);
  assert.deepEqual(summarizeCoaching([]).nextSteps, []);
});

function fakeDb({ calls = [], members = [{ id: 1, name: 'Matthew', email: 'm@example.com' }], onQuery = () => {} } = {}) {
  return {
    findReportSchool: async id => { onQuery('school', id); return { id, name: 'Test School', reporting_timezone: 'UTC' }; },
    findReportMembers: async (schoolId, offset) => { onQuery('members', schoolId); return members.slice(offset, offset + 100); },
    findReportCalls: async params => { onQuery('calls', params); return calls.filter(c => !params.userId || c.user_id === params.userId).slice(params.offset, params.offset + 100); },
    updateReportingTimezone: async (...args) => onQuery('update', args),
  };
}

test('service reads beyond 100 calls and members and returns bounded overview pages', async () => {
  const calls = Array.from({ length: 205 }, (_, index) => call(index + 1));
  const members = Array.from({ length: 105 }, (_, index) => ({ id: index + 1, name: `Staff ${index}` }));
  const service = createMonthlyReportsService(fakeDb({ calls, members, onQuery: (kind, params) => {
    if (kind === 'calls') { assert.equal(params.schoolId, 7); assert.ok(params.from); assert.ok(params.until); }
  } }));
  const report = (await service.detail({ actor, schoolId: 7, userId: 1, month: '2026-10' })).data;
  assert.equal(report.metrics.callsMade, 205);
  assert.equal(report.metrics.scoredCalls, 205);
  const overview = await service.list({ actor, schoolId: 7, month: '2026-10', page: 2, limit: 25 });
  assert.equal(overview.data.length, 25);
  assert.equal(overview.meta.total, 105);
  assert.equal(overview.meta.totalPages, 5);
});

test('service denies unauthorized school access before any database reads or writes', async () => {
  let operations = 0;
  const service = createMonthlyReportsService(fakeDb({ onQuery: () => { operations++; } }));
  for (const requester of [{ role: 'staff', schoolId: 7 }, { role: 'school_admin', schoolId: 8 }, null]) {
    await assert.rejects(service.list({ actor: requester, schoolId: 7 }), /FORBIDDEN/);
    await assert.rejects(service.detail({ actor: requester, schoolId: 7, userId: 1 }), /FORBIDDEN/);
    await assert.rejects(service.updateSettings({ actor: requester, schoolId: 7, timezone: 'UTC' }), /FORBIDDEN/);
  }
  await assert.rejects(service.list({ actor: { role: 'global_admin' }, schoolId: null }), /FORBIDDEN/);
  assert.equal(operations, 0);
});

test('zero-activity members and former members have reports; unrelated users do not', async () => {
  const service = createMonthlyReportsService(fakeDb({ calls: [call(2, { user_id: 2, users: { name: 'John' } })] }));
  const empty = (await service.detail({ actor, schoolId: 7, userId: 1, month: '2026-10' })).data;
  assert.equal(empty.metrics.callsMade, 0);
  assert.equal(empty.metrics.avgScore, null);
  const former = (await service.detail({ actor, schoolId: 7, userId: 2, month: '2026-10' })).data;
  assert.equal(former.employee.formerMember, true);
  assert.equal(former.employee.name, 'John');
  await assert.rejects(service.detail({ actor, schoolId: 7, userId: 3, month: '2026-10' }), /NOT_FOUND/);
});

test('previous-month changes are computed from the same employee and school', async () => {
  const service = createMonthlyReportsService(fakeDb({ calls: [call(1), call(2, { created_at: '2026-09-01T00:00:00Z', duration_seconds: 60,
    scorecards: { overall_score: 65 } })] }));
  const report = (await service.detail({ actor, schoolId: 7, userId: 1, month: '2026-10' })).data;
  assert.equal(report.comparison.avgScore, 10);
  assert.equal(report.comparison.minutesUsed, 0.5);
  assert.equal(report.comparison.callsMade, 0);
});

test('timezone changes verify school scope and update only the selected school', async () => {
  const updates = [];
  const service = createMonthlyReportsService(fakeDb({ onQuery: (kind, args) => { if (kind === 'update') updates.push(args); } }));
  await service.updateSettings({ actor, schoolId: 7, timezone: 'Asia/Manila' });
  assert.deepEqual(updates, [[7, 'Asia/Manila']]);
});

test('request schemas reject invalid periods, timezones, IDs, and unbounded pagination', () => {
  for (const value of [{ month: '2026-13' }, { month: '0026-01' }, { limit: 101 }, { page: 0 }]) assert.ok(reportQuerySchema.validate(value).error);
  assert.equal(reportQuerySchema.validate({ month: '2026-10' }).error, undefined);
  assert.ok(reportTimezoneSchema.validate({ timezone: 'Not/A_Zone' }).error);
  assert.equal(reportTimezoneSchema.validate({ timezone: 'Asia/Manila' }).error, undefined);
  assert.ok(reportParamsSchema.validate({ userId: 'abc' }).error);
  assert.ok(reportParamsSchema.validate({ userId: -1 }).error);
});

test('team summary totals every employee and weights the average score by scored calls', () => {
  const metricsFor = calls => summarizeActivity(calls, 'UTC');
  const employees = [
    { id: 1, metrics: metricsFor([call(1, { difficulty: 'easy', scorecards: { overall_score: 90 } }),
      call(2, { difficulty: 'easy', scorecards: { overall_score: 90 } }), call(3, { difficulty: 'easy', scorecards: { overall_score: 90 } })]) },
    { id: 2, metrics: metricsFor([call(4, { difficulty: 'hard', scorecards: { overall_score: 50 } })]) },
    { id: 3, metrics: metricsFor([]) },
  ];
  const summary = summarizeTeam(employees);
  assert.equal(summary.employees, 3);
  assert.equal(summary.activeEmployees, 2);
  assert.equal(summary.callsMade, 4);
  assert.equal(summary.scoredCalls, 4);
  assert.equal(summary.minutesUsed, 6);
  assert.equal(summary.avgScore, 80);
  assert.deepEqual(summary.difficulty, { easy: 3, medium: 0, hard: 1, legacy: 0 });
  assert.equal(summarizeTeam([]).avgScore, null);
});
