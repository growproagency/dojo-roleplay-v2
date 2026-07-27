import test from 'node:test';
import assert from 'node:assert/strict';
import { getUsagePeriod } from '../src/services/usageLimits.service.js';

test('manual usage period rolls forward on its monthly anniversary', () => {
  const school = {
    usagePeriodStart: '2026-07-25T04:30:00.000Z',
    usagePeriodEnd: '2026-08-25T04:30:00.000Z',
  };

  const beforeRollover = getUsagePeriod(school, new Date('2026-08-25T04:29:59.999Z'));
  assert.equal(beforeRollover.start.toISOString(), '2026-07-25T04:30:00.000Z');
  assert.equal(beforeRollover.end.toISOString(), '2026-08-25T04:30:00.000Z');

  const afterRollover = getUsagePeriod(school, new Date('2026-08-25T04:30:00.000Z'));
  assert.equal(afterRollover.start.toISOString(), '2026-08-25T04:30:00.000Z');
  assert.equal(afterRollover.end.toISOString(), '2026-09-25T04:30:00.000Z');
});

test('manual usage period catches up across multiple elapsed months', () => {
  const period = getUsagePeriod(
    { usagePeriodStart: '2026-07-25T00:00:00.000Z' },
    new Date('2026-11-30T00:00:00.000Z'),
  );

  assert.equal(period.start.toISOString(), '2026-11-25T00:00:00.000Z');
  assert.equal(period.end.toISOString(), '2026-12-25T00:00:00.000Z');
});

test('month-end manual periods remain anchored to the last valid day', () => {
  const school = { usagePeriodStart: '2026-01-31T00:00:00.000Z' };

  const february = getUsagePeriod(school, new Date('2026-02-28T00:00:00.000Z'));
  assert.equal(february.start.toISOString(), '2026-02-28T00:00:00.000Z');
  assert.equal(february.end.toISOString(), '2026-03-31T00:00:00.000Z');

  const april = getUsagePeriod(school, new Date('2026-04-30T00:00:00.000Z'));
  assert.equal(april.start.toISOString(), '2026-04-30T00:00:00.000Z');
  assert.equal(april.end.toISOString(), '2026-05-31T00:00:00.000Z');
});

test('default usage period continues to follow UTC calendar months', () => {
  const period = getUsagePeriod({}, new Date('2026-07-25T12:00:00.000Z'));

  assert.equal(period.start.toISOString(), '2026-07-01T00:00:00.000Z');
  assert.equal(period.end.toISOString(), '2026-08-01T00:00:00.000Z');
  assert.equal(period.isManual, false);
});
