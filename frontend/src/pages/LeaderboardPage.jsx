import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useLeaderboard } from '../hooks/useLeaderboard';
import { useScenarios } from '../hooks/useScenarios';
import { useAdminSchools } from '../hooks/useAdmin';
import DashboardLayout from '../components/DashboardLayout';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Trophy, Loader2, Flame } from 'lucide-react';

function Identity({ entry }) {
  return <div className="min-w-0">
    <p className="font-medium truncate">{entry.userName || entry.userEmail || 'Unknown'}</p>
    {entry.userName && <p className="text-xs text-muted-foreground truncate">{entry.userEmail}</p>}
    {entry.hardModeParticipant && <span className="inline-flex items-center gap-1 text-xs text-orange-400"><Flame className="h-3 w-3" />Hard-mode participant</span>}
  </div>;
}

function FilterSelect({ label, value, onChange, options }) {
  return <div className="space-y-1">
    <span className="text-xs text-muted-foreground">{label}</span>
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger aria-label={label} className="w-full"><SelectValue /></SelectTrigger>
      <SelectContent>{options.map(([id, title]) => <SelectItem key={id} value={id}>{title}</SelectItem>)}</SelectContent>
    </Select>
  </div>;
}

export function LeaderboardPage() {
  const { isGlobalAdmin } = useAuth();
  const [range, setRange] = useState('30d');
  const [scenario, setScenario] = useState('all');
  const [difficulty, setDifficulty] = useState('all');
  const [schoolFilter, setSchoolFilter] = useState('all');
  const [page, setPage] = useState(1);
  const { data: scenarios } = useScenarios();
  const { data: schools } = useAdminSchools();
  const { data: result, isLoading, isError, error, refetch } = useLeaderboard({
    range, page, limit: 25,
    ...(scenario !== 'all' && { scenario }),
    ...(difficulty !== 'all' && { difficulty }),
    ...(isGlobalAdmin && schoolFilter !== 'all' && { schoolId: schoolFilter }),
  });
  const change = setter => value => { setter(value); setPage(1); };
  const entries = result?.data ?? [];
  const meta = result?.meta;
  const minimum = meta?.minimumScoredCalls ?? 5;
  const me = result?.currentUser;
  const showSchool = isGlobalAdmin && schoolFilter === 'all';
  const schoolNames = new Map((schools ?? []).map(s => [s.id, s.name]));

  return <DashboardLayout title="Staff Leaderboard">
    <div className="max-w-6xl mx-auto space-y-6 py-2">
      <div>
        <h2 className="text-xl font-semibold">Take on the challenge</h2>
        <p className="text-sm text-muted-foreground mt-1">Ranked by average difficulty-adjusted points. Easy ×1.00 · Medium ×1.15 · Hard ×1.30.</p>
        <p className="text-sm text-muted-foreground">Hard calls earn 30% more points. Scorecard percentages stay the same. Complete {minimum} scored calls within the selected filters to qualify.</p>
      </div>

      <div className={`grid gap-3 sm:grid-cols-2 ${isGlobalAdmin ? 'lg:grid-cols-4' : 'lg:grid-cols-3'}`}>
        <FilterSelect label="Period" value={range} onChange={change(setRange)} options={[
          ['30d', 'Last 30 days'], ['7d', 'Last 7 days'], ['90d', 'Last 90 days'], ['all', 'All time'],
        ]} />
        <FilterSelect label="Scenario" value={scenario} onChange={change(setScenario)} options={[
          ['all', 'All scenarios'], ...(scenarios ?? []).map(s => [s.id, s.title]),
        ]} />
        <FilterSelect label="Difficulty" value={difficulty} onChange={change(setDifficulty)} options={[
          ['all', 'All difficulties'], ['easy', 'Easy'], ['medium', 'Medium'], ['hard', 'Hard'],
        ]} />
        {isGlobalAdmin && <FilterSelect label="School" value={schoolFilter} onChange={change(setSchoolFilter)} options={[
          ['all', 'All schools'], ...(schools ?? []).map(s => [String(s.id), s.name]),
        ]} />}
      </div>

      {isLoading ? <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin" aria-label="Loading leaderboard" /></div>
        : isError ? <Card><CardContent className="pt-6 space-y-3" role="alert"><p>{error.message || 'Unable to load rankings.'}</p><Button onClick={() => refetch()}>Try again</Button></CardContent></Card>
          : <>
            <Card><CardContent className="pt-6 flex flex-wrap items-center justify-between gap-4">
              <div><p className="font-semibold">Your progress</p>
                <p className="text-sm text-muted-foreground">{me?.qualified ? `Rank #${me.rank} · ${me.scoredCalls} scored calls`
                  : `Qualifying — ${me?.scoredCalls ?? 0}/${minimum} scored calls`}</p>
                {!me?.qualified && <p className="text-xs text-muted-foreground">Complete {Math.max(0, minimum - (me?.scoredCalls ?? 0))} more scored calls to enter the rankings.</p>}
              </div>
              <div className="text-right"><p className="text-2xl font-bold">{me?.avgPoints != null ? `${me.avgPoints.toFixed(1)} pts` : 'No points yet'}</p>
                {me && <p className="text-sm text-muted-foreground">{me.avgScore.toFixed(1)}% average score</p>}</div>
            </CardContent></Card>

            {page === 1 && entries.some(e => e.qualified) && <div className="grid sm:grid-cols-3 gap-4">
              {entries.filter(e => e.qualified).slice(0, 3).map(entry => <Card key={entry.userId} className={entry.rank === 1 ? 'border-yellow-500/40 bg-yellow-500/5' : ''}>
                <CardContent className="pt-6 space-y-2">
                  <div className="flex items-center gap-2 text-primary"><Trophy className="h-5 w-5" />#{entry.rank}</div>
                  <Identity entry={entry} />
                  <p className="text-3xl font-bold">{entry.avgPoints.toFixed(1)} <span className="text-sm font-normal text-muted-foreground">pts</span></p>
                  <p className="text-xs text-muted-foreground">{entry.avgScore.toFixed(1)}% avg score · {entry.scoredCalls} scored calls</p>
                </CardContent>
              </Card>)}
            </div>}

            <Card><CardContent className="p-0">
              {entries.length === 0 ? <p className="p-12 text-center text-muted-foreground">No scored calls match these filters. Complete and score a call to start qualifying.</p>
                : <div className="overflow-x-auto"><table className="w-full text-sm">
                  <thead><tr className="border-b border-border text-muted-foreground">
                    {['Rank', 'Staff member', ...(showSchool ? ['School'] : []), 'Avg points', 'Avg score', 'Easy / Medium / Hard', 'Scored calls'].map(label => <th key={label} className="text-left p-4 whitespace-nowrap font-medium">{label}</th>)}
                  </tr></thead>
                  <tbody>{entries.map(entry => <tr key={entry.userId} className="border-b border-border/50 hover:bg-secondary/30">
                    <td className="p-4 whitespace-nowrap">{entry.qualified ? `#${entry.rank}` : <span className="text-muted-foreground">Qualifying {entry.scoredCalls}/{minimum}</span>}</td>
                    <td className="p-4"><Identity entry={entry} /></td>
                    {showSchool && <td className="p-4">{schoolNames.get(entry.schoolId) ?? '—'}</td>}
                    <td className="p-4 font-bold whitespace-nowrap">{entry.avgPoints.toFixed(1)} pts</td>
                    <td className="p-4">{entry.avgScore.toFixed(1)}%</td>
                    <td className="p-4 whitespace-nowrap">
                      {entry.difficultyCounts.easy} / {entry.difficultyCounts.medium} / {entry.difficultyCounts.hard}
                      {entry.difficultyCounts.legacy > 0 && <span className="block text-xs text-muted-foreground">{entry.difficultyCounts.legacy} legacy (×1.00)</span>}
                    </td>
                    <td className="p-4">{entry.scoredCalls}</td>
                  </tr>)}</tbody>
                </table></div>}
              {meta?.totalPages > 1 && <div className="flex items-center justify-between gap-2 p-4">
                <Button variant="outline" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
                <span className="text-sm text-muted-foreground">Page {page} of {meta.totalPages}</span>
                <Button variant="outline" disabled={page >= meta.totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
              </div>}
            </CardContent></Card>
            <p className="text-xs text-muted-foreground">Points are averaged across all eligible scored calls within these filters. Equal points share a rank. Legacy calls without a recognized difficulty receive ×1.00.</p>
          </>}
    </div>
  </DashboardLayout>;
}
