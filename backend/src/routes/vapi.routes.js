import { Router } from 'express';
import { validateBody } from '../middleware/validate.middleware.js';
import { vapiWebhookHandler } from '../controllers/vapi.controller.js';
import { vapiWebhookSchema } from '../schemas/vapi.schema.js';

// Public — no auth (Vapi sends events here)
const router = Router();
router.post('/webhook', validateBody(vapiWebhookSchema), vapiWebhookHandler);
export default router;
