import { getSchoolCallUsageSince } from '../db/calls.queries.js';
import { findSchoolById } from '../db/schools.queries.js';
import { getEffectivePlanDetails } from '../utils/plans.js';

function currentUtcMonthStart(now = new Date()) {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

function addUtcMonths(date, months) {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + months;
  const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  return new Date(Date.UTC(
    year,
    month,
    Math.min(date.getUTCDate(), lastDay),
    date.getUTCHours(),
    date.getUTCMinutes(),
    date.getUTCSeconds(),
    date.getUTCMilliseconds(),
  ));
}

export function getUsagePeriod(school, now = new Date()) {
  const explicitStart = school.usagePeriodStart ? new Date(school.usagePeriodStart) : null;
  const hasManualStart = explicitStart && !Number.isNaN(explicitStart.getTime());

  if (!hasManualStart) {
    const start = currentUtcMonthStart(now);
    return { start, end: addUtcMonths(start, 1), isManual: false };
  }

  let monthOffset = Math.max(
    0,
    ((now.getUTCFullYear() - explicitStart.getUTCFullYear()) * 12)
      + now.getUTCMonth()
      - explicitStart.getUTCMonth(),
  );
  let start = addUtcMonths(explicitStart, monthOffset);

  if (start > now && monthOffset > 0) {
    monthOffset -= 1;
    start = addUtcMonths(explicitStart, monthOffset);
  }

  return {
    start,
    end: addUtcMonths(explicitStart, monthOffset + 1),
    isManual: true,
  };
}

export async function getSchoolMonthlyMinutesUsage(schoolId) {
  const school = await findSchoolById(schoolId);
  if (!school) throw new Error('NOT_FOUND');

  const planDetails = getEffectivePlanDetails(school);
  const limit = planDetails?.monthlyRoleplayMinutes ?? null;
  const period = getUsagePeriod(school);
  const currentUsage = await getSchoolCallUsageSince(schoolId, period.start);
  const usedSeconds = currentUsage.durationSeconds;
  const limitSeconds = Number.isInteger(limit) ? limit * 60 : null;
  const usedMinutes = Math.round((usedSeconds / 60) * 10) / 10;
  const remainingMinutes = limitSeconds != null
    ? Math.max(0, Math.round(((limitSeconds - usedSeconds) / 60) * 10) / 10)
    : null;

  return {
    limit,
    usedCalls: currentUsage.calls,
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
