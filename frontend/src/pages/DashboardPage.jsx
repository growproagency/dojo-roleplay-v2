import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import DashboardLayout from '../components/DashboardLayout';
import { DashboardCharts } from '../components/DashboardCharts';
import { useCalls } from '../hooks/useCalls';
import { useLeaderboard } from '../hooks/useLeaderboard';
import { useSchool } from '../hooks/useSchool';
import { useVapiConfig } from '../hooks/useVapi';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Phone, Clock, TrendingUp, Loader2, ChevronRight, Trophy, Medal, Star, Sparkles, Users, Gauge } from 'lucide-react';
import { getEffectivePlanDetails } from '../utils/plans';

const SCENARIO_LABELS = {
  new_student: 'New Student',
  parent_enrollment: 'Parent Enrollment',
  web_lead_callback: 'Outbound Callback',
  sales_enrollment: 'Sales Enrollment',
  renewal_conference: 'Renewal',
  cancellation_save: 'Cancellation Save',
};

const DIFFICULTY_DOT = {
  easy: 'bg-green-500',
  medium: 'bg-yellow-500',
  hard: 'bg-red-500',
};

const DASHBOARD_LEADERBOARD_LIMIT = 4;

function DifficultyChip({ difficulty }) {
  if (!difficulty) return null;
  const labels = { easy: 'Easy', medium: 'Medium', hard: 'Hard' };
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
      <span className={`w-1.5 h-1.5 rounded-full ${DIFFICULTY_DOT[difficulty] ?? 'bg-muted-foreground'}`} />
      {labels[difficulty] ?? difficulty}
    </span>
  );
}

function scoreColor(score) {
  if (score == null) return 'text-muted-foreground';
  if (score >= 80) return 'text-green-500';
  if (score >= 60) return 'text-yellow-500';
  if (score >= 40) return 'text-orange-500';
  return 'text-red-500';
}

function formatDuration(seconds) {
  if (!seconds) return '--';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function formatDate(date) {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
  });
}

const STATUS_LABELS = {
  in_progress: 'In Progress',
  completed: 'Not scored',
  scoring: 'Scoring...',
  failed: 'Failed',
};

function rankIcon(rank) {
  if (rank === 1) return <Trophy className="h-4 w-4 text-yellow-500" />;
  if (rank === 2) return <Medal className="h-4 w-4 text-slate-400" />;
  if (rank === 3) return <Medal className="h-4 w-4 text-amber-600" />;
  return <span className="flex h-4 w-4 items-center justify-center text-xs font-semibold text-muted-foreground">#{rank}</span>;
}

function scoreText(score) {
  if (score == null) return '--';
  return Math.round(score);
}

function truncateText(value, maxLength = 24) {
  if (!value || value.length <= maxLength) return value;
  return `${value.slice(0, maxLength - 1)}...`;
}

