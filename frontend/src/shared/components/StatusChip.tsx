import { Chip, ChipProps } from '@mui/material';
import { motion } from 'framer-motion';
import { EstadoSiniestro, estadoSiniestroLabels } from '../../domain/enums/estados';

const estadoColors: Record<EstadoSiniestro, ChipProps['color']> = {
  [EstadoSiniestro.RECIBIDO]: 'info',
  [EstadoSiniestro.EN_VALIDACION]: 'warning',
  [EstadoSiniestro.BENEFICIARIOS]: 'secondary',
  [EstadoSiniestro.LIQUIDACION]: 'primary',
  [EstadoSiniestro.PAGO]: 'success',
  [EstadoSiniestro.CERRADO]: 'default',
  [EstadoSiniestro.INVALIDO]: 'error',
};

interface StatusChipProps {
  estado: EstadoSiniestro;
  size?: 'small' | 'medium';
  animated?: boolean;
}

export const StatusChip = ({
  estado,
  size = 'small',
  animated = false,
}: StatusChipProps) => {
  const chip = (
    <Chip
      label={estadoSiniestroLabels[estado]}
      color={estadoColors[estado]}
      size={size}
      sx={{ fontWeight: 500 }}
    />
  );

  if (animated) {
    return (
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.2 }}
      >
        {chip}
      </motion.div>
    );
  }

  return chip;
};
