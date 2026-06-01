import { config } from '../config/env.js';

export function automationAuth(req, res, next) {
  if (!config.automationWebhookSecret) {
    return res.status(503).json({
      error: { code: 'NOT_CONFIGURED', message: 'Automation webhook secret is not configured', status: 503 },
    });
  }

  const token = req.header('x-automation-secret');
  if (token !== config.automationWebhookSecret) {
    return res.status(401).json({
      error: { code: 'UNAUTHORIZED', message: 'Invalid automation secret', status: 401 },
    });
  }

  return next();
}
