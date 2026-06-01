// store/ui.store.js
// Global UI state — things that need to be shared across the component tree
// but don't belong in the server (no API calls, no persistence needed).
//
// Covers: toast notifications, sidebar state, modal state.
// Add more fields as your app grows.
import { create } from 'zustand';

export const useUIStore = create((set) => ({
  // ── Sidebar ──────────────────────────────────────────────────────────────
  sidebarOpen: true,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),

  // ── Global admin school switcher ──────────────────────────────────────────
  // When set, API calls include x-viewing-school-id header
  viewingSchoolId: null,
  setViewingSchoolId: (id) => set({ viewingSchoolId: id }),

  // ── Toast notifications ───────────────────────────────────────────────────
  toasts: [],
  addToast: (message, type = 'info') =>
    set((s) => ({
      toasts: [...s.toasts, { id: Date.now(), message, type }],
    })),
  removeToast: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));
