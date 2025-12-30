import { useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  TextField,
  Button,
  Chip,
  Divider,
  Alert,
  CircularProgress,
} from '@mui/material';
import { Send, Upload, CloudDownload, ArrowForward, Email, CheckCircle, Visibility, Download, Lock } from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import { useSnackbar } from 'notistack';
import { Siniestro } from '../../../domain/types/siniestro';
import { EstadoLiquidacion } from '../../../domain/enums/estados';
import { FileDropzone } from '../../../shared/components/FileDropzone';
import { 
  useRegistrarLiquidacion, 
  useUpdateSiniestro,
  useEnviarExpedienteAseguradora,
  useAseguradoraConfig,
  useEnviarLiquidacionBeneficiarios,
} from '../../../infrastructure/queries/siniestros.queries';
import { formatDate, formatCurrency } from '../../../infrastructure/api/mappers';

interface LiquidacionSectionProps {
  siniestro: Siniestro;
}

interface LiquidacionForm {
  fechaLiquidacion: string;
  montoLiquidado: number;
  notasAseguradora: string;
}

const estadoColors: Record<string, 'warning' | 'info' | 'success' | 'default'> = {
  [EstadoLiquidacion.ENVIADO]: 'warning',
  [EstadoLiquidacion.OBSERVADO]: 'info',
  [EstadoLiquidacion.APROBADO]: 'success',
  'EN_ESPERA': 'default',
};

const estadoLabels: Record<string, string> = {
  [EstadoLiquidacion.ENVIADO]: 'Enviado a aseguradora',
  [EstadoLiquidacion.OBSERVADO]: 'Observado',
  [EstadoLiquidacion.APROBADO]: 'Aprobada',
  'EN_ESPERA': 'En espera de respuesta',
};

