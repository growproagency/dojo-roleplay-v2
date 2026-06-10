import { Router } from 'express';
import { validateBody } from '../middleware/validate.middleware.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { getInviteHandler, acceptInviteHandler } from '../controllers/invites.controller.js';
import { acceptInviteSchema } from '../schemas/auth.schema.js';

const router = Router();
// Preview stays public so invitees can inspect the invite before creating an account.
router.get('/:token', getInviteHandler);
router.post('/:token/accept', authMiddleware, validateBody(acceptInviteSchema), acceptInviteHandler);
export default router;
