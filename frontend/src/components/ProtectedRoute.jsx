// components/ProtectedRoute.jsx
// Wraps routes that require authentication.
// Redirects to /login if the user is not logged in.
// Shows a loading state while the auth session is being initialised.
//
// Usage in your router:
//   <Route element={<ProtectedRoute />}>
//     <Route path="/dashboard" element={<Dashboard />} />
//   </Route>
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/auth.store';
import { supabase } from '../lib/supabase';

function AccessDisabledScreen({ school }) {
  const reason = school?.accessStatus?.reason;
  const message = reason === 'archived'
    ? 'This school has been archived.'
    : reason === 'past_due'
      ? 'This school subscription is past due.'
      : reason === 'suspended'
        ? 'This school subscription is suspended.'
        : reason === 'canceled'
          ? 'This school subscription has been canceled.'
          : 'This school does not currently have access.';

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 text-center shadow-sm">
        <p className="text-sm font-medium text-muted-foreground">{school?.name || 'School access'}</p>
        <h1 className="mt-2 text-2xl font-semibold">Access paused</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          {message} Please contact your school administrator or billing contact to restore access.
        </p>
        <button
          type="button"
          onClick={() => supabase.auth.signOut()}
          className="mt-5 inline-flex h-10 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}

export const ProtectedRoute = ({ redirectTo = '/login' }) => {
  const user        = useAuthStore((s) => s.user);
  const initialized = useAuthStore((s) => s.initialized);
  const profile     = useAuthStore((s) => s.profile);

  // Wait for auth state to be resolved before making a decision
  if (!initialized) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        Loading...
      </div>
    );
  }

  // Not logged in → redirect to login
  if (!user) return <Navigate to={redirectTo} replace />;

  const isGlobalAdmin = profile?.role === 'global_admin' || profile?.role === 'admin';
  if (!isGlobalAdmin && profile?.school?.accessStatus?.allowed === false) {
    return <AccessDisabledScreen school={profile.school} />;
  }

  // Logged in → render the child route
  return <Outlet />;
};
