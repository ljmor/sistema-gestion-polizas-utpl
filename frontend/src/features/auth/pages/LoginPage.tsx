import { useState } from 'react';
import { useNavigate, useLocation, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Link,
  Alert,
  InputAdornment,
  IconButton,
} from '@mui/material';
import { Visibility, VisibilityOff, Login } from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useSnackbar } from 'notistack';
import { motion } from 'framer-motion';
import { useAuthStore } from '../../../application/services/authStore';
import { APP_NAME } from '../../../shared/utils/constants';

const loginSchema = z.object({
  email: z.string().email('Email inválido').min(1, 'Email requerido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
});

type LoginForm = z.infer<typeof loginSchema>;

export const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { enqueueSnackbar } = useSnackbar();
  const login = useAuthStore((state) => state.login);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const from = location.state?.from?.pathname || '/app/dashboard';

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setLoading(true);
    setError(null);

    try {
      await login(data);
      enqueueSnackbar('Bienvenido al sistema', { variant: 'success' });
      navigate(from, { replace: true });
    } catch (err: any) {
      // Extraer mensaje de error del backend o mostrar mensaje genérico
      const backendMessage = err?.response?.data?.message;
      const errorMessage = backendMessage === 'Invalid credentials' 
        ? 'Usuario y/o contraseña incorrectos'
        : backendMessage || 'Usuario y/o contraseña incorrectos';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        p: 2,
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card sx={{ maxWidth: 400, width: '100%' }}>
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Typography variant="h5" fontWeight={700} color="primary" gutterBottom>
                {APP_NAME}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Ingresa tus credenciales para acceder
              </Typography>
            </Box>

            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            <form onSubmit={handleSubmit(onSubmit)}>
              <TextField
                {...register('email')}
                fullWidth
                label="Correo electrónico"
                type="email"
                error={!!errors.email}
                helperText={errors.email?.message}
                sx={{ mb: 2 }}
                autoComplete="email"
              />

              <TextField
                {...register('password')}
                fullWidth
                label="Contraseña"
                type={showPassword ? 'text' : 'password'}
                error={!!errors.password}
                helperText={errors.password?.message}
                sx={{ mb: 3 }}
                autoComplete="current-password"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={loading}
                startIcon={<Login />}
              >
                {loading ? 'Ingresando...' : 'Ingresar'}
              </Button>
            </form>

            <Box sx={{ mt: 3, textAlign: 'center' }}>
              <Link
                component={RouterLink}
                to="/forgot-password"
                variant="body2"
                underline="hover"
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </Box>

            <Box sx={{ mt: 4, pt: 3, borderTop: 1, borderColor: 'divider' }}>
              <Typography variant="body2" color="text.secondary" align="center">
                ¿Necesitas reportar un siniestro?{' '}
                <Link component={RouterLink} to="/reporte" underline="hover">
                  Ir al portal público
                </Link>
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </motion.div>
    </Box>
  );
};
