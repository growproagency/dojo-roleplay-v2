import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useInvitePreview, useAcceptInvite } from '../hooks/useInvite';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../store/auth.store';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Loader2, Mail, School, CheckCircle2, XCircle, Clock, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';

const PENDING_INVITE_KEY = 'dojo:pendingInviteToken';

function CenteredCard({ children }) {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-md">{children}</Card>
    </div>
  );
}

function InvalidState({ message, onHome }) {
  return (
    <>
      <CardHeader className="text-center pb-3">
        <div className="mx-auto w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mb-3">
          <XCircle className="w-6 h-6 text-red-500" />
        </div>
        <CardTitle className="text-xl">Invite unavailable</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground text-center">{message}</p>
        <Button onClick={onHome} variant="outline" className="w-full">Go home</Button>
      </CardContent>
    </>
  );
}

export function InviteAcceptPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, initialized } = useAuth();
  const setProfile = useAuthStore((s) => s.setProfile);

  const { data: invite, isLoading: inviteLoading, error: inviteError } = useInvitePreview(token);
  const acceptMutation = useAcceptInvite();

  const [settling, setSettling] = useState(() => {
    return typeof window !== 'undefined' && !!sessionStorage.getItem(PENDING_INVITE_KEY);
  });

  useEffect(() => {
    if (!settling) return;
    const timeout = setTimeout(() => setSettling(false), 2000);
    if (user) { setSettling(false); clearTimeout(timeout); }
    return () => clearTimeout(timeout);
  }, [settling, user]);

  useEffect(() => {
    if (token && !user && initialized && !settling) {
      sessionStorage.setItem(PENDING_INVITE_KEY, token);
    }
  }, [token, user, initialized, settling]);

  if (!token) {
    return <CenteredCard><InvalidState message="Missing invite token." onHome={() => navigate('/')} /></CenteredCard>;
  }

  if (inviteLoading || !initialized || settling) {
    return (
      <CenteredCard>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </CenteredCard>
    );
  }

  if (inviteError) {
    return <CenteredCard><InvalidState message="Failed to load invite. Please check your link." onHome={() => navigate('/')} /></CenteredCard>;
  }

  if (!invite || invite.valid === false) {
    const reasons = {
      not_found: 'This invite link is invalid or has been removed.',
      already_accepted: 'This invite has already been accepted.',
      revoked: 'This invite has been revoked by your school admin.',
      expired: 'This invite has expired. Ask your school admin for a new one.',
    };
    return <CenteredCard><InvalidState message={reasons[invite?.reason] || 'This invite is no longer valid.'} onHome={() => navigate('/')} /></CenteredCard>;
  }

  const emailMismatch = user && user.email?.toLowerCase() !== invite.email?.toLowerCase();

  const handleAccept = () => {
    acceptMutation.mutate({ token, data: { email: invite.email } }, {
      onSuccess: (res) => {
        sessionStorage.removeItem(PENDING_INVITE_KEY);
        if (res.data?.profile) setProfile(res.data.profile);
        queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
        toast.success(invite.role === 'global_admin' ? 'Welcome to Platform Admin.' : `Welcome to ${res.data?.school?.name ?? 'the school'}!`);
        navigate('/dashboard', { replace: true });
      },
      onError: (err) => toast.error(err.message || 'Failed to accept invite'),
    });
  };

  return (
    <CenteredCard>
      <CardHeader className="text-center pb-3">
        <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
          <School className="w-6 h-6 text-primary" />
        </div>
        <CardTitle className="text-xl">
          {invite.role === 'global_admin'
            ? 'You are invited as a Platform Admin'
            : `You're invited to join ${invite.school?.name ?? 'a school'}`}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2 p-3 rounded-lg bg-secondary/50 text-sm">
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
            <span className="text-muted-foreground">For:</span>
            <span className="font-medium truncate">{invite.email}</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-muted-foreground shrink-0" />
            <span className="text-muted-foreground">Role:</span>
            <span className="font-medium capitalize">
              {invite.role === 'global_admin' ? 'Platform Admin' : invite.role === 'school_admin' ? 'School Admin' : 'Staff'}
            </span>
          </div>
          {invite.expiresAt && (
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="text-muted-foreground">Expires:</span>
              <span className="font-medium">{new Date(invite.expiresAt).toLocaleDateString()}</span>
            </div>
          )}
        </div>

        {!user ? (
          <div className="space-y-3">
            <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 text-sm text-center">
              <p className="font-medium">New here? No worries!</p>
              <p className="text-muted-foreground mt-1">
                Create an account with <strong>{invite.email}</strong> to join the team.
              </p>
            </div>
            <Button onClick={() => {
              sessionStorage.setItem('dojo:inviteEmail', invite.email);
              sessionStorage.setItem('dojo:inviteMode', 'signup');
              navigate('/login');
            }} className="w-full" size="lg">
              Create account & join
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              Already have an account?{' '}
              <button onClick={() => {
                sessionStorage.setItem('dojo:inviteEmail', invite.email);
                sessionStorage.setItem('dojo:inviteMode', 'signin');
                navigate('/login');
              }} className="text-primary underline underline-offset-2">
                Sign in instead
              </button>
            </p>
          </div>
        ) : emailMismatch ? (
          <div className="flex items-start gap-3 p-3 rounded-lg bg-red-500/5 border border-red-500/20">
            <ShieldAlert className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium">Email mismatch</p>
              <p className="text-muted-foreground mt-1">
                You're signed in as <strong>{user.email}</strong>, but this invite is for <strong>{invite.email}</strong>.
                Sign out and sign in with the correct email.
              </p>
            </div>
          </div>
        ) : (
          <Button onClick={handleAccept} disabled={acceptMutation.isPending} className="w-full gap-2" size="lg">
            {acceptMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            Accept invite
          </Button>
        )}
      </CardContent>
    </CenteredCard>
  );
}
