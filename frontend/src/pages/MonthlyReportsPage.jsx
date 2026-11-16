import { useMemo, useState } from 'react';
import { Link, Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useAdminSchools } from '../hooks/useAdmin';
import { useMonthlyReport, useMonthlyReports, useUpdateReportSettings, useDownloadMonthlyReport } from '../hooks/useMonthlyReports';
import { useUIStore } from '../store/ui.store';
import DashboardLayout from '../components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import {
  AlertTriangle, ArrowDownRight, ArrowLeft, ArrowUpDown, ArrowUpRight, CalendarDays, CheckCircle2, ChevronLeft,
  ChevronRight, Clock, Download, Globe, Lightbulb, Loader2, Minus, Phone, Search, Sparkles, Target, Trophy, Users,
} from 'lucide-react';
import { coachingSections, metricValue, reportTitle } from '../utils/monthlyReportPresentation';

const TIMEZONES = ['UTC', 'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles', 'Europe/London', 'Asia/Manila', 'Australia/Sydney'];

// Leaderboard point multipliers. These mirror backend/src/utils/leaderboardRules.js.
const DIFFICULTY = {
  easy: { label: 'Easy', multiplier: '1.00', bar: 'bg-emerald-500', dot: 'bg-emerald-500' },
  medium: { label: 'Medium', multiplier: '1.15', bar: 'bg-amber-500', dot: 'bg-amber-500' },
  hard: { label: 'Hard', multiplier: '1.30', bar: 'bg-rose-500', dot: 'bg-rose-500' },
  legacy: { label: 'Unlabelled', multiplier: '1.00', bar: 'bg-slate-400', dot: 'bg-slate-400' },
};

const SECTION_STYLE = {
  'What went well': { icon: CheckCircle2, tone: 'text-emerald-500' },
  'What needs improvement': { icon: Target, tone: 'text-amber-500' },
  'Highlights from call feedback': { icon: Sparkles, tone: 'text-primary' },
  'Missed opportunities': { icon: AlertTriangle, tone: 'text-rose-500' },
  "Next month's focus": { icon: Lightbulb, tone: 'text-primary' },
};

const SORTS = {
  name: (a, b) => displayName(a).localeCompare(displayName(b)),
  calls: (a, b) => b.metrics.callsMade - a.metrics.callsMade,
  score: (a, b) => (b.metrics.avgScore ?? -1) - (a.metrics.avgScore ?? -1),
  change: (a, b) => (b.comparison.avgScore ?? -Infinity) - (a.comparison.avgScore ?? -Infinity),
};

function displayName(employee) {
  return employee.name?.trim() || employee.email || 'Employee';
}

function initials(employee) {
  return displayName(employee).split(/[\s@.]+/).filter(Boolean).slice(0, 2).map(part => part[0].toUpperCase()).join('');
}

function shiftMonth(month, offset) {
  const [year, number] = month.split('-').map(Number);
  return new Date(Date.UTC(year, number - 1 + offset, 1)).toISOString().slice(0, 7);
}

function scoreTone(score) {
  if (score == null) return { bar: 'bg-muted', text: 'text-muted-foreground' };
  if (score >= 80) return { bar: 'bg-emerald-500', text: 'text-emerald-600 dark:text-emerald-400' };
  if (score >= 60) return { bar: 'bg-amber-500', text: 'text-amber-600 dark:text-amber-400' };
  return { bar: 'bg-rose-500', text: 'text-rose-600 dark:text-rose-400' };
}

function Avatar({ employee, size = 'h-9 w-9 text-xs' }) {
  return (
    <span className={`flex shrink-0 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary ${size}`} aria-hidden="true">
      {initials(employee)}
    </span>
  );
}

function Delta({ value, suffix = '', fallback = 'No previous month' }) {
  if (value == null) return <span className="text-xs text-muted-foreground">{fallback}</span>;
  const Icon = value > 0 ? ArrowUpRight : value < 0 ? ArrowDownRight : Minus;
  const tone = value > 0
    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
    : value < 0
      ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
      : 'bg-secondary text-muted-foreground';
  return (
    <span className={`inline-flex items-center gap-0.5 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ${tone}`}>
      <Icon className="h-3 w-3" />
      {value > 0 ? '+' : ''}{value}{suffix}
    </span>
  );
}

function ScoreBar({ score, className = '' }) {
  const tone = scoreTone(score);
  return (
    <div className={`h-1.5 overflow-hidden rounded-full bg-secondary ${className}`}>
      <div className={`h-full rounded-full ${tone.bar}`} style={{ width: `${score ?? 0}%` }} />
    </div>
  );
}

