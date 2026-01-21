import { useState } from 'react';
import {
  Box,
  TextField,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Button,
  InputAdornment,
  Collapse,
  IconButton,
} from '@mui/material';
import { Search, FilterList, Clear } from '@mui/icons-material';
import { SiniestroFilters } from '../../../domain/types/siniestro';
import { EstadoSiniestro, TipoSiniestro, estadoSiniestroLabels, tipoSiniestroLabels } from '../../../domain/enums/estados';
import { useDebounce } from '../../../shared/hooks/useDebounce';

interface SiniestrosFiltersProps {
  filters: SiniestroFilters;
  onFiltersChange: (filters: SiniestroFilters) => void;
}

export const SiniestrosFilters = ({
  filters,
  onFiltersChange,
}: SiniestrosFiltersProps) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [searchTerm, setSearchTerm] = useState(filters.search || '');
  const debouncedSearch = useDebounce(searchTerm, 300);

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    onFiltersChange({ ...filters, search: value });
  };

  const handleFilterChange = (key: keyof SiniestroFilters, value: unknown) => {
    onFiltersChange({ ...filters, [key]: value || undefined });
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    onFiltersChange({});
  };

  const hasActiveFilters =
    filters.estado ||
    filters.tipo ||
    filters.fechaDesde ||
    filters.fechaHasta ||
    filters.soloVencimientos;

  return (
    <Box sx={{ mb: 2 }}>
      <Box
        sx={{
          display: 'flex',
          gap: 2,
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        <TextField
          size="small"
          placeholder="Buscar #Caso / Cédula / Nombre"
          value={searchTerm}
          onChange={(e) => handleSearchChange(e.target.value)}
          sx={{ minWidth: 300 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
          }}
        />

        <TextField
          select
          size="small"
          label="Estado"
          value={filters.estado || ''}
          onChange={(e) => handleFilterChange('estado', e.target.value as EstadoSiniestro)}
          sx={{ minWidth: 150 }}
        >
          <MenuItem value="">Todos</MenuItem>
          {Object.values(EstadoSiniestro).map((estado) => (
            <MenuItem key={estado} value={estado}>
              {estadoSiniestroLabels[estado]}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          select
          size="small"
          label="Tipo"
          value={filters.tipo || ''}
          onChange={(e) => handleFilterChange('tipo', e.target.value as TipoSiniestro)}
          sx={{ minWidth: 130 }}
        >
          <MenuItem value="">Todos</MenuItem>
          {Object.values(TipoSiniestro).map((tipo) => (
            <MenuItem key={tipo} value={tipo}>
              {tipoSiniestroLabels[tipo]}
            </MenuItem>
          ))}
        </TextField>

        <Button
          variant={showAdvanced ? 'contained' : 'outlined'}
          size="small"
          startIcon={<FilterList />}
          onClick={() => setShowAdvanced(!showAdvanced)}
        >
          Más filtros
        </Button>

        {hasActiveFilters && (
          <IconButton size="small" onClick={handleClearFilters} title="Limpiar filtros">
            <Clear />
          </IconButton>
        )}
      </Box>

      <Collapse in={showAdvanced}>
        <Box
          sx={{
            display: 'flex',
            gap: 2,
            mt: 2,
            flexWrap: 'wrap',
            alignItems: 'center',
          }}
        >
          <TextField
            size="small"
            label="Fecha defunción desde"
            type="date"
            value={filters.fechaDesde || ''}
            onChange={(e) => handleFilterChange('fechaDesde', e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ minWidth: 180 }}
          />

          <TextField
            size="small"
            label="Fecha defunción hasta"
            type="date"
            value={filters.fechaHasta || ''}
            onChange={(e) => handleFilterChange('fechaHasta', e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ minWidth: 180 }}
          />

          <FormControlLabel
            control={
              <Checkbox
                checked={filters.soloVencimientos || false}
                onChange={(e) => handleFilterChange('soloVencimientos', e.target.checked)}
              />
            }
            label="Solo vencimientos próximos"
          />
        </Box>
      </Collapse>
    </Box>
  );
};
