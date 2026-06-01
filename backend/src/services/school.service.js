import { findSchoolById, updateSchool as updateSchoolDB } from '../db/schools.queries.js';
import { findUsersBySchool, updateUser, removeUserFromSchool } from '../db/users.queries.js';
import { findInvitesBySchool, insertInvite, revokeInvite } from '../db/invites.queries.js';
import { hasReachedMemberLimit } from '../utils/plans.js';

export async function getSchool(schoolId) {
  const school = await findSchoolById(schoolId);
  if (!school) throw new Error('NOT_FOUND');
  return school;
}

export async function updateSchool(schoolId, data) {
  const school = await findSchoolById(schoolId);
  if (!school) throw new Error('NOT_FOUND');
  await updateSchoolDB(schoolId, data);
  return findSchoolById(schoolId);
}

export async function getSchoolMembers(schoolId) {
  return findUsersBySchool(schoolId);
}

export async function removeMember(userId, schoolId, requesterId, isGlobalAdmin) {
  if (!isGlobalAdmin && userId === requesterId) throw new Error('FORBIDDEN');
  await removeUserFromSchool(userId);
}

export async function getInvites(schoolId) {
  const [invites, members] = await Promise.all([
    findInvitesBySchool(schoolId),
    findUsersBySchool(schoolId),
  ]);
  const memberEmails = new Set(members.map(member => member.email.toLowerCase()));
  return invites.filter(invite => !memberEmails.has(invite.email.toLowerCase()));
}

export async function createInvite(schoolId, inviterId, { email, role }) {
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

  return insertInvite({ schoolId, email, role: role || 'staff', invitedBy: inviterId });
}

export async function deleteInvite(inviteId, schoolId) {
  await revokeInvite(inviteId, schoolId);
}
