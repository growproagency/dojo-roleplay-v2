import { asyncHandler } from '../utils/asyncHandler.js';
import { listSchools, createSchool, editSchool, removeSchool, restoreSchool, getSchoolDetail, getUsageOverview, getPlatformSettings, updatePlatformSettings, changeUserRole, unassignUserFromSchool, removeUser, getSchoolInvites, createSchoolInvite, readdUserToSchool, revokeSchoolInvite, getPlatformAdmins, createPlatformAdminInvite, revokePlatformAdminInvite, revokePlatformAdmin, createPasswordResetLink } from '../services/admin.service.js';
import { config } from '../config/env.js';

function buildInviteUrl(token) {
  return `${config.frontendUrl.replace(/\/$/, '')}/invite/${token}`;
}

export const listSchoolsHandler = asyncHandler(async (req, res) => {
  const data = await listSchools({ status: req.query.status });
  res.json({ data });
});

export const createSchoolHandler = asyncHandler(async (req, res) => {
  const data = await createSchool(req.body);
  res.status(201).json({ data });
});

export const updateSchoolHandler = asyncHandler(async (req, res) => {
  const schoolId = parseInt(req.params.schoolId, 10);
  if (isNaN(schoolId)) throw Object.assign(new Error('VALIDATION'), { message: 'Invalid school ID' });
  const data = await editSchool(schoolId, req.body);
  res.json({ data });
});

export const getSchoolDetailHandler = asyncHandler(async (req, res) => {
  const schoolId = parseInt(req.params.schoolId, 10);
  if (isNaN(schoolId)) throw Object.assign(new Error('VALIDATION'), { message: 'Invalid school ID' });
  const data = await getSchoolDetail(schoolId);
  res.json({ data });
});

export const getUsageHandler = asyncHandler(async (_req, res) => {
  const data = await getUsageOverview();
  res.json({ data });
});

export const getPlatformSettingsHandler = asyncHandler(async (_req, res) => {
  const data = await getPlatformSettings();
  res.json({ data });
});

export const updatePlatformSettingsHandler = asyncHandler(async (req, res) => {
  const data = await updatePlatformSettings(req.body);
  res.json({ data });
});

export const deleteSchoolHandler = asyncHandler(async (req, res) => {
  const schoolId = parseInt(req.params.schoolId, 10);
  if (isNaN(schoolId)) throw Object.assign(new Error('VALIDATION'), { message: 'Invalid school ID' });
  await removeSchool(schoolId);
  res.status(204).end();
});

export const restoreSchoolHandler = asyncHandler(async (req, res) => {
  const schoolId = parseInt(req.params.schoolId, 10);
  if (isNaN(schoolId)) throw Object.assign(new Error('VALIDATION'), { message: 'Invalid school ID' });
  await restoreSchool(schoolId);
  res.json({ data: { ok: true } });
});

export const changeUserRoleHandler = asyncHandler(async (req, res) => {
  const userId = parseInt(req.params.userId, 10);
  if (isNaN(userId)) throw Object.assign(new Error('VALIDATION'), { message: 'Invalid user ID' });
  await changeUserRole(userId, req.body.role);
  res.json({ data: { ok: true } });
});

export const unassignUserHandler = asyncHandler(async (req, res) => {
  const userId = parseInt(req.params.userId, 10);
  if (isNaN(userId)) throw Object.assign(new Error('VALIDATION'), { message: 'Invalid user ID' });
  await unassignUserFromSchool(userId);
  res.json({ data: { ok: true } });
});

export const deleteUserHandler = asyncHandler(async (req, res) => {
  const userId = parseInt(req.params.userId, 10);
  if (isNaN(userId)) throw Object.assign(new Error('VALIDATION'), { message: 'Invalid user ID' });
  await removeUser(userId);
  res.status(204).end();
});

export const getSchoolInvitesHandler = asyncHandler(async (req, res) => {
  const schoolId = parseInt(req.params.schoolId, 10);
  if (isNaN(schoolId)) throw Object.assign(new Error('VALIDATION'), { message: 'Invalid school ID' });
  const data = await getSchoolInvites(schoolId);
  res.json({ data });
});

export const createSchoolInviteHandler = asyncHandler(async (req, res) => {
  const schoolId = parseInt(req.params.schoolId, 10);
  if (isNaN(schoolId)) throw Object.assign(new Error('VALIDATION'), { message: 'Invalid school ID' });
  const invite = await createSchoolInvite(schoolId, req.body, req.user.id);
  const acceptUrl = buildInviteUrl(invite.token);
  res.status(201).json({ data: { ...invite, acceptUrl } });
});

export const readdSchoolUserHandler = asyncHandler(async (req, res) => {
  const schoolId = parseInt(req.params.schoolId, 10);
  if (isNaN(schoolId)) throw Object.assign(new Error('VALIDATION'), { message: 'Invalid school ID' });
  const data = await readdUserToSchool(schoolId, req.body);
  res.json({ data });
});

export const revokeSchoolInviteHandler = asyncHandler(async (req, res) => {
  const schoolId = parseInt(req.params.schoolId, 10);
  const inviteId = parseInt(req.params.inviteId, 10);
  if (isNaN(schoolId) || isNaN(inviteId)) throw Object.assign(new Error('VALIDATION'), { message: 'Invalid ID' });
  await revokeSchoolInvite(schoolId, inviteId);
  res.status(204).end();
});

export const getPlatformAdminsHandler = asyncHandler(async (_req, res) => {
  const data = await getPlatformAdmins();
  res.json({ data });
});

export const createPlatformAdminInviteHandler = asyncHandler(async (req, res) => {
  const invite = await createPlatformAdminInvite(req.body, req.user.id);
  const acceptUrl = buildInviteUrl(invite.token);
  res.status(201).json({ data: { ...invite, acceptUrl } });
});

export const revokePlatformAdminInviteHandler = asyncHandler(async (req, res) => {
  const inviteId = parseInt(req.params.inviteId, 10);
  if (isNaN(inviteId)) throw Object.assign(new Error('VALIDATION'), { message: 'Invalid invite ID' });
  await revokePlatformAdminInvite(inviteId);
  res.status(204).end();
});

export const revokePlatformAdminHandler = asyncHandler(async (req, res) => {
  const userId = parseInt(req.params.userId, 10);
  if (isNaN(userId)) throw Object.assign(new Error('VALIDATION'), { message: 'Invalid user ID' });
  await revokePlatformAdmin(userId, req.user.id);
  res.status(204).end();
});

export const createPasswordResetLinkHandler = asyncHandler(async (req, res) => {
  const data = await createPasswordResetLink(req.body);
  res.json({ data });
});
