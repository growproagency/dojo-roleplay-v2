import { findUserById, findUserByPhoneNumber, updateUser } from '../db/users.queries.js';
import { findSchoolById, getSchoolUsageTotals } from '../db/schools.queries.js';
import { getEffectivePlanDetails } from '../utils/plans.js';
import { getSchoolAccessStatus } from '../utils/schoolAccess.js';

export async function getMe(userId) {
  const user = await findUserById(userId);
  if (!user) throw new Error('NOT_FOUND');

  let school = null;
  let usageStatus = null;

  if (user.schoolId) {
    const [schoolData, usage] = await Promise.all([
      findSchoolById(user.schoolId),
      getSchoolUsageTotals(user.schoolId),
    ]);
    school = schoolData;
    if (school) {
      const capUsd = school.usageCapUsd;
      usageStatus = {
        totalUsd: usage.totalUsd,
        capUsd,
        nearCap: capUsd != null && usage.totalUsd >= capUsd * 0.9,
        atCap: capUsd != null && usage.totalUsd >= capUsd,
      };
    }
  }

  return {
    ...user,
    school: school ? {
      id: school.id,
      name: school.name,
      slug: school.slug,
      plan: school.plan,
      memberLimit: school.memberLimit,
      monthlyRoleplayMinutes: school.monthlyRoleplayMinutes,
      usagePeriodStart: school.usagePeriodStart,
      usagePeriodEnd: school.usagePeriodEnd,
      archivedAt: school.archivedAt,
      subscriptionStatus: school.subscriptionStatus,
      subscriptionCurrentPeriodEnd: school.subscriptionCurrentPeriodEnd,
      accessGraceUntil: school.accessGraceUntil,
      accessStatus: getSchoolAccessStatus(school),
      planDetails: getEffectivePlanDetails(school),
      usageStatus,
    } : null,
  };
}

export async function updateProfile(userId, data) {
  if (data.phoneNumber) {
    const existing = await findUserByPhoneNumber(data.phoneNumber);
    if (existing && existing.id !== userId) throw new Error('CONFLICT');
  }
  await updateUser(userId, data);
  return getMe(userId);
}
