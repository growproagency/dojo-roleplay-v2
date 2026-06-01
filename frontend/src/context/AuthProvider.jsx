import { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/auth.store';
import { apiClient } from '../api/client';

export const AuthProvider = ({ children }) => {
  const setSession     = useAuthStore((s) => s.setSession);
  const setProfile     = useAuthStore((s) => s.setProfile);
  const setProfileLoading = useAuthStore((s) => s.setProfileLoading);
  const setInitialized = useAuthStore((s) => s.setInitialized);

  const fetchProfile = async () => {
    setProfileLoading(true);
    try {
      const res = await apiClient.get('/api/auth/me');
      setProfile(res.data ?? null);
    } catch {
      setProfile(null);
    } finally {
      setProfileLoading(false);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchProfile().finally(() => setInitialized());
      else setInitialized();
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        if (session) fetchProfile().finally(() => setInitialized());
        else {
          setProfile(null);
          setProfileLoading(false);
          setInitialized();
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  return children;
};
