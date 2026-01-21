import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  MenuItem,
  CircularProgress,
  IconButton,
  Tooltip,
} from '@mui/material';
import { Add, Edit, Delete } from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { useSnackbar } from 'notistack';
import { PageHeader } from '../../../shared/components/PageHeader';
import { DataTable, Column } from '../../../shared/components/DataTable';
import { ConfirmDialog } from '../../../shared/components/ConfirmDialog';
import { usePolizas, useCreatePoliza, useUpdatePoliza, useDeletePoliza } from '../../../infrastructure/queries/polizas.queries';
import { PolizaListItem } from '../../../domain/types/poliza';
import { EstadoPoliza, TipoPoliza } from '../../../domain/enums/estados';
import { formatDate } from '../../../shared/utils/dates';
import { formatCurrency } from '../../../infrastructure/api/mappers';

const estadoColors: Record<EstadoPoliza, 'success' | 'error' | 'default'> = {
  [EstadoPoliza.ACTIVA]: 'success',
  [EstadoPoliza.VENCIDA]: 'error',
  [EstadoPoliza.CANCELADA]: 'default',
};

const tipoLabels: Record<TipoPoliza, string> = {
  [TipoPoliza.VIDA]: 'Vida',
  [TipoPoliza.ACCIDENTES]: 'Accidentes',
  [TipoPoliza.MEDICA]: 'Médica',
};

interface CreatePolizaForm {
  nombre: string;
  tipo: TipoPoliza;
  prima: number;
  montoCobertura: number;
  descripcion: string;
  vigenciaDesde: string;
  vigenciaHasta: string;
}

