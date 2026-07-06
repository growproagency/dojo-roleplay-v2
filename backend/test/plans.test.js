import assert from 'node:assert/strict';
import test from 'node:test';
import { canUseCustomScenarios } from '../src/utils/plans.js';

test('custom scenario access is enabled by default unless explicitly disabled', () => {
  assert.equal(canUseCustomScenarios({ plan: 'aios', customScenariosEnabled: false }), false);
  assert.equal(canUseCustomScenarios({ plan: 'starter', customScenariosEnabled: true }), true);
  assert.equal(canUseCustomScenarios({ plan: 'starter' }), true);
});

test('custom scenario access keeps plan fallback for legacy callers', () => {
  assert.equal(canUseCustomScenarios('aios'), true);
  assert.equal(canUseCustomScenarios('starter'), false);
});
