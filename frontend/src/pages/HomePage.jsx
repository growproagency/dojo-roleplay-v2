import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export function HomePage() {
  const { user, initialized } = useAuth();
  if (!initialized) return null;
  return <Navigate to={user ? '/dashboard' : '/login'} replace />;
}
