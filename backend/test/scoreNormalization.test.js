import assert from 'node:assert/strict';
import test from 'node:test';
import {
  calculateAverageOverallScore,
  calculateWeightedOverallScore,
  normalizeOverallScore,
  resolveOverallScore,
} from '../src/utils/scoreNormalization.js';

const call192Categories = [
  { name: 'Rapport & Greeting', score: 9, feedback: '' },
  { name: 'Needs Discovery', score: 9, feedback: '' },
  { name: 'School Positioning & Offer', score: 8, feedback: '' },
  { name: 'Objection Handling', score: 7, feedback: '' },
  { name: 'Appointment Setting', score: 9, feedback: '' },
  { name: 'Information Gathering & Referrals', score: 7, feedback: '' },
];

test('built-in inbound scoring calculates overall from weighted categories', () => {
  const score = calculateWeightedOverallScore(call192Categories, 'Parent Enrolling a Child');

  assert.equal(score, 82);
});

test('built-in scoring ignores mismatched low-scale model overallScore', () => {
  const score = resolveOverallScore({
    overallScore: 8.3,
    categories: call192Categories,
    scenarioTitle: 'Parent Enrolling a Child',
    customScoringPrompt: null,
  });

  assert.equal(score, 82);
});

test('custom scoring normalizes 0-10 overall scores to 0-100', () => {
  assert.equal(normalizeOverallScore(8.3), 83);
});

test('custom scoring leaves 0-100 overall scores on the same scale', () => {
  assert.equal(normalizeOverallScore(86), 86);
});

test('custom scoring calculates overall from average category scores', () => {
  const score = calculateAverageOverallScore([
    { name: 'Greeting', score: 1, feedback: '' },
    { name: 'Close', score: 0.6, feedback: '' },
  ]);

  assert.equal(score, 8);
});

test('custom scoring uses category average before raw overallScore normalization', () => {
  const score = resolveOverallScore({
    overallScore: 8,
    categories: [
      { name: 'Greeting', score: 1, feedback: '' },
      { name: 'Close', score: 0.6, feedback: '' },
    ],
    scenarioTitle: 'Custom Scenario',
    customScoringPrompt: 'Score this custom scenario.',
  });

  assert.equal(score, 8);
});
