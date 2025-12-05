import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineOppositeContent,
} from '@mui/lab';
import { Typography, Box } from '@mui/material';
import { Person } from '@mui/icons-material';
import { EventoAuditoria } from '../../../domain/types/siniestro';
import { formatDateTime } from '../../../shared/utils/dates';

interface CaseAuditTrailProps {
  events?: EventoAuditoria[];
}

export const CaseAuditTrail = ({ events = [] }: CaseAuditTrailProps) => {
  if (!events || events.length === 0) {
    return (
      <Typography color="text.secondary" align="center" sx={{ py: 4 }}>
        No hay eventos registrados
      </Typography>
    );
  }

  return (
    <Timeline position="alternate">
      {events.map((event, index) => (
        <TimelineItem key={event.id}>
          <TimelineOppositeContent color="text.secondary" sx={{ flex: 0.3 }}>
            <Typography variant="caption">
              {formatDateTime(event.fecha)}
            </Typography>
          </TimelineOppositeContent>
          <TimelineSeparator>
            <TimelineDot color="primary" variant={index === 0 ? 'filled' : 'outlined'}>
              <Person fontSize="small" />
            </TimelineDot>
            {index < events.length - 1 && <TimelineConnector />}
          </TimelineSeparator>
          <TimelineContent>
            <Box>
              <Typography variant="body2" fontWeight={600}>
                {event.usuario}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {event.accion}
              </Typography>
              {event.detalles && (
                <Typography variant="caption" color="text.disabled">
                  {event.detalles}
                </Typography>
              )}
            </Box>
          </TimelineContent>
        </TimelineItem>
      ))}
    </Timeline>
  );
};
