import { getSchoolCallDurationSecondsSince } from '../db/calls.queries.js';
import { findSchoolById } from '../db/schools.queries.js';
import { getEffectivePlanDetails } from '../utils/plans.js';

function currentUtcMonthStart() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

export async function getSchoolMonthlyMinutesUsage(schoolId) {
  const school = await findSchoolById(schoolId);
  if (!school) throw new Error('NOT_FOUND');

  const planDetails = getEffectivePlanDetails(school);
  const limit = planDetails?.monthlyRoleplayMinutes ?? null;
  const usedSeconds = await getSchoolCallDurationSecondsSince(schoolId, currentUtcMonthStart());
  const limitSeconds = Number.isInteger(limit) ? limit * 60 : null;
  const usedMinutes = Math.round((usedSeconds / 60) * 10) / 10;
  const remainingMinutes = limitSeconds != null
    ? Math.max(0, Math.round(((limitSeconds - usedSeconds) / 60) * 10) / 10)
    : null;

  return {
    limit,
    usedMinutes,
    remainingMinutes,
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
