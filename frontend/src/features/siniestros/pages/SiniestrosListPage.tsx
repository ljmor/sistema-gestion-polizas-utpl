import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  Chip,
  ToggleButton,
  ToggleButtonGroup,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  MenuItem,
  CircularProgress,
} from '@mui/material';
import { Add, ViewList, ViewKanban } from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { useSnackbar } from 'notistack';
import { PageHeader } from '../../../shared/components/PageHeader';
import { DataTable, Column } from '../../../shared/components/DataTable';
import { StatusChip } from '../../../shared/components/StatusChip';
import { SiniestrosFilters } from '../components/SiniestrosFilters';
import { SiniestroKanban } from '../components/SiniestroKanban';
import { useSiniestros, useCreateSiniestroManual } from '../../../infrastructure/queries/siniestros.queries';
import { SiniestroListItem, SiniestroFilters as FilterType } from '../../../domain/types/siniestro';
import { EstadoSiniestro, TipoSiniestro } from '../../../domain/enums/estados';
import { formatDate } from '../../../shared/utils/dates';
import { usePermissions } from '../../../application/services/permissionsService';
import { Role } from '../../../domain/enums/roles';
import { RELACIONES_REPORTANTE } from '../../../shared/utils/constants';

type ViewMode = 'table' | 'kanban';

interface CreateCasoForm {
  tipo: TipoSiniestro;
  fechaDefuncion: string;
  fallecidoNombre: string;
  fallecidoCedula: string;
  reportanteNombre: string;
  reportanteEmail: string;
  reportanteTelefono: string;
  reportanteRelacion: string;
  observaciones: string;
}

