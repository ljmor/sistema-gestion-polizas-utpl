import { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Box,
  Divider,
  Avatar,
  Grid,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton,
} from '@mui/material';
import { 
  Save, 
  Person, 
  Email, 
  Lock, 
  Visibility, 
  VisibilityOff,
  Security,
} from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useSnackbar } from 'notistack';
import { PageHeader } from '../../../shared/components/PageHeader';
import { useAuthStore } from '../../../application/services/authStore';
import { httpClient } from '../../../infrastructure/api/httpClient';

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Ingrese su contraseña actual'),
  newPassword: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
});

type ChangePasswordForm = z.infer<typeof changePasswordSchema>;

export const PerfilPage = () => {
  const { enqueueSnackbar } = useSnackbar();
  const { user } = useAuthStore();
  const [changingPassword, setChangingPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordForm>({
    resolver: zodResolver(changePasswordSchema),
  });

  const onChangePassword = async (data: ChangePasswordForm) => {
    setChangingPassword(true);
    try {
      await httpClient.post('/auth/change-password', {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      enqueueSnackbar('Contraseña actualizada correctamente', { variant: 'success' });
      reset();
    } catch (error: any) {
      const message = error.response?.data?.message || 'Error al cambiar la contraseña';
      enqueueSnackbar(message, { variant: 'error' });
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Mi Perfil"
        subtitle="Información de tu cuenta"
      />

      <Grid container spacing={3}>
        {/* Información del usuario */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Person color="primary" />
                <Typography variant="h6">Información Personal</Typography>
              </Box>
              <Divider sx={{ mb: 3 }} />

              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 4 }}>
                <Avatar
                  sx={{
                    width: 100,
                    height: 100,
                    bgcolor: 'primary.main',
                    fontSize: '2.5rem',
                    mb: 2,
                  }}
                >
                  {user?.name?.charAt(0) || 'G'}
                </Avatar>
                <Typography variant="h5" fontWeight={600}>
                  {user?.name || 'Gestor UTPL'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Gestor de Pólizas y Siniestros
                </Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" color="text.secondary">
                  Correo electrónico
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Email fontSize="small" color="action" />
                  <Typography>{user?.email || 'gestor@utpl.edu.ec'}</Typography>
                </Box>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" color="text.secondary">
                  Rol
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Security fontSize="small" color="action" />
                  <Typography>Gestor UTPL</Typography>
                </Box>
              </Box>

              <Alert severity="info" sx={{ mt: 3 }}>
                <Typography variant="body2">
                  Para cambiar el correo electrónico o nombre de usuario, contacte al administrador del sistema.
                </Typography>
              </Alert>
            </CardContent>
          </Card>
        </Grid>

        {/* Cambiar contraseña */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Lock color="primary" />
                <Typography variant="h6">Cambiar Contraseña</Typography>
              </Box>
              <Divider sx={{ mb: 3 }} />

              <form onSubmit={handleSubmit(onChangePassword)}>
                <TextField
                  {...register('currentPassword')}
                  fullWidth
                  label="Contraseña actual"
                  type={showCurrentPassword ? 'text' : 'password'}
                  error={!!errors.currentPassword}
                  helperText={errors.currentPassword?.message}
                  sx={{ mb: 2 }}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          edge="end"
                        >
                          {showCurrentPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />

                <TextField
                  {...register('newPassword')}
                  fullWidth
                  label="Nueva contraseña"
                  type={showNewPassword ? 'text' : 'password'}
                  error={!!errors.newPassword}
                  helperText={errors.newPassword?.message}
                  sx={{ mb: 2 }}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          edge="end"
                        >
                          {showNewPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />

                <TextField
                  {...register('confirmPassword')}
                  fullWidth
                  label="Confirmar nueva contraseña"
                  type="password"
                  error={!!errors.confirmPassword}
                  helperText={errors.confirmPassword?.message}
                  sx={{ mb: 3 }}
                />

                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  disabled={changingPassword}
                  startIcon={changingPassword ? <CircularProgress size={20} color="inherit" /> : <Save />}
                >
                  Actualizar contraseña
                </Button>
              </form>

              <Alert severity="warning" sx={{ mt: 3 }}>
                <Typography variant="body2">
                  Después de cambiar la contraseña, deberá iniciar sesión nuevamente.
                </Typography>
              </Alert>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </>
  );
};
