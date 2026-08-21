import { Router } from 'express';
import { validateBody } from '../middleware/validate.middleware.js';
import { createSupportRequestSchema } from '../schemas/supportRequests.schema.js';
import * as supportRequestsController from '../controllers/supportRequests.controller.js';

const router = Router();
router.get('/', supportRequestsController.listMine);
router.post('/', validateBody(createSupportRequestSchema), supportRequestsController.create);

export default router;
