import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/app/providers/AuthProvider';
import type { UserRole } from '@/types';

interface ProtectedRouteProps {
  roles?: UserRole[];
}

export function ProtectedRoute({ roles }: ProtectedRouteProps) {
  const { user } = useAuth();
  const location = useLocation();

  const fallbackPath =
    user?.role === 'teacher' ? '/teacher' : user?.role === 'student' ? '/student' : '/login';

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to={fallbackPath} replace />;
  }

  return <Outlet />;
}
