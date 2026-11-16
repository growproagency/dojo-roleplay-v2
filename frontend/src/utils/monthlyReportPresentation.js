export const metricValue = (value, suffix = '') => value == null ? 'Not available' : `${value}${suffix}`;
export function reportTitle(report) {
  const name = report.employee.name?.trim() || report.employee.email || 'Employee';
  return `${name}'s ${report.period.monthName} Report`;
}
export function reportFilename(report) {
  return `${reportTitle(report)} ${report.period.month.slice(0, 4)}`.replace(/[<>:"/\\|?*\x00-\x1F]/g, '-').slice(0, 180) + '.pdf';
}
export function comparisonText(value, suffix = '') {
  return value == null ? 'No comparison available' : `${value > 0 ? '+' : ''}${value}${suffix} vs previous month`;
}
export function coachingSections(report) {
  const formatCategory = item => ({ text: `${item.category} (${item.scenario}): ${item.avgScore}/10 across ${item.sampleSize} scored call${item.sampleSize === 1 ? '' : 's'}.`, callIds: item.callIds });
  return [
    { title: 'What went well', items: report.coaching.strengths.map(formatCategory), empty: 'No category averages of 7/10 or higher recorded.' },
    { title: 'What needs improvement', items: report.coaching.improvements.map(formatCategory), empty: 'No category averages below 7/10 recorded.' },
    { title: 'Highlights from call feedback', items: report.coaching.highlights, empty: 'No highlights recorded.' },
    { title: 'Missed opportunities', items: report.coaching.missedOpportunities, empty: 'No missed opportunities recorded.' },
    { title: "Next month's focus", items: report.coaching.nextSteps, empty: 'No saved coaching suggestions available yet.' },
  ];
}
