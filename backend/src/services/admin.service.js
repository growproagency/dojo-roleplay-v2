import { findAllSchools, insertSchool, updateSchool as updateSchoolDB, archiveSchool as archiveSchoolDB, restoreSchool as restoreSchoolDB, findSchoolById, getSchoolUsageTotals } from '../db/schools.queries.js';
import { findGlobalAdminUsers, findUserByEmail, findUsersBySchool, updateUser, removeUserFromSchool as removeUserFromSchoolDB } from '../db/users.queries.js';
import { findInvitesBySchool, findOpenPlatformInviteByEmail, findPlatformInvites, insertInvite, revokeInvite, revokePlatformInvite } from '../db/invites.queries.js';
import { findPlatformSettings, updatePlatformSettings as updatePlatformSettingsDB } from '../db/platform.queries.js';
import { generateRecoveryLink } from '../db/authAdmin.queries.js';
import { findUsageCalls } from '../db/calls.queries.js';
import { getSchoolMonthlyMinutesUsage } from './usageLimits.service.js';
import { hasReachedMemberLimit } from '../utils/plans.js';
import { config } from '../config/env.js';

export async function listSchools({ status = 'active' } = {}) {
  const schools = await findAllSchools({
    includeArchived: status === 'all',
    archivedOnly: status === 'archived',
  });
  const schoolsWithCounts = await Promise.all(
    schools.map(async (school) => {
      const members = await findUsersBySchool(school.id);
      return { ...school, memberCount: members.length };
    })
  );
  return schoolsWithCounts;
}

export async function createSchool({ name, slug, plan, ownerUserId, usageCapUsd, memberLimit, monthlyRoleplayMinutes }) {
  const generatedSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return insertSchool({ name, slug: generatedSlug, plan: plan || 'starter', ownerUserId, usageCapUsd, memberLimit, monthlyRoleplayMinutes });
}

export async function editSchool(schoolId, data) {
  const school = await findSchoolById(schoolId);
  if (!school) throw new Error('NOT_FOUND');
  await updateSchoolDB(schoolId, data);
  return findSchoolById(schoolId);
}

export async function getSchoolDetail(schoolId) {
  const [school, members, monthlyUsage] = await Promise.all([
    findSchoolById(schoolId),
    findUsersBySchool(schoolId),
    getSchoolMonthlyMinutesUsage(schoolId),
  ]);
  if (!school) throw new Error('NOT_FOUND');
  const usage = await getSchoolUsageTotals(schoolId);
  return { school, members, usage: { ...usage, monthly: monthlyUsage } };
}

export async function resetSchoolUsagePeriod(schoolId) {
  const school = await findSchoolById(schoolId);
  if (!school) throw new Error('NOT_FOUND');
  const start = new Date();
  const end = new Date(start);
  end.setUTCMonth(end.getUTCMonth() + 1);
  await updateSchoolDB(schoolId, {
    usagePeriodStart: start.toISOString(),
    usagePeriodEnd: end.toISOString(),
  });
  return getSchoolDetail(schoolId);
}

export async function getUsageOverview() {
  const [schools, calls] = await Promise.all([
    findAllSchools({ includeArchived: true }),
    findUsageCalls(),
  ]);
  const [membersBySchool, totals] = await Promise.all([
    Promise.all(schools.map(async (school) => [school.id, (await findUsersBySchool(school.id)).length])),
    Promise.resolve(summarizeUsageCalls(calls)),
  ]);
  const memberCounts = new Map(membersBySchool);
  const callsBySchool = new Map();
  for (const call of calls) {
    const list = callsBySchool.get(call.schoolId) ?? [];
    list.push(call);
    callsBySchool.set(call.schoolId, list);
  }
  const schoolRows = schools.map((school) => {
    const schoolCalls = callsBySchool.get(school.id) ?? [];
    return {
      schoolId: school.id,
      schoolName: school.name,
      plan: school.plan,
      archivedAt: school.archivedAt,
      accessStatus: school.subscriptionStatus,
      capUsd: school.usageCapUsd,
      monthlyRoleplayMinutes: school.monthlyRoleplayMinutes,
      memberCount: memberCounts.get(school.id) ?? 0,
      ...summarizeUsageCalls(schoolCalls),
    };
  });
  return { ...totals, schools: schoolRows, calls: calls.map(toUsageCall) };
}

function summarizeUsageCalls(calls) {
  const scoredCalls = calls.filter((call) => call.overallScore != null);
  const totalUsd = calls.reduce((sum, call) => sum + Number(call.costUsd || 0), 0);
  const totalSeconds = calls.reduce((sum, call) => sum + Number(call.durationSeconds || 0), 0);
  const completedCalls = calls.filter((call) => call.status === 'completed').length;
  const failedCalls = calls.filter((call) => ['failed', 'error'].includes(call.status)).length;
  return {
    totalUsd: Math.round(totalUsd * 10000) / 10000,
    totalCalls: calls.length,
    completedCalls,
    failedCalls,
    unscoredCalls: calls.length - scoredCalls.length,
    scoredCalls: scoredCalls.length,
    totalSeconds,
    totalMinutes: Math.round((totalSeconds / 60) * 10) / 10,
    avgScore: scoredCalls.length
      ? Math.round(scoredCalls.reduce((sum, call) => sum + Number(call.overallScore || 0), 0) / scoredCalls.length)
      : null,
    avgCostPerCall: calls.length ? Math.round((totalUsd / calls.length) * 10000) / 10000 : 0,
    avgCostPerMinute: totalSeconds > 0 ? Math.round((totalUsd / (totalSeconds / 60)) * 10000) / 10000 : 0,
    lastActivityAt: calls[0]?.createdAt ?? null,
  };
}

