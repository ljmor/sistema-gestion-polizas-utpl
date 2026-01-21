import { useParams, useNavigate } from 'react-router-dom';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Chip,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import { ArrowBack, Add, CalendarMonth } from '@mui/icons-material';
import { PageHeader } from '../../../shared/components/PageHeader';
import { LoadingState } from '../../../shared/components/LoadingState';
import { usePoliza } from '../../../infrastructure/queries/polizas.queries';
import { Poliza, PagoPoliza, Vigencia } from '../../../domain/types/poliza';
import { TipoPoliza, EstadoPoliza } from '../../../domain/enums/estados';
import { formatDate } from '../../../shared/utils/dates';
import { formatCurrency } from '../../../infrastructure/api/mappers';
import { PolizaVigenciaCard } from '../components/PolizaVigenciaCard';
import { PolizaPagosTable } from '../components/PolizaPagosTable';

export const PolizaDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: poliza, isLoading } = usePoliza(id || '');

  // Mock data para desarrollo
  const mockPoliza: Poliza = {
    id: '1',
    nombre: 'Póliza de Vida Colectiva',
    tipo: TipoPoliza.VIDA,
    estado: EstadoPoliza.ACTIVA,
    prima: 50000,
    montoCobertura: 15000,
    descripcion: 'Póliza de vida colectiva para estudiantes y personal de la UTPL',
    gruposAsegurados: ['ESTUDIANTES', 'PERSONAL_LOJA', 'PERSONAL_CENTROS'],
    vigenciaActual: {
      id: '1',
      desde: '2024-01-01',
      hasta: '2024-12-31',
      activa: true,
    },
    vigencias: [
      { id: '1', desde: '2024-01-01', hasta: '2024-12-31', activa: true },
      { id: '2', desde: '2023-01-01', hasta: '2023-12-31', activa: false },
    ],
    pagos: [
      { id: '1', fecha: '2024-01-15', monto: 12500, estado: 'PAGADO', descripcion: 'Primer trimestre' },
      { id: '2', fecha: '2024-04-15', monto: 12500, estado: 'PAGADO', descripcion: 'Segundo trimestre' },
      { id: '3', fecha: '2024-07-15', monto: 12500, estado: 'PENDIENTE', descripcion: 'Tercer trimestre' },
      { id: '4', fecha: '2024-10-15', monto: 12500, estado: 'PENDIENTE', descripcion: 'Cuarto trimestre' },
    ],
    createdAt: '2024-01-01',
    updatedAt: '2024-01-15',
  };

  const displayData = poliza || mockPoliza;

  if (isLoading) {
    return <LoadingState message="Cargando póliza..." />;
  }

  const tipoLabels: Record<TipoPoliza, string> = {
    [TipoPoliza.VIDA]: 'Vida',
    [TipoPoliza.ACCIDENTES]: 'Accidentes',
    [TipoPoliza.MEDICA]: 'Médica',
  };

  return (
    <>
      <PageHeader
        title={displayData.nombre}
        breadcrumbs={[
          { label: 'Pólizas', href: '/app/polizas' },
          { label: displayData.nombre },
        ]}
        actions={
          <Button startIcon={<ArrowBack />} onClick={() => navigate('/app/polizas')}>
            Volver
          </Button>
        }
      />

      <Grid container spacing={3}>
        {/* Información general */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Información General
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" color="text.secondary">
                  Tipo de póliza
                </Typography>
                <Box sx={{ mt: 0.5 }}>
                  <Chip label={tipoLabels[displayData.tipo]} size="small" />
                </Box>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" color="text.secondary">
                  Estado
                </Typography>
                <Box sx={{ mt: 0.5 }}>
                  <Chip
                    label={displayData.estado}
                    size="small"
                    color={displayData.estado === EstadoPoliza.ACTIVA ? 'success' : 'error'}
                  />
                </Box>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" color="text.secondary">
                  Prima anual
                </Typography>
                <Typography variant="h5" color="primary" fontWeight={700}>
                  {formatCurrency(displayData.prima)}
                </Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" color="text.secondary">
                  Monto de cobertura
                </Typography>
                <Typography fontWeight={600}>
                  {formatCurrency(displayData.montoCobertura)}
                </Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" color="text.secondary">
                  Descripción
                </Typography>
                <Typography variant="body2">
                  {displayData.descripcion || 'Sin descripción'}
                </Typography>
              </Box>

              {displayData.gruposAsegurados && displayData.gruposAsegurados.length > 0 && (
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Grupos asegurados
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                    {displayData.gruposAsegurados.map((grupo) => (
                      <Chip key={grupo} label={grupo} size="small" variant="outlined" />
                    ))}
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Vigencia actual y acciones */}
        <Grid size={{ xs: 12, md: 8 }}>
          <PolizaVigenciaCard
            vigenciaActual={displayData.vigenciaActual}
            vigencias={displayData.vigencias}
            polizaId={displayData.id}
          />
        </Grid>

      </Grid>
    </>
  );
};
