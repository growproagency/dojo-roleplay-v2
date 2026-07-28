import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export function HomePage() {
  const { user, initialized, recoveryMode } = useAuth();
  if (!initialized) return null;
  if (recoveryMode) return <Navigate to="/update-password" replace />;
  return <Navigate to={user ? '/dashboard' : '/login'} replace />;
}
