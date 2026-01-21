import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Tabs,
  Tab,
  Button,
  Chip,
  List,
  ListItem,
  ListItemText,
  Divider,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  ArrowBack,
  Phone,
  Email,
  Warning,
  LockOpen,
} from '@mui/icons-material';
import { PageHeader } from '../../../shared/components/PageHeader';
import { StatusChip } from '../../../shared/components/StatusChip';
import { StepTimeline } from '../../../shared/components/StepTimeline';
import { LoadingState } from '../../../shared/components/LoadingState';
import { SiniestroStepPanel } from '../components/SiniestroStepPanel';
import { CaseAuditTrail } from '../components/CaseAuditTrail';
import { useSiniestro } from '../../../infrastructure/queries/siniestros.queries';
import { EstadoSiniestro, TipoSiniestro, EstadoDocumento, EstadoFirma, EstadoPago, EstadoLiquidacion } from '../../../domain/enums/estados';
import { formatDate } from '../../../shared/utils/dates';
import { Siniestro } from '../../../domain/types/siniestro';
import { DOCUMENTOS_BASE_NATURAL, DOCUMENTOS_ADICIONALES_ACCIDENTE } from '../../../shared/utils/constants';

const stepToTab: Record<EstadoSiniestro, number> = {
  [EstadoSiniestro.RECIBIDO]: 0,
  [EstadoSiniestro.EN_VALIDACION]: 1,
  [EstadoSiniestro.BENEFICIARIOS]: 2,
  [EstadoSiniestro.LIQUIDACION]: 3,
  [EstadoSiniestro.PAGO]: 4,
  [EstadoSiniestro.CERRADO]: 4,
  [EstadoSiniestro.INVALIDO]: 0, // Casos inválidos muestran solo recepción
};