function SchoolSnapshotCard({ schoolName, totalCalls, totalMinutes, minuteLimit }) {
  const hasMinuteLimit = Number.isInteger(minuteLimit);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Gauge className="h-4 w-4 text-primary" />
          School Snapshot
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-1">
          <p className="text-sm font-medium leading-5">{schoolName}</p>
          <p className="text-xs leading-4 text-muted-foreground">Current usage period at a glance.</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-border/70 p-3">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Current calls</span>
              <Users className="h-3.5 w-3.5" />
            </div>
            <p className="mt-1 text-xl font-semibold">{totalCalls}</p>
          </div>
          <div className="rounded-lg border border-border/70 p-3">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Current minutes</span>
              <Gauge className="h-3.5 w-3.5" />
            </div>
            <div className="mt-1 flex min-w-0 items-baseline gap-1">
              <span className="text-xl font-semibold">{totalMinutes}m</span>
              {hasMinuteLimit && (
                <span className="truncate text-xs text-muted-foreground">/ {minuteLimit}m</span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function FocusCard() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <TrendingUp className="h-4 w-4 text-primary" />
          Focus
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Complete one call, review the scorecard, then repeat the same scenario once to improve.
        </p>
      </CardContent>
    </Card>
  );
}

function TopPerformersCard({ leaderboard, isLoading }) {
  const performers = leaderboard ?? [];

  return (
    <Card className="h-full">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-base flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
            <Trophy className="h-4 w-4 text-primary" />
          </span>
          Top Performers
        </CardTitle>
        <span className="rounded-full border border-border/70 px-2 py-1 text-xs text-muted-foreground">30 days</span>
      </CardHeader>
      <CardContent className="pb-5">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : performers.length === 0 ? (
          <div className="py-10 text-center">
            <Trophy className="mx-auto mb-3 h-9 w-9 text-muted-foreground/25" />
            <p className="text-sm text-muted-foreground">No scored calls yet.</p>
          </div>
        ) : (
          <div className="space-y-0.5">
            {performers.slice(0, DASHBOARD_LEADERBOARD_LIMIT).map((entry) => {
              const primary = entry.userName?.trim() || entry.userEmail || 'Unknown';
              const secondary = entry.userName?.trim() && entry.userEmail ? entry.userEmail : `${entry.totalCalls} calls`;
              const displaySecondary = entry.userName?.trim() && entry.userEmail
                ? truncateText(entry.userEmail, 24)
                : secondary;
              return (
                <div key={entry.userId} className="flex items-center gap-3 rounded-lg px-2.5 py-2 hover:bg-secondary/50">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary text-muted-foreground">
                    {rankIcon(entry.rank)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{primary}</p>
                    <p className="truncate text-xs text-muted-foreground" title={secondary}>{displaySecondary}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold leading-none text-foreground">{scoreText(entry.avgScore)}</p>
                    {entry.bestScore !== null && (
                      <p className="mt-1 flex items-center justify-end gap-1 text-[10px] text-muted-foreground">
                        <Star className="h-3 w-3" />
                        {scoreText(entry.bestScore)}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function RecentCallsCard({ calls, isLoading, onViewAll, onSelectCall }) {
  return (
    <Card>
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <CardTitle className="text-base">Recent Calls</CardTitle>
        <Button
          variant="ghost"
          size="sm"
          onClick={onViewAll}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          View all <ChevronRight className="w-3 h-3 ml-1" />
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : calls.length === 0 ? (
          <div className="text-center py-12">
            <Phone className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No calls yet.</p>
            <p className="text-xs text-muted-foreground/70 mt-1">Make your first training call to get started.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {calls.map((call) => (
              <button
                key={call.id}
                onClick={() => onSelectCall(call.id)}
                className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-secondary/50 transition-colors text-left group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Phone className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-3 flex-wrap mb-1">
                      <span className="text-sm font-medium">{SCENARIO_LABELS[call.scenario] ?? call.scenario}</span>
                      <DifficultyChip difficulty={call.difficulty} />
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                      <span>{formatDate(call.createdAt)}</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDuration(call.durationSeconds)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0 ml-2">
                  {call.status === 'scored' && call.overallScore != null ? (
                    <div className="text-right">
                      <div className={`text-lg font-semibold leading-none ${scoreColor(call.overallScore)}`}>
                        {call.overallScore}
                      </div>
                      <div className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wide">Score</div>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">{STATUS_LABELS[call.status] ?? call.status}</span>
                  )}
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                </div>
              </button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function DashboardPage() {
  const navigate = useNavigate();
  const { user, profile, isSchoolAdmin } = useAuth();
  const { data: calls, isLoading } = useCalls({ scope: 'mine' });
  const { data: schoolCalls } = useCalls({ scope: 'school' });
  const { data: leaderboard, isLoading: leaderboardLoading } = useLeaderboard({ range: '30d' });
  const { data: schoolDetail } = useSchool(!!user);
  const { data: vapiConfig } = useVapiConfig(!!user);

  const recentCalls = calls?.slice(0, 5) ?? [];
  const schoolCallList = schoolCalls ?? [];
  const currentSchool = schoolDetail ?? profile?.school;
  const currentPlanDetails = currentSchool?.planDetails ?? getEffectivePlanDetails(currentSchool);
  const monthlyMinuteLimit = currentPlanDetails?.monthlyRoleplayMinutes ?? null;
  const currentUsage = currentSchool?.usage?.monthly;
  const periodStart = currentUsage?.periodStart ?? currentSchool?.usagePeriodStart;
  const periodEnd = currentUsage?.periodEnd ?? currentSchool?.usagePeriodEnd;
  const periodStartTime = periodStart ? new Date(periodStart).getTime() : null;
  const periodEndTime = periodEnd ? new Date(periodEnd).getTime() : null;
  const currentPeriodCalls = schoolCallList.filter((call) => {
    const callTime = call.createdAt ? new Date(call.createdAt).getTime() : null;
    if (!callTime) return false;
    if (periodStartTime && callTime < periodStartTime) return false;
    if (periodEndTime && callTime >= periodEndTime) return false;
    return true;
  });
  const currentPeriodMinutes = Math.round((currentPeriodCalls.reduce((sum, call) => sum + (call.durationSeconds ?? 0), 0) / 60) * 10) / 10;
  const schoolCurrentCalls = currentUsage?.usedCalls ?? currentPeriodCalls.length;
  const schoolCurrentMinutes = currentUsage?.usedMinutes ?? currentPeriodMinutes;
  const startPractice = () => navigate('/practice');

  return (
    <DashboardLayout title="Training Dashboard">
      <div className="max-w-6xl mx-auto space-y-8 py-2">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <Card className="relative overflow-hidden border-primary/20 bg-primary text-primary-foreground shadow-sm dark:border-primary/30">
            <div className="pointer-events-none absolute inset-0 opacity-45">
              <div className="absolute -right-10 top-1/2 h-56 w-56 -translate-y-1/2 rounded-full border border-white/20" />
              <img
                src="/ai_dojo_gate.svg"
                alt=""
                aria-hidden="true"
                className="absolute -bottom-8 -right-6 h-64 w-64 opacity-45"
              />
            </div>
            <CardContent className="relative flex min-h-[220px] flex-col items-start justify-center gap-5 p-7 sm:p-8">
              <div className="min-w-0">
                <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/15 px-2.5 py-1 text-xs font-medium text-white">
                  <Sparkles className="h-3.5 w-3.5" />
                  AI practice
                </div>
                <h2 className="max-w-xl text-2xl font-semibold leading-tight tracking-tight sm:text-3xl">
                  Start your next roleplay call
                </h2>
                <p className="mt-2 max-w-xl text-sm text-white/75 sm:text-base">
                  Jump into a web-based training call, then review your scorecard and coaching notes after the session.
                </p>
              </div>
              <Button
                size="lg"
                onClick={startPractice}
                disabled={!vapiConfig?.configured}
                className="h-10 shrink-0 gap-2 rounded-full bg-background px-5 text-foreground hover:bg-background/90 dark:bg-white dark:text-black dark:hover:bg-white/90"
              >
                <Phone className="h-4 w-4" />
                Start Practice Call
              </Button>
            </CardContent>
          </Card>
          <TopPerformersCard leaderboard={leaderboard} isLoading={leaderboardLoading} />
        </div>

        <DashboardCharts calls={calls ?? []} />

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <RecentCallsCard
            calls={recentCalls}
            isLoading={isLoading}
            onViewAll={() => navigate('/calls')}
            onSelectCall={(callId) => navigate(`/calls/${callId}`)}
          />
          {isSchoolAdmin ? (
            <SchoolSnapshotCard
              schoolName={currentSchool?.name ?? 'Your school'}
              totalCalls={schoolCurrentCalls}
              totalMinutes={schoolCurrentMinutes}
              minuteLimit={monthlyMinuteLimit}
            />
          ) : (
            <FocusCard />
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
