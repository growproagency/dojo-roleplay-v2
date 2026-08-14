import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/auth.store';

export function PasswordRecoveryGuard() {
  const recoveryMode = useAuthStore((s) => s.recoveryMode);
  const location = useLocation();

  if (recoveryMode && location.pathname !== '/update-password') {
    return <Navigate to="/update-password" replace />;
  }

  return <Outlet />;
}
