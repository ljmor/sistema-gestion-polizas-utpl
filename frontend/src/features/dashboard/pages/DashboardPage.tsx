import { useNavigate } from 'react-router-dom';
import {
  Card,
  CardContent,
  Typography,
  Box,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Button,
  Divider,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import {
  Assignment,
  Warning,
  Pending,
  ArrowForward,
  Error as ErrorIcon,
  CheckCircle,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { PageHeader } from '../../../shared/components/PageHeader';
import { StatusChip } from '../../../shared/components/StatusChip';
import { DashboardSkeleton } from '../../../shared/components/LoadingState';
import {
  useDashboardKPIs,
  useCasosRecientes,
  useAlertasCriticas,
} from '../../../infrastructure/queries/dashboard.queries';
import { formatDate } from '../../../shared/utils/dates';
import { severidadAlertaColors, tipoAlertaLabels } from '../../../domain/types/alerta';
import { useAuthStore } from '../../../application/services/authStore';

const KPICard = ({
  title,
  value,
  icon,
  color,
  onClick,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  onClick?: () => void;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
  >
    <Card
      sx={{
        cursor: onClick ? 'pointer' : 'default',
        '&:hover': onClick ? { boxShadow: 4 } : {},
        transition: 'box-shadow 0.2s',
      }}
      onClick={onClick}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box
            sx={{
              p: 1.5,
              borderRadius: 2,
              bgcolor: `${color}.light`,
              color: `${color}.main`,
              display: 'flex',
            }}
          >
            {icon}
          </Box>
          <Box>
            <Typography variant="h4" fontWeight={700}>
              {value}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {title}
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  </motion.div>
);

export const DashboardPage = () => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);

  // Hooks para obtener datos reales de la API
  const { data: kpis, isLoading: kpisLoading } = useDashboardKPIs();
  const { data: casosRecientes, isLoading: casosLoading } = useCasosRecientes();
  const { data: alertasCriticas, isLoading: alertasLoading } = useAlertasCriticas();

  const isLoading = kpisLoading || casosLoading || alertasLoading;

  // Usar datos reales o valores por defecto vacíos
  const displayKPIs = kpis || {
    totalSiniestros: 0,
    siniestrosRecibidos: 0,
    siniestrosEnProceso: 0,
    siniestroCerrados: 0,
    alertasPendientes: 0,
    tasaCierre: 0,
  };
  const displayCasos = casosRecientes || [];
  const displayAlertas = alertasCriticas || [];

  if (isLoading) {
    return (
      <>
        <PageHeader title={`Bienvenido, ${user?.name || 'Usuario'}`} />
        <DashboardSkeleton />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title={`Bienvenido, ${user?.name || 'Usuario'}`}
        subtitle="Gestión de Póliza de Vida Estudiantil UTPL"
      />

      <Grid container spacing={3}>
        {/* KPIs - Datos reales del backend */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <KPICard
            title="Total siniestros"
            value={displayKPIs.totalSiniestros || 0}
            icon={<Assignment />}
            color="primary"
            onClick={() => navigate('/app/siniestros')}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <KPICard
            title="En proceso"
            value={displayKPIs.siniestrosEnProceso || 0}
            icon={<Pending />}
            color="warning"
            onClick={() => navigate('/app/siniestros')}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <KPICard
            title="Cerrados"
            value={displayKPIs.siniestroCerrados || 0}
            icon={<CheckCircle />}
            color="success"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <KPICard
            title="Alertas pendientes"
            value={displayKPIs.alertasPendientes || 0}
            icon={<Warning />}
            color="error"
            onClick={() => navigate('/app/alertas')}
          />
        </Grid>

        {/* Casos recientes */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Card>
            <CardContent>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: 2,
                }}
              >
                <Typography variant="h6">Mis casos recientes</Typography>
                <Button
                  size="small"
                  endIcon={<ArrowForward />}
                  onClick={() => navigate('/app/siniestros')}
                >
                  Ver todos
                </Button>
              </Box>
              <Divider sx={{ mb: 2 }} />
              {displayCasos.length === 0 ? (
                <Typography color="text.secondary" align="center" sx={{ py: 4 }}>
                  No hay casos recientes
                </Typography>
              ) : (
                <List disablePadding>
                  {displayCasos.map((caso, index) => (
                    <ListItem
                      key={caso.id}
                      divider={index < displayCasos.length - 1}
                      sx={{
                        cursor: 'pointer',
                        '&:hover': { bgcolor: 'action.hover' },
                        borderRadius: 1,
                      }}
                      onClick={() => navigate(`/app/siniestros/${caso.id}`)}
                    >
                      <ListItemText
                        primary={
                          <Box
                            sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                          >
                            <Typography fontWeight={600}>#{caso.caseCode}</Typography>
                            <StatusChip estado={caso.estado as any} />
                          </Box>
                        }
                        secondary={
                          <>
                            {caso.fallecido.nombreCompleto} - {caso.fallecido.cedula}
                            <br />
                            Defunción: {formatDate(caso.fechaDefuncion)}
                          </>
                        }
                      />
                      {caso.diasRestantes60 !== null && caso.diasRestantes60 < 15 && (
                        <Chip
                          label={`${caso.diasRestantes60}d`}
                          color="error"
                          size="small"
                        />
                      )}
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Alertas críticas */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: 2,
                }}
              >
                <Typography variant="h6">Alertas críticas</Typography>
                <Button
                  size="small"
                  endIcon={<ArrowForward />}
                  onClick={() => navigate('/app/alertas')}
                >
                  Ver todas
                </Button>
              </Box>
              <Divider sx={{ mb: 2 }} />
              {displayAlertas.length === 0 ? (
                <Typography color="text.secondary" align="center" sx={{ py: 4 }}>
                  No hay alertas críticas
                </Typography>
              ) : (
                <List disablePadding>
                  {displayAlertas.slice(0, 5).map((alerta, index) => (
                    <ListItem
                      key={alerta.id}
                      divider={index < Math.min(displayAlertas.length, 5) - 1}
                      sx={{ px: 0 }}
                    >
                      <ListItemIcon sx={{ minWidth: 36 }}>
                        <ErrorIcon
                          color={severidadAlertaColors[alerta.severidad]}
                          fontSize="small"
                        />
                      </ListItemIcon>
                      <ListItemText
                        primary={alerta.mensaje}
                        secondary={
                          <Chip
                            label={tipoAlertaLabels[alerta.tipo]}
                            size="small"
                            color={severidadAlertaColors[alerta.severidad]}
                            sx={{ mt: 0.5 }}
                          />
                        }
                        primaryTypographyProps={{ variant: 'body2' }}
                        secondaryTypographyProps={{ component: 'div' }}
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </>
  );
};