import assert from 'node:assert/strict';
import test from 'node:test';
import { getScenarioSystemPrompt } from '../src/data/scenarios.js';

test('web lead callbacks vary medium objections beyond schedule', () => {
  const originalRandom = Math.random;
  Math.random = () => 0.3;

  try {
    const prompt = getScenarioSystemPrompt('web_lead_callback', null, 'medium');

    assert.match(prompt, /Selected Objections/);
    assert.match(prompt, /(check with your partner|usually costs|couple of schools|class time options)/);
    assert.match(prompt, /Do not default to schedule/);
  } finally {
    Math.random = originalRandom;
  }
});

test('hard adult inbound can use a non-schedule blocker', () => {
  const originalRandom = Math.random;
  Math.random = () => 0;

  try {
    const prompt = getScenarioSystemPrompt('new_student', null, 'hard');

    assert.match(prompt, /Selected Objections/);
    assert.match(prompt, /(price\/budget|schedule uncertainty|commitment concern|comparison shopping)/);
    assert.match(prompt, /Do not default to schedule/);
  } finally {
    Math.random = originalRandom;
  }
});

test('hard parent enrollment can use a non-schedule blocker', () => {
  const originalRandom = Math.random;
  Math.random = () => 0.25;

  try {
    const prompt = getScenarioSystemPrompt('parent_enrollment', null, 'hard');

    assert.match(prompt, /Selected Objections/);
    assert.match(prompt, /(other-parent decision|family's budget|schedule uncertainty|child fit)/);
    assert.match(prompt, /Do not default to schedule/);
  } finally {
    Math.random = originalRandom;
  }
});

test('hard sales enrollment can use a random blocker', () => {
  const originalRandom = Math.random;
  Math.random = () => 0.75;

  try {
    const prompt = getScenarioSystemPrompt('sales_enrollment', null, 'hard');

    assert.match(prompt, /Selected Objections/);
    assert.match(prompt, /(price\/budget|other-parent decision|schedule uncertainty|commitment length)/);
    assert.match(prompt, /Do not default to schedule/);
  } finally {
    Math.random = originalRandom;
  }
});

test('hard renewal conference can use a random blocker', () => {
  const originalRandom = Math.random;
  Math.random = () => 0.75;

  try {
    const prompt = getScenarioSystemPrompt('renewal_conference', null, 'hard');

    assert.match(prompt, /Selected Objections/);
    assert.match(prompt, /(price\/value|other-parent decision|schedule uncertainty|progress doubt)/);
    assert.match(prompt, /Do not default to schedule/);
  } finally {
    Math.random = originalRandom;
  }
});

test('scenario prompts discourage elongated filler sounds', () => {
  const prompt = getScenarioSystemPrompt('web_lead_callback', null, 'easy');

  assert.match(prompt, /Never elongate filler words/);
  assert.match(prompt, /Do not say "uhhhhh"/);
});
