import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Box,
  Divider,
  Alert,
  CircularProgress,
  Grid,
} from '@mui/material';
import { Save, Email, Business, CheckCircle, Warning } from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { PageHeader } from '../../../shared/components/PageHeader';
import { httpClient } from '../../../infrastructure/api/httpClient';

interface ConfiguracionAseguradora {
  email: string;
  nombre: string;
}

interface SMTPStatus {
  configured: boolean;
  host?: string;
}

export const ConfiguracionPage = () => {
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<ConfiguracionAseguradora>({
    email: '',
    nombre: '',
  });
  const [smtpStatus, setSMTPStatus] = useState<SMTPStatus>({ configured: false });
  const [testingEmail, setTestingEmail] = useState(false);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const [aseguradoraRes, smtpRes] = await Promise.all([
        httpClient.get<ConfiguracionAseguradora>('/config/aseguradora'),
        httpClient.get<SMTPStatus>('/config/smtp-status'),
      ]);
      setConfig(aseguradoraRes.data);
      setSMTPStatus(smtpRes.data);
    } catch (error) {
      console.error('Error fetching config:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!config.email || !config.nombre) {
      enqueueSnackbar('Complete todos los campos', { variant: 'warning' });
      return;
    }

    setSaving(true);
    try {
      await httpClient.put('/config/aseguradora', config);
      enqueueSnackbar('Configuración guardada correctamente', { variant: 'success' });
    } catch {
      enqueueSnackbar('Error al guardar la configuración', { variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleTestEmail = async () => {
    setTestingEmail(true);
    try {
      await httpClient.post('/config/test-email');
      enqueueSnackbar('Email de prueba enviado. Revise su bandeja de entrada.', { variant: 'success' });
    } catch {
      enqueueSnackbar('Error al enviar email de prueba', { variant: 'error' });
    } finally {
      setTestingEmail(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      <PageHeader
        title="Configuración"
        subtitle="Ajustes generales del sistema"
      />

      <Grid container spacing={3}>
        {/* Configuración de Aseguradora */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Business color="primary" />
                <Typography variant="h6">Aseguradora</Typography>
              </Box>
              <Divider sx={{ mb: 3 }} />

              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Configure los datos de la aseguradora para el envío de expedientes.
              </Typography>

              <TextField
                fullWidth
                label="Nombre de la aseguradora"
                value={config.nombre}
                onChange={(e) => setConfig({ ...config, nombre: e.target.value })}
                sx={{ mb: 2 }}
                placeholder="Ej: Seguros del Ecuador S.A."
              />

              <TextField
                fullWidth
                label="Email de la aseguradora"
                type="email"
                value={config.email}
                onChange={(e) => setConfig({ ...config, email: e.target.value })}
                sx={{ mb: 3 }}
                placeholder="seguros@aseguradora.com.ec"
                helperText="Los expedientes de siniestros serán enviados a este correo"
              />

              <Button
                variant="contained"
                startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <Save />}
                onClick={handleSave}
                disabled={saving}
                fullWidth
              >
                Guardar cambios
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Estado del Email */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Email color="primary" />
                <Typography variant="h6">Configuración de Email</Typography>
              </Box>
              <Divider sx={{ mb: 3 }} />

              <Alert 
                severity={smtpStatus.configured ? 'success' : 'warning'}
                icon={smtpStatus.configured ? <CheckCircle /> : <Warning />}
                sx={{ mb: 3 }}
              >
                {smtpStatus.configured ? (
                  <>
                    <Typography variant="body2" fontWeight={600}>
                      Servidor SMTP configurado
                    </Typography>
                    <Typography variant="body2">
                      Host: {smtpStatus.host}
                    </Typography>
                  </>
                ) : (
                  <>
                    <Typography variant="body2" fontWeight={600}>
                      SMTP no configurado
                    </Typography>
                    <Typography variant="body2">
                      Los emails se registran en el log pero no se envían. 
                      Configure las variables SMTP_HOST, SMTP_USER y SMTP_PASS en el archivo .env
                    </Typography>
                  </>
                )}
              </Alert>

              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Para configurar el envío de emails (alertas, notificaciones, etc.), 
                necesita configurar un servidor SMTP en el archivo .env del backend:
              </Typography>

              <Box 
                component="pre" 
                sx={{ 
                  bgcolor: 'grey.100', 
                  p: 2, 
                  borderRadius: 1, 
                  fontSize: '0.75rem',
                  overflow: 'auto',
                  mb: 3,
                }}
              >
{`# Para Gmail
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu_correo@gmail.com
SMTP_PASS=tu_app_password

# Para Brevo (Sendinblue)
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_USER=tu_email_brevo
SMTP_PASS=tu_smtp_key

# Para Outlook/Office365
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_USER=tu_correo@outlook.com
SMTP_PASS=tu_contraseña`}
              </Box>

              <Button
                variant="outlined"
                onClick={handleTestEmail}
                disabled={!smtpStatus.configured || testingEmail}
                startIcon={testingEmail ? <CircularProgress size={20} /> : <Email />}
                fullWidth
              >
                Enviar email de prueba
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Info adicional */}
        <Grid size={{ xs: 12 }}>
          <Alert severity="info">
            <Typography variant="body2">
              <strong>Nota:</strong> Las configuraciones sensibles (credenciales SMTP, claves) 
              se manejan a través de variables de entorno en el servidor por seguridad. 
              Solo los parámetros no sensibles pueden modificarse desde esta interfaz.
            </Typography>
          </Alert>
        </Grid>
      </Grid>
    </>
  );
};
