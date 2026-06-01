import { processHighLevelPaymentCompleted } from '../services/automation.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const highLevelPaymentCompletedHandler = asyncHandler(async (req, res) => {
  const data = await processHighLevelPaymentCompleted(req.body);
  res.status(201).json({ data });
});
