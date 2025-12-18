import { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
} from '@mui/material';
import { CalendarMonth, Add, Lock, CheckCircle } from '@mui/icons-material';
import { Vigencia } from '../../../domain/types/poliza';
import { formatDate } from '../../../shared/utils/dates';
import { useCreateVigencia, useCerrarVigencia } from '../../../infrastructure/queries/polizas.queries';
import { useSnackbar } from 'notistack';

interface PolizaVigenciaCardProps {
  vigenciaActual: Vigencia | null;
  vigencias: Vigencia[];
  polizaId: string;
}

export const PolizaVigenciaCard = ({
  vigenciaActual,
  vigencias,
  polizaId,
}: PolizaVigenciaCardProps) => {
  const [openNueva, setOpenNueva] = useState(false);
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  
  const { enqueueSnackbar } = useSnackbar();
  const createVigencia = useCreateVigencia();
  const cerrarVigencia = useCerrarVigencia();

  const handleCrearVigencia = async () => {
    if (!desde || !hasta) {
      enqueueSnackbar('Debe ingresar fechas válidas', { variant: 'warning' });
      return;
    }

    try {
      await createVigencia.mutateAsync({
        polizaId,
        data: { desde, hasta },
      });
      enqueueSnackbar('Vigencia creada correctamente', { variant: 'success' });
      setOpenNueva(false);
      setDesde('');
      setHasta('');
    } catch (error) {
      enqueueSnackbar('Error al crear vigencia', { variant: 'error' });
    }
  };

  const handleCerrarVigencia = async () => {
    if (!vigenciaActual) return;

    try {
      await cerrarVigencia.mutateAsync({
        polizaId,
        vigenciaId: vigenciaActual.id,
      });
      enqueueSnackbar('Vigencia cerrada correctamente', { variant: 'success' });
    } catch (error) {
      enqueueSnackbar('Error al cerrar vigencia', { variant: 'error' });
    }
  };

  const isLoading = createVigencia.isPending || cerrarVigencia.isPending;

  return (
    <>
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Vigencia
          </Typography>
          <Divider sx={{ mb: 2 }} />

          {/* Vigencia actual */}
          {vigenciaActual ? (
            <Box
              sx={{
                p: 2,
                bgcolor: 'primary.light',
                borderRadius: 1,
                color: 'white',
                mb: 3,
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="subtitle2">Vigencia actual</Typography>
                <Chip
                  label={vigenciaActual.activa ? 'Activa' : 'Cerrada'}
                  size="small"
                  sx={{ 
                    bgcolor: vigenciaActual.activa ? 'white' : '#e0e0e0', 
                    color: vigenciaActual.activa ? 'primary.main' : '#666' 
                  }}
                />
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CalendarMonth />
                <Typography variant="h6">
                  {formatDate(vigenciaActual.desde)} - {formatDate(vigenciaActual.hasta)}
                </Typography>
              </Box>
            </Box>
          ) : (
            <Box
              sx={{
                p: 2,
                bgcolor: 'grey.200',
                borderRadius: 1,
                mb: 3,
                textAlign: 'center',
              }}
            >
              <Typography color="text.secondary">
                No hay vigencia activa
              </Typography>
            </Box>
          )}

          {/* Acciones */}
          <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
            <Button 
              variant="outlined" 
              startIcon={isLoading ? <CircularProgress size={20} /> : <Lock />}
              onClick={handleCerrarVigencia}
              disabled={!vigenciaActual?.activa || isLoading}
            >
              Cerrar vigencia
            </Button>
            <Button 
              variant="contained" 
              startIcon={<Add />}
              onClick={() => setOpenNueva(true)}
              disabled={isLoading}
            >
              Abrir nueva vigencia
            </Button>
          </Box>

          {/* Historial de vigencias */}
          <Typography variant="subtitle2" gutterBottom>
            Historial de vigencias
          </Typography>
          {vigencias.length > 0 ? (
            <List dense>
              {vigencias.map((vigencia) => (
                <ListItem key={vigencia.id}>
                  <ListItemIcon>
                    {vigencia.activa ? (
                      <CheckCircle color="success" />
                    ) : (
                      <CalendarMonth color="disabled" />
                    )}
                  </ListItemIcon>
                  <ListItemText
                    primary={`${formatDate(vigencia.desde)} - ${formatDate(vigencia.hasta)}`}
                    secondary={vigencia.activa ? 'Vigencia actual' : 'Vigencia cerrada'}
                  />
                </ListItem>
              ))}
            </List>
          ) : (
            <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
              No hay vigencias registradas
            </Typography>
          )}
        </CardContent>
      </Card>

      {/* Dialog para crear nueva vigencia */}
      <Dialog open={openNueva} onClose={() => setOpenNueva(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Crear nueva vigencia</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              label="Fecha de inicio"
              type="date"
              value={desde}
              onChange={(e) => setDesde(e.target.value)}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
            <TextField
              label="Fecha de fin"
              type="date"
              value={hasta}
              onChange={(e) => setHasta(e.target.value)}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenNueva(false)} disabled={isLoading}>
            Cancelar
          </Button>
          <Button 
            variant="contained" 
            onClick={handleCrearVigencia}
            disabled={isLoading || !desde || !hasta}
          >
            {isLoading ? <CircularProgress size={20} /> : 'Crear'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
