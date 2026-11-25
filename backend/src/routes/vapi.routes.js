import { Router } from 'express';
import { validateBody } from '../middleware/validate.middleware.js';
import { vapiWebhookAuth } from '../middleware/vapiWebhookAuth.middleware.js';
import { vapiWebhookHandler } from '../controllers/vapi.controller.js';
import { vapiWebhookSchema } from '../schemas/vapi.schema.js';

// Called by Vapi, not by logged-in users: authenticated by shared secret or per-user webhook token.
const router = Router();
router.post('/webhook', vapiWebhookAuth, validateBody(vapiWebhookSchema), vapiWebhookHandler);
export default router;