export const SiniestroDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: siniestro, isLoading } = useSiniestro(id || '');

  // Mock data para desarrollo (se usa solo mientras carga el backend)
  const mockSiniestro: Siniestro = {
    id: '1',
    caseCode: 'SIN-2024-001',
    fallecido: {
      id: '1',
      nombreCompleto: 'Juan Pérez García',
      cedula: '1104567890',
      fechaDefuncion: '2024-01-15',
    },
    reportante: {
      id: '1',
      nombre: 'María Pérez López',
      relacion: 'FAMILIAR',
      email: 'maria.perez@email.com',
      telefono: '0991234567',
    },
    tipo: TipoSiniestro.NATURAL,
    tipoPreliminar: TipoSiniestro.NATURAL,
    estado: EstadoSiniestro.RECIBIDO, // Iniciar en RECIBIDO para consistencia
    observaciones: 'Fallecimiento por causas naturales',
    polizaId: 'POL-001',
    grupoAsegurado: 'ESTUDIANTES',
    montoCobertura: 15000,
    fechaReporte: '2024-01-15',
    documentos: [
      { id: '1', nombre: 'Cédula del fallecido', tipo: 'CEDULA_FALLECIDO', estado: EstadoDocumento.RECIBIDO, requerido: true, fechaSubida: '2024-01-16' },
      { id: '2', nombre: 'Certificado de defunción', tipo: 'CERTIFICADO_DEFUNCION', estado: EstadoDocumento.RECIBIDO, requerido: true, fechaSubida: '2024-01-16' },
      { id: '3', nombre: 'Posesión efectiva', tipo: 'POSESION_EFECTIVA', estado: EstadoDocumento.PENDIENTE, requerido: true },
      { id: '4', nombre: 'Cédulas de beneficiarios', tipo: 'CEDULAS_BENEFICIARIOS', estado: EstadoDocumento.PENDIENTE, requerido: true },
    ],
    beneficiarios: [
      { id: '1', nombre: 'María Pérez López', cedula: '1105678901', relacion: 'Cónyuge', porcentaje: 50, cuentaBancaria: '2200123456', banco: 'Banco Pichincha', estadoFirma: EstadoFirma.PENDIENTE },
      { id: '2', nombre: 'Carlos Pérez López', cedula: '1106789012', relacion: 'Hijo', porcentaje: 50, cuentaBancaria: '2200654321', banco: 'Banco Guayaquil', estadoFirma: EstadoFirma.PENDIENTE },
    ],
    liquidacion: {
      estado: EstadoLiquidacion.ENVIADO,
    },
    pago: {
      estadoPago: EstadoPago.PENDIENTE,
    },
    auditTrail: [
      { id: '1', usuario: 'Sistema', accion: 'Caso creado desde portal público', fecha: '2024-01-15T10:30:00' },
      { id: '2', usuario: 'Juan Gestor', accion: 'Cambió estado a En Validación', fecha: '2024-01-16T09:15:00' },
      { id: '3', usuario: 'Juan Gestor', accion: 'Documentos recibidos: Cédula, Certificado defunción', fecha: '2024-01-16T14:20:00' },
    ],
    diasRestantes60: 45,
    diasHabilesRestantes15: 10,
    horasRestantes72: 48,
    createdAt: '2024-01-15T10:30:00',
    updatedAt: '2024-01-16T14:20:00',
  };

  const displayData = siniestro || mockSiniestro;
  const [activeTab, setActiveTab] = useState(0); // Iniciar en Recepción
  const [reopenDialogOpen, setReopenDialogOpen] = useState(false);

  // Actualizar tab cuando se carguen los datos del siniestro
  useEffect(() => {
    if (siniestro) {
      setActiveTab(stepToTab[siniestro.estado]);
    }
  }, [siniestro]);

  if (isLoading) {
    return <LoadingState message="Cargando caso..." />;
  }

  // Determinar si el plazo 60d expiró (bloqueado)
  const plazo60dExpirado = displayData.diasRestantes60 === 0 && !displayData.plazo60dCompletado;
  const plazo60dCumplido = displayData.plazo60dCompletado === true;
  
  // Determinar si el caso está cerrado definitivamente (no se puede reabrir)
  const casoCerradoDefinitivo = displayData.estado === EstadoSiniestro.CERRADO;
  
  // Obtener lista de documentos requeridos según tipo de siniestro
  const documentosRequeridos = displayData.tipo === TipoSiniestro.ACCIDENTE
    ? [...DOCUMENTOS_BASE_NATURAL, ...DOCUMENTOS_ADICIONALES_ACCIDENTE]
    : DOCUMENTOS_BASE_NATURAL;

  // Verificar si todos los documentos REQUERIDOS están validados (recibidos)
  const allDocsRecibidos = documentosRequeridos
    .filter(docReq => docReq.requerido) // Solo los obligatorios
    .every(docReq => {
      const doc = displayData.documentos?.find(d => d.tipo === docReq.tipo);
      return doc && doc.estado === EstadoDocumento.RECIBIDO;
    });
  
  // Verificar si todas las firmas de beneficiarios están recibidas
  const allFirmasRecibidas = displayData.beneficiarios?.length > 0 &&
    displayData.beneficiarios.every(b => b.estadoFirma === EstadoFirma.RECIBIDA);
  
  // La liquidación está aprobada
  const liquidacionAprobada = displayData.liquidacion?.estado === EstadoLiquidacion.APROBADO;
  
  // Verificar si ya se envió a beneficiarios (el estado cambia a PAGO después de enviar)
  const yaEnviadoABeneficiarios = displayData.estado === EstadoSiniestro.PAGO || 
    displayData.estado === EstadoSiniestro.CERRADO;
  
  // Condiciones para habilitar tabs progresivamente
  const canAccessLiquidacion = allDocsRecibidos && allFirmasRecibidas;
  const canAccessPago = liquidacionAprobada || yaEnviadoABeneficiarios;

  const alerts = [];
  
  // Alerta de plazo 60d
  if (plazo60dExpirado) {
    alerts.push({
      severity: 'error' as const,
      message: '⚠️ PLAZO EXPIRADO: El plazo de 60 días para reportar a la aseguradora ha vencido. El caso está bloqueado.',
      action: !casoCerradoDefinitivo ? (
        <Button 
          size="small" 
          color="inherit" 
          startIcon={<LockOpen />}
          onClick={() => setReopenDialogOpen(true)}
        >
          Solicitar reapertura
        </Button>
      ) : undefined,
    });
  } else if (plazo60dCumplido) {
    alerts.push({
      severity: 'success' as const,
      message: '✅ Plazo 60d cumplido: Expediente enviado a la aseguradora',
    });
  } else if (displayData.diasRestantes60 !== null && displayData.diasRestantes60 !== undefined) {
    if (displayData.diasRestantes60 <= 5) {
      alerts.push({
        severity: 'error' as const,
        message: `🚨 URGENTE: Quedan ${displayData.diasRestantes60} días para reportar a la aseguradora`,
      });
    } else if (displayData.diasRestantes60 <= 15) {
      alerts.push({
        severity: 'warning' as const,
        message: `⏰ Quedan ${displayData.diasRestantes60} días para reportar a la aseguradora`,
      });
    }
  }

  if (displayData.diasHabilesRestantes15 && displayData.diasHabilesRestantes15 < 5) {
    alerts.push({
      severity: 'error' as const,
      message: `Aseguradora: quedan ${displayData.diasHabilesRestantes15} días hábiles`,
    });
  }
  if (displayData.horasRestantes72 && displayData.horasRestantes72 < 24) {
    alerts.push({
      severity: 'error' as const,
      message: `Pago: quedan ${displayData.horasRestantes72} horas`,
    });
  }

  return (
    <>
      <PageHeader
        title={`Caso #${displayData.caseCode}`}
        breadcrumbs={[
          { label: 'Siniestros', href: '/app/siniestros' },
          { label: `#${displayData.caseCode}` },
        ]}
        actions={
          <Button
            startIcon={<ArrowBack />}
            onClick={() => navigate('/app/siniestros')}
          >
            Volver
          </Button>
        }
      />

      <Grid container spacing={3} sx={{ alignItems: 'flex-start' }}>
        {/* Columna izquierda - Resumen */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Resumen del caso
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" color="text.secondary">
                  Estado
                </Typography>
                <Box sx={{ mt: 0.5 }}>
                  <StatusChip estado={displayData.estado} animated />
                </Box>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" color="text.secondary">
                  Fallecido
                </Typography>
                <Typography fontWeight={600}>
                  {displayData.fallecido.nombreCompleto}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  CI: {displayData.fallecido.cedula}
                </Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" color="text.secondary">
                  Tipo de siniestro
                </Typography>
                <Box sx={{ mt: 0.5 }}>
                  <Chip
                    label={displayData.tipo === TipoSiniestro.NATURAL ? 'Natural' : 'Accidente'}
                    size="small"
                    color={displayData.tipo === TipoSiniestro.ACCIDENTE ? 'error' : 'default'}
                  />
                </Box>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" color="text.secondary">
                  Fecha de defunción
                </Typography>
                <Typography>
                  {displayData.fechaDefuncion || displayData.fallecido?.fechaDefuncion 
                    ? formatDate(displayData.fechaDefuncion || displayData.fallecido?.fechaDefuncion)
                    : 'No registrada'}
                </Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" color="text.secondary">
                  Monto cobertura
                </Typography>
                <Typography fontWeight={600} color="primary">
                  ${displayData.montoCobertura?.toLocaleString() || 'Por determinar'}
                </Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" color="text.secondary">
                  Fecha de reporte
                </Typography>
                <Typography>
                  {displayData.fechaReporte ? formatDate(displayData.fechaReporte) : 'No registrada'}
                </Typography>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Typography variant="subtitle2" gutterBottom>
                Reportante
              </Typography>
              <Typography>{displayData.reportante.nombre}</Typography>
              <Typography variant="body2" color="text.secondary">
                {displayData.reportante.relacion}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1 }}>
                <Email fontSize="small" color="action" />
                <Typography variant="body2">{displayData.reportante.email}</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                <Phone fontSize="small" color="action" />
                <Typography variant="body2">{displayData.reportante.telefono}</Typography>
              </Box>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Etapas del proceso
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <StepTimeline
                currentStep={displayData.estado}
                onStepClick={(step) => setActiveTab(stepToTab[step])}
                clickable
                orientation="vertical"
              />
            </CardContent>
          </Card>

          {/* Alertas */}
          {alerts.length > 0 && (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Warning color="warning" />
                  Alertas del caso
                </Typography>
                <Divider sx={{ mb: 2 }} />
                {alerts.map((alert, index) => (
                  <Alert 
                    key={index} 
                    severity={alert.severity} 
                    sx={{ mb: 1 }}
                    action={alert.action}
                  >
                    {alert.message}
                  </Alert>
                ))}
              </CardContent>
            </Card>
          )}
        </Grid>

        {/* Columna derecha - Contenido por etapa */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Card>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs
                value={activeTab}
                onChange={(_, value) => setActiveTab(value)}
                variant="scrollable"
                scrollButtons="auto"
              >
                <Tab 
                  label="Recepción" 
                  disabled={plazo60dExpirado}
                />
                <Tab 
                  label="Validación" 
                  disabled={
                    plazo60dExpirado ||
                    displayData.estado === EstadoSiniestro.INVALIDO || 
                    displayData.estado === EstadoSiniestro.RECIBIDO
                  }
                />
                <Tab 
                  label="Beneficiarios" 
                  disabled={
                    plazo60dExpirado ||
                    displayData.estado === EstadoSiniestro.INVALIDO ||
                    displayData.estado === EstadoSiniestro.RECIBIDO
                    // Beneficiarios disponible desde EN_VALIDACION para poder añadir beneficiarios
                    // y enviarles notificaciones de documentos faltantes
                  }
                />
                <Tab 
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      Liquidación
                      {!canAccessLiquidacion && displayData.estado !== EstadoSiniestro.INVALIDO && (
                        <Chip size="small" label="🔒" sx={{ ml: 0.5, height: 18 }} />
                      )}
                    </Box>
                  }
                  disabled={
                    plazo60dExpirado ||
                    displayData.estado === EstadoSiniestro.INVALIDO ||
                    displayData.estado === EstadoSiniestro.RECIBIDO ||
                    !canAccessLiquidacion // Solo habilitado si docs y firmas completos
                  }
                />
                <Tab 
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      Pago/Cierre
                      {!canAccessPago && displayData.estado !== EstadoSiniestro.INVALIDO && (
                        <Chip size="small" label="🔒" sx={{ ml: 0.5, height: 18 }} />
                      )}
                    </Box>
                  }
                  disabled={
                    plazo60dExpirado ||
                    displayData.estado === EstadoSiniestro.INVALIDO ||
                    !canAccessPago // Solo habilitado si liquidación aprobada
                  }
                />
              </Tabs>
            </Box>
            <CardContent>
              <SiniestroStepPanel
                step={activeTab}
                siniestro={displayData}
              />
            </CardContent>
          </Card>

          {/* Audit Trail */}
          <Card sx={{ mt: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Historial de cambios
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <CaseAuditTrail events={displayData.auditTrail} />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Dialog de reapertura por plazo expirado */}
      <Dialog 
        open={reopenDialogOpen} 
        onClose={() => setReopenDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ color: 'warning.main' }}>
          ⚠️ Advertencia: Reapertura de Caso
        </DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            <Typography variant="body2" fontWeight="bold">
              El plazo de 60 días para reportar a la aseguradora ha expirado.
            </Typography>
          </Alert>
          <Typography variant="body2" paragraph>
            La reapertura de este caso <strong>SOLO debe realizarse</strong> si cuenta con la 
            aprobación expresa de la aseguradora para continuar con el proceso fuera de plazo.
          </Typography>
          <Typography variant="body2" paragraph color="text.secondary">
            Esta acción queda registrada y es responsabilidad del gestor verificar 
            que exista autorización de la aseguradora para proceder.
          </Typography>
          <Alert severity="info" sx={{ mt: 2 }}>
            Al reabrir, el caso regresará al estado anterior para continuar su gestión.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReopenDialogOpen(false)}>
            Cancelar
          </Button>
          <Button 
            variant="contained" 
            color="warning"
            onClick={() => {
              // TODO: Implementar lógica de reapertura
              setReopenDialogOpen(false);
            }}
          >
            Confirmar reapertura
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
