import { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Link,
  Alert,
  CircularProgress,
} from '@mui/material';
import { ArrowBack, Email } from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { APP_NAME } from '../../../shared/utils/constants';
import { httpClient } from '../../../infrastructure/api/httpClient';

const forgotPasswordSchema = z.object({
  email: z.string().email('Email inválido').min(1, 'Email requerido'),
});

type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;

export const ForgotPasswordPage = () => {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordForm) => {
    setLoading(true);
    try {
      await httpClient.post('/auth/forgot-password', { email: data.email });
      setSubmitted(true);
    } catch {
      // Por seguridad, siempre mostramos éxito aunque el email no exista
      setSubmitted(true);
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
                Recuperar contraseña
              </Typography>
            </Box>

            {submitted ? (
              <Alert severity="success" sx={{ mb: 3 }}>
                Si el correo está registrado en el sistema, recibirás una 
                <strong> contraseña temporal</strong> para acceder. Recuerda cambiarla 
                desde tu perfil después de iniciar sesión.
              </Alert>
            ) : (
              <>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Ingresa tu correo electrónico y te enviaremos una contraseña 
                  temporal para que puedas acceder al sistema.
                </Typography>

                <form onSubmit={handleSubmit(onSubmit)}>
                  <TextField
                    {...register('email')}
                    fullWidth
                    label="Correo electrónico"
                    type="email"
                    error={!!errors.email}
                    helperText={errors.email?.message}
                    sx={{ mb: 3 }}
                    autoComplete="email"
                  />

                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    size="large"
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <Email />}
                  >
                    {loading ? 'Enviando...' : 'Enviar contraseña temporal'}
                  </Button>
                </form>
              </>
            )}

            <Box sx={{ mt: 3, textAlign: 'center' }}>
              <Link
                component={RouterLink}
                to="/login"
                variant="body2"
                underline="hover"
                sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}
              >
                <ArrowBack fontSize="small" />
                Volver al login
              </Link>
            </Box>
          </CardContent>
        </Card>
      </motion.div>
    </Box>
  );
};
