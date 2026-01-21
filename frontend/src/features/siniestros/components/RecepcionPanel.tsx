import { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  TextField,
  MenuItem,
  Typography,
  Button,
  Divider,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Autocomplete,
  CircularProgress,
} from '@mui/material';
import { Save, ArrowForward, Block, Edit } from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { Siniestro } from '../../../domain/types/siniestro';
import { TipoSiniestro, EstadoSiniestro } from '../../../domain/enums/estados';
import { GRUPOS_ASEGURADOS } from '../../../shared/utils/constants';
import { formatDate } from '../../../shared/utils/dates';
import { useUpdateSiniestro, useMarcarInvalido } from '../../../infrastructure/queries/siniestros.queries';
import { usePolizas } from '../../../infrastructure/queries/polizas.queries';
import { useSnackbar } from 'notistack';

interface RecepcionPanelProps {
  siniestro: Siniestro;
  readOnly?: boolean;
}

interface RecepcionForm {
  tipo: TipoSiniestro;
  polizaId: string;
  grupoAsegurado: string;
  observaciones: string;
  fechaDefuncion: string;
  fallecidoNombre: string;
  fallecidoCedula: string;
}

const MOTIVOS_INVALIDACION = [
  'Reporte duplicado',
  'No es estudiante matriculado de UTPL',
  'Información falsa o fraudulenta',
  'Spam o reporte de prueba',
  'Fallecimiento anterior a la vigencia de la póliza',
  'No cumple requisitos de cobertura',
  'Otro (especificar)',
];

