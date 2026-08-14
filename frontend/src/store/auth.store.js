import { create } from 'zustand';

const RECOVERY_STORAGE_KEY = 'dojo:passwordRecovery';

const getStoredRecoveryMode = () => {
  if (typeof window === 'undefined') return false;
  return window.localStorage.getItem(RECOVERY_STORAGE_KEY) === 'true';
};

export const useAuthStore = create((set) => ({
  user:        null,
  session:     null,
  token:       null,
  profile:     null,  // full user profile from /api/auth/me (includes role, school, schoolId)
  initialized: false,
  profileLoading: false,
  recoveryMode: getStoredRecoveryMode(),

  setSession: (session) => set({
    session,
    user:  session?.user  ?? null,
    token: session?.access_token ?? null,
  }),

  setProfile: (profile) => set({ profile }),

  setProfileLoading: (profileLoading) => set({ profileLoading }),

  setInitialized: () => set({ initialized: true }),

  setRecoveryMode: (recoveryMode) => {
    if (typeof window !== 'undefined') {
      if (recoveryMode) window.localStorage.setItem(RECOVERY_STORAGE_KEY, 'true');
      else window.localStorage.removeItem(RECOVERY_STORAGE_KEY);
    }
    set({ recoveryMode });
  },

  clear: () => {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(RECOVERY_STORAGE_KEY);
    }
    set({
      user: null,
      session: null,
      token: null,
      profile: null,
      profileLoading: false,
      recoveryMode: false,
    });
  },
}));
