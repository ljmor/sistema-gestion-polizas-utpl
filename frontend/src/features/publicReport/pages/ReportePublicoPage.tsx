import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  MenuItem,
  Alert,
} from '@mui/material';
import { Send, Upload, Description, Delete } from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useSnackbar } from 'notistack';
import { motion } from 'framer-motion';
import { useCreateReportePublico } from '../../../infrastructure/queries/siniestros.queries';
import { RELACIONES_REPORTANTE } from '../../../shared/utils/constants';
import { TipoSiniestro } from '../../../domain/enums/estados';

// Tipos de documentos opcionales que el reportante puede subir
const DOCUMENTOS_SUBIBLES = [
  { tipo: 'CEDULA_FALLECIDO', label: 'Cédula del fallecido', descripcion: 'Copia legible de la cédula de identidad' },
  { tipo: 'CERTIFICADO_DEFUNCION', label: 'Certificado de defunción', descripcion: 'Documento emitido por el Registro Civil' },
  { tipo: 'CERTIFICADO_MATRICULA', label: 'Certificado de matrícula', descripcion: 'Certificado de matrícula UTPL del estudiante' },
];

const reporteSchema = z.object({
  fallecido: z.object({
    nombreCompleto: z.string().min(3, 'Nombre requerido (mínimo 3 caracteres)'),
    cedula: z.string().min(10, 'Cédula inválida').max(13, 'Cédula inválida'),
    fechaDefuncion: z.string().min(1, 'Fecha de defunción requerida'),
  }),
  tipoPreliminar: z.nativeEnum(TipoSiniestro),
  observaciones: z.string().optional(),
  reportante: z.object({
    nombre: z.string().min(3, 'Nombre requerido'),
    relacion: z.enum(['FAMILIAR', 'COMPANERO', 'PERSONAL', 'OTRO']),
    email: z.string().email('Email inválido'),
    telefono: z.string().min(7, 'Teléfono inválido'),
  }),
});

type ReporteForm = z.infer<typeof reporteSchema>;

// Estado para los archivos por tipo
interface ArchivosPorTipo {
  [tipo: string]: File | null;
}

