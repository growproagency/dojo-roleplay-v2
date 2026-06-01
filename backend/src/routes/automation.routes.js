import express from 'express';
import { highLevelPaymentCompletedHandler } from '../controllers/automation.controller.js';
import { automationAuth } from '../middleware/automationAuth.middleware.js';
import { validateBody } from '../middleware/validate.middleware.js';
import { highLevelPaymentCompletedSchema } from '../schemas/automation.schema.js';

const router = express.Router();

router.post(
  '/highlevel/payment-completed',
  automationAuth,
  validateBody(highLevelPaymentCompletedSchema),
  highLevelPaymentCompletedHandler
);

export default router;
