import { useMemo } from 'react';
import { Area, AreaChart, CartesianGrid, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Activity, BarChart3, Clock, Phone, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';

const SCENARIO_LABELS = {
  new_student: 'New Student',
  parent_enrollment: 'Parent Enroll',
  web_lead_callback: 'Web Callback',
  sales_enrollment: 'Sales Enroll',
  renewal_conference: 'Renewal',
  cancellation_save: 'Cancellation',
};

function labelScenario(slug) {
  return SCENARIO_LABELS[slug] || String(slug).replace(/_/g, ' ');
}

function shortDate(date) {
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatMinutes(seconds) {
  const minutes = Math.round(((seconds || 0) / 60) * 10) / 10;
  return `${Number.isInteger(minutes) ? minutes : minutes.toFixed(1)}m`;
}

export function DashboardCharts({ calls = [] }) {
  const chartData = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const days = Array.from({ length: 14 }, (_, index) => {
      const date = new Date(today);
      date.setDate(date.getDate() - (13 - index));
      return {
        date: date.toISOString().slice(0, 10),
        label: shortDate(date),
        calls: 0,
        minutes: 0,
        scoreTotal: 0,
        scored: 0,
      };
    });
    const byDate = new Map(days.map((day) => [day.date, day]));
    calls.forEach((call) => {
      if (!call.createdAt) return;
      const day = byDate.get(new Date(call.createdAt).toISOString().slice(0, 10));
      if (!day) return;
      day.calls += 1;
      day.minutes += (call.durationSeconds ?? 0) / 60;
      if (call.status === 'scored' && typeof call.overallScore === 'number') {
        day.scoreTotal += call.overallScore;
        day.scored += 1;
      }
    });
    return days.map((day) => ({
      ...day,
      minutes: Math.round(day.minutes * 10) / 10,
      score: day.scored ? Math.round(day.scoreTotal / day.scored) : null,
    }));
  }, [calls]);

  const scenarioData = useMemo(() => {
    const counts = new Map();
    calls.forEach((call) => counts.set(call.scenario, (counts.get(call.scenario) || 0) + 1));
    return [...counts.entries()]
      .map(([scenario, count]) => ({ scenario: labelScenario(scenario), count }))
      .sort((a, b) => b.count - a.count);
  }, [calls]);

  const scoreTrendData = useMemo(() => {
    return calls
      .filter((call) => call.status === 'scored' && typeof call.overallScore === 'number')
      .slice(0, 10)
      .reverse()
      .map((call, index) => ({ label: `#${index + 1}`, date: shortDate(call.createdAt), score: Math.round(call.overallScore) }));
  }, [calls]);

  const totalCalls = calls.length;
  const scoredCalls = calls.filter((call) => call.status === 'scored' && typeof call.overallScore === 'number');
  const avgScore = scoredCalls.length
    ? Math.round(scoredCalls.reduce((sum, call) => sum + call.overallScore, 0) / scoredCalls.length)
    : null;
  const totalSeconds = calls.reduce((sum, call) => sum + (call.durationSeconds ?? 0), 0);
  const hasActivity = totalCalls > 0;

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <Activity className="h-4 w-4 text-primary" />
              Training Progress
            </CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">Calls, practice time, and score trend over the last 14 days.</p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:min-w-[520px]">
            <MetricPill icon={<Phone className="h-3.5 w-3.5" />} label="Calls" value={totalCalls} />
            <MetricPill icon={<BarChart3 className="h-3.5 w-3.5" />} label="Scored" value={scoredCalls.length} />
            <MetricPill icon={<TrendingUp className="h-3.5 w-3.5" />} label="Avg Score" value={avgScore ?? '—'} />
            <MetricPill icon={<Clock className="h-3.5 w-3.5" />} label="Time" value={formatMinutes(totalSeconds)} />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {hasActivity ? (
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="callsFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.32} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0.03} />
                  </linearGradient>
                  <linearGradient id="minutesFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#16a34a" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#16a34a" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} interval={1} />
                <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip
                  formatter={(value, name) => {
                    if (name === 'calls') return [value, 'Calls'];
                    if (name === 'minutes') return [`${value} min`, 'Practice time'];
                    return [`${value}/100`, 'Avg score'];
                  }}
                  contentStyle={{ fontSize: 12, borderRadius: 8 }}
                />
                <Area type="monotone" dataKey="calls" stroke="#2563eb" strokeWidth={2} fill="url(#callsFill)" />
                <Area type="monotone" dataKey="minutes" stroke="#16a34a" strokeWidth={2} fill="url(#minutesFill)" />
                {scoreTrendData.length > 0 && (
                  <Line type="monotone" dataKey="score" stroke="#f59e0b" strokeWidth={2} dot={false} connectNulls />
                )}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex min-h-[260px] flex-col items-center justify-center rounded-lg border border-dashed border-border bg-secondary/20 text-center">
            <Activity className="mb-3 h-10 w-10 text-muted-foreground/35" />
            <p className="text-sm font-medium">No training activity yet.</p>
            <p className="mt-1 max-w-sm text-xs text-muted-foreground">Start a practice call to build your progress chart.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function MetricPill({ icon, label, value }) {
  return (
    <div className="rounded-lg border border-border/70 bg-background px-3 py-2">
      <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
        <span>{label}</span>
        <span className="text-primary">{icon}</span>
      </div>
      <p className="mt-1 text-xl font-semibold tracking-tight">{value}</p>
    </div>
  );
}
