import assert from 'node:assert/strict';
import test from 'node:test';

// Set before config is imported (dotenv never overrides existing vars).
process.env.SUPABASE_URL ||= 'http://localhost';
process.env.SUPABASE_SERVICE_KEY ||= 'test';
process.env.OPENAI_API_KEY ||= 'test';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.VAPI_WEBHOOK_SECRET = 'test-vapi-secret';
process.env.VAPI_WEBHOOK_AUTH_MODE = 'enforce';

const { vapiWebhookAuth } = await import('../src/middleware/vapiWebhookAuth.middleware.js');
const { config } = await import('../src/config/env.js');
const {
  createSessionToken,
  createVapiWebhookToken,
  verifySessionToken,
  verifyVapiWebhookToken,
} = await import('../src/utils/sessionToken.js');

function run({ headers = {}, query = {}, body = { message: { type: 'assistant-request' } } } = {}) {
  const lower = Object.fromEntries(Object.entries(headers).map(([k, v]) => [k.toLowerCase(), v]));
  const req = { header: (name) => lower[name.toLowerCase()], query, body, ip: '127.0.0.1' };
  const res = {
    statusCode: null,
    payload: null,
    status(code) { this.statusCode = code; return this; },
    json(payload) { this.payload = payload; return this; },
  };
  let nextCalled = false;
  vapiWebhookAuth(req, res, () => { nextCalled = true; });
  return { req, res, nextCalled };
}

test('accepts the shared Vapi secret header', () => {
  const { req, nextCalled } = run({ headers: { 'X-Vapi-Secret': 'test-vapi-secret' } });
  assert.equal(nextCalled, true);
  assert.deepEqual(req.vapiAuth, { method: 'secret' });
});

test('rejects a wrong secret and no token with 401 when enforcing', () => {
  const { res, nextCalled } = run({ headers: { 'X-Vapi-Secret': 'nope' } });
  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 401);
  assert.equal(res.payload.error.code, 'UNAUTHORIZED');
});

test('rejects probe-style requests with no credentials when enforcing', () => {
  const { res, nextCalled } = run({ body: { message: { type: 'assistant-request', call: { id: 'probe-7523' } } } });
  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 401);
});

test('accepts a per-user webhook token and binds the request to that user', () => {
  const token = createVapiWebhookToken({ userId: 42, schoolId: 7 });
  const { req, nextCalled } = run({ query: { token } });
  assert.equal(nextCalled, true);
  assert.deepEqual(req.vapiAuth, { method: 'token', userId: 42, schoolId: 7 });
});

test('a browser session token is not accepted as a webhook token, and vice versa', () => {
  const sessionToken = createSessionToken({ userId: 42, schoolId: 7 });
  const webhookToken = createVapiWebhookToken({ userId: 42, schoolId: 7 });
  assert.equal(verifyVapiWebhookToken(sessionToken), null);
  assert.equal(verifySessionToken(webhookToken), null);
  assert.equal(run({ query: { token: sessionToken } }).res.statusCode, 401);
});

test('monitor mode lets unauthenticated requests through as method none', () => {
  config.vapiWebhookAuthMode = 'monitor';
  try {
    const { req, nextCalled } = run();
    assert.equal(nextCalled, true);
    assert.deepEqual(req.vapiAuth, { method: 'none' });
  } finally {
    config.vapiWebhookAuthMode = 'enforce';
  }
});
