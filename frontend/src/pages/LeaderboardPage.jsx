import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useLeaderboard } from '../hooks/useLeaderboard';
import { useScenarios } from '../hooks/useScenarios';
import { useAdminSchools } from '../hooks/useAdmin';
import DashboardLayout from '../components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Trophy, Phone, TrendingUp, Star, Loader2, Medal, Filter } from 'lucide-react';

function ScoreBadge({ score }) {
  if (score === null) return <span className="text-muted-foreground text-sm">—</span>;
  const color = score >= 80 ? 'text-green-400' : score >= 60 ? 'text-yellow-400' : score >= 40 ? 'text-orange-400' : 'text-red-400';
  return <span className={`text-lg font-bold ${color}`}>{score}</span>;
}

function RankIcon({ rank }) {
  if (rank === 1) return <Trophy className="w-5 h-5 text-yellow-400" />;
  if (rank === 2) return <Medal className="w-5 h-5 text-slate-400" />;
  if (rank === 3) return <Medal className="w-5 h-5 text-amber-600" />;
  return <span className="w-5 h-5 flex items-center justify-center text-sm font-bold text-muted-foreground">#{rank}</span>;
}

function formatDate(date) {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function StaffIdentity({ entry, align = 'left', size = 'sm' }) {
  const name = entry.userName?.trim();
  const email = entry.userEmail?.trim();
  const primary = name || email || 'Unknown';
  const secondary = name && email ? email : null;
  return (
    <div className={`min-w-0 ${align === 'center' ? 'text-center' : 'text-left'}`}>
      <p className={`${size === 'lg' ? 'font-semibold text-base' : 'font-medium text-sm'} truncate`}>{primary}</p>
      {secondary && <p className="text-xs text-muted-foreground truncate">{secondary}</p>}
    </div>
  );
}

export function LeaderboardPage() {
  const { isGlobalAdmin } = useAuth();
  const [range, setRange] = useState('all');
  const [scenario, setScenario] = useState('all');
  const [schoolFilter, setSchoolFilter] = useState('all');

  const { data: scenarios } = useScenarios();
  const { data: schools } = useAdminSchools();

  const filters = {
    ...(range !== 'all' && { range }),
    ...(scenario !== 'all' && { scenario }),
    ...(isGlobalAdmin && schoolFilter !== 'all' && { schoolId: schoolFilter }),
  };

  const { data, isLoading } = useLeaderboard(filters);
  const schoolNameById = new Map((schools ?? []).map((s) => [s.id, s.name]));
  const showSchoolColumn = isGlobalAdmin && schoolFilter === 'all';

  return (
    <DashboardLayout title="Staff Leaderboard">
      <div className="max-w-4xl mx-auto space-y-6 py-2">
        <p className="text-muted-foreground text-sm">Rankings based on average scorecard score across all completed calls.</p>

        {isLoading ? (
          <div className="flex items-center justify-center min-h-[40vh]">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {data && data.length >= 1 && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {data.slice(0, 3).map((entry) => (
                  <Card key={entry.userId} className={`text-center py-6 ${
                    entry.rank === 1 ? 'border-yellow-500/30 bg-yellow-500/5' :
                    entry.rank === 2 ? 'border-slate-400/30' : 'border-amber-600/30'
                  }`}>
                    <CardContent className="pt-0 space-y-2">
                      <div className="flex justify-center"><RankIcon rank={entry.rank} /></div>
                      <StaffIdentity entry={entry} align="center" size="lg" />
                      {showSchoolColumn && (
                        <p className="text-xs text-muted-foreground truncate">{schoolNameById.get(entry.schoolId) ?? '—'}</p>
                      )}
                      <div className="flex justify-center"><ScoreBadge score={entry.avgScore} /></div>
                      <p className="text-xs text-muted-foreground">avg score</p>
                      <div className="flex justify-center gap-3 text-xs text-muted-foreground pt-1">
                        <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{entry.totalCalls} calls</span>
                        {entry.bestScore !== null && (
                          <span className="flex items-center gap-1"><Star className="w-3 h-3" />{entry.bestScore} best</span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-primary" />All Rankings
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="px-4 py-2 border-b border-border flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground shrink-0">
                    <Filter className="w-4 h-4" /><span>Filter:</span>
                  </div>
                  <Select value={range} onValueChange={setRange}>
                    <SelectTrigger className="w-full sm:w-36"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All time</SelectItem>
                      <SelectItem value="7d">Last 7 days</SelectItem>
                      <SelectItem value="30d">Last 30 days</SelectItem>
                      <SelectItem value="90d">Last 90 days</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={scenario} onValueChange={setScenario}>
                    <SelectTrigger className="w-full sm:w-52"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All scenarios</SelectItem>
                      {(scenarios ?? []).map((s) => (
                        <SelectItem key={s.id} value={s.id}>{s.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {isGlobalAdmin && (
                    <Select value={schoolFilter} onValueChange={setSchoolFilter}>
                      <SelectTrigger className="w-full sm:w-52"><SelectValue placeholder="All schools" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All schools</SelectItem>
                        {(schools ?? []).map((s) => (
                          <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                {!data || data.length === 0 ? (
                  <div className="py-16 text-center">
                    <Trophy className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
                    <p className="text-muted-foreground font-medium">No calls scored yet.</p>
                    <p className="text-sm text-muted-foreground/70 mt-1">Complete and score a call to appear on the leaderboard.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Rank</th>
                          <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Staff Member</th>
                          {showSchoolColumn && <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">School</th>}
                          <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Avg Score</th>
                          <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Best</th>
                          <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Calls</th>
                          <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Last Call</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.map((entry) => (
                          <tr key={entry.userId} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                            <td className="px-4 py-3"><div className="flex items-center"><RankIcon rank={entry.rank} /></div></td>
                            <td className="px-4 py-3"><StaffIdentity entry={entry} /></td>
                            {showSchoolColumn && <td className="px-4 py-3 text-sm text-muted-foreground">{schoolNameById.get(entry.schoolId) ?? '—'}</td>}
                            <td className="px-4 py-3 text-right"><ScoreBadge score={entry.avgScore} /></td>
                            <td className="px-4 py-3 text-right">
                              {entry.bestScore !== null ? <span className="text-sm font-medium">{entry.bestScore}</span> : <span className="text-muted-foreground">—</span>}
                            </td>
                            <td className="px-4 py-3 text-right text-muted-foreground">{entry.totalCalls}</td>
                            <td className="px-4 py-3 text-right text-muted-foreground text-xs">{formatDate(entry.lastCallAt)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
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
