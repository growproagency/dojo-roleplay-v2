import { Router } from 'express';
import { validateBody } from '../middleware/validate.middleware.js';
import { requireSchoolAdmin } from '../middleware/auth.middleware.js';
import { getSchoolHandler, updateSchoolHandler, getMembersHandler, removeMemberHandler, getInvitesHandler, createInviteHandler, deleteInviteHandler } from '../controllers/school.controller.js';
import { updateSchoolSchema, createInviteSchema } from '../schemas/school.schema.js';

const router = Router();

router.get('/', getSchoolHandler);
router.put('/', requireSchoolAdmin, validateBody(updateSchoolSchema), updateSchoolHandler);
router.get('/members', requireSchoolAdmin, getMembersHandler);
router.delete('/members/:userId', requireSchoolAdmin, removeMemberHandler);
router.get('/invites', requireSchoolAdmin, getInvitesHandler);
router.post('/invites', requireSchoolAdmin, validateBody(createInviteSchema), createInviteHandler);
router.delete('/invites/:inviteId', requireSchoolAdmin, deleteInviteHandler);

export default router;