export const RecepcionPanel = ({ siniestro, readOnly = false }: RecepcionPanelProps) => {
  const { enqueueSnackbar } = useSnackbar();
  const updateSiniestro = useUpdateSiniestro();
  const marcarInvalido = useMarcarInvalido();
  const { data: polizas, isLoading: loadingPolizas } = usePolizas();
  const [isEditing, setIsEditing] = useState(false);
  const [selectedPoliza, setSelectedPoliza] = useState<any>(null);
  
  // Determinar si el caso está bloqueado
  const isLocked = readOnly || siniestro.estado === EstadoSiniestro.INVALIDO || siniestro.estado === EstadoSiniestro.CERRADO;
  const [invalidDialogOpen, setInvalidDialogOpen] = useState(false);
  const [motivoInvalidacion, setMotivoInvalidacion] = useState('');
  const [motivoOtro, setMotivoOtro] = useState('');

  // Obtener fecha de defunción en formato YYYY-MM-DD (usar campo directo del siniestro primero)
  const fechaDefuncionRaw = siniestro.fechaDefuncion || siniestro.fallecido?.fechaDefuncion;
  const fechaDefuncionStr = fechaDefuncionRaw 
    ? new Date(fechaDefuncionRaw).toISOString().split('T')[0]
    : '';

  const { control, handleSubmit, register, setValue, watch, reset } = useForm<RecepcionForm>({
    defaultValues: {
      tipo: siniestro.tipo,
      polizaId: siniestro.polizaId || '',
      grupoAsegurado: siniestro.grupoAsegurado || '',
      observaciones: siniestro.observaciones || '',
      fechaDefuncion: fechaDefuncionStr,
      fallecidoNombre: siniestro.fallecido?.nombreCompleto || '',
      fallecidoCedula: siniestro.fallecido?.cedula || '',
    },
  });

  // Actualizar formulario cuando cambian los datos del siniestro
  useEffect(() => {
    // Usar fecha directa del siniestro primero, luego la del objeto fallecido
    const fechaRaw = siniestro.fechaDefuncion || siniestro.fallecido?.fechaDefuncion;
    const fechaDefStr = fechaRaw 
      ? new Date(fechaRaw).toISOString().split('T')[0]
      : '';
    
    reset({
      tipo: siniestro.tipo,
      polizaId: siniestro.polizaId || '',
      grupoAsegurado: siniestro.grupoAsegurado || '',
      observaciones: siniestro.observaciones || '',
      fechaDefuncion: fechaDefStr,
      fallecidoNombre: siniestro.fallecido?.nombreCompleto || '',
      fallecidoCedula: siniestro.fallecido?.cedula || '',
    });
  }, [siniestro, reset]);

  // Obtener monto de cobertura de la póliza seleccionada
  const watchPolizaId = watch('polizaId');
  useEffect(() => {
    if (polizas && watchPolizaId) {
      const poliza = polizas.find((p: any) => p.id === watchPolizaId);
      setSelectedPoliza(poliza);
    } else {
      setSelectedPoliza(null);
    }
  }, [watchPolizaId, polizas]);

  const montoCobertura = selectedPoliza?.montoCobertura || selectedPoliza?.vigenciaActual?.configJson?.cobertura || siniestro.montoCobertura;

  const onSubmit = async (data: RecepcionForm) => {
    // IMPORTANTE: Solo guardar si estamos en modo edición
    if (!isEditing) {
      console.log('onSubmit llamado pero isEditing es false, ignorando...');
      return;
    }

    try {
      // Preparar datos, asegurando que los campos vacíos se envíen como null
      const updateData: Record<string, unknown> = {
        tipo: data.tipo,
        observaciones: data.observaciones || '',
      };
      
      // Solo incluir campos que tienen valor
      if (data.polizaId && data.polizaId.trim() !== '') {
        updateData.polizaId = data.polizaId;
      }
      if (data.grupoAsegurado && data.grupoAsegurado.trim() !== '') {
        updateData.grupoAsegurado = data.grupoAsegurado;
      }
      if (data.fechaDefuncion && data.fechaDefuncion.trim() !== '') {
        updateData.fechaDefuncion = data.fechaDefuncion;
      }
      if (data.fallecidoNombre && data.fallecidoNombre.trim() !== '') {
        updateData.fallecidoNombre = data.fallecidoNombre;
      }
      if (data.fallecidoCedula && data.fallecidoCedula.trim() !== '') {
        updateData.fallecidoCedula = data.fallecidoCedula;
      }

      await updateSiniestro.mutateAsync({
        id: siniestro.id,
        data: updateData,
      });
      enqueueSnackbar('Datos guardados correctamente', { variant: 'success' });
      setIsEditing(false);
    } catch (error) {
      console.error('Error al guardar:', error);
      enqueueSnackbar('Error al guardar los datos', { variant: 'error' });
    }
  };

  // Función para manejar el clic en "Editar datos"
  const handleEditarClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsEditing(true);
  };

  const handleMarcarRecibido = async () => {
    try {
      await updateSiniestro.mutateAsync({
        id: siniestro.id,
        data: { estado: EstadoSiniestro.EN_VALIDACION },
      });
      enqueueSnackbar('Caso marcado como recibido', { variant: 'success' });
    } catch {
      enqueueSnackbar('Error al actualizar el estado', { variant: 'error' });
    }
  };

  const handleMarcarInvalido = async () => {
    const motivo = motivoInvalidacion === 'Otro (especificar)' ? motivoOtro : motivoInvalidacion;
    if (!motivo.trim()) {
      enqueueSnackbar('Debe especificar un motivo', { variant: 'warning' });
      return;
    }

    try {
      await marcarInvalido.mutateAsync({
        siniestroId: siniestro.id,
        motivo,
      });
      enqueueSnackbar('Caso marcado como inválido', { variant: 'success' });
      setInvalidDialogOpen(false);
      setMotivoInvalidacion('');
      setMotivoOtro('');
    } catch {
      enqueueSnackbar('Error al marcar como inválido', { variant: 'error' });
    }
  };

  const canMarkInvalid = !isLocked && [EstadoSiniestro.RECIBIDO, EstadoSiniestro.EN_VALIDACION].includes(siniestro.estado);

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Datos del Reporte
      </Typography>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12 }}>
            <Typography variant="subtitle2" gutterBottom color="text.secondary">
              Información del fallecido
            </Typography>
            <Divider sx={{ mb: 2 }} />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              {...register('fallecidoNombre')}
              fullWidth
              label="Nombre completo"
              disabled={!isEditing}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              {...register('fallecidoCedula')}
              fullWidth
              label="Cédula"
              disabled={!isEditing}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              {...register('fechaDefuncion')}
              fullWidth
              label="Fecha de defunción"
              type={isEditing ? 'date' : 'text'}
              InputLabelProps={{ shrink: true }}
              inputProps={{ max: new Date().toISOString().split('T')[0] }}
              disabled={!isEditing}
              value={isEditing ? watch('fechaDefuncion') : (fechaDefuncionRaw ? formatDate(fechaDefuncionRaw) : 'No registrada')}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Controller
              name="tipo"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  select
                  fullWidth
                  label="Tipo de fallecimiento"
                  disabled={!isEditing}
                  helperText="Determina las reglas de cobertura aplicables"
                >
                  <MenuItem value={TipoSiniestro.NATURAL}>Muerte Natural</MenuItem>
                  <MenuItem value={TipoSiniestro.ACCIDENTE}>Muerte por Accidente</MenuItem>
                </TextField>
              )}
            />
          </Grid>

          <Grid size={{ xs: 12 }}>
            <Typography variant="subtitle2" gutterBottom color="text.secondary" sx={{ mt: 2 }}>
              Cobertura / Póliza asociada
            </Typography>
            <Divider sx={{ mb: 2 }} />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Controller
              name="polizaId"
              control={control}
              render={({ field }) => (
                <Autocomplete
                  options={polizas || []}
                  getOptionLabel={(option: any) => option.nombre || ''}
                  value={polizas?.find((p: any) => p.id === field.value) || null}
                  onChange={(_, newValue) => {
                    field.onChange(newValue?.id || '');
                  }}
                  disabled={!isEditing}
                  loading={loadingPolizas}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Póliza"
                      placeholder="Buscar póliza..."
                      InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                          <>
                            {loadingPolizas ? <CircularProgress size={20} /> : null}
                            {params.InputProps.endAdornment}
                          </>
                        ),
                      }}
                    />
                  )}
                />
              )}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Controller
              name="grupoAsegurado"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  select
                  fullWidth
                  label="Grupo asegurado"
                  disabled={!isEditing}
                >
                  <MenuItem value="">Seleccionar...</MenuItem>
                  {GRUPOS_ASEGURADOS.map((grupo) => (
                    <MenuItem key={grupo.value} value={grupo.value}>
                      {grupo.label}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="Monto de cobertura"
              value={
                montoCobertura
                  ? `$${Number(montoCobertura).toLocaleString()}`
                  : selectedPoliza ? 'Según póliza' : 'Seleccione una póliza'
              }
              disabled
              helperText={selectedPoliza ? `Póliza: ${selectedPoliza.nombre}` : undefined}
            />
          </Grid>

          <Grid size={{ xs: 12 }}>
            <TextField
              {...register('observaciones')}
              fullWidth
              label="Observaciones"
              multiline
              rows={3}
              disabled={!isEditing}
            />
          </Grid>

          <Grid size={{ xs: 12 }}>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
              {isEditing ? (
                <>
                  <Button type="button" onClick={() => setIsEditing(false)}>Cancelar</Button>
                  <Button
                    type="submit"
                    variant="contained"
                    startIcon={<Save />}
                    disabled={updateSiniestro.isPending}
                  >
                    Guardar cambios
                  </Button>
                </>
              ) : (
                <>
                  {canMarkInvalid && (
                    <Button
                      type="button"
                      variant="outlined"
                      color="error"
                      startIcon={<Block />}
                      onClick={() => setInvalidDialogOpen(true)}
                    >
                      Marcar como inválido
                    </Button>
                  )}
                  {!isLocked && (
                    <Button 
                      type="button"
                      variant="outlined" 
                      startIcon={<Edit />}
                      onClick={handleEditarClick}
                    >
                      Editar datos
                    </Button>
                  )}
                  {!isLocked && siniestro.estado === EstadoSiniestro.RECIBIDO && (
                    <Button
                      type="button"
                      variant="contained"
                      endIcon={<ArrowForward />}
                      onClick={handleMarcarRecibido}
                      disabled={updateSiniestro.isPending}
                    >
                      Marcar como recibido
                    </Button>
                  )}
                </>
              )}
            </Box>
          </Grid>
        </Grid>
      </form>

      {/* Alerta si está invalidado */}
      {siniestro.estado === EstadoSiniestro.INVALIDO && (
        <Alert severity="error" sx={{ mt: 3 }}>
          <Typography variant="subtitle2">Este caso ha sido marcado como inválido</Typography>
          <Typography variant="body2">
            Motivo: {(siniestro as any).motivoInvalidacion || 'No especificado'}
          </Typography>
        </Alert>
      )}

      {/* Alerta si está cerrado */}
      {siniestro.estado === EstadoSiniestro.CERRADO && (
        <Alert severity="success" sx={{ mt: 3 }}>
          <Typography variant="subtitle2">✅ Este caso ha sido cerrado exitosamente</Typography>
          <Typography variant="body2">
            El proceso de siniestro ha sido completado. Los datos se muestran en modo de solo lectura.
          </Typography>
        </Alert>
      )}

      {/* Dialog para marcar como inválido */}
      <Dialog open={invalidDialogOpen} onClose={() => setInvalidDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ color: 'error.main' }}>
          ⚠️ Marcar caso como inválido
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Esta acción cerrará el caso permanentemente. Por favor, seleccione el motivo de invalidación.
          </Typography>
          <TextField
            select
            fullWidth
            label="Motivo de invalidación"
            value={motivoInvalidacion}
            onChange={(e) => setMotivoInvalidacion(e.target.value)}
            sx={{ mb: 2 }}
          >
            {MOTIVOS_INVALIDACION.map((motivo) => (
              <MenuItem key={motivo} value={motivo}>
                {motivo}
              </MenuItem>
            ))}
          </TextField>
          {motivoInvalidacion === 'Otro (especificar)' && (
            <TextField
              fullWidth
              label="Especifique el motivo"
              value={motivoOtro}
              onChange={(e) => setMotivoOtro(e.target.value)}
              multiline
              rows={3}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setInvalidDialogOpen(false)}>Cancelar</Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleMarcarInvalido}
            disabled={!motivoInvalidacion || marcarInvalido.isPending}
          >
            Confirmar invalidación
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
