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
import { Payment, CheckCircle, Lock } from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import { useSnackbar } from 'notistack';
import { Siniestro } from '../../../domain/types/siniestro';
import { EstadoPago, EstadoSiniestro, EstadoFirma } from '../../../domain/enums/estados';
import { FileDropzone } from '../../../shared/components/FileDropzone';
import { useRegistrarPagoYNotificar, useUpdateSiniestro } from '../../../infrastructure/queries/siniestros.queries';
import { formatDate, formatCurrency } from '../../../infrastructure/api/mappers';
import { ConfirmDialog } from '../../../shared/components/ConfirmDialog';

interface PagosSectionProps {
  siniestro: Siniestro;
  readOnly?: boolean;
}

interface PagoForm {
  fechaPago: string;
  docContable: string;
  obsFinanzas: string;
}

export const PagosSection = ({ siniestro, readOnly = false }: PagosSectionProps) => {
  const { enqueueSnackbar } = useSnackbar();
  const [comprobanteFile, setComprobanteFile] = useState<File[]>([]);
  const [cerrarDialogOpen, setCerrarDialogOpen] = useState(false);

  const registrarPago = useRegistrarPagoYNotificar();
  const updateSiniestro = useUpdateSiniestro();
  
  // Nota: readOnly se usa para control de UI

  // Helper para formatear fecha al formato YYYY-MM-DD para input type="date"
  const formatDateForInput = (date: string | Date | null | undefined): string => {
    if (!date) return '';
    try {
      const d = new Date(date);
      if (isNaN(d.getTime())) return '';
      return d.toISOString().split('T')[0];
    } catch {
      return '';
    }
  };

  const { register, handleSubmit } = useForm<PagoForm>({
    defaultValues: {
      // Si no hay fecha de pago, usar la fecha de liquidación como default
      fechaPago: formatDateForInput(siniestro.pago?.fechaPago || siniestro.liquidacion?.fechaLiquidacion),
      docContable: siniestro.pago?.docContable || '',
      obsFinanzas: siniestro.pago?.obsFinanzas || '',
    },
  });

  const onSubmit = async (data: PagoForm) => {
    try {
      const result = await registrarPago.mutateAsync({
        siniestroId: siniestro.id,
        data: {
          fechaPago: data.fechaPago,
          docContable: data.docContable,
          obsFinanzas: data.obsFinanzas,
        },
        comprobante: comprobanteFile[0],
      });
      
      // Mostrar resultado de notificaciones
      if (result.beneficiariosNotificados > 0) {
        enqueueSnackbar(
          `Pago registrado y comprobante enviado a ${result.beneficiariosNotificados} beneficiario(s)`,
          { variant: 'success' }
        );
      } else {
        enqueueSnackbar('Pago registrado. No hay beneficiarios con email para notificar.', { variant: 'info' });
      }
      setComprobanteFile([]);
    } catch {
      enqueueSnackbar('Error al registrar el pago', { variant: 'error' });
    }
  };

  const handleCerrarCaso = async () => {
    try {
      await updateSiniestro.mutateAsync({
        id: siniestro.id,
        data: { estado: EstadoSiniestro.CERRADO },
      });
      enqueueSnackbar('Caso cerrado exitosamente', { variant: 'success' });
      setCerrarDialogOpen(false);
    } catch {
      enqueueSnackbar('Error al cerrar el caso', { variant: 'error' });
    }
  };

  // El pago está ejecutado SOLO si existe un registro de pago con estado EJECUTADO
  const isPagoEjecutado = siniestro.pago?.estadoPago === EstadoPago.EJECUTADO || 
                          siniestro.pago?.estado === 'EJECUTADO';
  const isCasoCerrado = siniestro.estado === EstadoSiniestro.CERRADO;
  
  // Verificar si todas las firmas de beneficiarios están recibidas
  const allFirmasRecibidas = siniestro.beneficiarios.length > 0 &&
    siniestro.beneficiarios.every(b => b.estadoFirma === EstadoFirma.RECIBIDA);

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Registro de Pago y Cierre
      </Typography>

      {isCasoCerrado && (
        <Alert severity="success" sx={{ mb: 3 }} icon={<Lock />}>
          Este caso ha sido cerrado. No se permiten más modificaciones.
        </Alert>
      )}

      <Grid container spacing={3} alignItems="stretch">
        {/* Información de liquidación firmada */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card variant="outlined" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ flex: 1 }}>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                Recepción de Liquidación Firmada
              </Typography>
              <Divider sx={{ mb: 2 }} />

              {allFirmasRecibidas ? (
                <Box sx={{ mb: 2 }}>
                  <Alert severity="success" sx={{ mb: 2 }}>
                    ✅ Todas las firmas de beneficiarios han sido recibidas ({siniestro.beneficiarios.length} de {siniestro.beneficiarios.length})
                  </Alert>
                  {siniestro.pago?.fechaFirmaRecibida && (
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Fecha de recepción
                      </Typography>
                      <Typography>{formatDate(siniestro.pago.fechaFirmaRecibida)}</Typography>
                    </Box>
                  )}
                </Box>
              ) : (
                <Alert severity="warning">
                  ⏳ Esperando firmas: {siniestro.beneficiarios.filter(b => b.estadoFirma === EstadoFirma.RECIBIDA).length} de {siniestro.beneficiarios.length} beneficiarios han firmado.
                </Alert>
              )}

              {siniestro.liquidacion?.montoLiquidado && (
                <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Monto a pagar
                  </Typography>
                  <Typography variant="h5" color="primary" fontWeight={700}>
                    {formatCurrency(siniestro.liquidacion.montoLiquidado)}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Registro de pago */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card variant="outlined" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ flex: 1 }}>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                Registro de Pago
              </Typography>
              <Divider sx={{ mb: 2 }} />

              {isPagoEjecutado ? (
                <Box>
                  <Chip
                    icon={<CheckCircle />}
                    label="Pago ejecutado"
                    color="success"
                    sx={{ mb: 2 }}
                  />
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Fecha de pago
                    </Typography>
                    <Typography>
                      {formatDate(siniestro.pago?.fechaPago || siniestro.liquidacion?.fechaLiquidacion || '')}
                    </Typography>
                  </Box>
                  {siniestro.pago?.docContable && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        Documento contable
                      </Typography>
                      <Typography>{siniestro.pago.docContable}</Typography>
                    </Box>
                  )}
                </Box>
              ) : (
                <form onSubmit={handleSubmit(onSubmit)}>
                  <TextField
                    {...register('fechaPago')}
                    fullWidth
                    label="Fecha de pago"
                    type="date"
                    InputLabelProps={{ shrink: true }}
                    sx={{ mb: 2 }}
                    disabled={isCasoCerrado}
                  />

                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Comprobante de pago
                  </Typography>
                  <FileDropzone
                    onFilesAccepted={setComprobanteFile}
                    acceptedFiles={comprobanteFile}
                    onFileRemove={() => setComprobanteFile([])}
                    maxFiles={1}
                    disabled={isCasoCerrado}
                  />

                  <Button
                    type="submit"
                    variant="contained"
                    fullWidth
                    startIcon={registrarPago.isPending ? <CircularProgress size={20} color="inherit" /> : <Payment />}
                    sx={{ mt: 2 }}
                    disabled={isCasoCerrado || registrarPago.isPending}
                  >
                    {registrarPago.isPending ? 'Registrando y enviando...' : 'Registrar pago y notificar'}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Contabilidad */}
        <Grid size={{ xs: 12 }}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                Información Contable (Finanzas)
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    {...register('docContable')}
                    fullWidth
                    label="Número de documento contable"
                    disabled={isCasoCerrado}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    {...register('obsFinanzas')}
                    fullWidth
                    label="Observaciones de finanzas"
                    multiline
                    rows={2}
                    disabled={isCasoCerrado}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Acción de cierre */}
        {isPagoEjecutado && !isCasoCerrado && (
          <Grid size={{ xs: 12 }}>
            <Card sx={{ bgcolor: 'success.light' }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="h6" color="success.dark">
                      Proceso completado
                    </Typography>
                    <Typography variant="body2" color="success.dark">
                      El pago ha sido ejecutado. Puede proceder a cerrar el caso.
                    </Typography>
                  </Box>
                  <Button
                    variant="contained"
                    color="success"
                    startIcon={<Lock />}
                    onClick={() => setCerrarDialogOpen(true)}
                  >
                    Cerrar caso
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>

      <ConfirmDialog
        open={cerrarDialogOpen}
        title="Cerrar caso"
        message="¿Está seguro de cerrar este caso? Esta acción no se puede deshacer."
        confirmText="Cerrar caso"
        confirmColor="success"
        onConfirm={handleCerrarCaso}
        onCancel={() => setCerrarDialogOpen(false)}
        loading={updateSiniestro.isPending}
      />
    </Box>
  );
};
