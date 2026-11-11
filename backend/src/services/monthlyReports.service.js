import * as queries from '../db/monthlyReports.queries.js';
import { callsInMonth, compareActivity, reportPeriod, summarizeActivity, summarizeCoaching } from '../utils/monthlyReports.js';

async function allPages(query, offset = 0) {
  const rows = await query(offset);
  return rows.length < 100 ? rows : rows.concat(await allPages(query, offset + 100));
}

export function assertReportAccess(actor, schoolId) {
  const global = ['admin', 'global_admin'].includes(actor?.role);
  if (!schoolId || (!global && (actor?.role !== 'school_admin' || actor.schoolId !== schoolId))) throw new Error('FORBIDDEN');
}

// Dependency injection keeps school isolation and complete pagination testable without a live database.
export function createMonthlyReportsService(db = queries, clock = () => new Date()) {
  async function context(actor, schoolId, month) {
    assertReportAccess(actor, schoolId);
    const school = await db.findReportSchool(schoolId);
    if (!school) throw new Error('NOT_FOUND');
    const period = reportPeriod(month, school.reporting_timezone || 'UTC', clock());
    return { school: { id: school.id, name: school.name }, period };
  }

  async function list({ actor, schoolId, month, page = 1, limit = 25 }) {
    const { school, period } = await context(actor, schoolId, month);
    const [members, calls] = await Promise.all([
      allPages(offset => db.findReportMembers(schoolId, offset)),
      allPages(offset => db.findReportCalls({ schoolId, ...period, offset })),
    ]);
    const byId = new Map(members.map(member => [member.id, member]));
    callsInMonth(calls, period.month, period.timezone, new Date(period.generatedAt)).forEach(call => {
      if (!byId.has(call.user_id)) byId.set(call.user_id, { id: call.user_id, ...((Array.isArray(call.users) ? call.users[0] : call.users) || {}), formerMember: true });
    });
    const employees = [...byId.values()].map(employee => {
      const own = calls.filter(call => call.user_id === employee.id);
      const metrics = summarizeActivity(callsInMonth(own, period.month, period.timezone, new Date(period.generatedAt)), period.timezone);
      const previous = summarizeActivity(callsInMonth(own, period.previousMonth, period.timezone, new Date(period.generatedAt)), period.timezone);
      return { ...employee, metrics, comparison: compareActivity(metrics, previous) };
    }).sort((a, b) => (a.name || a.email || '').localeCompare(b.name || b.email || '') || a.id - b.id);
    return { data: employees.slice((page - 1) * limit, page * limit), school, period,
      meta: { total: employees.length, page, limit, totalPages: Math.ceil(employees.length / limit) } };
  }

  async function detail({ actor, schoolId, month, userId }) {
    const { school, period } = await context(actor, schoolId, month);
    const [members, calls] = await Promise.all([
      allPages(offset => db.findReportMembers(schoolId, offset)),
      allPages(offset => db.findReportCalls({ schoolId, userId, ...period, offset })),
    ]);
    const current = callsInMonth(calls, period.month, period.timezone, new Date(period.generatedAt));
    const former = current[0];
    const employee = members.find(member => member.id === userId) ?? (former ? { id: userId,
      ...((Array.isArray(former.users) ? former.users[0] : former.users) || {}), formerMember: true } : null);
    if (!employee) throw new Error('NOT_FOUND');
    const metrics = summarizeActivity(current, period.timezone);
    const previous = summarizeActivity(callsInMonth(calls, period.previousMonth, period.timezone, new Date(period.generatedAt)), period.timezone);
    return { data: { school, employee, period, metrics, previous, comparison: compareActivity(metrics, previous), coaching: summarizeCoaching(current) } };
  }

  async function updateSettings({ actor, schoolId, timezone }) {
    assertReportAccess(actor, schoolId);
    const school = await db.findReportSchool(schoolId);
    if (!school) throw new Error('NOT_FOUND');
    await db.updateReportingTimezone(school.id, timezone);
    return { data: { timezone } };
  }
  return { list, detail, updateSettings };
}

export const monthlyReportsService = createMonthlyReportsService();
