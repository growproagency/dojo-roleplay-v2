import { Router } from 'express';
import { validateBody } from '../middleware/validate.middleware.js';
import { requireGlobalAdmin } from '../middleware/auth.middleware.js';
import {
  listSchoolsHandler, createSchoolHandler, updateSchoolHandler, deleteSchoolHandler, getSchoolDetailHandler,
  restoreSchoolHandler,
  getPlatformAdminsHandler, createPlatformAdminInviteHandler, revokePlatformAdminInviteHandler,
  revokePlatformAdminHandler,
  createPasswordResetLinkHandler,
  getUsageHandler, getPlatformSettingsHandler, updatePlatformSettingsHandler,
  changeUserRoleHandler, unassignUserHandler, deleteUserHandler,
  getSchoolInvitesHandler, createSchoolInviteHandler, readdSchoolUserHandler, revokeSchoolInviteHandler,
} from '../controllers/admin.controller.js';
import { createSchoolSchema, updateSchoolAdminSchema, updatePlatformSchema, changeRoleSchema, unassignUserSchema, adminCreateInviteSchema, readdSchoolUserSchema, platformAdminInviteSchema, passwordResetLinkSchema } from '../schemas/admin.schema.js';

const router = Router();

router.use(requireGlobalAdmin);

router.get('/schools', listSchoolsHandler);
router.post('/schools', validateBody(createSchoolSchema), createSchoolHandler);
router.get('/schools/:schoolId', getSchoolDetailHandler);
router.put('/schools/:schoolId', validateBody(updateSchoolAdminSchema), updateSchoolHandler);
router.delete('/schools/:schoolId', deleteSchoolHandler);
router.put('/schools/:schoolId/restore', restoreSchoolHandler);
router.get('/schools/:schoolId/invites', getSchoolInvitesHandler);
router.post('/schools/:schoolId/invites', validateBody(adminCreateInviteSchema), createSchoolInviteHandler);
router.post('/schools/:schoolId/users/readd', validateBody(readdSchoolUserSchema), readdSchoolUserHandler);
router.delete('/schools/:schoolId/invites/:inviteId', revokeSchoolInviteHandler);

router.get('/platform-admins', getPlatformAdminsHandler);
router.post('/platform-admins/invites', validateBody(platformAdminInviteSchema), createPlatformAdminInviteHandler);
router.delete('/platform-admins/:userId', revokePlatformAdminHandler);
router.delete('/platform-admins/invites/:inviteId', revokePlatformAdminInviteHandler);

router.put('/users/:userId/role', validateBody(changeRoleSchema), changeUserRoleHandler);
router.put('/users/:userId/school', validateBody(unassignUserSchema), unassignUserHandler);
router.delete('/users/:userId', deleteUserHandler);
router.post('/users/password-reset-link', validateBody(passwordResetLinkSchema), createPasswordResetLinkHandler);

router.get('/usage', getUsageHandler);
router.get('/platform-settings', getPlatformSettingsHandler);
router.put('/platform-settings', validateBody(updatePlatformSchema), updatePlatformSettingsHandler);

export default router;
