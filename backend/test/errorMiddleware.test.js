import assert from 'node:assert/strict';
import test from 'node:test';
import { errorHandler } from '../src/middleware/error.middleware.js';

function createMockResponse() {
  return {
    statusCode: null,
    payload: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.payload = payload;
      return this;
    },
  };
}

test('call-not-scoreable errors return a helpful message', () => {
  const res = createMockResponse();

  errorHandler(
    new Error('CALL_NOT_SCOREABLE'),
    { url: '/api/calls/1/score', method: 'POST', user: { id: 1 } },
    res,
    () => {}
  );

  assert.equal(res.statusCode, 400);
  assert.deepEqual(res.payload, {
    error: {
      code: 'CALL_NOT_SCOREABLE',
      message: 'This call is too short or does not contain enough conversation to generate a scorecard.',
      status: 400,
    },
  });
});
