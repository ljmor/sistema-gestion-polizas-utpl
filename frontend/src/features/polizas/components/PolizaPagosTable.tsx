import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Typography,
} from '@mui/material';
import { Visibility, Upload } from '@mui/icons-material';
import { PagoPoliza } from '../../../domain/types/poliza';
import { formatDate } from '../../../shared/utils/dates';
import { formatCurrency } from '../../../infrastructure/api/mappers';

interface PolizaPagosTableProps {
  pagos: PagoPoliza[];
}

export const PolizaPagosTable = ({ pagos }: PolizaPagosTableProps) => {
  if (pagos.length === 0) {
    return (
      <Typography color="text.secondary" align="center" sx={{ py: 4 }}>
        No hay pagos registrados
      </Typography>
    );
  }

  return (
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Fecha</TableCell>
            <TableCell>Descripción</TableCell>
            <TableCell align="right">Monto</TableCell>
            <TableCell align="center">Estado</TableCell>
            <TableCell align="right">Acciones</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {pagos.map((pago) => (
            <TableRow key={pago.id}>
              <TableCell>{formatDate(pago.fecha)}</TableCell>
              <TableCell>{pago.descripcion || '-'}</TableCell>
              <TableCell align="right">{formatCurrency(pago.monto)}</TableCell>
              <TableCell align="center">
                <Chip
                  label={pago.estado}
                  size="small"
                  color={pago.estado === 'PAGADO' ? 'success' : 'warning'}
                />
              </TableCell>
              <TableCell align="right">
                {pago.facturaUrl && (
                  <IconButton size="small" title="Ver factura">
                    <Visibility />
                  </IconButton>
                )}
                <IconButton size="small" title="Subir factura">
                  <Upload />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};
