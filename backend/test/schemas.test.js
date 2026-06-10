import assert from 'node:assert/strict';
import test from 'node:test';
import { acceptInviteSchema, updateProfileSchema } from '../src/schemas/auth.schema.js';
import { unassignUserSchema, updatePlatformSchema } from '../src/schemas/admin.schema.js';
import { vapiWebhookSchema } from '../src/schemas/vapi.schema.js';

test('acceptInviteSchema lowercases email and strips unknown fields', () => {
  const { error, value } = acceptInviteSchema.validate({
    email: 'Staff@Example.com',
    password: 'secret123',
    role: 'global_admin',
  });

  assert.equal(error, undefined);
  assert.deepEqual(value, { email: 'staff@example.com' });
});

test('updateProfileSchema validates E.164 phone numbers', () => {
  const valid = updateProfileSchema.validate({ phoneNumber: '+639171234567' });
  const invalid = updateProfileSchema.validate({ phoneNumber: '09171234567' });

  assert.equal(valid.error, undefined);
  assert.equal(invalid.error?.details[0]?.type, 'string.pattern.base');
});

test('updatePlatformSchema accepts maintenance banner fields', () => {
  const { error, value } = updatePlatformSchema.validate({
    maintenanceEnabled: true,
    maintenanceMessage: 'Scheduled maintenance tonight.',
    maintenanceSeverity: 'warning',
    maintenanceNotice: 'old field',
  });

  assert.equal(error, undefined);
  assert.deepEqual(value, {
    maintenanceEnabled: true,
    maintenanceMessage: 'Scheduled maintenance tonight.',
    maintenanceSeverity: 'warning',
  });
});

test('unassignUserSchema accepts the current client payload', () => {
  const { error, value } = unassignUserSchema.validate({ schoolId: null, extra: 'ignored' });

  assert.equal(error, undefined);
  assert.deepEqual(value, { schoolId: null });
});

test('vapiWebhookSchema keeps the provider payload under message', () => {
  const { error, value } = vapiWebhookSchema.validate({
    message: {
      type: 'end-of-call-report',
      call: { id: 'call_123' },
      artifact: { messages: [] },
    },
    ignored: true,
  });

  assert.equal(error, undefined);
  assert.equal(value.ignored, undefined);
  assert.equal(value.message.call.id, 'call_123');
});
