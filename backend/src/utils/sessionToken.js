import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';

const TTL_SECONDS = 60 * 30; // 30 minutes
const WEBHOOK_TOKEN_AUDIENCE = 'vapi-webhook';
// Must outlive the longest call (maxDurationSeconds = 1200) plus the end-of-call report delay.
const WEBHOOK_TOKEN_TTL_SECONDS = 60 * 60 * 2;

export function createSessionToken({ userId, schoolId }) {
  return jwt.sign(
    { userId, schoolId: schoolId ?? null },
    config.jwtSecret,
    { expiresIn: TTL_SECONDS }
  );
}

export function verifySessionToken(token) {
  try {
    const payload = jwt.verify(token, config.jwtSecret);
    // Webhook tokens are scoped to the webhook URL only; never accept them as session tokens.
    return payload?.aud === WEBHOOK_TOKEN_AUDIENCE ? null : payload;
  } catch {
    return null;
  }
}

// Per-user token embedded in the webhook URL of assistants that are handed to the browser.
// Those assistants cannot carry the shared Vapi secret, so this token authenticates their
// webhooks and binds them to the user who started the call.
export function createVapiWebhookToken({ userId, schoolId }) {
  return jwt.sign(
    { userId, schoolId: schoolId ?? null },
    config.jwtSecret,
    { expiresIn: WEBHOOK_TOKEN_TTL_SECONDS, audience: WEBHOOK_TOKEN_AUDIENCE }
  );
}

export function verifyVapiWebhookToken(token) {
  if (!token || typeof token !== 'string') return null;
  try {
    const payload = jwt.verify(token, config.jwtSecret, { audience: WEBHOOK_TOKEN_AUDIENCE });
    return payload?.userId ? { userId: payload.userId, schoolId: payload.schoolId ?? null } : null;
  } catch {
    return null;
  }
}