export const LiquidacionSection = ({ siniestro }: LiquidacionSectionProps) => {
  const { enqueueSnackbar } = useSnackbar();
  const [expedienteFile, setExpedienteFile] = useState<File[]>([]);
  const [liquidacionFile, setLiquidacionFile] = useState<File[]>([]);

  const registrarLiquidacion = useRegistrarLiquidacion();
  const updateSiniestro = useUpdateSiniestro();
  const enviarExpediente = useEnviarExpedienteAseguradora();
  const enviarLiquidacion = useEnviarLiquidacionBeneficiarios();
  const { data: aseguradoraConfig, isLoading: loadingConfig } = useAseguradoraConfig();

  // Determinar estado de liquidación
  const fueEnviadoAseguradora = !!siniestro.liquidacion?.fechaEnvioAseguradora;
  const estadoActual = siniestro.liquidacion?.estado || (fueEnviadoAseguradora ? 'EN_ESPERA' : null);
  const isAprobado = siniestro.liquidacion?.estado === EstadoLiquidacion.APROBADO;
  const tieneRespuestaAseguradora = !!siniestro.liquidacion?.fechaLiquidacion && !!siniestro.liquidacion?.montoLiquidado;
  
  // Función para ver documentos
  const handleViewDocument = (url: string | undefined) => {
    if (url) {
      const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const fullUrl = url.startsWith('http') ? url : `${backendUrl}${url.startsWith('/') ? url : `/${url}`}`;
      window.open(fullUrl, '_blank');
    } else {
      enqueueSnackbar('Documento no disponible', { variant: 'warning' });
    }
  };

  // Función para marcar como aprobada
  const handleMarcarAprobada = async () => {
    try {
      await registrarLiquidacion.mutateAsync({
        siniestroId: siniestro.id,
        data: {
          estado: EstadoLiquidacion.APROBADO,
        },
      });
      enqueueSnackbar('Liquidación marcada como aprobada', { variant: 'success' });
    } catch {
      enqueueSnackbar('Error al aprobar la liquidación', { variant: 'error' });
    }
  };

  const { register, handleSubmit } = useForm<LiquidacionForm>({
    defaultValues: {
      fechaLiquidacion: siniestro.liquidacion?.fechaLiquidacion || '',
      montoLiquidado: siniestro.liquidacion?.montoLiquidado || 0,
      notasAseguradora: siniestro.liquidacion?.notasAseguradora || '',
    },
  });

  const handleEnviarExpediente = async () => {
    try {
      const result = await enviarExpediente.mutateAsync({
        siniestroId: siniestro.id,
        expediente: expedienteFile[0], // Enviar el archivo adjunto
      });
      
      if (result.emailEnviado) {
        const archivosMsg = result.archivosAdjuntos > 0 
          ? ` con ${result.archivosAdjuntos} archivo(s) adjunto(s)`
          : '';
        enqueueSnackbar(
          `Expediente enviado exitosamente a ${result.aseguradoraEmail}${archivosMsg}`, 
          { variant: 'success' }
        );
      } else {
        enqueueSnackbar(
          'Expediente registrado. El correo no pudo enviarse (verifique configuración SMTP)',
          { variant: 'warning' }
        );
      }
      setExpedienteFile([]);
    } catch {
      enqueueSnackbar('Error al enviar el expediente', { variant: 'error' });
    }
  };

  const onSubmitLiquidacion = async (data: LiquidacionForm) => {
    try {
      await registrarLiquidacion.mutateAsync({
        siniestroId: siniestro.id,
        data: {
          fechaLiquidacion: data.fechaLiquidacion,
          montoLiquidado: data.montoLiquidado,
          notasAseguradora: data.notasAseguradora,
        },
        file: liquidacionFile[0],
      });
      enqueueSnackbar('Liquidación registrada correctamente', { variant: 'success' });
      setLiquidacionFile([]);
    } catch {
      enqueueSnackbar('Error al registrar la liquidación', { variant: 'error' });
    }
  };

  const handleEnviarBeneficiarios = async () => {
    try {
      const result = await enviarLiquidacion.mutateAsync({
        siniestroId: siniestro.id,
        comprobante: liquidacionFile[0], // Adjuntar comprobante si existe
      });
      
      const exitosos = result.resultados.filter(r => r.enviado).length;
      const montoFormateado = result.montoTotal.toLocaleString('es-EC', { minimumFractionDigits: 2 });
      
      enqueueSnackbar(
        `Liquidación ($${montoFormateado}) enviada a ${exitosos} de ${result.beneficiariosNotificados} beneficiario(s)${result.comprobanteAdjunto ? ' con comprobante adjunto' : ''}`, 
        { variant: 'success' }
      );
      
      // Limpiar archivo de liquidación después de enviar
      setLiquidacionFile([]);
    } catch {
      enqueueSnackbar('Error al enviar liquidación a beneficiarios', { variant: 'error' });
    }
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Gestión de Liquidación
      </Typography>

      <Grid container spacing={3} alignItems="stretch">
        {/* Envío a aseguradora */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card variant="outlined" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ flex: 1 }}>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                Envío a Aseguradora
              </Typography>
              <Divider sx={{ mb: 2 }} />

              {fueEnviadoAseguradora ? (
                <Box sx={{ mb: 2 }}>
                  <Alert severity="success" sx={{ mb: 2 }}>
                    ✅ Expediente enviado exitosamente
                  </Alert>
                  <Typography variant="body2" color="text.secondary">
                    Fecha de envío
                  </Typography>
                  <Typography>
                    {formatDate(siniestro.liquidacion?.fechaEnvioAseguradora || '')}
                  </Typography>
                </Box>
              ) : (
                <Alert severity="info" sx={{ mb: 2 }}>
                  El expediente aún no ha sido enviado a la aseguradora.
                </Alert>
              )}

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Estado
                </Typography>
                <Chip
                  icon={isAprobado ? <CheckCircle /> : undefined}
                  label={estadoActual ? estadoLabels[estadoActual] || estadoActual : 'Pendiente de envío'}
                  color={estadoActual ? estadoColors[estadoActual] || 'default' : 'default'}
                />
              </Box>

              {!fueEnviadoAseguradora && (
                <>
                  {/* Mostrar email de destino */}
                  <Alert 
                    severity="info" 
                    icon={<Email />}
                    sx={{ mb: 2 }}
                  >
                    <Typography variant="body2">
                      El expediente será enviado a:
                    </Typography>
                    <Typography variant="subtitle2" fontWeight={600}>
                      {loadingConfig ? (
                        <CircularProgress size={14} sx={{ mr: 1 }} />
                      ) : (
                        aseguradoraConfig?.email || 'No configurado'
                      )}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      ({aseguradoraConfig?.nombre || 'Aseguradora'})
                    </Typography>
                  </Alert>

                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Adjuntar expediente (ZIP/PDF) - opcional
                  </Typography>
                  <FileDropzone
                    onFilesAccepted={setExpedienteFile}
                    acceptedFiles={expedienteFile}
                    onFileRemove={() => setExpedienteFile([])}
                    maxFiles={1}
                  />
                  <Button
                    variant="contained"
                    fullWidth
                    startIcon={enviarExpediente.isPending ? <CircularProgress size={20} color="inherit" /> : <Send />}
                    sx={{ mt: 2 }}
                    onClick={handleEnviarExpediente}
                    disabled={enviarExpediente.isPending}
                  >
                    {enviarExpediente.isPending ? 'Enviando...' : 'Enviar a aseguradora'}
                  </Button>
                </>
              )}

              {siniestro.liquidacion?.expedienteUrl && (
                <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                  <Button
                    variant="outlined"
                    startIcon={<Visibility />}
                    onClick={() => handleViewDocument(siniestro.liquidacion?.expedienteUrl)}
                  >
                    Ver expediente
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<Download />}
                    onClick={() => handleViewDocument(siniestro.liquidacion?.expedienteUrl)}
                  >
                    Descargar
                  </Button>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Respuesta de aseguradora */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card variant="outlined" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ flex: 1 }}>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                Respuesta de Aseguradora
              </Typography>
              <Divider sx={{ mb: 2 }} />

              {isAprobado && (
                <Alert severity="success" icon={<Lock />} sx={{ mb: 2 }}>
                  Liquidación aprobada. No se permiten más cambios.
                </Alert>
              )}

              {tieneRespuestaAseguradora && !isAprobado && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  ✅ Respuesta de aseguradora registrada. Puede marcarla como aprobada.
                </Alert>
              )}

              <form onSubmit={handleSubmit(onSubmitLiquidacion)}>
                <TextField
                  {...register('fechaLiquidacion')}
                  fullWidth
                  label="Fecha de liquidación"
                  type="date"
                  InputLabelProps={{ shrink: true }}
                  sx={{ mb: 2 }}
                  disabled={isAprobado || tieneRespuestaAseguradora}
                />

                <TextField
                  {...register('montoLiquidado', { valueAsNumber: true })}
                  fullWidth
                  label="Monto liquidado"
                  type="number"
                  InputProps={{ startAdornment: '$' }}
                  sx={{ mb: 2 }}
                  disabled={isAprobado || tieneRespuestaAseguradora}
                />

                <TextField
                  {...register('notasAseguradora')}
                  fullWidth
                  label="Notas de la aseguradora"
                  multiline
                  rows={3}
                  sx={{ mb: 2 }}
                  disabled={isAprobado || tieneRespuestaAseguradora}
                />

                {!isAprobado && !tieneRespuestaAseguradora && (
                  <>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Adjuntar documento de liquidación
                    </Typography>
                    <FileDropzone
                      onFilesAccepted={setLiquidacionFile}
                      acceptedFiles={liquidacionFile}
                      onFileRemove={() => setLiquidacionFile([])}
                      maxFiles={1}
                    />

                    <Button
                      type="submit"
                      variant="contained"
                      fullWidth
                      startIcon={registrarLiquidacion.isPending ? <CircularProgress size={20} color="inherit" /> : <Upload />}
                      sx={{ mt: 2 }}
                      disabled={registrarLiquidacion.isPending}
                    >
                      {registrarLiquidacion.isPending ? 'Registrando...' : 'Registrar liquidación'}
                    </Button>
                  </>
                )}

                {/* Botón para marcar como aprobada - solo visible si hay respuesta y no está aprobada */}
                {tieneRespuestaAseguradora && !isAprobado && (
                  <Button
                    variant="contained"
                    color="success"
                    fullWidth
                    startIcon={<CheckCircle />}
                    sx={{ mt: 2 }}
                    onClick={handleMarcarAprobada}
                    disabled={registrarLiquidacion.isPending}
                  >
                    Marcar como aprobada
                  </Button>
                )}

                {/* Ver documento de liquidación si existe */}
                {siniestro.liquidacion?.liquidacionUrl && (
                  <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                    <Button
                      variant="outlined"
                      startIcon={<Visibility />}
                      onClick={() => handleViewDocument(siniestro.liquidacion?.liquidacionUrl)}
                    >
                      Ver liquidación
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<Download />}
                      onClick={() => handleViewDocument(siniestro.liquidacion?.liquidacionUrl)}
                    >
                      Descargar
                    </Button>
                  </Box>
                )}
              </form>
            </CardContent>
          </Card>
        </Grid>

        {/* Resumen y acciones */}
        {siniestro.liquidacion?.montoLiquidado && (
          <Grid size={{ xs: 12 }}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                  <Box>
                    <Typography variant="subtitle1">Monto a pagar</Typography>
                    <Typography variant="h4" color="primary" fontWeight={700}>
                      {formatCurrency(siniestro.liquidacion.montoLiquidado)}
                    </Typography>
                  </Box>
                  <Button
                    variant="contained"
                    startIcon={enviarLiquidacion.isPending ? <CircularProgress size={20} color="inherit" /> : undefined}
                    endIcon={!enviarLiquidacion.isPending ? <ArrowForward /> : undefined}
                    onClick={handleEnviarBeneficiarios}
                    disabled={enviarLiquidacion.isPending || siniestro.liquidacion.estado === EstadoLiquidacion.APROBADO}
                  >
                    {enviarLiquidacion.isPending ? 'Enviando notificaciones...' : 'Enviar a beneficiarios'}
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};
