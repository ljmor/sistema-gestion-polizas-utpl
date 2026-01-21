import { useState } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Alert,
} from '@mui/material';
import { Add, Edit, Delete, Upload, CheckCircle, HourglassEmpty, Visibility, Download } from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useSnackbar } from 'notistack';
import { Siniestro, Beneficiario } from '../../../domain/types/siniestro';
import { EstadoFirma } from '../../../domain/enums/estados';
import { useCreateBeneficiario, useUpdateBeneficiario, useDeleteBeneficiario } from '../../../infrastructure/queries/siniestros.queries';
import { FileDropzone } from '../../../shared/components/FileDropzone';
import { ConfirmDialog } from '../../../shared/components/ConfirmDialog';

interface BeneficiariosSectionProps {
  siniestro: Siniestro;
}

const beneficiarioSchema = z.object({
  nombre: z.string().min(3, 'Nombre requerido'),
  cedula: z.string().min(10, 'Cédula inválida'),
  relacion: z.string().min(1, 'Relación requerida'),
  porcentaje: z.number().min(0.01).max(100),
  banco: z.string().optional(),
  cuentaBancaria: z.string().optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  telefono: z.string().optional(),
});

type BeneficiarioForm = z.infer<typeof beneficiarioSchema>;

export const BeneficiariosSection = ({ siniestro }: BeneficiariosSectionProps) => {
  const { enqueueSnackbar } = useSnackbar();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBeneficiario, setEditingBeneficiario] = useState<Beneficiario | null>(null);
  const [firmaDialogOpen, setFirmaDialogOpen] = useState(false);
  const [selectedBeneficiario, setSelectedBeneficiario] = useState<Beneficiario | null>(null);
  const [firmaFile, setFirmaFile] = useState<File[]>([]);

  const createBeneficiario = useCreateBeneficiario();
  const updateBeneficiario = useUpdateBeneficiario();
  const deleteBeneficiario = useDeleteBeneficiario();

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [beneficiarioToDelete, setBeneficiarioToDelete] = useState<Beneficiario | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<BeneficiarioForm>({
    resolver: zodResolver(beneficiarioSchema),
  });

  // Convertir porcentaje a número para evitar concatenación de strings
  const totalPorcentaje = siniestro.beneficiarios.reduce((sum, b) => sum + Number(b.porcentaje), 0);
  const allFirmasRecibidas = siniestro.beneficiarios.every(
    (b) => b.estadoFirma === EstadoFirma.RECIBIDA
  );

  // Funciones para ver/descargar firma
  const getFirmaUrl = (beneficiario: Beneficiario): string | null => {
    if (!beneficiario.archivoFirma) return null;
    const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    const path = beneficiario.archivoFirma.startsWith('/') ? beneficiario.archivoFirma : `/${beneficiario.archivoFirma}`;
    return `${backendUrl}${path}`;
  };

  const handleViewFirma = (beneficiario: Beneficiario) => {
    const url = getFirmaUrl(beneficiario);
    if (url) {
      window.open(url, '_blank');
    } else {
      enqueueSnackbar('No hay archivo de firma disponible', { variant: 'warning' });
    }
  };

  const handleDownloadFirma = async (beneficiario: Beneficiario) => {
    const url = getFirmaUrl(beneficiario);
    if (!url) {
      enqueueSnackbar('No hay archivo de firma disponible', { variant: 'warning' });
      return;
    }

    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `firma_${beneficiario.nombre.replace(/\s+/g, '_')}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch {
      window.open(url, '_blank');
    }
  };

  const handleDeleteBeneficiario = async () => {
    if (!beneficiarioToDelete) return;
    
    try {
      await deleteBeneficiario.mutateAsync({
        siniestroId: siniestro.id,
        beneficiarioId: beneficiarioToDelete.id,
      });
      enqueueSnackbar('Beneficiario eliminado exitosamente', { variant: 'success' });
      setDeleteDialogOpen(false);
      setBeneficiarioToDelete(null);
    } catch {
      enqueueSnackbar('Error al eliminar el beneficiario', { variant: 'error' });
    }
  };

  const handleOpenDialog = (beneficiario?: Beneficiario) => {
    if (beneficiario) {
      setEditingBeneficiario(beneficiario);
      reset({
        nombre: beneficiario.nombre,
        cedula: beneficiario.cedula,
        relacion: beneficiario.relacion,
        porcentaje: beneficiario.porcentaje,
        cuentaBancaria: beneficiario.cuenta || beneficiario.cuentaBancaria || '',
        banco: beneficiario.banco || '',
        email: beneficiario.email || '',
        telefono: beneficiario.telefono || '',
      });
    } else {
      setEditingBeneficiario(null);
      reset({
        nombre: '',
        cedula: '',
        relacion: '',
        porcentaje: 0,
        cuentaBancaria: '',
        banco: '',
        email: '',
        telefono: '',
      });
    }
    setDialogOpen(true);
  };

  const onSubmit = async (data: BeneficiarioForm) => {
    try {
      // Mapear campos del frontend al formato del backend
      const backendData = {
        nombre: data.nombre,
        cedula: data.cedula,
        parentesco: data.relacion, // Backend espera "parentesco"
        porcentaje: data.porcentaje,
        email: data.email || undefined,
        telefono: data.telefono || undefined,
        banco: data.banco || undefined,
        numeroCuenta: data.cuentaBancaria || undefined, // Backend espera "numeroCuenta"
      };

      if (editingBeneficiario) {
        await updateBeneficiario.mutateAsync({
          siniestroId: siniestro.id,
          beneficiarioId: editingBeneficiario.id,
          data: backendData,
        });
        enqueueSnackbar('Beneficiario actualizado', { variant: 'success' });
      } else {
        await createBeneficiario.mutateAsync({
          siniestroId: siniestro.id,
          data: backendData as any,
        });
        enqueueSnackbar('Beneficiario agregado', { variant: 'success' });
      }
      setDialogOpen(false);
      reset();
    } catch (error) {
      console.error('Error al guardar beneficiario:', error);
      enqueueSnackbar('Error al guardar beneficiario', { variant: 'error' });
    }
  };

  const handleUploadFirma = async () => {
    if (!selectedBeneficiario || firmaFile.length === 0) return;

    try {
      // Crear FormData para enviar el archivo
      const formData = new FormData();
      formData.append('firma', firmaFile[0]);
      
      // Usar httpClient que ya tiene el token configurado
      const { httpClient } = await import('../../../infrastructure/api/httpClient');
      
      await httpClient.post(
        `/siniestros/${siniestro.id}/beneficiarios/${selectedBeneficiario.id}/firma`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      
      // Invalidar la query para refrescar los datos (esto también actualiza la UI)
      await updateBeneficiario.mutateAsync({
        siniestroId: siniestro.id,
        beneficiarioId: selectedBeneficiario.id,
        data: { estadoFirma: EstadoFirma.RECIBIDA },
      });
      
      enqueueSnackbar('Firma subida exitosamente', { variant: 'success' });
      setFirmaDialogOpen(false);
      setFirmaFile([]);
    } catch (error) {
      console.error('Error al subir firma:', error);
      enqueueSnackbar('Error al subir la firma', { variant: 'error' });
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">Beneficiarios</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => handleOpenDialog()}>
          Agregar beneficiario
        </Button>
      </Box>

      {totalPorcentaje !== 100 && siniestro.beneficiarios.length > 0 && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          La suma de porcentajes es {totalPorcentaje}%. Debe ser 100%.
        </Alert>
      )}

      {allFirmasRecibidas && siniestro.beneficiarios.length > 0 && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Todas las firmas han sido recibidas. Listo para envío a aseguradora.
        </Alert>
      )}

      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nombre</TableCell>
              <TableCell>Cédula</TableCell>
              <TableCell>Relación</TableCell>
              <TableCell align="center">%</TableCell>
              <TableCell>Contacto</TableCell>
              <TableCell>Banco / Cuenta</TableCell>
              <TableCell align="center">Firma</TableCell>
              <TableCell align="right">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {siniestro.beneficiarios.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  <Typography color="text.secondary" sx={{ py: 4 }}>
                    No hay beneficiarios registrados
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              siniestro.beneficiarios.map((beneficiario) => (
                <TableRow key={beneficiario.id}>
                  <TableCell>{beneficiario.nombre}</TableCell>
                  <TableCell>{beneficiario.cedula}</TableCell>
                  <TableCell>{beneficiario.relacion}</TableCell>
                  <TableCell align="center">
                    <Chip label={`${beneficiario.porcentaje}%`} size="small" />
                  </TableCell>
                  <TableCell>
                    {beneficiario.email ? (
                      <>
                        <Typography variant="body2">{beneficiario.email}</Typography>
                        {beneficiario.telefono && (
                          <Typography variant="caption" color="text.secondary">
                            {beneficiario.telefono}
                          </Typography>
                        )}
                      </>
                    ) : (
                      <Typography variant="caption" color="warning.main">
                        Sin email
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{beneficiario.banco || 'Sin banco'}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {beneficiario.cuenta || beneficiario.cuentaBancaria || 'Sin cuenta'}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5, flexWrap: 'wrap' }}>
                      {beneficiario.estadoFirma === EstadoFirma.RECIBIDA ? (
                        <Chip
                          icon={<CheckCircle />}
                          label="Recibida"
                          size="small"
                          color="success"
                        />
                      ) : (
                        <Chip
                          icon={<HourglassEmpty />}
                          label="Pendiente"
                          size="small"
                          color="warning"
                        />
                      )}
                      {/* Mostrar botones si hay archivo O si la firma está recibida */}
                      {(beneficiario.archivoFirma || beneficiario.estadoFirma === EstadoFirma.RECIBIDA) && (
                        <>
                          <IconButton
                            size="small"
                            title="Ver firma"
                            color="info"
                            onClick={() => handleViewFirma(beneficiario)}
                          >
                            <Visibility fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            title="Descargar firma"
                            color="primary"
                            onClick={() => handleDownloadFirma(beneficiario)}
                          >
                            <Download fontSize="small" />
                          </IconButton>
                        </>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      title="Subir firma"
                      onClick={() => {
                        setSelectedBeneficiario(beneficiario);
                        setFirmaDialogOpen(true);
                      }}
                    >
                      <Upload />
                    </IconButton>
                    <IconButton
                      size="small"
                      title="Editar"
                      onClick={() => handleOpenDialog(beneficiario)}
                    >
                      <Edit />
                    </IconButton>
                    <IconButton
                      size="small"
                      title="Eliminar"
                      color="error"
                      onClick={() => {
                        setBeneficiarioToDelete(beneficiario);
                        setDeleteDialogOpen(true);
                      }}
                    >
                      <Delete />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Dialog para agregar/editar beneficiario */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogTitle>
            {editingBeneficiario ? 'Editar beneficiario' : 'Agregar beneficiario'}
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  {...register('nombre')}
                  fullWidth
                  label="Nombre completo"
                  error={!!errors.nombre}
                  helperText={errors.nombre?.message}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  {...register('cedula')}
                  fullWidth
                  label="Cédula"
                  error={!!errors.cedula}
                  helperText={errors.cedula?.message}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  {...register('relacion')}
                  fullWidth
                  label="Relación con el fallecido"
                  error={!!errors.relacion}
                  helperText={errors.relacion?.message}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  {...register('porcentaje', { valueAsNumber: true })}
                  fullWidth
                  label="Porcentaje de participación"
                  type="number"
                  inputProps={{ min: 0, max: 100, step: 0.01 }}
                  error={!!errors.porcentaje}
                  helperText={errors.porcentaje?.message}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  {...register('banco')}
                  fullWidth
                  label="Banco"
                  error={!!errors.banco}
                  helperText={errors.banco?.message}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  {...register('cuentaBancaria')}
                  fullWidth
                  label="Número de cuenta"
                  error={!!errors.cuentaBancaria}
                  helperText={errors.cuentaBancaria?.message}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  {...register('email')}
                  fullWidth
                  label="Correo electrónico"
                  type="email"
                  error={!!errors.email}
                  helperText={errors.email?.message || 'Requerido para enviar notificaciones'}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  {...register('telefono')}
                  fullWidth
                  label="Teléfono"
                  error={!!errors.telefono}
                  helperText={errors.telefono?.message}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button type="submit" variant="contained">
              {editingBeneficiario ? 'Actualizar' : 'Agregar'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Dialog para subir firma */}
      <Dialog open={firmaDialogOpen} onClose={() => setFirmaDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Subir documento firmado</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Beneficiario: {selectedBeneficiario?.nombre}
          </Typography>
          <FileDropzone
            onFilesAccepted={setFirmaFile}
            acceptedFiles={firmaFile}
            onFileRemove={() => setFirmaFile([])}
            maxFiles={1}
            label="Arrastra el documento firmado aquí"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFirmaDialogOpen(false)}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={handleUploadFirma}
            disabled={firmaFile.length === 0}
          >
            Registrar firma
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo de confirmación para eliminar beneficiario */}
      <ConfirmDialog
        open={deleteDialogOpen}
        title="Eliminar beneficiario"
        message={`¿Está seguro de eliminar al beneficiario "${beneficiarioToDelete?.nombre}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        confirmColor="error"
        onConfirm={handleDeleteBeneficiario}
        onCancel={() => {
          setDeleteDialogOpen(false);
          setBeneficiarioToDelete(null);
        }}
        loading={deleteBeneficiario.isPending}
      />
    </Box>
  );
};
