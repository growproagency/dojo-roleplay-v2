import test from 'node:test';
import assert from 'node:assert/strict';
import { getVapiRecordingUrl } from '../src/services/vapiRecording.service.js';

test('requests a mono recording with Vapi authentication and returns the signed URL', async () => {
  let request;
  const signedUrl = 'https://storage.example.com/recording.wav?signature=short-lived';
  const fetchImpl = async (url, options) => {
    request = { url, options };
    return new Response(null, { status: 302, headers: { location: signedUrl } });
  };

  const result = await getVapiRecordingUrl('call/123', { apiKey: 'private-key', fetchImpl });

  assert.equal(result, signedUrl);
  assert.equal(request.url, 'https://api.vapi.ai/call/call%2F123/mono-recording');
  assert.equal(request.options.headers.Authorization, 'Bearer private-key');
  assert.equal(request.options.redirect, 'manual');
});

test('rejects recording requests when the Vapi API key is missing', async () => {
  await assert.rejects(
    getVapiRecordingUrl('call-123', { apiKey: '' }),
    { message: 'VAPI_NOT_CONFIGURED' },
  );
});

test('maps a missing Vapi recording to RECORDING_UNAVAILABLE', async () => {
  const fetchImpl = async () => new Response(null, { status: 404 });

  await assert.rejects(
    getVapiRecordingUrl('call-123', { apiKey: 'private-key', fetchImpl }),
    { message: 'RECORDING_UNAVAILABLE' },
  );
});

test('rejects non-HTTPS recording redirects', async () => {
  const fetchImpl = async () => new Response(null, {
    status: 302,
    headers: { location: 'http://storage.example.com/recording.wav' },
  });

  await assert.rejects(
    getVapiRecordingUrl('call-123', { apiKey: 'private-key', fetchImpl }),
    { message: 'VAPI_RECORDING_FAILED' },
  );
});
