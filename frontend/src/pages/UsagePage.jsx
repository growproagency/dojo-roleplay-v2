import { useMemo, useState } from 'react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import DashboardLayout from '../components/DashboardLayout';
import { useAdminUsage } from '../hooks/useAdmin';
import { Badge } from '../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Progress } from '../components/ui/progress';
import { Activity, BarChart3, Clock, DollarSign, Loader2, Phone, School, Target, TrendingUp } from 'lucide-react';
import { labelScenario } from '../utils/scenarioLabels';

const ALL = 'all';

function money(value) {
  return `$${Number(value ?? 0).toFixed(2)}`;
}

function minutes(value) {
  const rounded = Number(value ?? 0);
  return `${Number.isInteger(rounded) ? rounded : rounded.toFixed(1)}m`;
}

function percent(value) {
  if (value == null) return '-';
  return `${Math.round(value)}%`;
}

function formatDate(value) {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function getCapStatus(school) {
  const capPct = school.capUsd ? (Number(school.totalUsd || 0) / Number(school.capUsd)) * 100 : null;
  const minutePct = school.monthlyRoleplayMinutes ? (Number(school.totalMinutes || 0) / Number(school.monthlyRoleplayMinutes)) * 100 : null;
  const worstPct = Math.max(capPct ?? 0, minutePct ?? 0);
  if (school.archivedAt) return { label: 'Archived', tone: 'neutral', percent: worstPct };
  if (worstPct >= 100) return { label: 'Over limit', tone: 'danger', percent: worstPct };
  if (worstPct >= 80) return { label: 'Near limit', tone: 'warning', percent: worstPct };
  return { label: 'OK', tone: 'success', percent: worstPct };
}

function summarizeCalls(calls) {
  const scored = calls.filter((call) => call.overallScore != null);
  const totalUsd = calls.reduce((sum, call) => sum + Number(call.costUsd || 0), 0);
  const totalSeconds = calls.reduce((sum, call) => sum + Number(call.durationSeconds || 0), 0);
  return {
    totalCalls: calls.length,
    totalUsd,
    totalMinutes: Math.round((totalSeconds / 60) * 10) / 10,
    scoredCalls: scored.length,
    unscoredCalls: calls.length - scored.length,
    avgScore: scored.length ? Math.round(scored.reduce((sum, call) => sum + Number(call.overallScore || 0), 0) / scored.length) : null,
    avgCostPerCall: calls.length ? totalUsd / calls.length : 0,
    avgCostPerMinute: totalSeconds ? totalUsd / (totalSeconds / 60) : 0,
  };
}

function buildDailySeries(calls) {
  const byDay = new Map();
  calls.forEach((call) => {
    if (!call.createdAt) return;
    const key = new Date(call.createdAt).toISOString().slice(0, 10);
    const item = byDay.get(key) ?? {
      date: key,
      label: new Date(call.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      calls: 0,
      spend: 0,
      minutes: 0,
    };
    item.calls += 1;
    item.spend += Number(call.costUsd || 0);
    item.minutes += Number(call.durationSeconds || 0) / 60;
    byDay.set(key, item);
  });
  return [...byDay.values()]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-30)
    .map((item) => ({ ...item, spend: Math.round(item.spend * 100) / 100, minutes: Math.round(item.minutes * 10) / 10 }));
}

function buildBreakdown(calls, key, labeler = (value) => value || 'Unknown') {
  const counts = new Map();
  calls.forEach((call) => {
    const label = labeler(call[key]);
    const item = counts.get(label) ?? { label, calls: 0, spend: 0, minutes: 0 };
    item.calls += 1;
    item.spend += Number(call.costUsd || 0);
    item.minutes += Number(call.durationSeconds || 0) / 60;
    counts.set(label, item);
  });
  return [...counts.values()]
    .sort((a, b) => b.calls - a.calls)
    .slice(0, 8)
    .map((item) => ({ ...item, spend: Math.round(item.spend * 100) / 100, minutes: Math.round(item.minutes * 10) / 10 }));
}

export function UsagePage() {
  const { data, isLoading } = useAdminUsage();
  const schools = data?.schools ?? [];
  const calls = data?.calls ?? [];
  const [schoolFilter, setSchoolFilter] = useState(ALL);
  const [statusFilter, setStatusFilter] = useState(ALL);
  const [difficultyFilter, setDifficultyFilter] = useState(ALL);
  const [scenarioFilter, setScenarioFilter] = useState(ALL);
  const [scoredFilter, setScoredFilter] = useState(ALL);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const schoolById = useMemo(() => new Map(schools.map((school) => [school.schoolId, school])), [schools]);

  const filteredCalls = useMemo(() => {
    return calls.filter((call) => {
      if (schoolFilter !== ALL && String(call.schoolId) !== schoolFilter) return false;
      if (statusFilter !== ALL && call.status !== statusFilter) return false;
      if (difficultyFilter !== ALL && call.difficulty !== difficultyFilter) return false;
      if (scenarioFilter !== ALL && call.scenario !== scenarioFilter) return false;
      if (scoredFilter === 'scored' && call.overallScore == null) return false;
      if (scoredFilter === 'unscored' && call.overallScore != null) return false;
      if (startDate && new Date(call.createdAt) < new Date(`${startDate}T00:00:00`)) return false;
      if (endDate && new Date(call.createdAt) > new Date(`${endDate}T23:59:59`)) return false;
      return true;
    });
  }, [calls, difficultyFilter, endDate, scenarioFilter, schoolFilter, scoredFilter, startDate, statusFilter]);

  const customTotals = useMemo(() => summarizeCalls(filteredCalls), [filteredCalls]);
  const platformSeries = useMemo(() => buildDailySeries(calls), [calls]);
  const customSeries = useMemo(() => buildDailySeries(filteredCalls), [filteredCalls]);
  const scenarioBreakdown = useMemo(() => buildBreakdown(filteredCalls, 'scenario', labelScenario), [filteredCalls]);
  const schoolBreakdown = useMemo(() => {
    return buildBreakdown(filteredCalls, 'schoolId', (id) => schoolById.get(id)?.schoolName ?? 'Unknown school');
  }, [filteredCalls, schoolById]);

  const scenarios = useMemo(() => [...new Set(calls.map((call) => call.scenario).filter(Boolean))], [calls]);
  const difficulties = useMemo(() => [...new Set(calls.map((call) => call.difficulty).filter(Boolean))], [calls]);
  const statuses = useMemo(() => [...new Set(calls.map((call) => call.status).filter(Boolean))], [calls]);
  const nearLimitSchools = schools.filter((school) => ['Near limit', 'Over limit'].includes(getCapStatus(school).label));

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-7xl space-y-6 py-2">
        <p className="text-muted-foreground">Platform spend, school limits, and custom usage slices.</p>

        <section className="space-y-4">
          <StatsStrip
            items={[
              { icon: <DollarSign className="h-4 w-4" />, label: 'Spend', value: money(data?.totalUsd), delta: `${data?.totalCalls ?? 0} calls` },
              { icon: <Phone className="h-4 w-4" />, label: 'Calls', value: data?.totalCalls ?? 0, delta: `${data?.scoredCalls ?? 0} scored` },
              { icon: <Clock className="h-4 w-4" />, label: 'Minutes', value: minutes(data?.totalMinutes), delta: `${money(data?.avgCostPerMinute)} / min` },
              { icon: <School className="h-4 w-4" />, label: 'Schools', value: schools.length, delta: `${nearLimitSchools.length} near limit`, tone: nearLimitSchools.length > 0 ? 'warning' : 'primary' },
              { icon: <TrendingUp className="h-4 w-4" />, label: 'Avg Score', value: data?.avgScore ?? '-', delta: `${data?.unscoredCalls ?? 0} unscored` },
            ]}
          />

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
            <Card className="border-border/70 shadow-sm">
              <CardHeader className="pb-3">
                <SectionTitle icon={<Activity className="h-4 w-4" />} title="Global Trend" description="Spend, calls, and minutes across the platform." />
              </CardHeader>
              <CardContent>
                <UsageAreaChart data={platformSeries} />
              </CardContent>
            </Card>

            <Card className="border-border/70 shadow-sm">
              <CardHeader className="pb-3">
                <SectionTitle icon={<Target className="h-4 w-4" />} title="Cost Efficiency" description="Unit costs and scoring coverage." />
              </CardHeader>
              <CardContent className="divide-y divide-border/70">
                <Pill label="Avg cost / call" value={money(data?.avgCostPerCall)} />
                <Pill label="Avg cost / minute" value={money(data?.avgCostPerMinute)} />
                <Pill label="Scored calls" value={data?.scoredCalls ?? 0} />
                <Pill label="Unscored calls" value={data?.unscoredCalls ?? 0} />
              </CardContent>
            </Card>
          </div>
        </section>

        <section>
          <Card className="border-border/70 shadow-sm">
            <CardHeader className="pb-3">
              <SectionTitle icon={<School className="h-4 w-4" />} title="Per-School Usage" description="Limits, activity, and access status by school." />
            </CardHeader>
            <CardContent>
              {schools.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">No school usage yet.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>School</TableHead>
                      <TableHead>Access</TableHead>
                      <TableHead className="text-right">Calls</TableHead>
                      <TableHead className="text-right">Minutes</TableHead>
                      <TableHead className="text-right">Spend</TableHead>
                      <TableHead className="text-right">Cap</TableHead>
                      <TableHead className="text-right">Avg Score</TableHead>
                      <TableHead>Limit Use</TableHead>
                      <TableHead>Last Activity</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {schools.map((school) => {
                      const status = getCapStatus(school);
                      return (
                        <TableRow key={school.schoolId}>
                          <TableCell>
                            <div className="font-medium">{school.schoolName}</div>
                            <div className="text-xs text-muted-foreground">{school.plan || 'No plan'} - {school.memberCount ?? 0} members</div>
                          </TableCell>
                          <TableCell><AccessBadge status={school.archivedAt ? 'archived' : school.accessStatus || 'active'} /></TableCell>
                          <TableCell className="text-right tabular-nums">{school.totalCalls ?? 0}</TableCell>
                          <TableCell className="text-right tabular-nums">{minutes(school.totalMinutes)}</TableCell>
                          <TableCell className="text-right tabular-nums">{money(school.totalUsd)}</TableCell>
                          <TableCell className="text-right tabular-nums">{school.capUsd == null ? '-' : money(school.capUsd)}</TableCell>
                          <TableCell className="text-right tabular-nums">{school.avgScore ?? '-'}</TableCell>
                          <TableCell>
                            <div className="min-w-32 space-y-1">
                              <div className="flex items-center justify-between gap-2 text-xs">
                                <span className={status.tone === 'danger' ? 'text-red-600' : status.tone === 'warning' ? 'text-amber-600' : 'text-primary'}>{status.label}</span>
                                <span className="text-muted-foreground">{percent(status.percent)}</span>
                              </div>
                              <Progress value={Math.min(status.percent || 0, 100)} />
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground">{formatDate(school.lastActivityAt)}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </section>

        <section className="space-y-4">
          <Card className="border-border/70 shadow-sm">
            <CardHeader className="pb-3">
              <SectionTitle icon={<BarChart3 className="h-4 w-4" />} title="Custom Usage View" description="Slice usage by school, scenario, difficulty, score state, and date." />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-xl border border-border/70 bg-secondary/20 p-4">
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  <FilterSelect label="School" value={schoolFilter} onChange={setSchoolFilter} options={schools.map((school) => ({ value: String(school.schoolId), label: school.schoolName }))} />
                  <FilterSelect label="Status" value={statusFilter} onChange={setStatusFilter} options={statuses.map((status) => ({ value: status, label: status }))} />
                  <FilterSelect label="Difficulty" value={difficultyFilter} onChange={setDifficultyFilter} options={difficulties.map((difficulty) => ({ value: difficulty, label: difficulty }))} />
                  <FilterSelect label="Scenario" value={scenarioFilter} onChange={setScenarioFilter} options={scenarios.map((scenario) => ({ value: scenario, label: labelScenario(scenario) }))} />
                  <FilterSelect label="Score state" value={scoredFilter} onChange={setScoredFilter} options={[{ value: 'scored', label: 'Scored' }, { value: 'unscored', label: 'Unscored' }]} />
                  <div className="space-y-1.5">
                    <Label htmlFor="usage-start">Start date</Label>
                    <Input id="usage-start" type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="usage-end">End date</Label>
                    <Input id="usage-end" type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} />
                  </div>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                <SummaryTile label="Filtered Calls" value={customTotals.totalCalls} />
                <SummaryTile label="Filtered Spend" value={money(customTotals.totalUsd)} />
                <SummaryTile label="Filtered Minutes" value={minutes(customTotals.totalMinutes)} />
                <SummaryTile label="Avg Score" value={customTotals.avgScore ?? '-'} />
                <SummaryTile label="Unscored" value={customTotals.unscoredCalls} />
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 xl:grid-cols-2">
            <Card className="border-border/70 shadow-sm">
              <CardHeader className="pb-3"><SectionTitle title="Filtered Trend" description="Usage over time for the selected slice." /></CardHeader>
              <CardContent><UsageAreaChart data={customSeries} /></CardContent>
            </Card>
            <Card className="border-border/70 shadow-sm">
              <CardHeader className="pb-3"><SectionTitle title="Scenario Breakdown" description="Most-used scenarios in the selected slice." /></CardHeader>
              <CardContent><UsageBarChart data={scenarioBreakdown} /></CardContent>
            </Card>
          </div>

          <Card className="border-border/70 shadow-sm">
            <CardHeader className="pb-3"><SectionTitle title="Top Schools in Current Slice" description="Schools ranked by matching calls." /></CardHeader>
            <CardContent>
              <UsageBreakdownTable rows={schoolBreakdown} />
            </CardContent>
          </Card>
        </section>
      </div>
    </DashboardLayout>
  );
}

const TONE_CLASSES = {
  primary: 'bg-primary/10 text-primary',
  warning: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
};

function SectionTitle({ icon, title, description }) {
  return (
    <div className="flex items-start gap-2.5">
      {icon && (
        <span className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          {icon}
        </span>
      )}
      <div>
        <CardTitle className="text-base">{title}</CardTitle>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
    </div>
  );
}

function StatsStrip({ items }) {
  return (
    <Card className="border-border/70 shadow-sm">
      <CardContent className="p-0">
        <div className="grid divide-y divide-border/70 md:grid-cols-5 md:divide-x md:divide-y-0">
          {items.map((item) => (
            <div key={item.label} className="flex min-h-24 items-center gap-3 px-5 py-4">
              <span className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${TONE_CLASSES[item.tone || 'primary'] ?? TONE_CLASSES.primary}`}>
                {item.icon}
              </span>
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{item.label}</p>
                <p className="mt-1 text-2xl font-semibold tracking-tight tabular-nums">{item.value}</p>
                {item.delta && (
                  <p className={`mt-1 text-xs ${item.tone === 'warning' ? 'text-amber-600' : 'text-muted-foreground'}`}>
                    {item.delta}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function Metric({ icon, label, value, tone = 'primary' }) {
  return (
    <Card className="border-border/70 shadow-sm transition-colors hover:bg-secondary/20">
      <CardContent className="p-5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <span className="text-sm text-muted-foreground">{label}</span>
          {icon && <span className={`inline-flex h-8 w-8 items-center justify-center rounded-lg ${TONE_CLASSES[tone] ?? TONE_CLASSES.primary}`}>{icon}</span>}
        </div>
        <div className="text-2xl font-semibold tracking-tight lg:text-3xl">{value}</div>
      </CardContent>
    </Card>
  );
}

function Pill({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-xl font-semibold tabular-nums">{value}</p>
    </div>
  );
}

function SummaryTile({ label, value }) {
  return (
    <div className="rounded-xl border border-border/70 bg-background px-4 py-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight">{value}</p>
    </div>
  );
}

function AccessBadge({ status }) {
  const normalized = String(status || 'active');
  const className = normalized === 'active' || normalized === 'trialing'
    ? 'border-primary/20 bg-primary/10 text-primary'
    : normalized === 'past_due'
      ? 'border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300'
      : normalized === 'archived'
        ? 'border-muted bg-muted text-muted-foreground'
        : 'border-red-500/20 bg-red-500/10 text-red-700 dark:text-red-300';
  return (
    <Badge className={`${className} border font-normal capitalize`}>
      {normalized.replace(/_/g, ' ')}
    </Badge>
  );
}

function FilterSelect({ label, value, onChange, options }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All</SelectItem>
          {options.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );
}

function UsageAreaChart({ data }) {
  if (data.length === 0) return <EmptyChart />;
  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
          <Tooltip formatter={(value, name) => name === 'spend' ? [money(value), 'Spend'] : [value, name]} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
          <Area type="monotone" dataKey="calls" stroke="#2563eb" strokeWidth={2} fill="#2563eb" fillOpacity={0.14} />
          <Area type="monotone" dataKey="minutes" stroke="#64748b" strokeWidth={2} fill="#64748b" fillOpacity={0.08} />
          <Area type="monotone" dataKey="spend" stroke="#0f172a" strokeWidth={2} fill="#0f172a" fillOpacity={0.04} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function UsageBarChart({ data }) {
  if (data.length === 0) return <EmptyChart />;
  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} interval={0} />
          <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
          <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
          <Bar dataKey="calls" fill="#2563eb" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function UsageBreakdownTable({ rows }) {
  if (rows.length === 0) return <p className="py-8 text-center text-sm text-muted-foreground">No matching usage.</p>;
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>School</TableHead>
          <TableHead className="text-right">Calls</TableHead>
          <TableHead className="text-right">Minutes</TableHead>
          <TableHead className="text-right">Spend</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.label}>
            <TableCell className="font-medium">{row.label}</TableCell>
            <TableCell className="text-right tabular-nums">{row.calls}</TableCell>
            <TableCell className="text-right tabular-nums">{minutes(row.minutes)}</TableCell>
            <TableCell className="text-right tabular-nums">{money(row.spend)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function EmptyChart() {
  return (
    <div className="flex h-72 items-center justify-center rounded-lg border border-dashed border-border bg-secondary/20 text-sm text-muted-foreground">
      No matching usage.
    </div>
  );
}
