import { useQuery } from '@tanstack/react-query';
import { httpClient } from '../api/httpClient';
import { endpoints } from '../api/endpoints';
import {
  ReporteSiniestralidad,
  ReportePoblacion,
  ReporteCostos,
  ReporteEstadoSiniestros,
  ReporteFilters,
} from '../../domain/types/reportes';

export const useReporteSiniestralidad = (filters?: ReporteFilters) => {
  return useQuery({
    queryKey: ['reporte-siniestralidad', filters],
    queryFn: async () => {
      const response = await httpClient.get<ReporteSiniestralidad[]>(
        endpoints.reportes.siniestralidad,
        { params: filters }
      );
      return response.data;
    },
  });
};

export const useReportePoblacion = (filters?: ReporteFilters) => {
  return useQuery({
    queryKey: ['reporte-poblacion', filters],
    queryFn: async () => {
      const response = await httpClient.get<ReportePoblacion[]>(
        endpoints.reportes.poblacion,
        { params: filters }
      );
      return response.data;
    },
  });
};

export const useReporteCostos = (filters?: ReporteFilters) => {
  return useQuery({
    queryKey: ['reporte-costos', filters],
    queryFn: async () => {
      const response = await httpClient.get<ReporteCostos[]>(
        endpoints.reportes.costos,
        { params: filters }
      );
      return response.data;
    },
  });
};

export const useReporteEstadoSiniestros = (filters?: ReporteFilters) => {
  return useQuery({
    queryKey: ['reporte-estado-siniestros', filters],
    queryFn: async () => {
      const response = await httpClient.get<ReporteEstadoSiniestros[]>(
        endpoints.reportes.estadoSiniestros,
        { params: filters }
      );
      return response.data;
    },
  });
};

export const exportToCSV = (data: Record<string, unknown>[], filename: string) => {
  if (data.length === 0) return;

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map((row) =>
      headers.map((header) => {
        const value = row[header];
        if (typeof value === 'string' && value.includes(',')) {
          return `"${value}"`;
        }
        return value;
      }).join(',')
    ),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}.csv`;
  link.click();
};
