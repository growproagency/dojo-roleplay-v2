import { useState } from 'react';
import { Link, Navigate, useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useAdminSchools } from '../hooks/useAdmin';
import { useMonthlyReport, useMonthlyReports, useUpdateReportSettings, useDownloadMonthlyReport } from '../hooks/useMonthlyReports';
import { useUIStore } from '../store/ui.store';
import DashboardLayout from '../components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Loader2, Download, ArrowLeft, FileText } from 'lucide-react';
import { coachingSections, comparisonText, metricValue, reportTitle } from '../utils/monthlyReportPresentation';

function TimezoneSettings({ timezone, schoolId }) {
  const [value, setValue] = useState(timezone);
  const update = useUpdateReportSettings();
  return <form className="flex flex-wrap items-end gap-2" onSubmit={event => { event.preventDefault(); update.mutate({ timezone: value }); }}>
    <label className="space-y-1 text-xs text-muted-foreground">School reporting timezone
      <Input list={`report-timezones-${schoolId}`} value={value} onChange={e => setValue(e.target.value)} required maxLength={100} className="w-60" />
    </label>
    <datalist id={`report-timezones-${schoolId}`}>
      {['UTC', 'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles', 'Europe/London', 'Asia/Manila', 'Australia/Sydney'].map(zone => <option key={zone} value={zone} />)}
    </datalist>
    <Button type="submit" size="sm" variant="outline" disabled={update.isPending || value === timezone}>{update.isPending ? 'Saving…' : 'Save timezone'}</Button>
    {update.isError && <p role="alert" className="w-full text-sm text-destructive">{update.error.message}</p>}
    {update.isSuccess && <p role="status" className="w-full text-xs text-muted-foreground">Timezone saved. Monthly reports have been recalculated.</p>}
  </form>;
}

function Metric({ title, value, comparison }) {
  return <Card><CardContent className="pt-5">
    <p className="text-xs text-muted-foreground">{title}</p><p className="mt-1 text-2xl font-semibold">{value}</p>
    {comparison && <p className="mt-1 text-xs text-muted-foreground">{comparison}</p>}
  </CardContent></Card>;
}

