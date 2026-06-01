import { asyncHandler } from '../utils/asyncHandler.js';
import { handleVapiWebhook } from '../services/vapi.service.js';

export const vapiWebhookHandler = asyncHandler(async (req, res) => {
  const data = await handleVapiWebhook(req.body.message);
  res.json(data);
});
