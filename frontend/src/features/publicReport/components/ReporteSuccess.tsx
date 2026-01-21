import { Box, Typography, Alert } from '@mui/material';
import { CheckCircle } from '@mui/icons-material';

interface ReporteSuccessProps {
  caseCode: string;
}

export const ReporteSuccess = ({ caseCode }: ReporteSuccessProps) => {
  return (
    <Box sx={{ textAlign: 'center', py: 4 }}>
      <CheckCircle sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
      <Typography variant="h5" gutterBottom>
        Reporte Enviado Exitosamente
      </Typography>
      <Alert severity="success" sx={{ mt: 2 }}>
        <Typography>
          Código de caso: <strong>#{caseCode}</strong>
        </Typography>
      </Alert>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
        Guarde este código para consultas futuras.
      </Typography>
    </Box>
  );
};
