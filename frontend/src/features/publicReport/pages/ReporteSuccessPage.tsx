import { useParams, Link as RouterLink } from 'react-router-dom';
import { Box, Card, CardContent, Typography, Button, Alert } from '@mui/material';
import { CheckCircle, Home } from '@mui/icons-material';
import { motion } from 'framer-motion';

export const ReporteSuccessPage = () => {
  const { codigo } = useParams<{ codigo: string }>();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Card sx={{ textAlign: 'center', py: 4 }}>
        <CardContent>
          <CheckCircle sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />

          <Typography variant="h4" gutterBottom fontWeight={600}>
            Reporte Recibido
          </Typography>

          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Su reporte de siniestro ha sido registrado exitosamente.
          </Typography>

          <Alert severity="success" sx={{ mb: 3, textAlign: 'left' }}>
            <Typography variant="body2">
              <strong>Código de caso:</strong>
            </Typography>
            <Typography variant="h5" fontWeight={700} color="primary">
              #{codigo}
            </Typography>
          </Alert>

          <Box sx={{ bgcolor: 'grey.100', p: 3, borderRadius: 2, mb: 3 }}>
            <Typography variant="body2" color="text.secondary">
              Guarde este código para dar seguimiento a su caso. Un gestor se
              comunicará con usted a través del correo electrónico o teléfono
              proporcionado para continuar con el proceso.
            </Typography>
          </Box>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            <strong>Próximos pasos:</strong>
            <br />
            1. Recibirá un correo de confirmación con los detalles del caso.
            <br />
            2. Un gestor revisará la información y se comunicará con usted.
            <br />
            3. Se le solicitará documentación adicional según el tipo de siniestro.
          </Typography>

          <Button
            component={RouterLink}
            to="/reporte"
            variant="outlined"
            startIcon={<Home />}
          >
            Volver al inicio
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
};
