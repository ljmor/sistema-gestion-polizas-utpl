import { useState } from 'react';
import {
  Card,
  CardContent,
  Tabs,
  Tab,
  Box,
  TextField,
  MenuItem,
  Button,
  Grid,
  Typography,
  Divider,
  useTheme,
  CircularProgress,
  Alert,
} from '@mui/material';
import { Download, TrendingUp, People, AttachMoney, Assignment } from '@mui/icons-material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  Line,
  Area,
  AreaChart,
  ComposedChart,
} from 'recharts';
import { PageHeader } from '../../../shared/components/PageHeader';
import { DataTable, Column } from '../../../shared/components/DataTable';
import { exportToCSV } from '../../../infrastructure/queries/reportes.queries';
import { useDashboardKPIs, useEstadisticasReportes } from '../../../infrastructure/queries/dashboard.queries';
import { formatCurrency } from '../../../infrastructure/api/mappers';
import { formatDate } from '../../../shared/utils/dates';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = ({ children, value, index }: TabPanelProps) => (
  <div hidden={value !== index}>{value === index && <Box sx={{ py: 3 }}>{children}</Box>}</div>
);

// Colores para gráficos
const COLORS = ['#1976D2', '#4CAF50', '#FF9800', '#F44336', '#9C27B0', '#00BCD4'];
const ESTADO_COLORS: Record<string, string> = {
  'Recibido': '#90CAF9',
  'En Validación': '#FFE082',
  'Beneficiarios': '#A5D6A7',
  'Liquidación': '#CE93D8',
  'Pago': '#80DEEA',
  'Cerrado': '#81C784',
  'Inválido': '#EF9A9A',
};

