import { Router } from 'express';
import { validateBody } from '../middleware/validate.middleware.js';
import { getMeHandler, updateMeHandler, logoutHandler } from '../controllers/auth.controller.js';
import { updateProfileSchema } from '../schemas/auth.schema.js';

const router = Router();

router.get('/me', getMeHandler);
router.put('/me', validateBody(updateProfileSchema), updateMeHandler);
router.post('/logout', logoutHandler);

export default router;
