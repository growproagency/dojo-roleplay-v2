import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  useAdminSchool,
  useAdminSchoolInvites,
  useUpdateAdminSchool,
  useResetSchoolUsagePeriod,
  useChangeUserRole,
  useRemoveUserFromSchool,
  useCreatePasswordResetLink,
  useCreateSchoolInvite,
  useReaddSchoolUser,
  useRevokeSchoolInvite,
} from '../hooks/useAdmin';
import { useAuth } from '../hooks/useAuth';
import DashboardLayout from '../components/DashboardLayout';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Loader2, School, Users, ArrowLeft, Trash2, AlertTriangle, Mail, UserPlus, Copy, CheckCircle2, Save, SlidersHorizontal, KeyRound, Clock, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { getEffectivePlanDetails, getPlanDetails } from '../utils/plans';

function RoleBadge({ role }) {
  const config = {
    global_admin: { label: 'Global Admin', className: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
    admin: { label: 'Global Admin', className: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
    school_admin: { label: 'School Admin', className: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
    staff: { label: 'Staff', className: 'bg-green-500/10 text-green-400 border-green-500/20' },
  };
  const c = config[role] ?? { label: role, className: 'bg-muted text-muted-foreground' };
  return <Badge className={`${c.className} border`}>{c.label}</Badge>;
}

function formatDate(date) {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatMinutes(value) {
  if (value == null) return '0m';
  const minutes = Math.round(Number(value || 0) * 10) / 10;
  return `${Number.isInteger(minutes) ? minutes : minutes.toFixed(1)}m`;
}

const ACCESS_STATUS_META = {
  active: { label: 'Active', className: 'border-green-500/20 bg-green-500/10 text-green-700 dark:text-green-300' },
  trialing: { label: 'Trialing', className: 'border-blue-500/20 bg-blue-500/10 text-blue-700 dark:text-blue-300' },
  past_due: { label: 'Past due', className: 'border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-300' },
  suspended: { label: 'Suspended', className: 'border-red-500/20 bg-red-500/10 text-red-700 dark:text-red-300' },
  canceled: { label: 'Canceled', className: 'border-neutral-500/20 bg-neutral-500/10 text-neutral-700 dark:text-neutral-300' },
};

function AccessStatusBadge({ status }) {
  const meta = ACCESS_STATUS_META[status] ?? ACCESS_STATUS_META.active;
  return <Badge className={`${meta.className} border font-normal`}>{meta.label}</Badge>;
}

export function AdminSchoolDetailPage() {
  const { id } = useParams();
  const schoolId = id ? parseInt(id, 10) : null;
  const navigate = useNavigate();
  const { user: currentUser, resetPassword } = useAuth();

  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('school_admin');
  const [readdEmail, setReaddEmail] = useState('');
  const [readdRole, setReaddRole] = useState('staff');
  const [lastInviteUrl, setLastInviteUrl] = useState(null);
  const [copiedToken, setCopiedToken] = useState(null);
  const [unassignTarget, setUnassignTarget] = useState(null);
  const [resettingEmail, setResettingEmail] = useState(null);
  const [generatingResetLinkEmail, setGeneratingResetLinkEmail] = useState(null);
  const [planForm, setPlanForm] = useState({
    plan: 'starter',
    memberLimit: '',
    monthlyRoleplayMinutes: '',
    subscriptionStatus: 'active',
    subscriptionCurrentPeriodEnd: '',
    accessGraceUntil: '',
  });
  const { data, isLoading } = useAdminSchool(schoolId);

  const { data: invitesData } = useAdminSchoolInvites(schoolId);
  const changeRoleMutation = useChangeUserRole(schoolId);
  const unassignMutation = useRemoveUserFromSchool(schoolId);
  const createInviteMutation = useCreateSchoolInvite(schoolId);
  const readdUserMutation = useReaddSchoolUser(schoolId);
  const revokeInviteMutation = useRevokeSchoolInvite(schoolId);
  const updateSchoolMutation = useUpdateAdminSchool();
  const resetUsagePeriodMutation = useResetSchoolUsagePeriod();
  const createPasswordResetLink = useCreatePasswordResetLink();

  const school = data?.school;
  const members = data?.members ?? [];
  const invites = invitesData ?? [];
  const monthlyUsage = data?.usage?.monthly;

  useEffect(() => {
    if (!school) return;
    setPlanForm({
      plan: school.plan || 'starter',
      memberLimit: school.memberLimit == null ? '' : String(school.memberLimit),
      monthlyRoleplayMinutes: school.monthlyRoleplayMinutes == null ? '' : String(school.monthlyRoleplayMinutes),
      subscriptionStatus: school.subscriptionStatus || 'active',
      subscriptionCurrentPeriodEnd: school.subscriptionCurrentPeriodEnd ? school.subscriptionCurrentPeriodEnd.slice(0, 10) : '',
      accessGraceUntil: school.accessGraceUntil ? school.accessGraceUntil.slice(0, 10) : '',
    });
  }, [school]);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  if (!school) {
    return (
      <DashboardLayout>
        <div className="max-w-3xl mx-auto py-12 text-center">
          <p className="text-muted-foreground">School not found.</p>
          <Button variant="outline" onClick={() => navigate('/admin/schools')} className="mt-4">Back to schools</Button>
        </div>
      </DashboardLayout>
    );
  }

  const effectivePlan = getEffectivePlanDetails(school);
  const planDefaults = getPlanDetails(planForm.plan);
  const monthlyMinuteLimit = monthlyUsage?.limit ?? effectivePlan?.monthlyRoleplayMinutes ?? null;
  const usagePercent = monthlyMinuteLimit
    ? Math.min(100, Math.round((Number(monthlyUsage?.usedMinutes || 0) / monthlyMinuteLimit) * 100))
    : null;

  const handleLimitsSave = (event) => {
    event.preventDefault();
    updateSchoolMutation.mutate({
      id: school.id,
      data: {
        plan: planForm.plan || null,
        memberLimit: planForm.memberLimit === '' ? null : Number(planForm.memberLimit),
        monthlyRoleplayMinutes: planForm.monthlyRoleplayMinutes === '' ? null : Number(planForm.monthlyRoleplayMinutes),
        subscriptionStatus: planForm.subscriptionStatus,
        subscriptionCurrentPeriodEnd: planForm.subscriptionCurrentPeriodEnd ? new Date(`${planForm.subscriptionCurrentPeriodEnd}T23:59:59.000Z`).toISOString() : null,
        accessGraceUntil: planForm.accessGraceUntil ? new Date(`${planForm.accessGraceUntil}T23:59:59.000Z`).toISOString() : null,
      },
    }, {
      onSuccess: () => toast.success('Plan and access updated'),
      onError: (err) => toast.error(err.message || 'Failed to update plan and access'),
    });
  };

  const sendPasswordReset = async (email) => {
    setResettingEmail(email);
    try {
      await resetPassword(email);
      toast.success(`Password reset email sent to ${email}`);
    } catch (err) {
      toast.error(err.message || 'Failed to send password reset email');
    } finally {
      setResettingEmail(null);
    }
  };

  const generatePasswordResetLink = (email) => {
    setGeneratingResetLinkEmail(email);
    createPasswordResetLink.mutate(email, {
      onSuccess: async (res) => {
        await navigator.clipboard.writeText(res.data.actionLink);
        toast.success(`Password reset link copied for ${email}`);
      },
      onError: (err) => toast.error(err.message || 'Failed to generate password reset link'),
      onSettled: () => setGeneratingResetLinkEmail(null),
    });
  };

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-6 py-2">
        <div>
          <Button variant="ghost" size="sm" onClick={() => navigate('/admin/schools')} className="gap-1">
            <ArrowLeft className="w-4 h-4" />Back
          </Button>
        </div>

        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <School className="w-5 h-5 text-primary" />
            </div>
            {school.name}
          </h1>
        </div>

        <form onSubmit={handleLimitsSave} className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-primary" />Plan limits
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  {effectivePlan?.memberLimit ?? 'manual'} members, {effectivePlan?.monthlyRoleplayMinutes ?? 'manual'} minutes/month.
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="school-plan">Plan</Label>
                    <Select value={planForm.plan} onValueChange={(value) => setPlanForm((prev) => ({ ...prev, plan: value }))}>
                      <SelectTrigger id="school-plan"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="starter">Starter</SelectItem>
                        <SelectItem value="team">Team</SelectItem>
                        <SelectItem value="aios">AIOS</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="member-limit">Members</Label>
                    <Input
                      id="member-limit"
                      name="memberLimit"
                      type="number"
                      min="1"
                      placeholder={planDefaults?.memberLimit == null ? 'No default' : String(planDefaults.memberLimit)}
                      value={planForm.memberLimit}
                      onChange={(event) => setPlanForm((prev) => ({ ...prev, memberLimit: event.target.value }))}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="monthly-minutes">Minutes</Label>
                    <Input
                      id="monthly-minutes"
                      name="monthlyRoleplayMinutes"
                      type="number"
                      min="0"
                      placeholder={planDefaults?.monthlyRoleplayMinutes == null ? 'Manual' : String(planDefaults.monthlyRoleplayMinutes)}
                      value={planForm.monthlyRoleplayMinutes}
                      onChange={(event) => setPlanForm((prev) => ({ ...prev, monthlyRoleplayMinutes: event.target.value }))}
                    />
                  </div>
                </div>
                <p className="mt-3 text-xs leading-5 text-muted-foreground">
                  Leave blank to use the selected plan defaults.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle className="text-base">Subscription access</CardTitle>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Controls whether this school can use the app.
                    </p>
                  </div>
                  <AccessStatusBadge status={planForm.subscriptionStatus} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="subscription-status">Status</Label>
                    <Select value={planForm.subscriptionStatus} onValueChange={(value) => setPlanForm((prev) => ({ ...prev, subscriptionStatus: value }))}>
                      <SelectTrigger id="subscription-status"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="trialing">Trialing</SelectItem>
                        <SelectItem value="past_due">Past due</SelectItem>
                        <SelectItem value="suspended">Suspended</SelectItem>
                        <SelectItem value="canceled">Canceled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="period-end">Period end</Label>
                    <Input
                      id="period-end"
                      type="date"
                      value={planForm.subscriptionCurrentPeriodEnd}
                      onChange={(event) => setPlanForm((prev) => ({ ...prev, subscriptionCurrentPeriodEnd: event.target.value }))}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="grace-until">Grace until</Label>
                    <Input
                      id="grace-until"
                      type="date"
                      value={planForm.accessGraceUntil}
                      onChange={(event) => setPlanForm((prev) => ({ ...prev, accessGraceUntil: event.target.value }))}
                    />
                  </div>
                </div>
                <p className="mt-3 text-xs leading-5 text-muted-foreground">
                  Suspended and canceled schools are blocked. Past due schools keep access until the grace date.
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Clock className="w-4 h-4 text-primary" />Usage period
                  </CardTitle>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Controls which calls count against this school's current monthly minute limit.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  disabled={resetUsagePeriodMutation.isPending}
                  onClick={() => {
                    if (!confirm(`Start a new usage period for ${school.name}? Past calls and scorecards will stay in history.`)) return;
                    resetUsagePeriodMutation.mutate(school.id, {
                      onSuccess: () => toast.success('New usage period started'),
                      onError: (err) => toast.error(err.message || 'Failed to reset usage period'),
                    });
                  }}
                >
                  {resetUsagePeriodMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
                  Start new period
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-lg border border-border bg-secondary/20 p-3">
                  <p className="text-xs text-muted-foreground">Period start</p>
                  <p className="mt-1 text-sm font-medium">{formatDate(monthlyUsage?.periodStart)}</p>
                </div>
                <div className="rounded-lg border border-border bg-secondary/20 p-3">
                  <p className="text-xs text-muted-foreground">Period end</p>
                  <p className="mt-1 text-sm font-medium">{formatDate(monthlyUsage?.periodEnd)}</p>
                </div>
                <div className="rounded-lg border border-border bg-secondary/20 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs text-muted-foreground">Minutes used</p>
                    <p className="text-sm font-semibold">
                      {formatMinutes(monthlyUsage?.usedMinutes)}
                      {monthlyMinuteLimit != null ? ` / ${monthlyMinuteLimit}m` : ' / unlimited'}
                    </p>
                  </div>
                  {usagePercent != null && (
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-secondary">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${usagePercent}%` }} />
                    </div>
                  )}
                </div>
              </div>
              <p className="mt-3 text-xs leading-5 text-muted-foreground">
                Starting a new period resets the current counter only. Historical calls, scorecards, and analytics are not deleted.
              </p>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button type="submit" disabled={updateSchoolMutation.isPending} className="gap-2 sm:min-w-36">
              {updateSchoolMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save changes
            </Button>
          </div>
        </form>

        {/* Invite section */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-primary" />Invite to this school
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={(e) => {
              e.preventDefault();
              if (!inviteEmail.trim()) return;
              createInviteMutation.mutate(
                { email: inviteEmail.trim(), role: inviteRole },
                {
                  onSuccess: (res) => {
                    setInviteEmail('');
                    setLastInviteUrl(res.data?.acceptUrl);
                    toast.success('Invite created.');
                  },
                  onError: (err) => toast.error(err.message || 'Failed to create invite'),
                }
              );
            }} className="flex flex-col sm:flex-row gap-3 items-end">
              <div className="flex-1 space-y-1.5 w-full">
                <Label htmlFor="invite-email">Email</Label>
                <Input id="invite-email" type="email" placeholder="staff@example.com" value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)} required />
              </div>
              <div className="space-y-1.5 w-full sm:w-44">
                <Label htmlFor="invite-role">Role</Label>
                <Select value={inviteRole} onValueChange={setInviteRole}>
                  <SelectTrigger id="invite-role"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="school_admin">School Admin</SelectItem>
                    <SelectItem value="staff">Staff</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" disabled={createInviteMutation.isPending} className="gap-2 w-full sm:w-auto">
                {createInviteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                Create invite
              </Button>
            </form>

            {lastInviteUrl && (
              <div className="mt-4 p-3 rounded-lg bg-primary/5 border border-primary/20">
                <p className="text-xs text-muted-foreground mb-2 font-medium">Share this link with the new member:</p>
                <div className="flex items-center gap-2 p-2 rounded bg-background border">
                  <span className="font-mono text-xs flex-1 truncate">{lastInviteUrl}</span>
                  <button type="button" onClick={() => { navigator.clipboard.writeText(lastInviteUrl); setCopiedToken('latest'); toast.success('Copied!'); setTimeout(() => setCopiedToken(null), 2000); }}
                    className="p-1.5 rounded hover:bg-accent transition-colors shrink-0">
                    {copiedToken === 'latest' ? <CheckCircle2 className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-muted-foreground" />}
                  </button>
                </div>
              </div>
            )}

            <div className="mt-6 border-t border-border pt-6">
              <p className="mb-3 text-sm font-medium">Re-add existing user</p>
              <form onSubmit={(e) => {
                e.preventDefault();
                if (!readdEmail.trim()) return;
                readdUserMutation.mutate(
                  { email: readdEmail.trim(), role: readdRole },
                  {
                    onSuccess: () => {
                      setReaddEmail('');
                      setReaddRole('staff');
                      toast.success('User added back to school');
                    },
                    onError: (err) => toast.error(err.message || 'Failed to re-add user'),
                  }
                );
              }} className="flex flex-col sm:flex-row gap-3 items-end">
                <div className="flex-1 space-y-1.5 w-full">
                  <Label htmlFor="readd-email">Existing user email</Label>
                  <Input id="readd-email" type="email" placeholder="removed-user@example.com" value={readdEmail}
                    onChange={(e) => setReaddEmail(e.target.value)} required />
                </div>
                <div className="space-y-1.5 w-full sm:w-44">
                  <Label htmlFor="readd-role">Role</Label>
                  <Select value={readdRole} onValueChange={setReaddRole}>
                    <SelectTrigger id="readd-role"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="staff">Staff</SelectItem>
                      <SelectItem value="school_admin">School Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" disabled={readdUserMutation.isPending} className="gap-2 w-full sm:w-auto">
                  {readdUserMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Users className="w-4 h-4" />}
                  Re-add user
                </Button>
              </form>
              <p className="mt-2 text-xs text-muted-foreground">
                Use this only for users who already have an account and are not currently assigned to another school.
              </p>
            </div>

            {invites.length > 0 && (
              <div className="mt-6">
                <p className="text-xs font-medium text-muted-foreground mb-2">Pending invites ({invites.length})</p>
                <div className="divide-y divide-border">
                  {invites.map((invite) => {
                    const acceptUrl = `${window.location.origin}/invite/${invite.token}`;
                    return (
                      <div key={invite.id} className="flex items-center justify-between gap-3 py-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-medium truncate">{invite.email}</span>
                            <RoleBadge role={invite.role} />
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">Expires {formatDate(invite.expiresAt)}</p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Button variant="ghost" size="sm" onClick={() => { navigator.clipboard.writeText(acceptUrl); setCopiedToken(invite.token); toast.success('Copied!'); setTimeout(() => setCopiedToken(null), 2000); }}>
                            {copiedToken === invite.token ? <CheckCircle2 className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (confirm(`Revoke invite for ${invite.email}?`)) {
                                revokeInviteMutation.mutate(invite.id, {
                                  onSuccess: () => toast.success('Invite revoked'),
                                  onError: (err) => toast.error(err.message || 'Failed to revoke invite'),
                                });
                              }
                            }}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Members table */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />Members
              <span className="text-xs text-muted-foreground font-normal">({members.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {members.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No members in this school.</p>
            ) : (
              <div className="divide-y divide-border">
                {members.map((member) => {
                  const isSelf = member.id === currentUser?.id;
                  return (
                    <div key={member.id} className="flex items-center justify-between gap-3 py-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium truncate">{member.name || member.email}</span>
                          {isSelf && <Badge variant="outline" className="text-xs">You</Badge>}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 truncate">
                          {member.email}{member.phoneNumber ? ` • ${member.phoneNumber}` : ''}
                        </p>
                      </div>
                      <div className="shrink-0 w-36">
                        <Select value={member.role} onValueChange={(val) => {
                          if (isSelf) { toast.error("You cannot change your own role"); return; }
                          changeRoleMutation.mutate(
                            { userId: member.id, role: val },
                            {
                              onSuccess: () => toast.success('Role updated'),
                              onError: (err) => toast.error(err.message || 'Failed to change role'),
                            }
                          );
                        }} disabled={isSelf || changeRoleMutation.isPending}>
                          <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="staff">Staff</SelectItem>
                            <SelectItem value="school_admin">School Admin</SelectItem>
                            <SelectItem value="global_admin">Global Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => sendPasswordReset(member.email)}
                          disabled={resettingEmail === member.email}
                          title="Send password reset email"
                        >
                          {resettingEmail === member.email ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => generatePasswordResetLink(member.email)}
                          disabled={generatingResetLinkEmail === member.email}
                          title="Generate and copy password reset link"
                        >
                          {generatingResetLinkEmail === member.email ? <Loader2 className="w-4 h-4 animate-spin" /> : <Copy className="w-4 h-4" />}
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setUnassignTarget(member)} disabled={isSelf} title="Remove from school">
                          <Users className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Unassign modal */}
      <Dialog open={!!unassignTarget} onOpenChange={(open) => { if (!open) setUnassignTarget(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-yellow-500" />Remove from school</DialogTitle>
            <DialogDescription>
              Remove <strong>{unassignTarget?.name || unassignTarget?.email}</strong> from {school?.name}? Their past calls and scorecards will stay in history.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setUnassignTarget(null)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => unassignMutation.mutate(unassignTarget?.id, {
                onSuccess: () => {
                  setUnassignTarget(null);
                  toast.success('Member removed from school');
                },
                onError: (err) => toast.error(err.message || 'Failed to remove member'),
              })}
              disabled={unassignMutation.isPending}
              className="gap-2"
            >
              {unassignMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              Remove from school
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
