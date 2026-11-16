import { jsPDF } from 'jspdf';
import { coachingSections, comparisonText, metricValue, reportFilename, reportTitle } from './monthlyReportPresentation.js';

export function createMonthlyReportPdf(report, fontBuffer) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4', compress: true });
  const bytes = new Uint8Array(fontBuffer);
  let binary = '';
  for (let index = 0; index < bytes.length; index += 8192) binary += String.fromCharCode(...bytes.subarray(index, index + 8192));
  doc.addFileToVFS('NotoSans-Regular.ttf', btoa(binary));
  doc.addFont('NotoSans-Regular.ttf', 'Report', 'normal');
  doc.setFont('Report', 'normal');
  doc.setProperties({ title: reportTitle(report), subject: `DRP Monthly Report Card - ${report.period.label}`, author: 'Dojo Roleplay' });
  const left = 18, width = 174, bottom = 276;
  let y = 0;
  function header() {
    doc.setFillColor(24, 36, 57); doc.rect(0, 0, 210, 22, 'F');
    doc.setTextColor(255, 255, 255); doc.setFontSize(11); doc.text('DOJO ROLEPLAY  /  MONTHLY REPORT CARD', left, 14);
    doc.setTextColor(35, 45, 60); y = 33;
  }
  function page() { doc.addPage(); header(); }
  function text(value, { size = 10, gap = 3, color = [35, 45, 60] } = {}) {
    doc.setFontSize(size); doc.setTextColor(...color);
    const lineHeight = size * 0.3528 * 1.5;
    const lines = doc.splitTextToSize(String(value), width);
    for (const line of lines) {
      if (y + lineHeight > bottom) { page(); doc.setFontSize(size); doc.setTextColor(...color); }
      doc.text(line, left, y); y += lineHeight;
    }
    y += gap;
  }
  function heading(title) {
    if (y + 24 > bottom) page();
    y += 3; text(title, { size: 13, color: [33, 91, 145], gap: 3 });
  }
  header();
  text(reportTitle(report), { size: 21, gap: 4 });
  text(`${report.period.label} | ${report.school.name} | ${report.period.timezone}`, { size: 10 });
  if (report.employee.email) text(report.employee.email, { size: 9 });
  if (report.period.monthToDate) text('MONTH TO DATE — activity through the generation date.', { color: [145, 88, 15] });
  const m = report.metrics;
  heading('Practice activity');
  text(`Minutes used: ${m.minutesUsed}   |   Calls made: ${m.callsMade}   |   Active practice days: ${m.activeDays}`);
  text(`Completed: ${m.completedCalls}   |   Successfully scored: ${m.scoredCalls}   |   Failed: ${m.failedCalls}`);
  if (!m.callsMade) text('No practice recorded for this month. Performance is not scored as zero.');
  if (m.missingDurations) text(`${m.missingDurations} call(s) have no recorded duration. Minutes are incomplete.`);
  heading('Performance');
  text(`Average score: ${metricValue(m.avgScore, '%')}   |   Best score: ${metricValue(m.bestScore, '%')}`);
  text(`Average leaderboard points: ${metricValue(m.avgPoints, ' pts')}`);
  text(`Score coverage: ${m.scoredCalls} of ${m.completedCalls} completed calls scored.`);
  if (m.limitedData) text('Limited data: fewer than 5 scored calls. Treat coaching patterns as provisional.', { color: [145, 88, 15] });
  heading('Challenge level');
  m.difficulty.forEach(d => {
    const previous = report.previous.difficulty.find(item => item.difficulty === d.difficulty);
    text(`${d.difficulty.toUpperCase()}: ${d.calls} calls, ${d.scoredCalls} scored — average ${metricValue(d.avgScore, '%')} (previous: ${metricValue(previous?.avgScore, '%')})`, { gap: 1 });
  });
  heading('Previous-month comparison');
  if (!report.comparison.hasPreviousActivity) text('No previous-month activity recorded.');
  else {
    text(`Calls: ${comparisonText(report.comparison.callsMade)}`);
    text(`Minutes: ${comparisonText(report.comparison.minutesUsed)}`);
    text(`Average score: ${comparisonText(report.comparison.avgScore, ' percentage points')}`);
    text(`Average leaderboard points: ${comparisonText(report.comparison.avgPoints, ' pts')}`);
  }
  if (report.period.monthToDate) text('Comparison uses the full previous month; the current month is still in progress.', { size: 9 });
  page();
  text('Coaching and next steps', { size: 20 });
  text('Based on saved scorecard feedback. Category scores are grouped by scenario.', { size: 9 });
  for (const section of coachingSections(report)) {
    heading(section.title);
    if (!section.items.length) text(section.empty, { color: [105, 110, 120] });
    section.items.forEach((item, index) => {
      text(`${index + 1}. ${item.text}`);
      text(`Supporting calls: ${item.callIds.map(id => `#${id}`).join(', ')}`, { size: 8, color: [105, 110, 120] });
    });
  }
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i); doc.setFontSize(8); doc.setTextColor(105, 110, 120);
    doc.text(`Generated ${report.period.generatedAt.slice(0, 10)} (UTC) | ${report.period.label} | ${i} / ${pages}`, left, 288);
  }
  return doc;
}

export function downloadMonthlyReport(report, fontBuffer) {
  createMonthlyReportPdf(report, fontBuffer).save(reportFilename(report));
}
