import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Box,
  TextField,
  MenuItem,
  Button,
  Alert,
  CircularProgress,
  Tooltip,
} from '@mui/material';
import { Visibility, CheckCircle, Warning, Error as ErrorIcon, Info, Close } from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { PageHeader } from '../../../shared/components/PageHeader';
import { useAlertas, useMarcarAlertaLeida, useResolverAlerta, useResolverTodasAlertas } from '../../../infrastructure/queries/alertas.queries';
import { Alerta, AlertaFilters, tipoAlertaLabels, severidadAlertaColors } from '../../../domain/types/alerta';
import { TipoAlerta, SeveridadAlerta } from '../../../domain/enums/estados';
import { formatDate } from '../../../shared/utils/dates';

const severidadIcons: Record<SeveridadAlerta, React.ReactElement> = {
  [SeveridadAlerta.INFO]: <Info color="info" />,
  [SeveridadAlerta.WARNING]: <Warning color="warning" />,
  [SeveridadAlerta.CRITICAL]: <ErrorIcon color="error" />,
};

export const AlertasPage = () => {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const [filters, setFilters] = useState<AlertaFilters>({});
  const { data: alertas, isLoading } = useAlertas(filters);
  const marcarLeida = useMarcarAlertaLeida();
  const resolverAlerta = useResolverAlerta();
  const resolverTodas = useResolverTodasAlertas();

  // Usar datos reales de la API
  const displayData = alertas || [];

  const handleEliminarTodas = async () => {
    try {
      const result = await resolverTodas.mutateAsync();
      enqueueSnackbar(result.message || 'Todas las alertas eliminadas', { variant: 'success' });
    } catch {
      enqueueSnackbar('Error al eliminar las alertas', { variant: 'error' });
    }
  };

  const handleVerDetalle = (alerta: Alerta) => {
    if (!alerta.leida) {
      marcarLeida.mutate(alerta.id);
    }

    if (alerta.entidadTipo === 'SINIESTRO') {
      navigate(`/app/siniestros/${alerta.entidadId}`);
    } else if (alerta.entidadTipo === 'POLIZA') {
      navigate(`/app/polizas/${alerta.entidadId}`);
    }
  };

  const handleEliminar = async (alerta: Alerta) => {
    try {
      await resolverAlerta.mutateAsync(alerta.id);
      enqueueSnackbar('Alerta eliminada', { variant: 'success' });
    } catch {
      enqueueSnackbar('Error al eliminar la alerta', { variant: 'error' });
    }
  };

  const handleFilterChange = (key: keyof AlertaFilters, value: unknown) => {
    setFilters((prev) => ({ ...prev, [key]: value || undefined }));
  };

  if (isLoading) {
    return (
      <>
        <PageHeader
          title="Alertas"
          subtitle="Plazos y vencimientos pendientes"
        />
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Alertas"
        subtitle="Plazos y vencimientos pendientes"
      />

      <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextField
          select
          size="small"
          label="Tipo de alerta"
          value={filters.tipo || ''}
          onChange={(e) => handleFilterChange('tipo', e.target.value)}
          sx={{ minWidth: 200 }}
        >
          <MenuItem value="">Todas</MenuItem>
          {Object.values(TipoAlerta).map((tipo) => (
            <MenuItem key={tipo} value={tipo}>
              {tipoAlertaLabels[tipo]}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          select
          size="small"
          label="Severidad"
          value={filters.severidad || ''}
          onChange={(e) => handleFilterChange('severidad', e.target.value)}
          sx={{ minWidth: 150 }}
        >
          <MenuItem value="">Todas</MenuItem>
          <MenuItem value={SeveridadAlerta.INFO}>Info</MenuItem>
          <MenuItem value={SeveridadAlerta.WARNING}>Warning</MenuItem>
          <MenuItem value={SeveridadAlerta.CRITICAL}>Crítica</MenuItem>
        </TextField>

        {/* Botón para eliminar todas las alertas */}
        {displayData.length > 0 && (
          <Button
            variant="outlined"
            color="error"
            size="small"
            startIcon={<Close />}
            onClick={handleEliminarTodas}
            disabled={resolverTodas.isPending}
            sx={{ ml: 'auto' }}
          >
            {resolverTodas.isPending ? 'Eliminando...' : 'Eliminar todas'}
          </Button>
        )}
      </Box>

      {displayData.length === 0 ? (
        <Alert severity="success" sx={{ mt: 2 }}>
          🎉 No hay alertas pendientes. ¡Todo está bajo control!
        </Alert>
      ) : (
        <Card>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell width={50}></TableCell>
                  <TableCell>Mensaje</TableCell>
                  <TableCell>Tipo</TableCell>
                  <TableCell>Fecha límite</TableCell>
                  <TableCell align="center">Estado</TableCell>
                  <TableCell align="right">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {displayData.map((alerta) => (
                  <TableRow
                    key={alerta.id}
                    sx={{
                      bgcolor: alerta.leida ? 'transparent' : 'action.hover',
                      '&:hover': { bgcolor: 'action.selected' },
                    }}
                  >
                    <TableCell>{severidadIcons[alerta.severidad]}</TableCell>
                    <TableCell>
                      <Box sx={{ fontWeight: alerta.leida ? 400 : 600 }}>
                        {alerta.mensaje}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={tipoAlertaLabels[alerta.tipo]}
                        size="small"
                        color={severidadAlertaColors[alerta.severidad]}
                      />
                    </TableCell>
                    <TableCell>{formatDate(alerta.fechaLimite)}</TableCell>
                    <TableCell align="center">
                      {alerta.leida ? (
                        <Chip
                          icon={<CheckCircle />}
                          label="Leída"
                          size="small"
                          variant="outlined"
                        />
                      ) : (
                        <Chip label="Nueva" size="small" color="primary" />
                      )}
                    </TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                        <Button
                          size="small"
                          startIcon={<Visibility />}
                          onClick={() => handleVerDetalle(alerta)}
                        >
                          Ver caso
                        </Button>
                        <Tooltip title="Descartar alerta">
                          <Button
                            size="small"
                            color="error"
                            variant="outlined"
                            onClick={() => handleEliminar(alerta)}
                            disabled={resolverAlerta.isPending}
                          >
                            <Close fontSize="small" />
                          </Button>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}
    </>
  );
};
