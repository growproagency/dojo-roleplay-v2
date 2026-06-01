import { findInviteByToken, acceptInvite } from '../db/invites.queries.js';
import { findSchoolById } from '../db/schools.queries.js';
import { upsertUser, findUserByEmail, findUsersBySchool } from '../db/users.queries.js';
import { getEffectivePlanDetails, hasReachedMemberLimit } from '../utils/plans.js';

export async function getInvitePreview(token) {
  const invite = await findInviteByToken(token);
  if (!invite) throw new Error('NOT_FOUND');
  if (invite.revokedAt) throw new Error('NOT_FOUND');
  if (invite.acceptedAt) throw new Error('CONFLICT');
  if (new Date(invite.expiresAt) < new Date()) throw new Error('NOT_FOUND');

  const school = invite.schoolId ? await findSchoolById(invite.schoolId) : null;
  return { ...invite, school };
}

export async function acceptInviteToken(token, { email, password }) {
  const invite = await findInviteByToken(token);
  if (!invite) throw new Error('NOT_FOUND');
  if (invite.revokedAt || invite.acceptedAt) throw new Error('CONFLICT');
  if (new Date(invite.expiresAt) < new Date()) throw new Error('NOT_FOUND');
  if (email.toLowerCase() !== invite.email.toLowerCase()) throw new Error('FORBIDDEN');

  const [school, members] = invite.schoolId
    ? await Promise.all([
      findSchoolById(invite.schoolId),
      findUsersBySchool(invite.schoolId),
    ])
    : [null, []];
  if (invite.schoolId && !school) throw new Error('NOT_FOUND');

  const normalizedEmail = email.toLowerCase();
  const existingMember = members.find(member => member.email.toLowerCase() === normalizedEmail);
  if (school && !existingMember && hasReachedMemberLimit(school, members.length)) throw new Error('MEMBER_LIMIT_REACHED');

  await upsertUser({
    email,
    name: invite.fullName || undefined,
    schoolId: invite.schoolId ?? null,
    role: invite.role || 'staff',
    lastSignedIn: new Date(),
  });

  await acceptInvite(token);

  const user = await findUserByEmail(email);
  return {
    user,
    profile: {
      ...user,
      school: school ? { id: school.id, name: school.name, slug: school.slug, plan: school.plan, memberLimit: school.memberLimit, monthlyRoleplayMinutes: school.monthlyRoleplayMinutes, planDetails: getEffectivePlanDetails(school) } : null,
    },
    school,
  };
}
