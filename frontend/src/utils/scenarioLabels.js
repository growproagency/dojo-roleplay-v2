const SCENARIO_LABELS = {
  new_student: 'New Student',
  parent_enrollment: 'Parent Enrollment',
  web_lead_callback: 'Outbound Callback',
  kids_web_lead_callback: 'Kids Outbound Callback',
  sales_enrollment: 'Sales Enrollment',
  renewal_conference: 'Renewal',
  student_advancement: 'Student Advancement',
  cancellation_save: 'Cancellation Save',
};

export function labelScenario(value, overrides = {}) {
  if (!value) return 'Unknown';
  const labels = { ...SCENARIO_LABELS, ...overrides };
  if (labels[value]) return labels[value];

  return String(value)
    .replace(/[_-]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}