export const SiniestrosListPage = () => {
  const navigate = useNavigate();
  const { hasRole } = usePermissions();
  const { enqueueSnackbar } = useSnackbar();
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [filters, setFilters] = useState<FilterType>({});
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const { data: siniestros, isLoading } = useSiniestros(filters);
  const createSiniestro = useCreateSiniestroManual();

  const { register, control, handleSubmit, reset, formState: { errors } } = useForm<CreateCasoForm>({
    defaultValues: {
      tipo: TipoSiniestro.NATURAL,
      reportanteRelacion: 'FAMILIAR',
    },
  });

  const onCreateSubmit = async (data: CreateCasoForm) => {
    try {
      const result = await createSiniestro.mutateAsync(data);
      enqueueSnackbar(`Caso ${result.caseCode} creado exitosamente`, { variant: 'success' });
      setCreateDialogOpen(false);
      reset();
      navigate(`/app/siniestros/${result.id}`);
    } catch {
      enqueueSnackbar('Error al crear el caso', { variant: 'error' });
    }
  };

  const handleOpenCreateDialog = () => {
    reset();
    setCreateDialogOpen(true);
  };

  // Datos mock para desarrollo
  const mockSiniestros: SiniestroListItem[] = [
    {
      id: '1',
      caseCode: 'SIN-2024-001',
      fallecido: { nombreCompleto: 'Juan Pérez García', cedula: '1104567890' },
      fechaDefuncion: '2024-01-15',
      estado: EstadoSiniestro.EN_VALIDACION,
      tipo: 'NATURAL' as any,
      diasRestantes60: 45,
      updatedAt: '2024-01-20',
    },
    {
      id: '2',
      caseCode: 'SIN-2024-002',
      fallecido: { nombreCompleto: 'María López Sánchez', cedula: '1105678901' },
      fechaDefuncion: '2024-01-10',
      estado: EstadoSiniestro.BENEFICIARIOS,
      tipo: 'ACCIDENTE' as any,
      diasRestantes60: 8,
      updatedAt: '2024-01-19',
    },
    {
      id: '3',
      caseCode: 'SIN-2024-003',
      fallecido: { nombreCompleto: 'Carlos Rodríguez Mora', cedula: '1106789012' },
      fechaDefuncion: '2024-01-05',
      estado: EstadoSiniestro.LIQUIDACION,
      tipo: 'NATURAL' as any,
      diasRestantes60: 35,
      updatedAt: '2024-01-18',
    },
    {
      id: '4',
      caseCode: 'SIN-2024-004',
      fallecido: { nombreCompleto: 'Ana Martínez López', cedula: '1107890123' },
      fechaDefuncion: '2024-01-01',
      estado: EstadoSiniestro.PAGO,
      tipo: 'NATURAL' as any,
      diasRestantes60: 31,
      updatedAt: '2024-01-17',
    },
  ];

  const displayData = siniestros || mockSiniestros;

  const columns: Column<SiniestroListItem>[] = [
    {
      id: 'caseCode',
      label: '#Caso',
      minWidth: 120,
      render: (row) => (
        <Box sx={{ fontWeight: 600, color: 'primary.main' }}>#{row.caseCode}</Box>
      ),
    },
    {
      id: 'fallecido',
      label: 'Fallecido',
      minWidth: 200,
      render: (row) => (
        <Box>
          <Box>{row.fallecido.nombreCompleto}</Box>
          <Box sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
            {row.fallecido.cedula}
          </Box>
        </Box>
      ),
    },
    {
      id: 'fechaDefuncion',
      label: 'Fecha defunción',
      minWidth: 130,
      render: (row) => row.fechaDefuncion ? formatDate(row.fechaDefuncion) : <Chip label="Sin definir" size="small" variant="outlined" />,
    },
    {
      id: 'estado',
      label: 'Estado',
      minWidth: 140,
      render: (row) => <StatusChip estado={row.estado} />,
    },
    {
      id: 'diasRestantes60',
      label: 'Plazo 60d',
      minWidth: 100,
      align: 'center',
      render: (row) => {
        // Si el caso es inválido, mostrar N/A
        if (row.estado === EstadoSiniestro.INVALIDO) {
          return <Chip label="N/A" size="small" variant="outlined" color="default" />;
        }
        // Si el plazo está cumplido (enviado a aseguradora), mostrar "Cumplido"
        if (row.plazo60dCompletado) {
          return <Chip label="✓ Cumplido" size="small" color="success" />;
        }
        // Si el plazo es 0, mostrar "Expirado"
        if (row.diasRestantes60 === 0) {
          return <Chip label="⚠️ Expirado" size="small" color="error" />;
        }
        // Si no hay fecha de reporte aún
        if (row.diasRestantes60 === null || row.diasRestantes60 === undefined) {
          return <Chip label="Sin plazo" size="small" variant="outlined" />;
        }
        // Mostrar días restantes
        return (
          <Chip
            label={`${row.diasRestantes60}d`}
            size="small"
            color={row.diasRestantes60 < 10 ? 'error' : row.diasRestantes60 < 20 ? 'warning' : 'success'}
          />
        );
      },
    },
    {
      id: 'updatedAt',
      label: 'Actualización',
      minWidth: 130,
      render: (row) => formatDate(row.updatedAt),
    },
  ];

  const handleRowClick = (row: SiniestroListItem) => {
    navigate(`/app/siniestros/${row.id}`);
  };

  return (
    <>
      <PageHeader
        title="Casos de Siniestro"
        subtitle="Gestión de reclamaciones por fallecimiento de estudiantes UTPL"
        actions={
          <>
            <ToggleButtonGroup
              value={viewMode}
              exclusive
              onChange={(_, value) => value && setViewMode(value)}
              size="small"
            >
              <ToggleButton value="table">
                <ViewList />
              </ToggleButton>
              <ToggleButton value="kanban">
                <ViewKanban />
              </ToggleButton>
            </ToggleButtonGroup>
            {hasRole(Role.GESTOR) && (
              <Button variant="contained" startIcon={<Add />} onClick={handleOpenCreateDialog}>
                Crear caso manual
              </Button>
            )}
          </>
        }
      />

      {/* Diálogo para crear caso manual */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Crear Caso Manual</DialogTitle>
        <form onSubmit={handleSubmit(onCreateSubmit)}>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12 }}>
                <Box sx={{ mb: 2, fontWeight: 600, color: 'primary.main' }}>Datos del fallecido</Box>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  {...register('fallecidoNombre', { required: 'Nombre requerido' })}
                  fullWidth
                  label="Nombre completo del fallecido *"
                  error={!!errors.fallecidoNombre}
                  helperText={errors.fallecidoNombre?.message}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  {...register('fallecidoCedula', { required: 'Cédula requerida' })}
                  fullWidth
                  label="Cédula del fallecido *"
                  error={!!errors.fallecidoCedula}
                  helperText={errors.fallecidoCedula?.message}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  {...register('fechaDefuncion')}
                  fullWidth
                  label="Fecha de defunción"
                  type="date"
                  InputLabelProps={{ shrink: true }}
                  inputProps={{ max: new Date().toISOString().split('T')[0] }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Controller
                  name="tipo"
                  control={control}
                  render={({ field }) => (
                    <TextField {...field} select fullWidth label="Tipo de fallecimiento" helperText="Determina cobertura">
                      <MenuItem value={TipoSiniestro.NATURAL}>Muerte Natural</MenuItem>
                      <MenuItem value={TipoSiniestro.ACCIDENTE}>Muerte por Accidente</MenuItem>
                    </TextField>
                  )}
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <Box sx={{ mb: 2, mt: 2, fontWeight: 600, color: 'primary.main' }}>Datos del reportante (opcional)</Box>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField {...register('reportanteNombre')} fullWidth label="Nombre del reportante" />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Controller
                  name="reportanteRelacion"
                  control={control}
                  render={({ field }) => (
                    <TextField {...field} select fullWidth label="Relación con el fallecido">
                      {RELACIONES_REPORTANTE.map((rel) => (
                        <MenuItem key={rel.value} value={rel.value}>{rel.label}</MenuItem>
                      ))}
                    </TextField>
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField {...register('reportanteEmail')} fullWidth label="Email del reportante" type="email" />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField {...register('reportanteTelefono')} fullWidth label="Teléfono del reportante" />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField {...register('observaciones')} fullWidth label="Observaciones" multiline rows={3} />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCreateDialogOpen(false)}>Cancelar</Button>
            <Button
              type="submit"
              variant="contained"
              disabled={createSiniestro.isPending}
              startIcon={createSiniestro.isPending ? <CircularProgress size={20} /> : <Add />}
            >
              {createSiniestro.isPending ? 'Creando...' : 'Crear caso'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <SiniestrosFilters filters={filters} onFiltersChange={setFilters} />

      <Card sx={{ mt: 2 }}>
        {viewMode === 'table' ? (
          <DataTable
            columns={columns}
            data={displayData}
            loading={isLoading}
            onRowClick={handleRowClick}
            searchable
            emptyMessage="No se encontraron siniestros"
          />
        ) : (
          <SiniestroKanban
            siniestros={displayData}
            onCardClick={handleRowClick}
          />
        )}
      </Card>
    </>
  );
};
