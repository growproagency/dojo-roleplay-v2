import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { authApi } from '../api/auth.api';
import { useAuthStore } from '../store/auth.store';

export const useAuth = () => {
  const user        = useAuthStore((s) => s.user);
  const token       = useAuthStore((s) => s.token);
  const profile     = useAuthStore((s) => s.profile);
  const initialized = useAuthStore((s) => s.initialized);
  const profileLoading = useAuthStore((s) => s.profileLoading);
  const clear       = useAuthStore((s) => s.clear);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError]         = useState(null);

  const signIn = async ({ email, password }) => {
    setIsLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
    if (error) setError(error.message);
    setIsLoading(false);
    return !error;
  };

  const signUp = async ({ email, password }) => {
    setIsLoading(true);
    setError(null);
    const { error } = await supabase.auth.signUp({ email: email.trim().toLowerCase(), password });
    if (error) setError(error.message);
    setIsLoading(false);
    return !error;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    clear();
  };

  const resetPassword = async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: `${window.location.origin}/update-password`,
    });
    if (error) throw error;
  };

  const updatePassword = async (password) => {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw error;
  };

  return {
    user,
    token,
    profile,
    initialized,
    profileLoading,
    isLoading,
    error,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
    isLoggedIn: !!user,
    role: profile?.role ?? null,
    isGlobalAdmin: profile?.role === 'global_admin' || profile?.role === 'admin',
    isSchoolAdmin: profile?.role === 'school_admin' || profile?.role === 'global_admin' || profile?.role === 'admin',
  };
};

export function useUpdateProfile() {
  const qc = useQueryClient();
  const setProfile = useAuthStore((s) => s.setProfile);

  return useMutation({
    mutationFn: (data) => authApi.updateMe(data),
    onSuccess: async (res) => {
      if (res.data) setProfile(res.data);
      await qc.invalidateQueries({ queryKey: ['auth', 'me'] });
    },
  });
}
