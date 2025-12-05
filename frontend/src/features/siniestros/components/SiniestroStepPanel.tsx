import { Box, Alert, Typography } from '@mui/material';
import { Block } from '@mui/icons-material';
import { Siniestro } from '../../../domain/types/siniestro';
import { EstadoSiniestro } from '../../../domain/enums/estados';
import { DocumentChecklist } from './DocumentChecklist';
import { BeneficiariosSection } from './BeneficiariosSection';
import { LiquidacionSection } from './LiquidacionSection';
import { PagosSection } from './PagosSection';
import { RecepcionPanel } from './RecepcionPanel';

interface SiniestroStepPanelProps {
  step: number;
  siniestro: Siniestro;
}

// Componente para mostrar cuando el caso está inválido
const InvalidCaseMessage = ({ siniestro }: { siniestro: Siniestro }) => (
  <Alert 
    severity="error" 
    icon={<Block />}
    sx={{ 
      borderRadius: 2,
      '& .MuiAlert-message': { width: '100%' }
    }}
  >
    <Typography variant="subtitle1" fontWeight={600} gutterBottom>
      Este caso ha sido marcado como inválido
    </Typography>
    <Typography variant="body2" gutterBottom>
      No se pueden realizar más acciones en este caso.
    </Typography>
    {(siniestro as any).motivoInvalidacion && (
      <Box sx={{ mt: 1, p: 1.5, bgcolor: 'rgba(0,0,0,0.05)', borderRadius: 1 }}>
        <Typography variant="caption" color="text.secondary">
          Motivo de invalidación:
        </Typography>
        <Typography variant="body2" fontWeight={500}>
          {(siniestro as any).motivoInvalidacion}
        </Typography>
      </Box>
    )}
  </Alert>
);

// Componente para mostrar cuando el caso está cerrado
const ClosedCaseMessage = () => (
  <Alert 
    severity="success" 
    sx={{ 
      borderRadius: 2,
      '& .MuiAlert-message': { width: '100%' }
    }}
  >
    <Typography variant="subtitle1" fontWeight={600} gutterBottom>
      ✅ Este caso ha sido cerrado exitosamente
    </Typography>
    <Typography variant="body2">
      El proceso de siniestro ha sido completado. No se pueden realizar modificaciones adicionales.
    </Typography>
  </Alert>
);

export const SiniestroStepPanel = ({ step, siniestro }: SiniestroStepPanelProps) => {
  const isInvalid = siniestro.estado === EstadoSiniestro.INVALIDO;
  const isClosed = siniestro.estado === EstadoSiniestro.CERRADO;
  const isLocked = isInvalid || isClosed;

  const renderPanel = () => {
    // Si el caso está inválido, solo mostrar el panel de recepción con el mensaje
    if (isInvalid) {
      if (step === 0) {
        return <RecepcionPanel siniestro={siniestro} readOnly />;
      }
      return <InvalidCaseMessage siniestro={siniestro} />;
    }

    // Si el caso está cerrado, mostrar en modo solo lectura
    if (isClosed) {
      switch (step) {
        case 0:
          return <RecepcionPanel siniestro={siniestro} readOnly />;
        case 4:
          return <PagosSection siniestro={siniestro} readOnly />;
        default:
          return <ClosedCaseMessage />;
      }
    }

    switch (step) {
      case 0:
        return <RecepcionPanel siniestro={siniestro} />;
      case 1:
        return <DocumentChecklist siniestro={siniestro} />;
      case 2:
        return <BeneficiariosSection siniestro={siniestro} />;
      case 3:
        return <LiquidacionSection siniestro={siniestro} />;
      case 4:
        return <PagosSection siniestro={siniestro} />;
      default:
        return null;
    }
  };

  return <Box>{renderPanel()}</Box>;
};
