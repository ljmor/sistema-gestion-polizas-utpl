import {
  Stepper,
  Step,
  StepLabel,
  StepButton,
  Box,
  Typography,
  useTheme,
  useMediaQuery,
  Tooltip,
} from '@mui/material';
import {
  Receipt,
  FactCheck,
  People,
  AccountBalance,
  Payment,
  CheckCircle,
  Lock,
} from '@mui/icons-material';
import { EstadoSiniestro } from '../../domain/enums/estados';

const steps = [
  { estado: EstadoSiniestro.RECIBIDO, label: 'Recepción', icon: Receipt },
  { estado: EstadoSiniestro.EN_VALIDACION, label: 'Validación', icon: FactCheck },
  { estado: EstadoSiniestro.BENEFICIARIOS, label: 'Beneficiarios', icon: People },
  { estado: EstadoSiniestro.LIQUIDACION, label: 'Liquidación', icon: AccountBalance },
  { estado: EstadoSiniestro.PAGO, label: 'Pago', icon: Payment },
  { estado: EstadoSiniestro.CERRADO, label: 'Cerrado', icon: CheckCircle },
];

interface StepTimelineProps {
  currentStep: EstadoSiniestro;
  onStepClick?: (step: EstadoSiniestro) => void;
  clickable?: boolean;
  orientation?: 'horizontal' | 'vertical';
}

export const StepTimeline = ({
  currentStep,
  onStepClick,
  clickable = false,
  orientation: propOrientation,
}: StepTimelineProps) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const orientation = propOrientation || (isMobile ? 'vertical' : 'horizontal');

  const currentIndex = steps.findIndex((s) => s.estado === currentStep);

  // Determinar si un paso es accesible
  // Solo se puede acceder a pasos completados (anteriores) y el paso actual
  // Validación y Beneficiarios son accesibles simultáneamente si estamos en cualquiera de ellos
  const isStepAccessible = (stepIndex: number): boolean => {
    // Siempre se puede ir a pasos anteriores o al actual
    if (stepIndex <= currentIndex) return true;
    
    // Caso especial: Si estamos en EN_VALIDACION, permitir acceso a BENEFICIARIOS
    // para poder agregar beneficiarios y enviarles notificaciones
    if (currentStep === EstadoSiniestro.EN_VALIDACION && stepIndex === 2) {
      return true; // Permitir acceso a Beneficiarios desde Validación
    }
    
    return false;
  };

  const handleStepClick = (step: EstadoSiniestro, index: number) => {
    if (clickable && onStepClick && isStepAccessible(index)) {
      onStepClick(step);
    }
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Stepper
        activeStep={currentIndex}
        orientation={orientation}
        nonLinear={clickable}
      >
        {steps.map((step, index) => {
          const StepIcon = step.icon;
          const isCompleted = index < currentIndex;
          const isActive = index === currentIndex;
          const isAccessible = isStepAccessible(index);
          const isLocked = !isAccessible && clickable;

          return (
            <Step key={step.estado} completed={isCompleted}>
              {clickable ? (
                <Tooltip 
                  title={isLocked ? 'Complete las etapas anteriores para desbloquear' : ''}
                  arrow
                >
                  <span>
                    <StepButton 
                      onClick={() => handleStepClick(step.estado, index)}
                      disabled={isLocked}
                      sx={{
                        opacity: isLocked ? 0.5 : 1,
                        cursor: isLocked ? 'not-allowed' : 'pointer',
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {isLocked ? (
                          <Lock color="disabled" fontSize="small" />
                        ) : (
                          <StepIcon
                            color={isActive ? 'primary' : isCompleted ? 'success' : 'disabled'}
                            fontSize="small"
                          />
                        )}
                        <Typography
                          variant="body2"
                          color={isLocked ? 'text.disabled' : isActive ? 'primary' : 'text.secondary'}
                          fontWeight={isActive ? 600 : 400}
                        >
                          {step.label}
                        </Typography>
                      </Box>
                    </StepButton>
                  </span>
                </Tooltip>
              ) : (
                <StepLabel
                  StepIconComponent={() => (
                    <StepIcon
                      color={isActive ? 'primary' : isCompleted ? 'success' : 'disabled'}
                    />
                  )}
                >
                  <Typography
                    variant="body2"
                    color={isActive ? 'primary' : 'text.secondary'}
                    fontWeight={isActive ? 600 : 400}
                  >
                    {step.label}
                  </Typography>
                </StepLabel>
              )}
            </Step>
          );
        })}
      </Stepper>
    </Box>
  );
};
