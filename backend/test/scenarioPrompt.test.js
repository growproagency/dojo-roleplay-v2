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

test('kids web lead callbacks stay parent and child focused', () => {
  const originalRandom = Math.random;
  Math.random = () => 0.25;

  try {
    const prompt = getScenarioSystemPrompt('kids_web_lead_callback', null, 'hard');

    assert.match(prompt, /Melissa/);
    assert.match(prompt, /Ava/);
    assert.match(prompt, /kids classes/);
    assert.match(prompt, /Selected Objections/);
    assert.match(prompt, /(other-parent decision|child fit|schedule uncertainty|price\/budget)/);
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

test('student advancement uses readiness and pressure blockers', () => {
  const originalRandom = Math.random;
  Math.random = () => 0.25;

  try {
    const prompt = getScenarioSystemPrompt('student_advancement', null, 'hard');

    assert.match(prompt, /Dana/);
    assert.match(prompt, /Maya/);
    assert.match(prompt, /advancement/);
    assert.match(prompt, /Selected Objections/);
    assert.match(prompt, /(readiness|pressure concern|schedule uncertainty|value clarity)/);
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

test('custom objection overrides respect per-difficulty counts', () => {
  const prompt = getScenarioSystemPrompt(
    'new_student',
    null,
    'hard',
    'Custom base prompt.',
    {
      easy: ['Easy concern'],
      medium: ['Medium concern one', 'Medium concern two'],
      hard: ['Hard concern one', 'Hard concern two', 'Hard concern three'],
    },
    { easy: 1, medium: 2, hard: 3 }
  );

  assert.match(prompt, /Selected Objections/);
  assert.match(prompt, /1\. Hard concern/);
  assert.match(prompt, /2\. Hard concern/);
  assert.match(prompt, /3\. Hard concern/);
  assert.doesNotMatch(prompt, /4\. Hard concern/);
});
