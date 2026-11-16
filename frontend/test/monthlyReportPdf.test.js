import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { createMonthlyReportPdf } from '../src/utils/downloadMonthlyReport.js';
import { reportFilename, reportTitle } from '../src/utils/monthlyReportPresentation.js';

const font = readFileSync(new URL('../src/assets/fonts/NotoSans-Regular.ttf', import.meta.url));
const difficulty = ['easy', 'medium', 'hard', 'legacy'].map(level => ({ difficulty: level, calls: 2, scoredCalls: 2, avgScore: 75 }));
const sample = () => ({ employee: { id: 1, name: 'Matthew', email: 'matthew@example.com' }, school: { name: 'Test School' },
  period: { label: 'October 2026', monthName: 'October', month: '2026-10', timezone: 'America/New_York', generatedAt: '2026-11-12T00:00:00Z' },
  metrics: { callsMade: 8, completedCalls: 8, scoredCalls: 8, minutesUsed: 32, activeDays: 4, failedCalls: 0, missingDurations: 0,
    avgScore: 75, avgPoints: 97.5, bestScore: 90, limitedData: false, difficulty },
  previous: { difficulty }, comparison: { hasPreviousActivity: true, callsMade: 3, minutesUsed: 10, avgScore: 5, avgPoints: 8 },
  coaching: { strengths: [{ category: 'Discovery', scenario: 'New student', avgScore: 8, sampleSize: 5, callIds: [1, 2] }],
    improvements: [], highlights: [{ text: 'Asked about goals.', callIds: [1] }], missedOpportunities: [], nextSteps: [{ text: 'Confirm a specific next step.', callIds: [2] }] } });

test('report titles and safe filenames preserve employee, month, and year', () => {
  const report = sample();
  assert.equal(reportTitle(report), "Matthew's October Report");
  assert.equal(reportFilename(report), "Matthew's October Report 2026.pdf");
  report.employee.name = 'John/Smith';
  assert.equal(reportFilename(report), "John-Smith's October Report 2026.pdf");
});

test('PDF generation embeds a Unicode font and creates a selectable two-page report', () => {
  const report = sample(); report.employee.name = 'José';
  const doc = createMonthlyReportPdf(report, font);
  assert.equal(doc.getNumberOfPages(), 2);
  const output = doc.output();
  assert.ok(output.startsWith('%PDF-'));
  assert.match(output, /\/FontFile2/);
  assert.match(output, /\/ToUnicode/);
  assert.ok(doc.internal.pages[1].join('\n').includes(' Tj'));
  assert.ok(doc.internal.pages[2].join('\n').includes(' Tj'));
});

test('long feedback creates continuation pages and every text baseline stays inside the page', () => {
  const report = sample();
  report.coaching.nextSteps = Array.from({ length: 3 }, () => ({ text: 'Practice confirming the next step and responding to the prospect. '.repeat(80), callIds: [1] }));
  const doc = createMonthlyReportPdf(report, font);
  assert.ok(doc.getNumberOfPages() > 2);
  for (const page of doc.internal.pages.slice(1)) {
    for (const match of page.join('\n').matchAll(/(-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?) Td/g)) {
      const y = Number(match[2]);
      assert.ok(y > 0 && y < 842, `Text falls outside A4 at ${y}`);
    }
  }
});

test('no-activity and month-to-date reports can still be exported', () => {
  const report = sample();
  report.period.monthToDate = true;
  Object.assign(report.metrics, { callsMade: 0, completedCalls: 0, scoredCalls: 0, minutesUsed: 0, avgScore: null, avgPoints: null, bestScore: null, limitedData: true, missingDurations: 1 });
  report.comparison.hasPreviousActivity = false;
  report.coaching = { strengths: [], improvements: [], highlights: [], missedOpportunities: [], nextSteps: [] };
  assert.equal(createMonthlyReportPdf(report, font).getNumberOfPages(), 2);
});