function toUsageCall(call) {
  return {
    id: call.id,
    schoolId: call.schoolId,
    userId: call.userId,
    userName: call.userName,
    userEmail: call.userEmail,
    scenario: call.scenario,
    difficulty: call.difficulty,
    status: call.status,
    durationSeconds: call.durationSeconds,
    costUsd: call.costUsd,
    overallScore: call.overallScore,
    createdAt: call.createdAt,
  };
}

export async function getPlatformSettings() {
  const settings = await findPlatformSettings();
  return settings;
}

export async function updatePlatformSettings(data) {
  const current = await findPlatformSettings();
  if (!current) throw new Error('NOT_FOUND');
  await updatePlatformSettingsDB(current.id, data);
  return findPlatformSettings();
}

export async function removeSchool(schoolId) {
  const school = await findSchoolById(schoolId);
  if (!school) throw new Error('NOT_FOUND');
  await archiveSchoolDB(schoolId);
}

export async function restoreSchool(schoolId) {
  const school = await findSchoolById(schoolId);
  if (!school) throw new Error('NOT_FOUND');
  await restoreSchoolDB(schoolId);
}

export async function changeUserRole(userId, role) {
  await updateUser(userId, { role });
}

export async function unassignUserFromSchool(userId) {
  await removeUserFromSchoolDB(userId);
}

export async function removeUser(userId) {
  await removeUserFromSchoolDB(userId);
}

export async function getSchoolInvites(schoolId) {
  const [invites, members] = await Promise.all([
    findInvitesBySchool(schoolId),
    findUsersBySchool(schoolId),
  ]);
  const memberEmails = new Set(members.map(member => member.email.toLowerCase()));
  return invites.filter(invite => !memberEmails.has(invite.email.toLowerCase()));
}

export async function createSchoolInvite(schoolId, { email, role }, invitedBy) {
  const [school, members, invites] = await Promise.all([
    findSchoolById(schoolId),
    findUsersBySchool(schoolId),
    findInvitesBySchool(schoolId),
  ]);
  if (!school) throw new Error('NOT_FOUND');

  const normalizedEmail = email.toLowerCase();
  if (members.some(member => member.email.toLowerCase() === normalizedEmail)) throw new Error('SCHOOL_MEMBER_EXISTS');
  if (invites.some(invite => invite.email.toLowerCase() === normalizedEmail)) throw new Error('SCHOOL_INVITE_EXISTS');
  if (hasReachedMemberLimit(school, members.length + invites.length)) throw new Error('MEMBER_LIMIT_REACHED');

  return insertInvite({ schoolId, email, role: role ?? 'staff', invitedBy });
}

export async function readdUserToSchool(schoolId, { email, role }) {
  const normalizedEmail = email.toLowerCase();
  const [school, user, members] = await Promise.all([
    findSchoolById(schoolId),
    findUserByEmail(normalizedEmail),
    findUsersBySchool(schoolId),
  ]);
  if (!school || !user) throw new Error('NOT_FOUND');
  if (user.schoolId === schoolId) throw new Error('USER_ALREADY_IN_SCHOOL');
  if (user.schoolId != null) throw new Error('USER_BELONGS_TO_ANOTHER_SCHOOL');
  if (hasReachedMemberLimit(school, members.length + 1)) throw new Error('MEMBER_LIMIT_REACHED');
  await updateUser(user.id, { schoolId, role: role ?? 'staff' });
  return findUserByEmail(normalizedEmail);
}

export async function revokeSchoolInvite(schoolId, inviteId) {
  await revokeInvite(inviteId, schoolId);
}

export async function getPlatformAdmins() {
  const [admins, invites] = await Promise.all([
    findGlobalAdminUsers(),
    findPlatformInvites(),
  ]);
  const adminEmails = new Set(admins.map(admin => admin.email.toLowerCase()));
  return {
    admins,
    invites: invites.filter(invite => !adminEmails.has(invite.email.toLowerCase())),
  };
}

export async function createPlatformAdminInvite({ email }, invitedBy) {
  const normalizedEmail = email.toLowerCase();
  const [existingUser, existingInvite] = await Promise.all([
    findUserByEmail(normalizedEmail),
    findOpenPlatformInviteByEmail(normalizedEmail),
  ]);
  if (existingUser?.role === 'global_admin' || existingUser?.role === 'admin') throw new Error('PLATFORM_ADMIN_EXISTS');
  if (existingInvite) throw new Error('PLATFORM_ADMIN_INVITE_EXISTS');
  return insertInvite({ schoolId: null, email: normalizedEmail, role: 'global_admin', invitedBy });
}

export async function revokePlatformAdminInvite(inviteId) {
  await revokePlatformInvite(inviteId);
}

export async function revokePlatformAdmin(userId, requesterId) {
  if (userId === requesterId) throw new Error('FORBIDDEN');
  const admins = await findGlobalAdminUsers();
  const target = admins.find((admin) => admin.id === userId);
  if (!target) throw new Error('NOT_FOUND');
  if (admins.length <= 1) throw new Error('LAST_PLATFORM_ADMIN');
  await updateUser(userId, { role: 'staff' });
}

export async function createPasswordResetLink({ email }) {
  const normalizedEmail = email.toLowerCase();
  const user = await findUserByEmail(normalizedEmail);
  if (!user) throw new Error('NOT_FOUND');
  const redirectTo = `${config.frontendUrl.replace(/\/$/, '')}/update-password`;
  return generateRecoveryLink(normalizedEmail, redirectTo);
}