export const PolizasListPage = () => {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const { data: polizas, isLoading } = usePolizas();
  const createPoliza = useCreatePoliza();
  const updatePoliza = useUpdatePoliza();
  const deletePoliza = useDeletePoliza();
  
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedPoliza, setSelectedPoliza] = useState<PolizaListItem | null>(null);

  const { register, control, handleSubmit, reset, setValue, formState: { errors } } = useForm<CreatePolizaForm>({
    defaultValues: {
      tipo: TipoPoliza.VIDA,
    },
  });

  const onCreateSubmit = async (data: CreatePolizaForm) => {
    try {
      const result = await createPoliza.mutateAsync(data);
      enqueueSnackbar(`Póliza "${result.nombre}" creada exitosamente`, { variant: 'success' });
      setCreateDialogOpen(false);
      reset();
      navigate(`/app/polizas/${result.id}`);
    } catch {
      enqueueSnackbar('Error al crear la póliza', { variant: 'error' });
    }
  };

  const onEditSubmit = async (data: CreatePolizaForm) => {
    if (!selectedPoliza) return;
    try {
      await updatePoliza.mutateAsync({ id: selectedPoliza.id, data });
      enqueueSnackbar('Póliza actualizada exitosamente', { variant: 'success' });
      setEditDialogOpen(false);
      setSelectedPoliza(null);
    } catch {
      enqueueSnackbar('Error al actualizar la póliza', { variant: 'error' });
    }
  };

  const handleEdit = (poliza: PolizaListItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedPoliza(poliza);
    setValue('nombre', poliza.nombre);
    setValue('tipo', poliza.tipo);
    setValue('prima', poliza.prima);
    setValue('montoCobertura', poliza.montoCobertura || 0);
    setValue('vigenciaDesde', poliza.vigenciaDesde?.split('T')[0] || '');
    setValue('vigenciaHasta', poliza.vigenciaHasta?.split('T')[0] || '');
    setValue('descripcion', poliza.descripcion || '');
    setEditDialogOpen(true);
  };

  const handleDelete = (poliza: PolizaListItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedPoliza(poliza);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedPoliza) return;
    try {
      await deletePoliza.mutateAsync(selectedPoliza.id);
      enqueueSnackbar('Póliza eliminada exitosamente', { variant: 'success' });
      setDeleteDialogOpen(false);
      setSelectedPoliza(null);
    } catch {
      enqueueSnackbar('Error al eliminar la póliza. Puede tener siniestros asociados.', { variant: 'error' });
    }
  };

  // Mock data para desarrollo
  const mockPolizas: PolizaListItem[] = [
    {
      id: '1',
      nombre: 'Póliza de Vida Colectiva',
      tipo: TipoPoliza.VIDA,
      estado: EstadoPoliza.ACTIVA,
      vigenciaDesde: '2024-01-01',
      vigenciaHasta: '2024-12-31',
      prima: 50000,
    },
    {
      id: '2',
      nombre: 'Póliza de Accidentes Personales',
      tipo: TipoPoliza.ACCIDENTES,
      estado: EstadoPoliza.ACTIVA,
      vigenciaDesde: '2024-01-01',
      vigenciaHasta: '2024-12-31',
      prima: 35000,
    },
    {
      id: '3',
      nombre: 'Póliza Médica Estudiantil',
      tipo: TipoPoliza.MEDICA,
      estado: EstadoPoliza.ACTIVA,
      vigenciaDesde: '2024-03-01',
      vigenciaHasta: '2025-02-28',
      prima: 80000,
    },
  ];

  const displayData = polizas || mockPolizas;

  const columns: Column<PolizaListItem>[] = [
    {
      id: 'nombre',
      label: 'Nombre de la póliza',
      minWidth: 200,
    },
    {
      id: 'tipo',
      label: 'Tipo',
      minWidth: 100,
      render: (row) => (
        <Chip label={tipoLabels[row.tipo]} size="small" variant="outlined" />
      ),
    },
    {
      id: 'vigencia',
      label: 'Vigencia',
      minWidth: 180,
      render: (row) => (
        <Box>
          {formatDate(row.vigenciaDesde)} - {formatDate(row.vigenciaHasta)}
        </Box>
      ),
    },
    {
      id: 'prima',
      label: 'Prima',
      minWidth: 100,
      align: 'right',
      render: (row) => formatCurrency(row.prima),
    },
    {
      id: 'cobertura',
      label: 'Cobertura',
      minWidth: 100,
      align: 'right',
      render: (row) => formatCurrency(row.montoCobertura || 0),
    },
    {
      id: 'estado',
      label: 'Estado',
      minWidth: 90,
      align: 'center',
      render: (row) => (
        <Chip label={row.estado} size="small" color={estadoColors[row.estado]} />
      ),
    },
    {
      id: 'acciones',
      label: 'Acciones',
      minWidth: 100,
      align: 'center',
      render: (row) => (
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
          <Tooltip title="Editar póliza">
            <IconButton size="small" onClick={(e) => handleEdit(row, e)} color="primary">
              <Edit fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Eliminar póliza">
            <IconButton size="small" onClick={(e) => handleDelete(row, e)} color="error">
              <Delete fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  const handleRowClick = (row: PolizaListItem) => {
    navigate(`/app/polizas/${row.id}`);
  };

  return (
    <>
      <PageHeader
        title="Póliza de Vida Estudiantil"
        subtitle="Gestión de cobertura para estudiantes UTPL"
        actions={
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => { reset(); setCreateDialogOpen(true); }}
          >
            Nueva póliza
          </Button>
        }
      />

      {/* Dialog para crear póliza */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Nueva Póliza</DialogTitle>
        <form onSubmit={handleSubmit(onCreateSubmit)}>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12 }}>
                <TextField
                  {...register('nombre', { required: 'Nombre requerido' })}
                  fullWidth
                  label="Nombre de la póliza *"
                  error={!!errors.nombre}
                  helperText={errors.nombre?.message}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Controller
                  name="tipo"
                  control={control}
                  render={({ field }) => (
                    <TextField {...field} select fullWidth label="Tipo de póliza" disabled>
                      <MenuItem value={TipoPoliza.VIDA}>Vida (Estudiantes UTPL)</MenuItem>
                    </TextField>
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  {...register('prima', { required: 'Prima requerida', valueAsNumber: true })}
                  fullWidth
                  label="Prima anual (USD) *"
                  type="number"
                  error={!!errors.prima}
                  helperText={errors.prima?.message}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  {...register('montoCobertura', { required: 'Cobertura requerida', valueAsNumber: true })}
                  fullWidth
                  label="Monto de cobertura (USD) *"
                  type="number"
                  error={!!errors.montoCobertura}
                  helperText={errors.montoCobertura?.message}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  {...register('vigenciaDesde', { required: 'Fecha requerida' })}
                  fullWidth
                  label="Vigencia desde *"
                  type="date"
                  InputLabelProps={{ shrink: true }}
                  error={!!errors.vigenciaDesde}
                  helperText={errors.vigenciaDesde?.message}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  {...register('vigenciaHasta', { required: 'Fecha requerida' })}
                  fullWidth
                  label="Vigencia hasta *"
                  type="date"
                  InputLabelProps={{ shrink: true }}
                  error={!!errors.vigenciaHasta}
                  helperText={errors.vigenciaHasta?.message}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  {...register('descripcion')}
                  fullWidth
                  label="Descripción"
                  multiline
                  rows={3}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCreateDialogOpen(false)}>Cancelar</Button>
            <Button
              type="submit"
              variant="contained"
              disabled={createPoliza.isPending}
              startIcon={createPoliza.isPending ? <CircularProgress size={20} /> : <Add />}
            >
              {createPoliza.isPending ? 'Creando...' : 'Crear póliza'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <Card>
        <DataTable
          columns={columns}
          data={displayData}
          loading={isLoading}
          onRowClick={handleRowClick}
          searchable
          emptyMessage="No se encontraron pólizas"
        />
      </Card>

      {/* Dialog para editar póliza */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Editar Póliza</DialogTitle>
        <form onSubmit={handleSubmit(onEditSubmit)}>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12 }}>
                <TextField
                  {...register('nombre', { required: 'Nombre requerido' })}
                  fullWidth
                  label="Nombre de la póliza *"
                  error={!!errors.nombre}
                  helperText={errors.nombre?.message}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Controller
                  name="tipo"
                  control={control}
                  render={({ field }) => (
                    <TextField {...field} select fullWidth label="Tipo de póliza" disabled>
                      <MenuItem value={TipoPoliza.VIDA}>Vida (Estudiantes UTPL)</MenuItem>
                    </TextField>
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  {...register('prima', { required: 'Prima requerida', valueAsNumber: true })}
                  fullWidth
                  label="Prima anual (USD) *"
                  type="number"
                  error={!!errors.prima}
                  helperText={errors.prima?.message}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  {...register('montoCobertura', { required: 'Cobertura requerida', valueAsNumber: true })}
                  fullWidth
                  label="Monto de cobertura (USD) *"
                  type="number"
                  error={!!errors.montoCobertura}
                  helperText={errors.montoCobertura?.message}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  {...register('vigenciaDesde', { required: 'Fecha requerida' })}
                  fullWidth
                  label="Vigencia desde *"
                  type="date"
                  InputLabelProps={{ shrink: true }}
                  error={!!errors.vigenciaDesde}
                  helperText={errors.vigenciaDesde?.message}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  {...register('vigenciaHasta', { required: 'Fecha requerida' })}
                  fullWidth
                  label="Vigencia hasta *"
                  type="date"
                  InputLabelProps={{ shrink: true }}
                  error={!!errors.vigenciaHasta}
                  helperText={errors.vigenciaHasta?.message}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  {...register('descripcion')}
                  fullWidth
                  label="Descripción"
                  multiline
                  rows={3}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditDialogOpen(false)}>Cancelar</Button>
            <Button
              type="submit"
              variant="contained"
              disabled={updatePoliza.isPending}
              startIcon={updatePoliza.isPending ? <CircularProgress size={20} /> : <Edit />}
            >
              {updatePoliza.isPending ? 'Guardando...' : 'Guardar cambios'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Dialog de confirmación para eliminar */}
      <ConfirmDialog
        open={deleteDialogOpen}
        title="Eliminar póliza"
        message={`¿Estás seguro de eliminar la póliza "${selectedPoliza?.nombre}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteDialogOpen(false)}
        confirmColor="error"
      />
    </>
  );
};
