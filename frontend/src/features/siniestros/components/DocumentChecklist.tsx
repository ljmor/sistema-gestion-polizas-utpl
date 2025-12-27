import React, { useState } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Checkbox,
} from '@mui/material';
import {
  CheckCircle,
  Cancel,
  HourglassEmpty,
  Upload,
  Visibility,
  ContentCopy,
  Email,
  Download,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { Siniestro, Documento } from '../../../domain/types/siniestro';
import { EstadoDocumento, TipoSiniestro } from '../../../domain/enums/estados';
import { FileDropzone } from '../../../shared/components/FileDropzone';
import { 
  useUploadDocumento, 
  useUpdateDocumento,
  useSolicitarDocumentosBeneficiarios,
} from '../../../infrastructure/queries/siniestros.queries';
import { DOCUMENTOS_BASE_NATURAL, DOCUMENTOS_ADICIONALES_ACCIDENTE } from '../../../shared/utils/constants';

interface DocumentChecklistProps {
  siniestro: Siniestro;
}

const estadoIcons: Record<EstadoDocumento, React.ReactElement> = {
  [EstadoDocumento.PENDIENTE]: <HourglassEmpty color="warning" />,
  [EstadoDocumento.RECIBIDO]: <CheckCircle color="success" />,
  [EstadoDocumento.RECHAZADO]: <Cancel color="error" />,
};

const estadoColors: Record<EstadoDocumento, 'warning' | 'success' | 'error'> = {
  [EstadoDocumento.PENDIENTE]: 'warning',
  [EstadoDocumento.RECIBIDO]: 'success',
  [EstadoDocumento.RECHAZADO]: 'error',
};

export const DocumentChecklist = ({ siniestro }: DocumentChecklistProps) => {
  const { enqueueSnackbar } = useSnackbar();
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<Documento | null>(null);
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [selectedDocsForEmail, setSelectedDocsForEmail] = useState<string[]>([]);

  const uploadDocumento = useUploadDocumento();
  const updateDocumento = useUpdateDocumento();
  const solicitarDocs = useSolicitarDocumentosBeneficiarios();

  const documentosRequeridos =
    siniestro.tipo === TipoSiniestro.ACCIDENTE
      ? [...DOCUMENTOS_BASE_NATURAL, ...DOCUMENTOS_ADICIONALES_ACCIDENTE]
      : DOCUMENTOS_BASE_NATURAL;

  const getDocumentoEstado = (tipo: string): Documento | undefined => {
    return siniestro.documentos.find((d) => d.tipo === tipo);
  };

  const handleUploadClick = (doc: Documento | { tipo: string; nombre: string }) => {
    setSelectedDoc(doc as Documento);
    setUploadDialogOpen(true);
  };

  const handleUpload = async () => {
    if (!selectedDoc || uploadFiles.length === 0) return;

    try {
      await uploadDocumento.mutateAsync({
        siniestroId: siniestro.id,
        file: uploadFiles[0],
        tipo: selectedDoc.tipo,
      });
      enqueueSnackbar('Documento subido correctamente', { variant: 'success' });
      setUploadDialogOpen(false);
      setUploadFiles([]);
    } catch {
      enqueueSnackbar('Error al subir el documento', { variant: 'error' });
    }
  };

  const handleReject = async () => {
    if (!selectedDoc) return;

    try {
      await updateDocumento.mutateAsync({
        siniestroId: siniestro.id,
        docId: selectedDoc.id,
        data: {
          estado: EstadoDocumento.RECHAZADO,
          motivoRechazo: rejectReason,
        },
      });
      enqueueSnackbar('Documento marcado como rechazado', { variant: 'success' });
      setRejectDialogOpen(false);
      setRejectReason('');
    } catch {
      enqueueSnackbar('Error al rechazar el documento', { variant: 'error' });
    }
  };

  const handleApprove = async (doc: Documento) => {
    try {
      await updateDocumento.mutateAsync({
        siniestroId: siniestro.id,
        docId: doc.id,
        data: { estado: EstadoDocumento.RECIBIDO },
      });
      enqueueSnackbar('Documento aprobado', { variant: 'success' });
    } catch {
      enqueueSnackbar('Error al aprobar el documento', { variant: 'error' });
    }
  };

  // Construir URL completa para documentos
  const getDocumentUrl = (doc: Documento): string | null => {
    if (!doc.url) return null;
    // Si la URL ya es absoluta, usarla; si no, construir la URL del backend
    if (doc.url.startsWith('http')) return doc.url;
    const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    return `${backendUrl}${doc.url.startsWith('/') ? '' : '/'}${doc.url}`;
  };

  // Ver documento en nueva pestaña
  const handleViewDocument = (doc: Documento) => {
    const url = getDocumentUrl(doc);
    if (url) {
      window.open(url, '_blank');
    } else {
      enqueueSnackbar('URL del documento no disponible', { variant: 'warning' });
    }
  };

  // Descargar documento
  const handleDownloadDocument = async (doc: Documento) => {
    const url = getDocumentUrl(doc);
    if (!url) {
      enqueueSnackbar('URL del documento no disponible', { variant: 'warning' });
      return;
    }

    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = doc.nombre || `documento_${doc.tipo}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
      enqueueSnackbar('Descarga iniciada', { variant: 'success' });
    } catch {
      // Si falla el fetch, intentar abrir directamente
      window.open(url, '_blank');
    }
  };

  // Calcular documentos pendientes basándose en los REQUERIDOS que NO están recibidos
  const documentosPendientes = documentosRequeridos.filter((docReq) => {
    const doc = siniestro.documentos.find((d) => d.tipo === docReq.tipo);
    // Si no hay doc o su estado no es RECIBIDO, está pendiente
    return !doc || doc.estado !== EstadoDocumento.RECIBIDO;
  });

  const generatePendingList = () => {
    const pending = documentosPendientes.map((docReq) => `- ${docReq.nombre}`).join('\n');
    navigator.clipboard.writeText(
      `Documentos pendientes para el caso #${siniestro.caseCode}:\n\n${pending}`
    );
    enqueueSnackbar('Lista copiada al portapapeles', { variant: 'success' });
  };

  const handleOpenEmailDialog = () => {
    // Pre-seleccionar documentos pendientes (los que no están RECIBIDO)
    const pendientes = documentosPendientes.map(d => d.nombre);
    setSelectedDocsForEmail(pendientes);
    setEmailDialogOpen(true);
  };

  const handleToggleDocForEmail = (docNombre: string) => {
    setSelectedDocsForEmail(prev =>
      prev.includes(docNombre)
        ? prev.filter(d => d !== docNombre)
        : [...prev, docNombre]
    );
  };

  const handleEnviarEmailBeneficiarios = async () => {
    if (selectedDocsForEmail.length === 0) {
      enqueueSnackbar('Seleccione al menos un documento', { variant: 'warning' });
      return;
    }

    try {
      const result = await solicitarDocs.mutateAsync({
        siniestroId: siniestro.id,
        documentosFaltantes: selectedDocsForEmail,
      });

      if (result.beneficiariosConEmail === 0) {
        enqueueSnackbar(
          'No hay beneficiarios con email registrado. Agregue emails en la sección de beneficiarios.',
          { variant: 'warning' }
        );
      } else {
        const exitosos = result.resultados.filter(r => r.enviado).length;
        enqueueSnackbar(
          `Correo enviado a ${exitosos} de ${result.beneficiariosConEmail} beneficiarios`,
          { variant: 'success' }
        );
      }
      setEmailDialogOpen(false);
    } catch {
      enqueueSnackbar('Error al enviar correos', { variant: 'error' });
    }
  };

  const hasBeneficiarios = siniestro.beneficiarios && siniestro.beneficiarios.length > 0;

  // Verificar que TODOS los documentos REQUERIDOS estén recibidos (no solo los que existen)
  const allDocumentsReceived = documentosRequeridos.every((docReq) => {
    if (!docReq.requerido) return true; // Documentos opcionales no bloquean
    const doc = getDocumentoEstado(docReq.tipo);
    return doc && doc.estado === EstadoDocumento.RECIBIDO;
  });

  // Contar documentos
  const docsRecibidos = documentosRequeridos.filter((docReq) => {
    const doc = getDocumentoEstado(docReq.tipo);
    return doc && doc.estado === EstadoDocumento.RECIBIDO;
  }).length;
  const totalDocsRequeridos = documentosRequeridos.filter(d => d.requerido).length;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 1 }}>
        <Typography variant="h6">Checklist Documental</Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {documentosPendientes.length > 0 && (
            <Button
              variant="outlined"
              size="small"
              startIcon={<ContentCopy />}
              onClick={generatePendingList}
            >
              Copiar lista
            </Button>
          )}
          <Button
            variant="contained"
            color="warning"
            startIcon={<Email />}
            onClick={handleOpenEmailDialog}
          >
            Notificar a beneficiarios
          </Button>
        </Box>
      </Box>

      {allDocumentsReceived ? (
        <Alert severity="success" sx={{ mb: 2 }}>
          ✅ Todos los documentos requeridos han sido recibidos. El expediente está completo.
        </Alert>
      ) : (
        <Alert severity="warning" sx={{ mb: 2 }}>
          📋 Progreso: {docsRecibidos} de {totalDocsRequeridos} documentos requeridos recibidos
        </Alert>
      )}

      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Documento</TableCell>
              <TableCell align="center">Estado</TableCell>
              <TableCell>Motivo rechazo</TableCell>
              <TableCell align="right">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {documentosRequeridos.map((docReq) => {
              const doc = getDocumentoEstado(docReq.tipo);
              const estado = doc?.estado || EstadoDocumento.PENDIENTE;

              return (
                <TableRow key={docReq.tipo}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {estadoIcons[estado]}
                      {docReq.nombre}
                      {docReq.requerido && (
                        <Chip label="Requerido" size="small" color="primary" variant="outlined" />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={estado}
                      size="small"
                      color={estadoColors[estado]}
                    />
                  </TableCell>
                  <TableCell>
                    {doc?.motivoRechazo || '-'}
                  </TableCell>
                  <TableCell align="right">
                    {doc?.url && (
                      <>
                        <IconButton 
                          size="small" 
                          title="Ver documento"
                          onClick={() => handleViewDocument(doc)}
                          color="info"
                        >
                          <Visibility />
                        </IconButton>
                        <IconButton 
                          size="small" 
                          title="Descargar documento"
                          onClick={() => handleDownloadDocument(doc)}
                          color="primary"
                        >
                          <Download />
                        </IconButton>
                      </>
                    )}
                    <IconButton
                      size="small"
                      title="Subir documento"
                      onClick={() => handleUploadClick(doc || docReq)}
                    >
                      <Upload />
                    </IconButton>
                    {doc && (estado === EstadoDocumento.PENDIENTE || estado === EstadoDocumento.RECIBIDO) && (
                      <>
                        {estado !== EstadoDocumento.RECIBIDO && (
                          <IconButton
                            size="small"
                            color="success"
                            title="Aprobar"
                            onClick={() => handleApprove(doc)}
                          >
                            <CheckCircle />
                          </IconButton>
                        )}
                        <IconButton
                          size="small"
                          color="error"
                          title="Rechazar"
                          onClick={() => {
                            setSelectedDoc(doc);
                            setRejectDialogOpen(true);
                          }}
                        >
                          <Cancel />
                        </IconButton>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Dialog para subir documento */}
      <Dialog open={uploadDialogOpen} onClose={() => setUploadDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Subir documento</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {selectedDoc?.nombre}
          </Typography>
          <FileDropzone
            onFilesAccepted={setUploadFiles}
            acceptedFiles={uploadFiles}
            onFileRemove={(i) => setUploadFiles((prev) => prev.filter((_, idx) => idx !== i))}
            maxFiles={1}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadDialogOpen(false)}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={handleUpload}
            disabled={uploadFiles.length === 0 || uploadDocumento.isPending}
          >
            Subir
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog para rechazar documento */}
      <Dialog open={rejectDialogOpen} onClose={() => setRejectDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Rechazar documento</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Motivo del rechazo"
            multiline
            rows={3}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectDialogOpen(false)}>Cancelar</Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleReject}
            disabled={!rejectReason || updateDocumento.isPending}
          >
            Rechazar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog para enviar email a beneficiarios */}
      <Dialog open={emailDialogOpen} onClose={() => setEmailDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Email color="warning" />
            Solicitar documentos a beneficiarios
          </Box>
        </DialogTitle>
        <DialogContent>
          {!hasBeneficiarios ? (
            <Alert severity="warning" sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                No hay beneficiarios registrados
              </Typography>
              <Typography variant="body2">
                Para enviar notificaciones, primero debe agregar beneficiarios con sus correos electrónicos en la pestaña "Beneficiarios".
              </Typography>
            </Alert>
          ) : documentosPendientes.length === 0 ? (
            <Alert severity="success" sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Todos los documentos han sido recibidos
              </Typography>
              <Typography variant="body2">
                No hay documentos pendientes que solicitar.
              </Typography>
            </Alert>
          ) : (
            <>
              <Alert severity="info" sx={{ mb: 2 }}>
                Se enviará un correo electrónico a los beneficiarios registrados solicitando los documentos seleccionados.
              </Alert>
              
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Seleccione los documentos a solicitar:
              </Typography>
              <List dense>
                {documentosRequeridos.map((docReq) => {
                  const doc = getDocumentoEstado(docReq.tipo);
                  const estado = doc?.estado || EstadoDocumento.PENDIENTE;
                  const isPendingOrRejected = estado === EstadoDocumento.PENDIENTE || estado === EstadoDocumento.RECHAZADO;
                  
                  return (
                    <ListItem 
                      key={docReq.tipo}
                      sx={{ 
                        bgcolor: isPendingOrRejected ? 'warning.50' : 'transparent',
                        borderRadius: 1,
                        mb: 0.5,
                      }}
                    >
                      <ListItemIcon>
                        <Checkbox
                          edge="start"
                          checked={selectedDocsForEmail.includes(docReq.nombre)}
                          onChange={() => handleToggleDocForEmail(docReq.nombre)}
                          disabled={!isPendingOrRejected}
                        />
                      </ListItemIcon>
                      <ListItemText
                        primary={docReq.nombre}
                        secondary={
                          estado === EstadoDocumento.RECHAZADO 
                            ? `Rechazado: ${doc?.motivoRechazo || 'Sin motivo'}` 
                            : estado === EstadoDocumento.RECIBIDO 
                              ? '✓ Ya recibido' 
                              : 'Pendiente'
                        }
                        secondaryTypographyProps={{
                          color: estado === EstadoDocumento.RECHAZADO ? 'error' : estado === EstadoDocumento.RECIBIDO ? 'success.main' : 'text.secondary',
                        }}
                      />
                    </ListItem>
                  );
                })}
              </List>

              <Alert severity="warning" variant="outlined" sx={{ mt: 2 }}>
                <Typography variant="caption">
                  Solo los beneficiarios con correo electrónico registrado recibirán la notificación.
                </Typography>
              </Alert>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEmailDialogOpen(false)}>Cerrar</Button>
          {hasBeneficiarios && documentosPendientes.length > 0 && (
            <Button
              variant="contained"
              color="warning"
              startIcon={solicitarDocs.isPending ? <CircularProgress size={20} color="inherit" /> : <Email />}
              onClick={handleEnviarEmailBeneficiarios}
              disabled={selectedDocsForEmail.length === 0 || solicitarDocs.isPending}
            >
              {solicitarDocs.isPending ? 'Enviando...' : 'Enviar notificación'}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};
