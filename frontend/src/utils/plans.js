export const PLAN_DETAILS = {
  starter: { label: 'Starter', memberLimit: 3, monthlyRoleplayMinutes: 200 },
  team: { label: 'Team', memberLimit: 5, monthlyRoleplayMinutes: 300 },
  aios: { label: 'AIOS', memberLimit: null, monthlyRoleplayMinutes: null },
};

export function normalizePlan(value) {
  const text = String(value || '').trim().toLowerCase();
  if (!text) return null;
  if (text.includes('aios')) return 'aios';
  if (text.includes('team')) return 'team';
  if (text.includes('starter')) return 'starter';
  return text.replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 64);
}

export function getPlanDetails(value) {
  const key = normalizePlan(value);
  if (!key) return null;
  return PLAN_DETAILS[key] ?? { label: key, memberLimit: null, monthlyRoleplayMinutes: null };
}

export function getEffectivePlanDetails(school) {
  if (!school) return null;
  const details = getPlanDetails(school.plan);
  if (!details) return null;
  return {
    ...details,
    memberLimit: school.memberLimit ?? details.memberLimit,
    monthlyRoleplayMinutes: school.monthlyRoleplayMinutes ?? details.monthlyRoleplayMinutes,
  };
}

export function canUseCustomScenarios(schoolOrPlan) {
  const plan = typeof schoolOrPlan === 'object' ? schoolOrPlan?.plan : schoolOrPlan;
  return normalizePlan(plan) === 'aios';
}