function EmployeeReport({ report }) {
  const download = useDownloadMonthlyReport();
  const m = report.metrics;
  const sections = coachingSections(report);
  return <div className="space-y-5">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div><h2 className="text-2xl font-semibold">{reportTitle(report)}</h2>
        <p className="text-sm text-muted-foreground">{report.employee.email} · {report.school.name} · {report.period.label}</p>
        {report.employee.formerMember && <p className="text-xs text-muted-foreground">Former member — includes only calls made at this school.</p>}
      </div>
      <Button onClick={() => download.mutate(report)} disabled={download.isPending}>
        {download.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}Download PDF
      </Button>
    </div>
    {download.isError && <p role="alert" className="text-sm text-destructive">The PDF could not be created. Please try again.</p>}
    {!m.callsMade && <p className="rounded-lg border p-4 text-muted-foreground">No practice recorded for this month. Performance is not scored as zero.</p>}
    {m.limitedData && <p className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4 text-sm">Limited data: {m.scoredCalls} scored calls. Coaching patterns are provisional until at least five calls are scored.</p>}
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <Metric title="Minutes used" value={m.minutesUsed} comparison={comparisonText(report.comparison.minutesUsed)} />
      <Metric title="Calls made" value={m.callsMade} comparison={comparisonText(report.comparison.callsMade)} />
      <Metric title="Average score" value={metricValue(m.avgScore, '%')} comparison={comparisonText(report.comparison.avgScore, ' percentage points')} />
      <Metric title="Average leaderboard points" value={metricValue(m.avgPoints, ' pts')} comparison={comparisonText(report.comparison.avgPoints, ' pts')} />
    </div>
    <Card><CardContent className="pt-5 space-y-2 text-sm">
      <p>{m.scoredCalls} of {m.completedCalls} completed calls scored · {m.activeDays} active practice days · {m.failedCalls} failed calls · Best score: {metricValue(m.bestScore, '%')}</p>
      {m.missingDurations > 0 && <p className="text-amber-500">Minutes are incomplete: {m.missingDurations} calls have no recorded duration.</p>}
      <p className="text-muted-foreground">{report.comparison.hasPreviousActivity ? 'Comparisons use the previous calendar month.' : 'No previous-month activity recorded.'} {report.period.monthToDate && 'This month is still in progress; the comparison uses the full previous month.'}</p>
    </CardContent></Card>
    <Card><CardHeader><CardTitle className="text-base">Challenge level</CardTitle></CardHeader><CardContent>
      <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b text-left text-muted-foreground">
        {['Difficulty', 'Calls', 'Scored', 'Avg score', 'Previous month'].map(label => <th className="pb-3 pr-4 font-medium" key={label}>{label}</th>)}
      </tr></thead><tbody>{m.difficulty.map(d => {
        const prev = report.previous.difficulty.find(item => item.difficulty === d.difficulty);
        return <tr key={d.difficulty} className="border-b border-border/50"><td className="py-3 capitalize">{d.difficulty}</td><td>{d.calls}</td><td>{d.scoredCalls}</td><td>{metricValue(d.avgScore, '%')}</td><td>{metricValue(prev?.avgScore, '%')}</td></tr>;
      })}</tbody></table></div>
      <p className="mt-3 text-xs text-muted-foreground">Compare scores within each difficulty when judging progress. Points use Easy ×1.00, Medium ×1.15 and Hard ×1.30; legacy calls use ×1.00.</p>
    </CardContent></Card>
    <div className="grid gap-4 lg:grid-cols-2">{sections.map(section => <Card key={section.title}>
      <CardHeader><CardTitle className="text-base">{section.title}</CardTitle></CardHeader>
      <CardContent>{section.items.length ? <ul className="space-y-4">{section.items.map((item, index) => <li key={index} className="text-sm">
        <p className="leading-relaxed">{item.text}</p>
        <div className="mt-1 flex flex-wrap gap-3 text-xs">{item.callIds.map(id => <Link className="text-primary underline underline-offset-2" key={id} to={`/calls/${id}`}>Call #{id}</Link>)}</div>
      </li>)}</ul> : <p className="text-sm text-muted-foreground">{section.empty}</p>}</CardContent>
    </Card>)}</div>
    <p className="text-xs text-muted-foreground">Coaching uses saved scorecard feedback. Category averages are grouped by scenario. Generated {new Date(report.period.generatedAt).toLocaleString()} · Reporting timezone: {report.period.timezone}</p>
  </div>;
}

export function MonthlyReportsPage() {
  const { userId } = useParams();
  const [search, setSearch] = useSearchParams();
  const { isSchoolAdmin, isGlobalAdmin, profile, profileLoading } = useAuth();
  const viewingSchoolId = useUIStore(s => s.viewingSchoolId);
  const setViewingSchoolId = useUIStore(s => s.setViewingSchoolId);
  const schoolId = viewingSchoolId ?? profile?.schoolId ?? profile?.school?.id;
  const { data: schools } = useAdminSchools(isGlobalAdmin);
  const month = search.get('month');
  const page = Math.max(1, Number(search.get('page')) || 1);
  const params = { ...(month ? { month } : {}), page, limit: 25 };
  const overview = useMonthlyReports(params, !userId);
  const detail = useMonthlyReport(userId, month ? { month } : {});
  const query = userId ? detail : overview;
  const period = query.data?.period;
  const school = query.data?.school;
  const selectMonth = value => setSearch(value ? { month: value } : {});
  if (!profileLoading && profile && !isSchoolAdmin) return <Navigate to="/dashboard" replace />;

  return <DashboardLayout title="Monthly Report Cards"><div className="mx-auto max-w-6xl space-y-6 py-2">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><h1 className="text-xl font-semibold">Employee progress, month by month</h1><p className="mt-1 text-sm text-muted-foreground">Review practice activity, strengths, and coaching priorities. Download a report to share.</p></div>
      <Link className="text-sm text-primary" to="/analytics">School Analytics</Link>
    </div>
    {isGlobalAdmin && <Select value={schoolId ? String(schoolId) : ''} onValueChange={value => { setViewingSchoolId(Number(value)); setSearch({}); }}>
      <SelectTrigger aria-label="Select school" className="sm:w-72"><SelectValue placeholder="Select a school" /></SelectTrigger>
      <SelectContent>{(schools ?? []).map(s => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}</SelectContent>
    </Select>}
    {!schoolId ? <Card><CardContent className="pt-6 text-muted-foreground">Select a school to view monthly reports.</CardContent></Card> : <>
      <div className="flex flex-wrap items-end gap-6">
        <label className="space-y-1 text-xs text-muted-foreground">Report month
          <Input aria-label="Report month" type="month" min="2000-01" value={month ?? period?.month ?? ''} onChange={e => selectMonth(e.target.value)} className="w-48" />
        </label>
        {period && !userId && <TimezoneSettings key={`${school.id}-${period.timezone}`} timezone={period.timezone} schoolId={school.id} />}
      </div>
      {query.isLoading ? <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin" aria-label="Loading monthly reports" /></div>
        : query.isError ? <Card><CardContent className="pt-6 space-y-3" role="alert"><p>{query.error.message || 'Unable to load monthly reports.'}</p><Button onClick={() => query.refetch()}>Try again</Button></CardContent></Card>
          : query.data && <>
            <p className="text-sm text-muted-foreground">{period.label} · {period.timezone}{period.monthToDate ? ' · Month to date' : ''}</p>
            {userId ? <><Link to={`/analytics/monthly-reports?month=${period.month}`} className="inline-flex items-center gap-2 text-sm text-primary"><ArrowLeft className="h-4 w-4" />All employee reports</Link><EmployeeReport key={`${school.id}-${userId}-${period.month}`} report={detail.data} /></>
              : <Card><CardContent className="p-0">
                {!overview.data.data.length ? <p className="p-8 text-center text-muted-foreground">No employees or practice calls found for this school and month.</p> : <div className="overflow-x-auto"><table className="w-full text-sm">
                  <thead><tr className="border-b text-left text-muted-foreground">{['Employee', 'Minutes', 'Calls', 'Avg score', 'Score change', 'Report'].map(label => <th key={label} className="p-4 font-medium whitespace-nowrap">{label}</th>)}</tr></thead>
                  <tbody>{overview.data.data.map(employee => <tr key={employee.id} className="border-b border-border/50 hover:bg-secondary/30">
                    <td className="p-4"><p className="font-medium">{employee.name || employee.email || 'Employee'}</p><p className="text-xs text-muted-foreground">{employee.email}</p>{employee.formerMember && <p className="text-xs text-muted-foreground">Former member</p>}</td>
                    <td className="p-4">{employee.metrics.minutesUsed}{employee.metrics.missingDurations ? '*' : ''}</td>
                    <td className="p-4">{employee.metrics.callsMade}<p className="text-xs text-muted-foreground">{employee.metrics.scoredCalls} scored</p></td>
                    <td className="p-4 whitespace-nowrap">{metricValue(employee.metrics.avgScore, '%')}{employee.metrics.limitedData && <p className="text-xs text-muted-foreground">Limited data</p>}</td>
                    <td className="p-4 whitespace-nowrap">{employee.comparison.avgScore == null ? '—' : `${employee.comparison.avgScore > 0 ? '+' : ''}${employee.comparison.avgScore} pp`}</td>
                    <td className="p-4"><Link className="inline-flex items-center gap-2 text-primary whitespace-nowrap" to={`/analytics/monthly-reports/${employee.id}?month=${period.month}`}><FileText className="h-4 w-4" />View report</Link></td>
                  </tr>)}</tbody>
                </table></div>}
                {overview.data.meta.totalPages > 1 && <div className="flex items-center justify-between p-4">
                  <Button variant="outline" disabled={page <= 1} onClick={() => setSearch({ month: period.month, page: page - 1 })}>Previous</Button>
                  <span className="text-xs text-muted-foreground">Page {page} of {overview.data.meta.totalPages}</span>
                  <Button variant="outline" disabled={page >= overview.data.meta.totalPages} onClick={() => setSearch({ month: period.month, page: page + 1 })}>Next</Button>
                </div>}
              </CardContent></Card>}
            {!userId && <p className="text-xs text-muted-foreground">* Missing call durations make minutes incomplete. Reports include all calls from this school within the calendar month. Current members with no calls remain visible. Score changes are percentage points versus the previous month.</p>}
          </>}
    </>}
  </div></DashboardLayout>;
}