export const ReportesPage = () => {
  const theme = useTheme();
  const [tabValue, setTabValue] = useState(0);

  // Obtener datos reales del backend
  const { data: kpis, isLoading: kpisLoading } = useDashboardKPIs();
  const { data: estadisticas, isLoading: statsLoading } = useEstadisticasReportes();

  const isLoading = kpisLoading || statsLoading;

  // Columnas para las tablas usando datos reales
  const columnsCostos: Column<NonNullable<typeof estadisticas>['relacionPolizaSiniestros'][0]>[] = [
    { id: 'poliza', label: 'Póliza' },
    { id: 'prima', label: 'Prima Total', align: 'right', render: (row) => formatCurrency(row.prima) },
    { id: 'siniestros', label: 'Siniestros Pagados', align: 'right', render: (row) => formatCurrency(row.siniestros) },
    { id: 'siniestrosCount', label: '# Siniestros', align: 'center' },
    { id: 'ratio', label: 'Ratio %', align: 'center', render: (row) => `${row.ratio.toFixed(2)}%` },
  ];

  const columnsEstado: Column<NonNullable<typeof estadisticas>['estadoSiniestros'][0]>[] = [
    { id: 'caseCode', label: '#Caso' },
    { id: 'fallecido', label: 'Fallecido' },
    { id: 'fechaDefuncion', label: 'Fecha Defunción', render: (row) => formatDate(row.fechaDefuncion) },
    { id: 'estado', label: 'Estado' },
    { id: 'diasEnProceso', label: 'Días en Proceso', align: 'center' },
    { id: 'montoLiquidado', label: 'Monto Liquidado', align: 'right', render: (row) => row.montoLiquidado ? formatCurrency(row.montoLiquidado) : '-' },
  ];

  const handleExport = (data: Record<string, unknown>[], filename: string) => {
    exportToCSV(data, filename);
  };

  const StatCard = ({ icon, title, value, subvalue, color }: { 
    icon: React.ReactNode; 
    title: string; 
    value: string | number; 
    subvalue?: string;
    color: string;
  }) => (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <Box sx={{ 
            p: 1, 
            borderRadius: 2, 
            bgcolor: `${color}20`,
            color: color,
            display: 'flex',
          }}>
            {icon}
          </Box>
          <Typography variant="body2" color="text.secondary">{title}</Typography>
        </Box>
        <Typography variant="h4" fontWeight={700} color={color}>{value}</Typography>
        {subvalue && (
          <Typography variant="caption" color="text.secondary">{subvalue}</Typography>
        )}
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  // Si no hay datos
  if (!estadisticas || !kpis) {
    return (
      <>
        <PageHeader
          title="Reportes y Estadísticas"
          subtitle="Análisis integral de pólizas y siniestros"
        />
        <Alert severity="info">
          No hay datos suficientes para mostrar reportes. Los reportes se generarán automáticamente 
          cuando existan siniestros y pólizas registrados en el sistema.
        </Alert>
      </>
    );
  }

  // Calcular ratio de siniestralidad
  const totalPrimas = estadisticas.relacionPolizaSiniestros.reduce((sum, p) => sum + p.prima, 0);
  const totalSiniestrosPagados = estadisticas.relacionPolizaSiniestros.reduce((sum, p) => sum + p.siniestros, 0);
  const ratioSiniestralidad = totalPrimas > 0 ? Math.round((totalSiniestrosPagados / totalPrimas) * 100) : 0;

  return (
    <>
      <PageHeader
        title="Reportes y Estadísticas"
        subtitle="Análisis integral de pólizas y siniestros"
      />

      {/* KPIs principales - datos reales */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            icon={<Assignment />}
            title="Total Siniestros"
            value={kpis.totalSiniestros || 0}
            subvalue={`${kpis.siniestroCerrados || 0} cerrados`}
            color="#1976D2"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            icon={<AttachMoney />}
            title="Monto Total Liquidado"
            value={formatCurrency(kpis.montoTotalLiquidado || 0)}
            subvalue={`Promedio: ${formatCurrency(kpis.promedioLiquidacion || 0)}/caso`}
            color="#4CAF50"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            icon={<People />}
            title="Pólizas Activas"
            value={kpis.totalPolizas || 0}
            subvalue="En el sistema"
            color="#FF9800"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            icon={<TrendingUp />}
            title="Ratio Siniestralidad"
            value={`${ratioSiniestralidad}%`}
            subvalue="Meta: < 70%"
            color={ratioSiniestralidad > 70 ? '#F44336' : '#9C27B0'}
          />
        </Grid>
      </Grid>

      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)}>
            <Tab label="Siniestralidad" />
            <Tab label="Relación Póliza/Siniestros" />
            <Tab label="Estado de Siniestros" />
          </Tabs>
        </Box>

        {/* Tab: Siniestralidad */}
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            {/* Gráfico de evolución */}
            <Grid size={{ xs: 12, md: 8 }}>
              <Typography variant="h6" gutterBottom>Evolución de Siniestros (Últimos 6 meses)</Typography>
              {estadisticas.evolucionMensual.length > 0 ? (
                <Box sx={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={estadisticas.evolucionMensual}>
                      <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                      <XAxis dataKey="mes" />
                      <YAxis />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: theme.palette.background.paper,
                          border: `1px solid ${theme.palette.divider}`,
                          borderRadius: 8,
                        }}
                      />
                      <Legend />
                      <Bar dataKey="cantidad" fill="#1976D2" name="Cantidad" radius={[4, 4, 0, 0]} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </Box>
              ) : (
                <Alert severity="info">No hay datos de evolución mensual disponibles</Alert>
              )}
            </Grid>

            {/* Gráfico por tipo */}
            <Grid size={{ xs: 12, md: 4 }}>
              <Typography variant="h6" gutterBottom>Por Tipo de Siniestro</Typography>
              {estadisticas.siniestrosPorTipo.length > 0 ? (
                <Box sx={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={estadisticas.siniestrosPorTipo}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        innerRadius={60}
                        paddingAngle={2}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                      >
                        {estadisticas.siniestrosPorTipo.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </Box>
              ) : (
                <Alert severity="info">No hay datos de tipos de siniestro disponibles</Alert>
              )}
            </Grid>

            {/* Gráfico por estado */}
            <Grid size={{ xs: 12 }}>
              <Typography variant="h6" gutterBottom>Distribución por Estado</Typography>
              {estadisticas.siniestrosPorEstado.length > 0 ? (
                <Box sx={{ height: 250 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={estadisticas.siniestrosPorEstado} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                      <XAxis type="number" />
                      <YAxis dataKey="estado" type="category" width={100} />
                      <Tooltip />
                      <Bar dataKey="cantidad" radius={[0, 4, 4, 0]}>
                        {estadisticas.siniestrosPorEstado.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={ESTADO_COLORS[entry.estado] || COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              ) : (
                <Alert severity="info">No hay datos de estados de siniestro disponibles</Alert>
              )}
            </Grid>
          </Grid>
        </TabPanel>

        {/* Tab: Relación Póliza/Siniestros */}
        <TabPanel value={tabValue} index={1}>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12 }}>
              <Typography variant="h6" gutterBottom>
                Relación Prima vs Siniestros por Póliza
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Este gráfico muestra la relación entre las primas y los siniestros liquidados por cada póliza.
                Un ratio alto indica mayor uso de la cobertura.
              </Typography>
              {estadisticas.relacionPolizaSiniestros.length > 0 ? (
                <Box sx={{ height: 350 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={estadisticas.relacionPolizaSiniestros}>
                      <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                      <XAxis dataKey="poliza" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="prima" fill="#1976D2" name="Prima Total" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="siniestros" fill="#F44336" name="Siniestros Pagados" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              ) : (
                <Alert severity="info">No hay datos de pólizas disponibles</Alert>
              )}
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="h6" gutterBottom>Ratio de Siniestralidad por Póliza</Typography>
              {estadisticas.relacionPolizaSiniestros.length > 0 ? (
                <Box sx={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={estadisticas.relacionPolizaSiniestros}>
                      <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                      <XAxis dataKey="poliza" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip />
                      <defs>
                        <linearGradient id="colorRatio" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#FF9800" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#FF9800" stopOpacity={0.1}/>
                        </linearGradient>
                      </defs>
                      <Area 
                        type="monotone" 
                        dataKey="ratio" 
                        stroke="#FF9800" 
                        fill="url(#colorRatio)"
                        name="Ratio %"
                      />
                      {/* Línea de meta */}
                      <Line 
                        type="monotone" 
                        dataKey={() => 70} 
                        stroke="#F44336" 
                        strokeDasharray="5 5"
                        name="Meta (70%)"
                        dot={false}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </Box>
              ) : (
                <Alert severity="info">No hay datos disponibles</Alert>
              )}
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="h6" gutterBottom>Número de Siniestros por Póliza</Typography>
              {estadisticas.relacionPolizaSiniestros.length > 0 ? (
                <Box sx={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={estadisticas.relacionPolizaSiniestros}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        innerRadius={50}
                        dataKey="siniestrosCount"
                        nameKey="poliza"
                        label={({ name, value }: { name: string; value: number }) => `${name}: ${value}`}
                      >
                        {estadisticas.relacionPolizaSiniestros.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </Box>
              ) : (
                <Alert severity="info">No hay datos disponibles</Alert>
              )}
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Divider sx={{ my: 2 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Detalle de Costos</Typography>
                <Button
                  variant="outlined"
                  startIcon={<Download />}
                  onClick={() => handleExport(estadisticas.relacionPolizaSiniestros as any, 'reporte-costos')}
                  disabled={estadisticas.relacionPolizaSiniestros.length === 0}
                >
                  Exportar CSV
                </Button>
              </Box>
              <DataTable columns={columnsCostos} data={estadisticas.relacionPolizaSiniestros} />
            </Grid>
          </Grid>
        </TabPanel>

        {/* Tab: Estado de Siniestros */}
        <TabPanel value={tabValue} index={2}>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
            <Button
              variant="outlined"
              startIcon={<Download />}
              onClick={() => handleExport(estadisticas.estadoSiniestros as any, 'reporte-estado-siniestros')}
              disabled={estadisticas.estadoSiniestros.length === 0}
            >
              Exportar CSV
            </Button>
          </Box>
          {estadisticas.estadoSiniestros.length > 0 ? (
            <DataTable columns={columnsEstado} data={estadisticas.estadoSiniestros} />
          ) : (
            <Alert severity="info">No hay siniestros registrados en el sistema</Alert>
          )}
        </TabPanel>
      </Card>
    </>
  );
};
