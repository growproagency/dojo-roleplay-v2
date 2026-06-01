import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useCalls } from '../hooks/useCalls';
import { useSchoolMembers } from '../hooks/useSchool';
import DashboardLayout from '../components/DashboardLayout';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Phone, ChevronRight, Loader2, Clock, Calendar, User } from 'lucide-react';

const SCENARIO_LABELS = {
  new_student: 'New Student',
  parent_enrollment: 'Parent Enrollment',
  web_lead_callback: 'Outbound Callback',
  sales_enrollment: 'Sales Enrollment',
  renewal_conference: 'Renewal',
  cancellation_save: 'Cancellation Save',
};

const DIFFICULTY_DOT = { easy: 'bg-green-500', medium: 'bg-yellow-500', hard: 'bg-red-500' };

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
  if (!seconds) return '—';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function formatDate(date) {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit',
  });
}

export function CallHistoryPage() {
  const navigate = useNavigate();
  const { isSchoolAdmin } = useAuth();
  const [userId, setUserId] = useState('all');

  const { data: calls, isLoading } = useCalls(userId !== 'all' ? { userId } : {});
  const { data: members } = useSchoolMembers();

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-6 py-2">
        <p className="text-muted-foreground">
          {calls ? `${calls.length} total call${calls.length !== 1 ? 's' : ''}` : 'Loading...'}
        </p>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <CardTitle className="text-base">All Training Sessions</CardTitle>
              {isSchoolAdmin && (
                <Select value={userId} onValueChange={setUserId}>
                  <SelectTrigger className="w-48 h-8 text-sm">
                    <SelectValue placeholder="All Staff" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Staff</SelectItem>
                    {(members ?? []).map((m) => (
                      <SelectItem key={m.id} value={String(m.id)}>
                        {m.name || m.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : !calls || calls.length === 0 ? (
              <div className="text-center py-16">
                <Phone className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
                <p className="text-muted-foreground font-medium">No calls yet</p>
                <p className="text-sm text-muted-foreground/70 mt-1 mb-6">
                  Make your first training call to see your history here.
                </p>
                <Button onClick={() => navigate('/dashboard')} size="sm">Go to Dashboard</Button>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {calls.map((call) => (
                  <button
                    key={call.id}
                    onClick={() => navigate(`/calls/${call.id}`)}
                    className="w-full flex items-center justify-between py-4 px-2 hover:bg-secondary/30 transition-colors text-left group rounded-lg"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <Phone className="w-4 h-4 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-3 flex-wrap mb-1">
                          <span className="text-sm font-medium">{SCENARIO_LABELS[call.scenario] ?? call.scenario}</span>
                          <DifficultyChip difficulty={call.difficulty} />
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(call.createdAt)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDuration(call.durationSeconds)}
                          </span>
                          {call.userName && (
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              {call.userName}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 ml-4">
                      {call.status === 'scored' && call.overallScore != null ? (
                        <div className="text-right">
                          <div className={`text-lg font-semibold leading-none ${scoreColor(call.overallScore)}`}>
                            {call.overallScore}
                          </div>
                          <div className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wide">Score</div>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          {{ in_progress: 'In Progress', completed: 'Not scored', scoring: 'Scoring…', failed: 'Failed' }[call.status] ?? call.status}
                        </span>
                      )}
                      <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
