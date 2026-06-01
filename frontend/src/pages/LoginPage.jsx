import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Loader2, School } from 'lucide-react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../store/auth.store';

export function LoginPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [inviteEmail, setInviteEmail] = useState(null);

  const pendingToken = typeof window !== 'undefined'
    ? sessionStorage.getItem('dojo:pendingInviteToken')
    : null;
  const postLoginPath = pendingToken ? `/invite/${pendingToken}` : '/dashboard';

  useEffect(() => {
    if (user) navigate(postLoginPath, { replace: true });
  }, [user]);

  useEffect(() => {
    const storedEmail = sessionStorage.getItem('dojo:inviteEmail');
    const storedMode = sessionStorage.getItem('dojo:inviteMode');
    if (storedEmail) {
      setEmail(storedEmail);
      setInviteEmail(storedEmail);
      setIsSignUp(storedMode !== 'signin');
      sessionStorage.removeItem('dojo:inviteEmail');
      sessionStorage.removeItem('dojo:inviteMode');
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSignUp && !pendingToken) {
      toast.error('Dojo Roleplay is invite-only. Please ask your school admin for an invite link.');
      return;
    }
    setLoading(true);
    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        if (data?.session) {
          queryClient.removeQueries({ queryKey: ['auth', 'me'] });
          navigate(postLoginPath, { replace: true });
        } else {
          toast.success('Check your email for a confirmation link!');
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        queryClient.removeQueries({ queryKey: ['auth', 'me'] });
        navigate(postLoginPath, { replace: true });
      }
    } catch (err) {
      toast.error(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const isFromInvite = !!inviteEmail || !!pendingToken;

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="text-center">
          {isFromInvite && isSignUp && (
            <div className="mx-auto w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-2">
              <School className="w-5 h-5 text-primary" />
            </div>
          )}
          <CardTitle className="text-2xl">
            {isSignUp ? (isFromInvite ? 'Create your account' : 'Create Account') : 'Sign In'}
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            {isSignUp
              ? isFromInvite ? 'Set up your account to join the team' : 'Sign up to start training'
              : isFromInvite ? 'Sign in to accept your invite' : 'Sign in to your training dashboard'}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                readOnly={!!inviteEmail}
                className={inviteEmail ? 'opacity-70' : ''}
              />
              {inviteEmail && (
                <p className="text-xs text-muted-foreground">
                  This email was set by your invite. Use this exact email to join.
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{isSignUp ? 'Create a password' : 'Password'}</Label>
              <Input
                id="password"
                type="password"
                placeholder={isSignUp ? 'At least 6 characters' : 'Your password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                autoFocus={!!inviteEmail}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isSignUp
                ? isFromInvite ? 'Create account & continue' : 'Sign Up'
                : isFromInvite ? 'Sign in & continue' : 'Sign In'}
            </Button>
          </form>

          {isFromInvite ? (
            <p className="text-center text-sm text-muted-foreground">
              {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
              <button
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-primary hover:underline font-medium"
              >
                {isSignUp ? 'Sign in' : 'Sign up'}
              </button>
            </p>
          ) : (
            <p className="text-center text-xs text-muted-foreground">
              Dojo Roleplay is invite-only. Contact your school admin for an invite link.
            </p>
          )}

          {!isSignUp && (
            <p className="text-center text-xs">
              <button
                onClick={() => navigate('/reset-password')}
                className="text-muted-foreground hover:text-foreground underline underline-offset-2"
              >
                Forgot password?
              </button>
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
