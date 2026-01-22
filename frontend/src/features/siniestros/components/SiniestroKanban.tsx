import { Box, Paper, Typography, Card, CardContent, Chip } from '@mui/material';
import { SiniestroListItem } from '../../../domain/types/siniestro';
import { EstadoSiniestro, estadoSiniestroLabels } from '../../../domain/enums/estados';
import { formatDate } from '../../../shared/utils/dates';

interface SiniestroKanbanProps {
  siniestros: SiniestroListItem[];
  onCardClick: (siniestro: SiniestroListItem) => void;
}

const columns: EstadoSiniestro[] = [
  EstadoSiniestro.RECIBIDO,
  EstadoSiniestro.EN_VALIDACION,
  EstadoSiniestro.BENEFICIARIOS,
  EstadoSiniestro.LIQUIDACION,
  EstadoSiniestro.PAGO,
  EstadoSiniestro.CERRADO,
];

const columnColors: Record<EstadoSiniestro, string> = {
  [EstadoSiniestro.RECIBIDO]: '#90CAF9',
  [EstadoSiniestro.EN_VALIDACION]: '#FFE082',
  [EstadoSiniestro.BENEFICIARIOS]: '#80CBC4',
  [EstadoSiniestro.LIQUIDACION]: '#B39DDB',
  [EstadoSiniestro.PAGO]: '#A5D6A7',
  [EstadoSiniestro.CERRADO]: '#BDBDBD',
  [EstadoSiniestro.INVALIDO]: '#EF9A9A',
};

export const SiniestroKanban = ({ siniestros, onCardClick }: SiniestroKanbanProps) => {
  const getSiniestrosByEstado = (estado: EstadoSiniestro) =>
    siniestros.filter((s) => s.estado === estado);

  return (
    <Box
      sx={{
        display: 'flex',
        gap: 2,
        overflowX: 'auto',
        p: 2,
        minHeight: 500,
      }}
    >
      {columns.map((estado) => {
        const items = getSiniestrosByEstado(estado);

        return (
          <Paper
            key={estado}
            sx={{
              minWidth: 280,
              maxWidth: 280,
              bgcolor: 'grey.100',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <Box
              sx={{
                p: 1.5,
                bgcolor: columnColors[estado],
                borderRadius: '4px 4px 0 0',
              }}
            >
              <Typography variant="subtitle2" fontWeight={600}>
                {estadoSiniestroLabels[estado]}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {items.length} casos
              </Typography>
            </Box>

            <Box sx={{ p: 1, flexGrow: 1, overflowY: 'auto', maxHeight: 400 }}>
              {items.length === 0 ? (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  align="center"
                  sx={{ py: 4 }}
                >
                  Sin casos
                </Typography>
              ) : (
                items.map((siniestro) => (
                  <Card
                    key={siniestro.id}
                    sx={{
                      mb: 1,
                      cursor: 'pointer',
                      '&:hover': { boxShadow: 3 },
                      transition: 'box-shadow 0.2s',
                    }}
                    onClick={() => onCardClick(siniestro)}
                  >
                    <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          mb: 1,
                        }}
                      >
                        <Typography
                          variant="body2"
                          fontWeight={600}
                          color="primary"
                        >
                          #{siniestro.caseCode}
                        </Typography>
                        {siniestro.diasRestantes60 !== null && siniestro.diasRestantes60 < 15 && (
                          <Chip
                            label={`${siniestro.diasRestantes60}d`}
                            size="small"
                            color="error"
                          />
                        )}
                      </Box>
                      <Typography variant="body2" noWrap>
                        {siniestro.fallecido.nombreCompleto}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {formatDate(siniestro.fechaDefuncion)}
                      </Typography>
                    </CardContent>
                  </Card>
                ))
              )}
            </Box>
          </Paper>
        );
      })}
    </Box>
  );
};
