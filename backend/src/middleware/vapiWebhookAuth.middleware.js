import { timingSafeEqual } from 'node:crypto';
import { config } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { verifyVapiWebhookToken } from '../utils/sessionToken.js';

function secretsMatch(provided, expected) {
  if (!provided || !expected) return false;
  const a = Buffer.from(String(provided));
  const b = Buffer.from(String(expected));
  return a.length === b.length && timingSafeEqual(a, b);
}

// Authenticates Vapi webhooks. Sets req.vapiAuth to one of:
//   { method: 'secret' }                     - x-vapi-secret header matched (assistants/phone numbers we configure)
//   { method: 'token', userId, schoolId }    - per-user token in ?token= (assistants built for the browser)
//   { method: 'none' }                       - unauthenticated, only allowed in monitor mode or before a secret is set
export function vapiWebhookAuth(req, res, next) {
  if (secretsMatch(req.header('x-vapi-secret'), config.vapiWebhookSecret)) {
    req.vapiAuth = { method: 'secret' };
    return next();
  }

  const tokenTenant = verifyVapiWebhookToken(req.query?.token);
  if (tokenTenant) {
    req.vapiAuth = { method: 'token', ...tokenTenant };
    return next();
  }

  const enforcing = !!config.vapiWebhookSecret && config.vapiWebhookAuthMode === 'enforce';
  logger.warn({
    ip: req.ip,
    messageType: req.body?.message?.type ?? null,
    hasSecretHeader: !!req.header('x-vapi-secret'),
    hasToken: !!req.query?.token,
    enforcing,
  }, enforcing ? 'Rejected unauthenticated Vapi webhook' : 'Unauthenticated Vapi webhook allowed (auth not enforced)');

  if (enforcing) {
    return res.status(401).json({
      error: { code: 'UNAUTHORIZED', message: 'Invalid webhook credentials', status: 401 },
    });
  }

  req.vapiAuth = { method: 'none' };
  return next();
}