function DifficultyMix({ levels }) {
  const used = levels.filter(level => level.calls > 0);
  const total = used.reduce((sum, level) => sum + level.calls, 0);
  if (!total) return <span className="text-xs text-muted-foreground">-</span>;
  const summary = used.map(level => `${level.calls} ${DIFFICULTY[level.difficulty].label.toLowerCase()}`).join(', ');
  return (
    <div className="min-w-28" title={summary}>
      <div className="flex h-1.5 overflow-hidden rounded-full bg-secondary" role="img" aria-label={`Difficulty mix: ${summary}`}>
        {used.map(level => (
          <div key={level.difficulty} className={DIFFICULTY[level.difficulty].bar} style={{ width: `${(level.calls / total) * 100}%` }} />
        ))}
      </div>
      <p className="mt-1 text-xs text-muted-foreground">{summary}</p>
    </div>
  );
}

function StatTile({ icon: Icon, label, value, hint, children }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <Icon className="h-3.5 w-3.5" />
          {label}
        </p>
        <p className="mt-1.5 text-2xl font-semibold tabular-nums">{value}</p>
        <div className="mt-1 min-h-5 text-xs text-muted-foreground">{children ?? hint}</div>
      </CardContent>
    </Card>
  );
}

function TimezoneSettings({ timezone, schoolId }) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(timezone);
  const update = useUpdateReportSettings();
  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
        <Globe className="h-3.5 w-3.5" />
        Timezone: {timezone}
        <span className="text-primary">Change</span>
      </button>
    );
  }
  return (
    <form className="flex flex-wrap items-end gap-2" onSubmit={event => { event.preventDefault(); update.mutate({ timezone: value }); }}>
      <label className="space-y-1 text-xs text-muted-foreground">
        School reporting timezone
        <Input list={`report-timezones-${schoolId}`} value={value} onChange={e => setValue(e.target.value)} required maxLength={100} className="w-56" />
      </label>
      <datalist id={`report-timezones-${schoolId}`}>
        {TIMEZONES.map(zone => <option key={zone} value={zone} />)}
      </datalist>
      <Button type="submit" size="sm" disabled={update.isPending || value === timezone}>{update.isPending ? 'Saving...' : 'Save'}</Button>
      <Button type="button" size="sm" variant="ghost" onClick={() => { setValue(timezone); setOpen(false); }}>Cancel</Button>
      {update.isError && <p role="alert" className="w-full text-sm text-destructive">{update.error.message}</p>}
      <p className="w-full text-xs text-muted-foreground">Changing the timezone recalculates which month each call belongs to.</p>
    </form>
  );
}

