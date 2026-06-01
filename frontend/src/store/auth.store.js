import { create } from 'zustand';

export const useAuthStore = create((set) => ({
  user:        null,
  session:     null,
  token:       null,
  profile:     null,  // full user profile from /api/auth/me (includes role, school, schoolId)
  initialized: false,
  profileLoading: false,

  setSession: (session) => set({
    session,
    user:  session?.user  ?? null,
    token: session?.access_token ?? null,
  }),

  setProfile: (profile) => set({ profile }),

  setProfileLoading: (profileLoading) => set({ profileLoading }),

  setInitialized: () => set({ initialized: true }),

  clear: () => set({ user: null, session: null, token: null, profile: null, profileLoading: false }),
}));
