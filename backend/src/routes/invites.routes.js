import { Router } from 'express';
import { validateBody } from '../middleware/validate.middleware.js';
import { getInviteHandler, acceptInviteHandler } from '../controllers/invites.controller.js';
import { acceptInviteSchema } from '../schemas/auth.schema.js';

// Public routes — no auth required (invitee may not have an account yet)
const router = Router();
router.get('/:token', getInviteHandler);
router.post('/:token/accept', validateBody(acceptInviteSchema), acceptInviteHandler);
export default router;
