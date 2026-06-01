import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminSchools, useAdminUsage, useCreateAdminSchool, useArchiveAdminSchool, useRestoreAdminSchool } from '../hooks/useAdmin';
import DashboardLayout from '../components/DashboardLayout';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Tabs, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Loader2, School, Plus, Trash2, ChevronRight, Users, RotateCcw, Clock, Phone } from 'lucide-react';
import { toast } from 'sonner';
import { getEffectivePlanDetails } from '../utils/plans';

function formatDate(date) {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatMinutes(value) {
  const minutes = Math.round(Number(value || 0) * 10) / 10;
  return `${Number.isInteger(minutes) ? minutes : minutes.toFixed(1)}m`;
}

function minuteUsageLabel(used, limit) {
  if (limit == null) return `${formatMinutes(used)} / unlimited`;
  return `${formatMinutes(used)} / ${formatMinutes(limit)}`;
}

export function AdminSchoolsPage() {
  const navigate = useNavigate();
  const [showCreate, setShowCreate] = useState(false);
  const [schoolStatus, setSchoolStatus] = useState('active');
  const [newSchoolName, setNewSchoolName] = useState('');
  const [archiveTarget, setArchiveTarget] = useState(null);
  const [archiveConfirmText, setArchiveConfirmText] = useState('');

  const { data: schools, isLoading } = useAdminSchools(true, schoolStatus);
  const { data: usage } = useAdminUsage();
  const usageBySchool = new Map((usage?.schools ?? []).map((row) => [row.schoolId, row]));

  const createMutation = useCreateAdminSchool();

  const archiveMutation = useArchiveAdminSchool();
  const restoreMutation = useRestoreAdminSchool();

  const handleArchive = () => {
    archiveMutation.mutate(archiveTarget?.id, {
      onSuccess: () => {
      setArchiveTarget(null);
      setArchiveConfirmText('');
      toast.success('School archived');
      },
      onError: (err) => toast.error(err.message || 'Failed to archive school'),
    });
  };

  const handleRestore = (school) => {
    restoreMutation.mutate(school.id, {
      onSuccess: () => toast.success('School restored'),
      onError: (err) => toast.error(err.message || 'Failed to restore school'),
    });
  };

  const handleCreate = (e) => {
    e.preventDefault();
    if (!newSchoolName.trim()) return;
    createMutation.mutate({ name: newSchoolName.trim() }, {
      onSuccess: () => { setNewSchoolName(''); setShowCreate(false); toast.success('School created'); },
      onError: (err) => toast.error(err.message || 'Failed to create school'),
    });
  };

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-6 py-2">
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground">Manage schools across the platform.</p>
          <Button onClick={() => setShowCreate(!showCreate)} className="gap-2">
            <Plus className="w-4 h-4" />New school
          </Button>
        </div>

        {showCreate && (
          <Card>
            <CardContent className="pt-6">
              <form onSubmit={handleCreate} className="flex gap-3 items-end">
                <div className="flex-1 space-y-1.5">
                  <Label htmlFor="school-name">School name</Label>
                  <Input id="school-name" value={newSchoolName} onChange={(e) => setNewSchoolName(e.target.value)}
                    placeholder="e.g. Gracie MMA Tampa" required />
                </div>
                <Button type="submit" disabled={createMutation.isPending} className="gap-2">
                  {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  Create
                </Button>
                <Button type="button" variant="ghost" onClick={() => setShowCreate(false)}>Cancel</Button>
              </form>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <School className="w-4 h-4 text-primary" />
                {schoolStatus === 'archived' ? 'Archived schools' : 'Active schools'}
                {schools && <span className="text-xs text-muted-foreground font-normal">({schools.length})</span>}
              </CardTitle>
              <Tabs value={schoolStatus} onValueChange={setSchoolStatus}>
                <TabsList>
                  <TabsTrigger value="active">Active</TabsTrigger>
                  <TabsTrigger value="archived">Archived</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : !schools || schools.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                {schoolStatus === 'archived' ? 'No archived schools.' : 'No schools yet. Create one to get started.'}
              </p>
            ) : (
              <div className="divide-y divide-border">
                {schools.map((school) => {
                  const planDetails = getEffectivePlanDetails(school);
                  const usageRow = usageBySchool.get(school.id);
                  const usedMinutes = Number(usageRow?.totalMinutes || 0);
                  const minuteLimit = planDetails?.monthlyRoleplayMinutes ?? null;
                  const usagePercent = minuteLimit ? Math.min(100, Math.round((usedMinutes / minuteLimit) * 100)) : null;
                  const isNearLimit = usagePercent != null && usagePercent >= 80;

                  return (
                  <div key={school.id} className="flex items-center justify-between gap-3 py-4 group">
                    <button
                      onClick={() => navigate(`/admin/schools/${school.id}`)}
                      className="flex items-center gap-3 min-w-0 flex-1 text-left"
                    >
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <School className="w-5 h-5 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1 space-y-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium">{school.name}</span>
                          <Badge variant="secondary" className="text-xs font-normal">{planDetails?.label ?? school.plan ?? 'No plan'}</Badge>
                          <Badge variant="outline" className="text-xs font-normal">{school.subscriptionStatus || 'active'}</Badge>
                        </div>
                        <div className="grid gap-3 text-xs text-muted-foreground sm:grid-cols-[minmax(120px,0.8fr)_minmax(180px,1fr)_minmax(90px,0.6fr)]">
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />{school.memberCount ?? 0} member{(school.memberCount ?? 0) !== 1 ? 's' : ''}
                          </span>
                          <span className="flex min-w-0 items-center gap-2">
                            <Clock className="w-3 h-3 shrink-0" />
                            <span className="shrink-0 tabular-nums">{minuteUsageLabel(usedMinutes, minuteLimit)}</span>
                            {usagePercent != null && (
                              <span className="h-1.5 min-w-16 flex-1 overflow-hidden rounded-full bg-muted">
                                <span
                                  className={`block h-full rounded-full ${isNearLimit ? 'bg-amber-500' : 'bg-primary'}`}
                                  style={{ width: `${usagePercent}%` }}
                                />
                              </span>
                            )}
                          </span>
                          <span className="flex items-center gap-1 tabular-nums">
                            <Phone className="w-3 h-3" />{usageRow?.totalCalls ?? 0} calls
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          {school.slug && <span className="font-mono">{school.slug}</span>}
                          <span>Created {formatDate(school.createdAt)}</span>
                          {school.archivedAt && <span>Archived {formatDate(school.archivedAt)}</span>}
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
                    </button>
                    {schoolStatus === 'archived' ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRestore(school)}
                        disabled={restoreMutation.isPending}
                        className="gap-2 shrink-0"
                      >
                        {restoreMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
                        Restore
                      </Button>
                    ) : (
                      <Button variant="ghost" size="sm" onClick={() => { setArchiveTarget(school); setArchiveConfirmText(''); }}
                        className="text-destructive hover:text-destructive shrink-0">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!archiveTarget} onOpenChange={(open) => { if (!open) { setArchiveTarget(null); setArchiveConfirmText(''); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-destructive">Archive school</DialogTitle>
            <DialogDescription>
              This hides <strong>{archiveTarget?.name}</strong> from active school lists while preserving calls, scorecards, usage, and historical analytics.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">
              Type <span className="font-mono font-semibold text-foreground">archive school</span> to confirm:
            </p>
            <Input value={archiveConfirmText} onChange={(e) => setArchiveConfirmText(e.target.value)} placeholder="archive school" autoFocus />
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { setArchiveTarget(null); setArchiveConfirmText(''); }}>Cancel</Button>
            <Button variant="destructive" onClick={handleArchive}
              disabled={archiveConfirmText !== 'archive school' || archiveMutation.isPending} className="gap-2">
              {archiveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              Archive school
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
