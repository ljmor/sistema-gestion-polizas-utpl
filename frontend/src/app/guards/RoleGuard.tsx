import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../application/services/authStore';
import { Role } from '../../domain/enums/roles';
import { Box, Typography, Button } from '@mui/material';
import { Block } from '@mui/icons-material';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: Role[];
  fallbackPath?: string;
}

export const RoleGuard = ({
  children,
  allowedRoles,
  fallbackPath,
}: RoleGuardProps) => {
  const user = useAuthStore((state) => state.user);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    if (fallbackPath) {
      return <Navigate to={fallbackPath} replace />;
    }

    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          textAlign: 'center',
          p: 3,
        }}
      >
        <Block sx={{ fontSize: 64, color: 'error.main', mb: 2 }} />
        <Typography variant="h5" gutterBottom>
          Acceso no autorizado
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          No tienes permisos para acceder a esta sección.
        </Typography>
        <Button variant="contained" href="/app/dashboard">
          Volver al Dashboard
        </Button>
      </Box>
    );
  }

  return <>{children}</>;
};
