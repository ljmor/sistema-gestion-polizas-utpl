import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../application/services/authStore';
import { LoadingState } from '../../shared/components/LoadingState';

interface AuthGuardProps {
  children: React.ReactNode;
}

export const AuthGuard = ({ children }: AuthGuardProps) => {
  const { isAuthenticated, isLoading } = useAuthStore();
  const location = useLocation();

  if (isLoading) {
    return <LoadingState fullScreen message="Verificando sesión..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};
