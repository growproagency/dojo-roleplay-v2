import { useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { useCreatePasswordResetLink, useCreatePlatformAdminInvite, usePlatformAdmins, useRevokePlatformAdmin, useRevokePlatformAdminInvite } from '../hooks/useAdmin';
import { useCreateInvite, useDeleteInvite, useInvites, useRemoveMember, useSchoolMembers } from '../hooks/useSchool';
import { useAuth } from '../hooks/useAuth';
import { useUIStore } from '../store/ui.store';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { AlertCircle, CheckCircle2, Copy, KeyRound, Loader2, Mail, Trash2, UserPlus, Users } from 'lucide-react';
import { toast } from 'sonner';
import { getEffectivePlanDetails } from '../utils/plans';

export function MembersPage() {
  const { user, profile, isGlobalAdmin, isSchoolAdmin, resetPassword } = useAuth();
  const viewingSchoolId = useUIStore((s) => s.viewingSchoolId);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('staff');
  const [adminEmail, setAdminEmail] = useState('');
  const [copiedToken, setCopiedToken] = useState(null);
  const [resettingEmail, setResettingEmail] = useState(null);
  const [generatingResetLinkEmail, setGeneratingResetLinkEmail] = useState(null);
  const [revokeAdminTarget, setRevokeAdminTarget] = useState(null);
  const platformMode = isGlobalAdmin && !viewingSchoolId;
  const { data: platformAdmins, isLoading: platformAdminsLoading } = usePlatformAdmins(platformMode);
  const createPlatformInvite = useCreatePlatformAdminInvite();
  const createPasswordResetLink = useCreatePasswordResetLink();
  const revokePlatformAdmin = useRevokePlatformAdmin();
  const revokePlatformInvite = useRevokePlatformAdminInvite();
  const { data: members = [], isLoading: membersLoading } = useSchoolMembers(!platformMode);
  const { data: invites = [], isLoading: invitesLoading } = useInvites(!platformMode);
  const createInvite = useCreateInvite();
  const removeMember = useRemoveMember();
  const deleteInvite = useDeleteInvite();
  const planDetails = profile?.school?.planDetails ?? getEffectivePlanDetails(profile?.school);
  const memberLimit = planDetails?.memberLimit;
  const reservedMemberCount = members.length + invites.length;
  const memberLimitReached = Number.isInteger(memberLimit) && reservedMemberCount >= memberLimit;
  const invitesRemaining = Number.isInteger(memberLimit)
    ? Math.max(memberLimit - reservedMemberCount, 0)
    : null;
  const memberUsagePercent = Number.isInteger(memberLimit)
    ? Math.min((reservedMemberCount / memberLimit) * 100, 100)
    : 0;

  const copyInviteLink = async (invite) => {
    const acceptUrl = `${window.location.origin}/invite/${invite.token}`;
    await navigator.clipboard.writeText(acceptUrl);
    setCopiedToken(invite.token);
    toast.success('Invite link copied');
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const sendPasswordReset = async (targetEmail) => {
    setResettingEmail(targetEmail);
    try {
      await resetPassword(targetEmail);
      toast.success(`Password reset email sent to ${targetEmail}`);
    } catch (err) {
      toast.error(err.message || 'Failed to send password reset email');
    } finally {
      setResettingEmail(null);
    }
  };

  const generatePasswordResetLink = (targetEmail) => {
    setGeneratingResetLinkEmail(targetEmail);
    createPasswordResetLink.mutate(targetEmail, {
      onSuccess: async (res) => {
        await navigator.clipboard.writeText(res.data.actionLink);
        toast.success(`Password reset link copied for ${targetEmail}`);
      },
      onError: (err) => toast.error(err.message || 'Failed to generate password reset link'),
      onSettled: () => setGeneratingResetLinkEmail(null),
    });
  };

  if (!isSchoolAdmin && !isGlobalAdmin) {
    return (
      <DashboardLayout>
        <Card className="mx-auto max-w-2xl">
          <CardContent className="p-6 text-sm text-muted-foreground">Only school admins can manage members.</CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  if (platformMode) {
    const submitPlatformAdmin = (event) => {
      event.preventDefault();
      createPlatformInvite.mutate({ email: adminEmail.trim() }, {
        onSuccess: () => {
          setAdminEmail('');
          toast.success('Platform admin invite created');
        },
        onError: (err) => toast.error(err.message || 'Failed to create platform admin invite'),
      });
    };

    const activePlatformAdmins = platformAdmins?.admins ?? [];

    return (
      <DashboardLayout>
        <div className="mx-auto max-w-5xl space-y-6 py-2">
          <p className="text-muted-foreground">Manage global administrator access and pending admin invites.</p>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base"><UserPlus className="h-4 w-4 text-primary" />Invite Platform Admin</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={submitPlatformAdmin} className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <div className="w-full flex-1 space-y-1.5">
                  <Label htmlFor="platform-admin-email">Email</Label>
                  <Input id="platform-admin-email" type="email" value={adminEmail} onChange={(event) => setAdminEmail(event.target.value)} required />
                </div>
                <div className="w-full space-y-1.5 sm:w-48">
                  <Label>Role</Label>
                  <div className="flex h-9 items-center rounded-full bg-secondary px-3 text-sm font-medium">Global Admin</div>
                </div>
                <Button type="submit" disabled={createPlatformInvite.isPending} className="gap-2">
                  {createPlatformInvite.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                  Create Admin Invite
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base"><Users className="h-4 w-4 text-primary" />Active Platform Admins</CardTitle>
            </CardHeader>
            <CardContent>
              {platformAdminsLoading ? <Loading /> : activePlatformAdmins.length === 0 ? <Empty>No platform admins yet.</Empty> : (
                <div className="divide-y">
                  {activePlatformAdmins.map((admin) => (
                    <div key={admin.id} className="flex items-center justify-between gap-3 py-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{admin.name || admin.email}</span>
                          <Badge variant="outline">Global Admin</Badge>
                          {admin.id === user?.id && <Badge>You</Badge>}
                        </div>
                        <p className="truncate text-xs text-muted-foreground">{admin.email}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={resettingEmail === admin.email}
                          onClick={() => sendPasswordReset(admin.email)}
                          className="gap-2"
                        >
                          {resettingEmail === admin.email ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
                          Reset Email
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={generatingResetLinkEmail === admin.email}
                          onClick={() => generatePasswordResetLink(admin.email)}
                          className="gap-2"
                        >
                          {generatingResetLinkEmail === admin.email ? <Loader2 className="h-4 w-4 animate-spin" /> : <Copy className="h-4 w-4" />}
                          Reset Link
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={admin.id === user?.id || activePlatformAdmins.length <= 1}
                          onClick={() => setRevokeAdminTarget(admin)}
                          className="gap-2 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                          Remove
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base"><Mail className="h-4 w-4 text-primary" />Pending Platform Admin Invites</CardTitle>
            </CardHeader>
            <CardContent>
              {platformAdminsLoading ? <Loading /> : (platformAdmins?.invites ?? []).length === 0 ? <Empty>No pending admin invites.</Empty> : (
                <InviteList
                  invites={platformAdmins?.invites ?? []}
                  copiedToken={copiedToken}
                  copyInviteLink={copyInviteLink}
                  deleteInvite={revokePlatformInvite}
                  successMessage="Admin invite revoked"
                />
              )}
            </CardContent>
          </Card>
        </div>

        <Dialog open={!!revokeAdminTarget} onOpenChange={(open) => { if (!open) setRevokeAdminTarget(null); }}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-destructive">Remove platform admin</DialogTitle>
              <DialogDescription>
                Remove <strong>{revokeAdminTarget?.name || revokeAdminTarget?.email}</strong> from platform admin access? Their user account and history will stay intact.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setRevokeAdminTarget(null)}>Cancel</Button>
              <Button
                variant="destructive"
                disabled={revokePlatformAdmin.isPending}
                onClick={() => revokePlatformAdmin.mutate(revokeAdminTarget?.id, {
                  onSuccess: () => {
                    setRevokeAdminTarget(null);
                    toast.success('Platform admin access removed');
                  },
                  onError: (err) => toast.error(err.message || 'Failed to remove platform admin'),
                })}
                className="gap-2"
              >
                {revokePlatformAdmin.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                Remove
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </DashboardLayout>
    );
  }

  const submit = (event) => {
    event.preventDefault();
    if (memberLimitReached) {
      toast.error(`Your ${planDetails.label} plan is limited to ${memberLimit} members.`);
      return;
    }
    createInvite.mutate({ email: email.trim(), role }, {
      onSuccess: () => {
        setEmail('');
        setRole('staff');
        toast.success('Invite created');
      },
      onError: (err) => toast.error(err.message || 'Failed to create invite'),
    });
  };

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-5xl space-y-6 py-2">
        <p className="text-muted-foreground">Manage active staff and pending invites.</p>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base"><UserPlus className="h-4 w-4 text-primary" />Invite Member</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="space-y-4">
              <div className="rounded-lg border border-border bg-muted/30 px-3 py-2.5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10">
                      <Users className="h-4 w-4 text-primary" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground">Member seats</p>
                      <p className="text-xs leading-5 text-muted-foreground">
                        {members.length} active + {invites.length} pending
                        {Number.isInteger(memberLimit) ? ` / ${memberLimit} total` : ' / unlimited'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-3 sm:justify-end">
                    <span className="text-xs text-muted-foreground">Remaining</span>
                    <span className="text-xl font-semibold tracking-tight">
                      {Number.isInteger(memberLimit) ? invitesRemaining : 'Unlimited'}
                    </span>
                  </div>
                </div>
                {Number.isInteger(memberLimit) ? (
                  <>
                    <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-background">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${memberUsagePercent}%` }} />
                    </div>
                    <p className="mt-1.5 text-[11px] leading-4 text-muted-foreground">
                      {reservedMemberCount} of {memberLimit} seats reserved on {planDetails.label}
                    </p>
                  </>
                ) : (
                  <p className="mt-1.5 text-[11px] leading-4 text-muted-foreground">
                    No member cap on {planDetails.label}
                  </p>
                )}
              </div>
              {memberLimitReached && (
                <div className="flex items-center gap-2 rounded-lg border border-primary/15 bg-primary/5 px-3 py-2 text-sm text-muted-foreground">
                  <AlertCircle className="h-4 w-4 shrink-0 text-primary" />
                  <span>Your {planDetails.label} plan is limited to {memberLimit} members.</span>
                </div>
              )}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="w-full flex-1 space-y-1.5">
                <Label htmlFor="invite-email">Email</Label>
                <Input id="invite-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
              </div>
              <div className="w-full space-y-1.5 sm:w-44">
                <Label>Role</Label>
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="staff">Staff</SelectItem>
                    <SelectItem value="school_admin">School Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" disabled={createInvite.isPending || memberLimitReached} className="gap-2">
                {createInvite.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                Create Invite
              </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base"><Users className="h-4 w-4 text-primary" />Active Members</CardTitle>
          </CardHeader>
          <CardContent>
            {membersLoading ? <Loading /> : members.length === 0 ? <Empty>No members yet.</Empty> : (
              <div className="divide-y">
                {members.map((member) => (
                  <div key={member.id} className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{member.name || member.email}</span>
                        <Badge variant="outline">{member.role}</Badge>
                        {member.id === user?.id && <Badge>You</Badge>}
                      </div>
                      <p className="truncate text-xs text-muted-foreground">{member.email}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={resettingEmail === member.email}
                        onClick={() => sendPasswordReset(member.email)}
                        title="Send password reset email"
                      >
                        {resettingEmail === member.email ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={generatingResetLinkEmail === member.email}
                        onClick={() => generatePasswordResetLink(member.email)}
                        title="Generate and copy password reset link"
                      >
                        {generatingResetLinkEmail === member.email ? <Loader2 className="h-4 w-4 animate-spin" /> : <Copy className="h-4 w-4" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={member.id === user?.id || removeMember.isPending}
                        onClick={() => removeMember.mutate(member.id, { onSuccess: () => toast.success('Member removed'), onError: (err) => toast.error(err.message) })}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base"><Mail className="h-4 w-4 text-primary" />Pending Invites</CardTitle>
          </CardHeader>
          <CardContent>
            {invitesLoading ? <Loading /> : invites.length === 0 ? <Empty>No pending invites.</Empty> : (
              <InviteList
                invites={invites}
                copiedToken={copiedToken}
                copyInviteLink={copyInviteLink}
                deleteInvite={deleteInvite}
                successMessage="Invite revoked"
              />
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

function InviteList({ invites, copiedToken, copyInviteLink, deleteInvite, successMessage }) {
  return (
    <div className="divide-y">
      {invites.map((invite) => (
        <div key={invite.id} className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="font-medium">{invite.email}</span>
              <Badge variant="outline">{invite.role === 'global_admin' ? 'Global Admin' : invite.role}</Badge>
            </div>
            <div className="mt-2 flex min-w-0 items-center gap-2 rounded-full border border-border bg-secondary/30 px-3 py-1.5">
              <p className="min-w-0 flex-1 truncate text-xs text-muted-foreground">{`${window.location.origin}/invite/${invite.token}`}</p>
              <button
                type="button"
                onClick={() => copyInviteLink(invite)}
                className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-accent hover:text-foreground"
                aria-label={`Copy invite link for ${invite.email}`}
              >
                {copiedToken === invite.token ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            disabled={deleteInvite.isPending}
            onClick={() => deleteInvite.mutate(invite.id, { onSuccess: () => toast.success(successMessage), onError: (err) => toast.error(err.message) })}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
    </div>
  );
}

function Loading() {
  return <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;
}

function Empty({ children }) {
  return <p className="py-6 text-center text-sm text-muted-foreground">{children}</p>;
}
