import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  Box,
  TextField,
  InputAdornment,
  Button,
  Skeleton,
  Typography,
} from '@mui/material';
import { Search, Download } from '@mui/icons-material';
import { useState, ReactNode } from 'react';
import { exportToCSV } from '../../infrastructure/queries/reportes.queries';

export interface Column<T> {
  id: keyof T | string;
  label: string;
  minWidth?: number;
  align?: 'left' | 'right' | 'center';
  format?: (value: T[keyof T], row: T) => ReactNode;
  render?: (row: T) => ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  searchable?: boolean;
  exportable?: boolean;
  exportFilename?: string;
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
  rowsPerPageOptions?: number[];
}

export function DataTable<T extends object>({
  columns,
  data,
  loading = false,
  searchable = false,
  exportable = false,
  exportFilename = 'export',
  onRowClick,
  emptyMessage = 'No hay datos disponibles',
  rowsPerPageOptions = [10, 25, 50],
}: DataTableProps<T>) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(rowsPerPageOptions[0]);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredData = searchable
    ? data.filter((row) =>
        Object.values(row).some((value) =>
          String(value).toLowerCase().includes(searchTerm.toLowerCase())
        )
      )
    : data;

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleExport = () => {
    const exportData = filteredData.map((row) => {
      const exportRow: Record<string, unknown> = {};
      columns.forEach((col) => {
        const key = col.id as string;
        exportRow[col.label] = (row as Record<string, unknown>)[key];
      });
      return exportRow;
    });
    exportToCSV(exportData, exportFilename);
  };

  const paginatedData = filteredData.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <Paper sx={{ width: '100%', overflow: 'hidden' }}>
      {(searchable || exportable) && (
        <Box
          sx={{
            p: 2,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 2,
          }}
        >
          {searchable && (
            <TextField
              size="small"
              placeholder="Buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
              sx={{ minWidth: 250 }}
            />
          )}
          {exportable && (
            <Button
              variant="outlined"
              startIcon={<Download />}
              onClick={handleExport}
              disabled={filteredData.length === 0}
            >
              Exportar CSV
            </Button>
          )}
        </Box>
      )}
      <TableContainer sx={{ maxHeight: 600 }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell
                  key={column.id as string}
                  align={column.align || 'left'}
                  style={{ minWidth: column.minWidth }}
                >
                  {column.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={index}>
                  {columns.map((column) => (
                    <TableCell key={column.id as string}>
                      <Skeleton variant="text" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : paginatedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} align="center">
                  <Typography color="text.secondary" sx={{ py: 4 }}>
                    {emptyMessage}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((row, rowIndex) => (
                <TableRow
                  hover
                  key={rowIndex}
                  onClick={() => onRowClick?.(row)}
                  sx={{ cursor: onRowClick ? 'pointer' : 'default' }}
                >
                  {columns.map((column) => {
                    if (column.render) {
                      return (
                        <TableCell key={column.id as string} align={column.align || 'left'}>
                          {column.render(row)}
                        </TableCell>
                      );
                    }
                    const value = row[column.id as keyof T];
                    return (
                      <TableCell key={column.id as string} align={column.align || 'left'}>
                        {column.format ? column.format(value, row) : (value as ReactNode)}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        rowsPerPageOptions={rowsPerPageOptions}
        component="div"
        count={filteredData.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        labelRowsPerPage="Filas por página"
        labelDisplayedRows={({ from, to, count }) =>
          `${from}-${to} de ${count !== -1 ? count : `más de ${to}`}`
        }
      />
    </Paper>
  );
}
