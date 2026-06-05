import { getSchoolCallDurationSecondsSince } from '../db/calls.queries.js';
import { findSchoolById } from '../db/schools.queries.js';
import { getEffectivePlanDetails } from '../utils/plans.js';

function currentUtcMonthStart() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

function addOneMonth(date) {
  const next = new Date(date);
  next.setUTCMonth(next.getUTCMonth() + 1);
  return next;
}

function getUsagePeriod(school) {
  const explicitStart = school.usagePeriodStart ? new Date(school.usagePeriodStart) : null;
  const start = explicitStart && !Number.isNaN(explicitStart.getTime())
    ? explicitStart
    : currentUtcMonthStart();
  const explicitEnd = school.usagePeriodEnd ? new Date(school.usagePeriodEnd) : null;
  const end = explicitEnd && !Number.isNaN(explicitEnd.getTime())
    ? explicitEnd
    : addOneMonth(start);
  return { start, end, isManual: !!school.usagePeriodStart };
}

export async function getSchoolMonthlyMinutesUsage(schoolId) {
  const school = await findSchoolById(schoolId);
  if (!school) throw new Error('NOT_FOUND');

  const planDetails = getEffectivePlanDetails(school);
  const limit = planDetails?.monthlyRoleplayMinutes ?? null;
  const period = getUsagePeriod(school);
  const usedSeconds = await getSchoolCallDurationSecondsSince(schoolId, period.start);
  const limitSeconds = Number.isInteger(limit) ? limit * 60 : null;
  const usedMinutes = Math.round((usedSeconds / 60) * 10) / 10;
  const remainingMinutes = limitSeconds != null
    ? Math.max(0, Math.round(((limitSeconds - usedSeconds) / 60) * 10) / 10)
    : null;

  return {
    limit,
    usedMinutes,
    remainingMinutes,
    periodStart: period.start.toISOString(),
    periodEnd: period.end.toISOString(),
    isManualPeriod: period.isManual,
    atLimit: limitSeconds != null && usedSeconds >= limitSeconds,
  };
}

export async function assertSchoolMonthlyMinutesAvailable(schoolId) {
  const usage = await getSchoolMonthlyMinutesUsage(schoolId);
  if (usage.atLimit) {
    throw new Error('MONTHLY_MINUTES_LIMIT_REACHED');
  }
  return usage;
}