export const ReportePublicoPage = () => {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const [archivosPorTipo, setArchivosPorTipo] = useState<ArchivosPorTipo>({});
  const createReporte = useCreateReportePublico();

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ReporteForm>({
    resolver: zodResolver(reporteSchema),
    defaultValues: {
      tipoPreliminar: TipoSiniestro.NATURAL,
      reportante: {
        relacion: 'FAMILIAR',
      },
    },
  });

  const onSubmit = async (data: ReporteForm) => {
    try {
      // Convertir archivos por tipo a array con metadata
      const archivosConTipo = Object.entries(archivosPorTipo)
        .filter(([, file]) => file !== null)
        .map(([tipo, file]) => ({ tipo, file: file! }));

      const result = await createReporte.mutateAsync({
        ...data,
        archivosIniciales: archivosConTipo.map(a => a.file),
        archivosTipos: archivosConTipo.map(a => a.tipo),
      });
      enqueueSnackbar('Reporte enviado exitosamente', { variant: 'success' });
      navigate(`/reporte/${result.caseCode}/confirmacion`);
    } catch {
      enqueueSnackbar('Error al enviar el reporte. Intente nuevamente.', {
        variant: 'error',
      });
    }
  };

  const handleFileChange = (tipo: string, file: File | null) => {
    setArchivosPorTipo(prev => ({ ...prev, [tipo]: file }));
  };

  const handleFileInputChange = (tipo: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    handleFileChange(tipo, file);
  };

  const today = new Date().toISOString().split('T')[0];
  const archivosSubidos = Object.values(archivosPorTipo).filter(f => f !== null).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom fontWeight={600}>
          Reporte de Siniestro - Póliza de Vida Estudiantil UTPL
        </Typography>
        <Typography color="text.secondary">
          Complete el formulario para reportar el fallecimiento de un estudiante UTPL. 
          Un gestor revisará su reporte y se comunicará con usted para dar seguimiento al proceso de reclamación.
        </Typography>
        <Alert severity="info" sx={{ mt: 2 }}>
          Este formulario es exclusivo para estudiantes matriculados en la UTPL que cuentan con póliza de vida estudiantil vigente.
        </Alert>
      </Box>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Grid container spacing={3}>
          {/* Datos del fallecido */}
          <Grid size={{ xs: 12 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Datos del fallecido
                </Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      {...register('fallecido.nombreCompleto')}
                      fullWidth
                      label="Nombre completo"
                      error={!!errors.fallecido?.nombreCompleto}
                      helperText={errors.fallecido?.nombreCompleto?.message}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      {...register('fallecido.cedula')}
                      fullWidth
                      label="Cédula"
                      error={!!errors.fallecido?.cedula}
                      helperText={errors.fallecido?.cedula?.message}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      {...register('fallecido.fechaDefuncion')}
                      fullWidth
                      label="Fecha de defunción"
                      type="date"
                      InputLabelProps={{ shrink: true }}
                      inputProps={{ max: today }}
                      error={!!errors.fallecido?.fechaDefuncion}
                      helperText={errors.fallecido?.fechaDefuncion?.message}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Controller
                      name="tipoPreliminar"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          select
                          fullWidth
                          label="Tipo de fallecimiento"
                          error={!!errors.tipoPreliminar}
                          helperText={errors.tipoPreliminar?.message || 'Seleccione según la causa del fallecimiento'}
                        >
                          <MenuItem value={TipoSiniestro.NATURAL}>Muerte Natural (enfermedad, vejez, etc.)</MenuItem>
                          <MenuItem value={TipoSiniestro.ACCIDENTE}>Muerte por Accidente (tránsito, laboral, etc.)</MenuItem>
                        </TextField>
                      )}
                    />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <TextField
                      {...register('observaciones')}
                      fullWidth
                      label="Observaciones"
                      multiline
                      rows={3}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Datos del reportante */}
          <Grid size={{ xs: 12 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Datos del reportante
                </Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      {...register('reportante.nombre')}
                      fullWidth
                      label="Nombre completo"
                      error={!!errors.reportante?.nombre}
                      helperText={errors.reportante?.nombre?.message}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Controller
                      name="reportante.relacion"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          select
                          fullWidth
                          label="Relación con el fallecido"
                          error={!!errors.reportante?.relacion}
                          helperText={errors.reportante?.relacion?.message}
                        >
                          {RELACIONES_REPORTANTE.map((rel) => (
                            <MenuItem key={rel.value} value={rel.value}>
                              {rel.label}
                            </MenuItem>
                          ))}
                        </TextField>
                      )}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      {...register('reportante.email')}
                      fullWidth
                      label="Correo electrónico"
                      type="email"
                      error={!!errors.reportante?.email}
                      helperText={errors.reportante?.email?.message}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      {...register('reportante.telefono')}
                      fullWidth
                      label="Teléfono"
                      error={!!errors.reportante?.telefono}
                      helperText={errors.reportante?.telefono?.message}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Adjuntos por tipo de documento */}
          <Grid size={{ xs: 12 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Documentos de soporte (opcional)
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Si dispone de alguno de los siguientes documentos, puede adjuntarlos ahora
                  para agilizar el proceso. Estos documentos serán revisados por el gestor.
                </Typography>

                <Grid container spacing={2}>
                  {DOCUMENTOS_SUBIBLES.map((doc) => (
                    <Grid size={{ xs: 12, md: 6 }} key={doc.tipo}>
                      <Box
                        sx={{
                          p: 2,
                          border: '1px solid',
                          borderColor: archivosPorTipo[doc.tipo] ? 'success.main' : 'divider',
                          borderRadius: 2,
                          bgcolor: archivosPorTipo[doc.tipo] ? 'success.50' : 'background.paper',
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <Description color={archivosPorTipo[doc.tipo] ? 'success' : 'action'} />
                          <Typography variant="subtitle2">{doc.label}</Typography>
                        </Box>
                        <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1.5 }}>
                          {doc.descripcion}
                        </Typography>

                        {archivosPorTipo[doc.tipo] ? (
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Typography variant="body2" color="success.main" noWrap sx={{ maxWidth: 180 }}>
                              ✓ {archivosPorTipo[doc.tipo]?.name}
                            </Typography>
                            <Button
                              size="small"
                              color="error"
                              startIcon={<Delete />}
                              onClick={() => handleFileChange(doc.tipo, null)}
                            >
                              Quitar
                            </Button>
                          </Box>
                        ) : (
                          <Button
                            variant="outlined"
                            component="label"
                            size="small"
                            startIcon={<Upload />}
                            fullWidth
                          >
                            Seleccionar archivo
                            <input
                              type="file"
                              hidden
                              accept=".pdf,.jpg,.jpeg,.png"
                              onChange={handleFileInputChange(doc.tipo)}
                            />
                          </Button>
                        )}
                      </Box>
                    </Grid>
                  ))}
                </Grid>

                {archivosSubidos > 0 && (
                  <Alert severity="info" sx={{ mt: 2 }}>
                    {archivosSubidos} documento(s) seleccionado(s) para adjuntar
                  </Alert>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Botón enviar */}
          <Grid size={{ xs: 12 }}>
            <Alert severity="info" sx={{ mb: 2 }}>
              Al enviar este formulario, un gestor revisará su reporte y se comunicará
              con usted al correo o teléfono proporcionado.
            </Alert>
            <Button
              type="submit"
              variant="contained"
              size="large"
              startIcon={<Send />}
              disabled={createReporte.isPending}
              fullWidth
            >
              {createReporte.isPending ? 'Enviando reporte...' : 'Enviar reporte'}
            </Button>
          </Grid>
        </Grid>
      </form>
    </motion.div>
  );
};