function MonthPicker({ month, monthToDate, onChange }) {
  return (
    <div className="flex items-center gap-1">
      <Button variant="outline" size="icon" aria-label="Previous month" disabled={!month} onClick={() => onChange(shiftMonth(month, -1))}>
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <Input aria-label="Report month" type="month" min="2000-01" value={month ?? ''} onChange={e => onChange(e.target.value)} className="w-44" />
      <Button variant="outline" size="icon" aria-label="Next month" disabled={!month || monthToDate} onClick={() => onChange(shiftMonth(month, 1))}>
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}

function SortHeader({ label, sortKey, sort, onSort, className = '' }) {
  const active = sort === sortKey;
  return (
    <th className={`p-4 font-medium whitespace-nowrap ${className}`} aria-sort={active ? 'descending' : undefined}>
      <button type="button" onClick={() => onSort(sortKey)} className={`inline-flex items-center gap-1 hover:text-foreground ${active ? 'text-foreground' : ''}`}>
        {label}
        <ArrowUpDown className={`h-3 w-3 ${active ? 'opacity-100' : 'opacity-40'}`} />
      </button>
    </th>
  );
}

function Overview({ data, page, onPage }) {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('name');
  const { period, summary, meta } = data;
  const multiPage = meta.totalPages > 1;

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();
    const filtered = term
      ? data.data.filter(e => `${e.name ?? ''} ${e.email ?? ''}`.toLowerCase().includes(term))
      : data.data;
    return [...filtered].sort(SORTS[sort]);
  }, [data.data, search, sort]);

  const mix = summary ? Object.entries(summary.difficulty).map(([difficulty, calls]) => ({ difficulty, calls })) : [];

  return (
    <div className="space-y-5">
      {summary && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatTile icon={Users} label="Practised this month" value={`${summary.activeEmployees} of ${summary.employees}`} hint="employees made at least one call" />
          <StatTile icon={Phone} label="Practice calls" value={summary.callsMade} hint={`${summary.scoredCalls} scored`} />
          <StatTile icon={Clock} label="Minutes practised" value={summary.minutesUsed} hint="across the whole school" />
          <StatTile icon={Trophy} label="School average score" value={summary.avgScore == null ? '-' : `${summary.avgScore}%`}>
            {summary.avgScore == null ? 'No scored calls yet' : <ScoreBar score={summary.avgScore} className="mt-2" />}
          </StatTile>
        </div>
      )}

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4">
          <div>
            <h2 className="text-base font-semibold">Employees</h2>
            <p className="text-xs text-muted-foreground">Select an employee to open their report card.</p>
          </div>
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input aria-label="Search employees" placeholder="Search employees" value={search} onChange={e => setSearch(e.target.value)} className="w-56 pl-8" />
          </div>
        </div>
        <CardContent className="p-0">
          {!data.data.length ? (
            <div className="p-10 text-center">
              <Users className="mx-auto mb-3 h-8 w-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">No employees or practice calls found for this school and month.</p>
            </div>
          ) : !rows.length ? (
            <p className="p-8 text-center text-sm text-muted-foreground">No employees match &quot;{search}&quot;.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs text-muted-foreground">
                    <SortHeader label="Employee" sortKey="name" sort={sort} onSort={setSort} />
                    <SortHeader label="Practice" sortKey="calls" sort={sort} onSort={setSort} />
                    <th className="p-4 font-medium whitespace-nowrap">Difficulty mix</th>
                    <SortHeader label="Avg score" sortKey="score" sort={sort} onSort={setSort} />
                    <SortHeader label="vs last month" sortKey="change" sort={sort} onSort={setSort} />
                    <th className="p-4"><span className="sr-only">Open report</span></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(employee => {
                    const m = employee.metrics;
                    const href = `/analytics/monthly-reports/${employee.id}?month=${period.month}`;
                    const idle = m.callsMade === 0;
                    return (
                      <tr key={employee.id} onClick={() => navigate(href)} className="cursor-pointer border-b border-border/50 last:border-0 hover:bg-secondary/40">
                        <td className="p-4">
                          <div className={`flex items-center gap-3 ${idle ? 'opacity-60' : ''}`}>
                            <Avatar employee={employee} />
                            <div className="min-w-0">
                              <Link to={href} onClick={e => e.stopPropagation()} className="font-medium hover:underline">{displayName(employee)}</Link>
                              <p className="truncate text-xs text-muted-foreground">{employee.email}{employee.formerMember ? ' · Former member' : ''}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 whitespace-nowrap">
                          {idle ? <span className="text-xs text-muted-foreground">No practice this month</span> : (
                            <>
                              <p className="font-medium tabular-nums">{m.callsMade} call{m.callsMade === 1 ? '' : 's'}</p>
                              <p className="text-xs text-muted-foreground">{m.minutesUsed}{m.missingDurations ? '*' : ''} min · {m.scoredCalls} scored</p>
                            </>
                          )}
                        </td>
                        <td className="p-4"><DifficultyMix levels={m.difficulty} /></td>
                        <td className="p-4">
                          {m.avgScore == null ? <span className="text-xs text-muted-foreground">-</span> : (
                            <div className="w-28">
                              <div className="flex items-baseline justify-between gap-2">
                                <span className={`font-semibold tabular-nums ${scoreTone(m.avgScore).text}`}>{m.avgScore}%</span>
                                {m.limitedData && <span className="text-[11px] text-muted-foreground" title="Fewer than five scored calls">Limited data</span>}
                              </div>
                              <ScoreBar score={m.avgScore} className="mt-1.5" />
                            </div>
                          )}
                        </td>
                        <td className="p-4"><Delta value={employee.comparison.avgScore} suffix=" pts" fallback="-" /></td>
                        <td className="p-4 text-right"><ChevronRight className="ml-auto h-4 w-4 text-muted-foreground" /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          {multiPage && (
            <div className="flex items-center justify-between border-t border-border p-4">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onPage(page - 1)}>Previous</Button>
              <span className="text-xs text-muted-foreground">Page {page} of {meta.totalPages} · search and sorting apply to this page</span>
              <Button variant="outline" size="sm" disabled={page >= meta.totalPages} onClick={() => onPage(page + 1)}>Next</Button>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="space-y-1 text-xs leading-5 text-muted-foreground">
        {mix.some(level => level.calls > 0) && (
          <p>
            Average score is a plain average of every scored call and is not adjusted for difficulty, so check the
            difficulty mix before comparing two people. Only leaderboard points are weighted (Easy ×1.00, Medium ×1.15, Hard ×1.30).
          </p>
        )}
        <p>
          Change is in percentage points against the previous month. Current members with no calls stay listed.
          An asterisk on minutes means some calls have no recorded duration.
        </p>
      </div>
    </div>
  );
}

function EmployeeReport({ report }) {
  const download = useDownloadMonthlyReport();
  const m = report.metrics;
  const sections = coachingSections(report);
  const levels = m.difficulty.filter(level => level.difficulty !== 'legacy' || level.calls > 0);

  return (
    <div className="space-y-5">
      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
          <div className="flex min-w-0 items-center gap-4">
            <Avatar employee={report.employee} size="h-12 w-12 text-base" />
            <div className="min-w-0">
              <h2 className="text-xl font-semibold">{reportTitle(report)}</h2>
              <p className="truncate text-sm text-muted-foreground">{report.employee.email} · {report.school.name} · {report.period.label}</p>
              {report.employee.formerMember && <p className="text-xs text-muted-foreground">Former member - includes only calls made at this school.</p>}
            </div>
          </div>
          <Button onClick={() => download.mutate(report)} disabled={download.isPending} className="gap-2">
            {download.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            Download PDF
          </Button>
        </CardContent>
      </Card>

      {download.isError && <p role="alert" className="text-sm text-destructive">The PDF could not be created. Please try again.</p>}
      {!m.callsMade && (
        <p className="rounded-xl border border-border bg-secondary/30 p-4 text-sm text-muted-foreground">
          No practice recorded for this month. Performance is not scored as zero.
        </p>
      )}
      {m.callsMade > 0 && m.limitedData && (
        <p className="flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-sm">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
          Limited data: {m.scoredCalls} scored call{m.scoredCalls === 1 ? '' : 's'}. Coaching patterns are provisional until at least five calls are scored.
        </p>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile icon={Trophy} label="Average score" value={m.avgScore == null ? '-' : `${m.avgScore}%`}>
          <Delta value={report.comparison.avgScore} suffix=" pts" />
        </StatTile>
        <StatTile icon={Sparkles} label="Avg leaderboard points" value={m.avgPoints == null ? '-' : m.avgPoints}>
          <Delta value={report.comparison.avgPoints} suffix=" pts" />
        </StatTile>
        <StatTile icon={Phone} label="Calls made" value={m.callsMade}>
          <Delta value={report.comparison.callsMade} />
        </StatTile>
        <StatTile icon={Clock} label="Minutes practised" value={m.minutesUsed}>
          <Delta value={report.comparison.minutesUsed} suffix=" min" />
        </StatTile>
      </div>

      <div className="flex flex-wrap gap-2 text-xs">
        <Badge variant="outline" className="gap-1 font-normal"><CalendarDays className="h-3 w-3" />{m.activeDays} active day{m.activeDays === 1 ? '' : 's'}</Badge>
        <Badge variant="outline" className="font-normal">{m.scoredCalls} of {m.completedCalls} completed calls scored</Badge>
        <Badge variant="outline" className="font-normal">Best score: {metricValue(m.bestScore, '%')}</Badge>
        {m.failedCalls > 0 && <Badge variant="outline" className="font-normal">{m.failedCalls} failed call{m.failedCalls === 1 ? '' : 's'}</Badge>}
        {m.missingDurations > 0 && (
          <Badge variant="outline" className="border-amber-500/40 font-normal text-amber-600 dark:text-amber-400">
            Minutes incomplete: {m.missingDurations} call{m.missingDurations === 1 ? '' : 's'} without a duration
          </Badge>
        )}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Scores by difficulty</CardTitle>
          <p className="text-xs text-muted-foreground">
            Judge progress within each level. The average score above is not adjusted for difficulty; leaderboard points are.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {levels.map(level => {
            const style = DIFFICULTY[level.difficulty];
            const previous = report.previous.difficulty.find(item => item.difficulty === level.difficulty);
            const change = level.avgScore != null && previous?.avgScore != null
              ? Math.round((level.avgScore - previous.avgScore) * 10) / 10
              : null;
            return (
              <div key={level.difficulty} className="grid items-center gap-x-4 gap-y-1 sm:grid-cols-[150px_minmax(0,1fr)_170px]">
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${style.dot}`} />
                  <span className="text-sm font-medium">{style.label}</span>
                  <span className="rounded bg-secondary px-1.5 py-0.5 text-[11px] text-muted-foreground" title="Leaderboard point multiplier">×{style.multiplier}</span>
                </div>
                <div className="flex items-center gap-3">
                  <ScoreBar score={level.avgScore} className="flex-1" />
                  <span className={`w-14 text-right text-sm font-semibold tabular-nums ${scoreTone(level.avgScore).text}`}>
                    {level.avgScore == null ? '-' : `${level.avgScore}%`}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground sm:justify-end">
                  <span>{level.calls} call{level.calls === 1 ? '' : 's'} · {level.scoredCalls} scored</span>
                  {change != null && <Delta value={change} suffix=" pts" />}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {sections.map(section => {
          const style = SECTION_STYLE[section.title] ?? { icon: Sparkles, tone: 'text-primary' };
          const Icon = style.icon;
          return (
            <Card key={section.title}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Icon className={`h-4 w-4 ${style.tone}`} />
                  {section.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {section.items.length ? (
                  <ul className="space-y-3">
                    {section.items.map((item, index) => (
                      <li key={index} className="rounded-lg border border-border/70 bg-secondary/20 p-3 text-sm">
                        <p className="leading-relaxed">{item.text}</p>
                        {item.callIds.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {item.callIds.map(id => (
                              <Link key={id} to={`/calls/${id}`} className="rounded-full border border-border px-2 py-0.5 text-xs text-primary hover:bg-primary/10">
                                Call #{id}
                              </Link>
                            ))}
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : <p className="text-sm text-muted-foreground">{section.empty}</p>}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <p className="text-xs leading-5 text-muted-foreground">
        {report.comparison.hasPreviousActivity ? 'Comparisons use the previous calendar month.' : 'No previous-month activity recorded, so there is nothing to compare against.'}
        {report.period.monthToDate && ' This month is still in progress; the comparison uses the full previous month.'}
        {' '}Coaching uses saved scorecard feedback, with category averages grouped by scenario.
        Generated {new Date(report.period.generatedAt).toLocaleString()} · Reporting timezone: {report.period.timezone}
      </p>
    </div>
  );
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
  const params = { ...(month ? { month } : {}), page, limit: 100 };
  const overview = useMonthlyReports(params, !userId);
  const detail = useMonthlyReport(userId, month ? { month } : {});
  const query = userId ? detail : overview;
  const period = query.data?.period;
  const school = query.data?.school;
  const selectMonth = value => setSearch(value ? { month: value } : {});

  if (!profileLoading && profile && !isSchoolAdmin) return <Navigate to="/dashboard" replace />;

  return (
    <DashboardLayout title="Monthly Report Cards">
      <div className="mx-auto max-w-6xl space-y-5 py-2">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            {userId ? (
              <Link to={`/analytics/monthly-reports${period ? `?month=${period.month}` : ''}`} className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
                <ArrowLeft className="h-4 w-4" />All employee reports
              </Link>
            ) : (
              <>
                <h1 className="text-2xl font-semibold tracking-tight">Monthly report cards</h1>
                <p className="mt-1 text-sm text-muted-foreground">See who practised, how they scored, and what to coach next.</p>
              </>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {isGlobalAdmin && (
              <Select value={schoolId ? String(schoolId) : ''} onValueChange={value => { setViewingSchoolId(Number(value)); setSearch({}); }}>
                <SelectTrigger aria-label="Select school" className="w-56"><SelectValue placeholder="Select a school" /></SelectTrigger>
                <SelectContent>{(schools ?? []).map(s => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}</SelectContent>
              </Select>
            )}
            {schoolId && <MonthPicker month={month ?? period?.month} monthToDate={period?.monthToDate} onChange={selectMonth} />}
          </div>
        </div>

        {!schoolId ? (
          <Card><CardContent className="pt-6 text-muted-foreground">Select a school to view monthly reports.</CardContent></Card>
        ) : query.isLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" aria-label="Loading monthly reports" /></div>
        ) : query.isError ? (
          <Card>
            <CardContent className="space-y-3 pt-6" role="alert">
              <p>{query.error.message || 'Unable to load monthly reports.'}</p>
              <Button onClick={() => query.refetch()}>Try again</Button>
            </CardContent>
          </Card>
        ) : query.data && (
          <>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <span className="text-sm font-medium">{period.label}</span>
              {period.monthToDate && <Badge variant="secondary" className="font-normal">Month to date</Badge>}
              {userId
                ? <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground"><Globe className="h-3.5 w-3.5" />{period.timezone}</span>
                : <TimezoneSettings key={`${school.id}-${period.timezone}`} timezone={period.timezone} schoolId={school.id} />}
            </div>
            {userId
              ? <EmployeeReport key={`${school.id}-${userId}-${period.month}`} report={detail.data} />
              : <Overview key={`${school.id}-${period.month}`} data={overview.data} page={page} onPage={next => setSearch({ month: period.month, page: next })} />}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
