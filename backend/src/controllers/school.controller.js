import { asyncHandler } from '../utils/asyncHandler.js';
import { getSchool, updateSchool, getSchoolMembers, removeMember, getInvites, createInvite, deleteInvite } from '../services/school.service.js';
import { effectiveSchoolId } from '../middleware/auth.middleware.js';

function isGlobalAdmin(user) { return user?.role === 'global_admin' || user?.role === 'admin'; }

export const getSchoolHandler = asyncHandler(async (req, res) => {
  const schoolId = effectiveSchoolId(req);
  if (!schoolId) throw new Error('FORBIDDEN');
  const data = await getSchool(schoolId);
  res.json({ data });
});

export const updateSchoolHandler = asyncHandler(async (req, res) => {
  const schoolId = effectiveSchoolId(req);
  if (!schoolId) throw new Error('FORBIDDEN');
  const data = await updateSchool(schoolId, req.body);
  res.json({ data });
});

export const getMembersHandler = asyncHandler(async (req, res) => {
  const schoolId = effectiveSchoolId(req);
  if (!schoolId) throw new Error('FORBIDDEN');
  const data = await getSchoolMembers(schoolId);
  res.json({ data });
});

export const removeMemberHandler = asyncHandler(async (req, res) => {
  const userId = parseInt(req.params.userId, 10);
  if (isNaN(userId)) throw Object.assign(new Error('VALIDATION'), { message: 'Invalid user ID' });
  const schoolId = effectiveSchoolId(req);
  if (!schoolId) throw new Error('FORBIDDEN');
  await removeMember(userId, schoolId, req.user.id, isGlobalAdmin(req.user));
  res.json({ data: { success: true } });
});

export const getInvitesHandler = asyncHandler(async (req, res) => {
  const schoolId = effectiveSchoolId(req);
  if (!schoolId) throw new Error('FORBIDDEN');
  const data = await getInvites(schoolId);
  res.json({ data });
});

export const createInviteHandler = asyncHandler(async (req, res) => {
  const schoolId = effectiveSchoolId(req);
  if (!schoolId) throw new Error('FORBIDDEN');
  const data = await createInvite(schoolId, req.user.id, req.body);
  res.status(201).json({ data });
});

export const deleteInviteHandler = asyncHandler(async (req, res) => {
  const inviteId = parseInt(req.params.inviteId, 10);
  if (isNaN(inviteId)) throw Object.assign(new Error('VALIDATION'), { message: 'Invalid invite ID' });
  const schoolId = effectiveSchoolId(req);
  if (!schoolId) throw new Error('FORBIDDEN');
  await deleteInvite(inviteId, schoolId);
  res.json({ data: { success: true } });
});
