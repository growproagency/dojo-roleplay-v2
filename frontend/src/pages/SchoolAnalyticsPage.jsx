import DashboardLayout from '../components/DashboardLayout';
import { DashboardCharts } from '../components/DashboardCharts';
import { useCalls } from '../hooks/useCalls';
import { useSchoolMembers } from '../hooks/useSchool';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Loader2, BarChart3, Users, Clock, Trophy, Phone } from 'lucide-react';

function formatMinutes(seconds) {
  const minutes = Math.round(((seconds || 0) / 60) * 10) / 10;
  return `${Number.isInteger(minutes) ? minutes : minutes.toFixed(1)}m`;
}

function average(values) {
  const valid = values.filter((value) => typeof value === 'number');
  if (valid.length === 0) return null;
  return Math.round(valid.reduce((sum, value) => sum + value, 0) / valid.length);
}

function buildMemberStats(members, calls) {
  return members.map((member) => {
    const memberCalls = calls.filter((call) => call.userId === member.id);
    const scoredCalls = memberCalls.filter((call) => call.status === 'scored' && typeof call.overallScore === 'number');
    return {
      ...member,
      totalCalls: memberCalls.length,
      scoredCalls: scoredCalls.length,
      avgScore: average(scoredCalls.map((call) => call.overallScore)),
      totalSeconds: memberCalls.reduce((sum, call) => sum + (call.durationSeconds || 0), 0),
    };
  }).sort((a, b) => b.totalCalls - a.totalCalls || (b.avgScore ?? -1) - (a.avgScore ?? -1));
}

function StatCard({ icon: Icon, label, value }) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between p-5">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-1 text-2xl font-semibold">{value}</p>
        </div>
        <Icon className="h-5 w-5 text-primary" />
      </CardContent>
    </Card>
  );
}

export function SchoolAnalyticsPage() {
  const { data: calls = [], isLoading: callsLoading } = useCalls({ scope: 'school' });
  const { data: members = [], isLoading: membersLoading } = useSchoolMembers();

  const scoredCalls = calls.filter((call) => call.status === 'scored' && typeof call.overallScore === 'number');
  const totalSeconds = calls.reduce((sum, call) => sum + (call.durationSeconds || 0), 0);
  const avgScore = average(scoredCalls.map((call) => call.overallScore));
  const memberStats = buildMemberStats(members, calls);
  const isLoading = callsLoading || membersLoading;

  return (
    <DashboardLayout title="School Analytics">
      <div className="mx-auto max-w-6xl space-y-6 py-2">
        <p className="text-muted-foreground">Analyze team training activity, scores, and practice time.</p>

        <div className="grid gap-4 md:grid-cols-4">
          <StatCard icon={Phone} label="School calls" value={calls.length} />
          <StatCard icon={Trophy} label="Avg score" value={avgScore ?? '--'} />
          <StatCard icon={Clock} label="Practice time" value={formatMinutes(totalSeconds)} />
          <StatCard icon={Users} label="Members" value={members.length} />
        </div>

        {isLoading ? (
          <Card>
            <CardContent className="flex justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </CardContent>
          </Card>
        ) : (
          <>
            <DashboardCharts calls={calls} />

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <BarChart3 className="h-4 w-4 text-primary" />
                  Member Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                {memberStats.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">No members yet.</p>
                ) : (
                  <div className="divide-y divide-border">
                    {memberStats.map((member) => (
                      <div key={member.id} className="grid gap-3 py-3 text-sm md:grid-cols-[minmax(0,1fr)_90px_90px_110px] md:items-center">
                        <div className="min-w-0">
                          <p className="truncate font-medium">{member.name || member.email}</p>
                          <p className="truncate text-xs text-muted-foreground">{member.email}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Calls</p>
                          <p className="font-semibold">{member.totalCalls}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Avg score</p>
                          <p className="font-semibold">{member.avgScore ?? '--'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Practice time</p>
                          <p className="font-semibold">{formatMinutes(member.totalSeconds)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
