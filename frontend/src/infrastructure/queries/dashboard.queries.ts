import { useQuery } from '@tanstack/react-query';
import { httpClient } from '../api/httpClient';
import { endpoints } from '../api/endpoints';
import { SiniestroListItem } from '../../domain/types/siniestro';
import { Alerta } from '../../domain/types/alerta';

export interface DashboardKPIs {
  casosAbiertos: number;
  casosPorVencerReporte: number;
  liquidacionesPendientes: number;
  pagosPorEjecutar: number;
}

export const useDashboardKPIs = () => {
  return useQuery({
    queryKey: ['dashboard-kpis'],
    queryFn: async () => {
      const response = await httpClient.get<DashboardKPIs>(endpoints.dashboard.kpis);
      return response.data;
    },
  });
};

export const useCasosRecientes = () => {
  return useQuery({
    queryKey: ['casos-recientes'],
    queryFn: async () => {
      const response = await httpClient.get<SiniestroListItem[]>(
        endpoints.dashboard.casosRecientes
      );
      return response.data;
    },
  });
};

export const useAlertasCriticas = () => {
  return useQuery({
    queryKey: ['alertas-criticas'],
    queryFn: async () => {
      const response = await httpClient.get<Alerta[]>(endpoints.dashboard.alertasCriticas);
      return response.data;
    },
  });
};

// Tipos para estadísticas de reportes
export interface EstadisticasReportes {
  siniestrosPorTipo: Array<{ name: string; value: number; color: string }>;
  siniestrosPorEstado: Array<{ estado: string; cantidad: number }>;
  evolucionMensual: Array<{ mes: string; cantidad: number }>;
  relacionPolizaSiniestros: Array<{
    poliza: string;
    polizaId: string;
    prima: number;
    siniestros: number;
    siniestrosCount: number;
    ratio: number;
  }>;
  estadoSiniestros: Array<{
    caseCode: string;
    fallecido: string;
    fechaDefuncion: string | null;
    estado: string;
    diasEnProceso: number;
    montoLiquidado: number | null;
  }>;
}

export const useEstadisticasReportes = () => {
  return useQuery({
    queryKey: ['estadisticas-reportes'],
    queryFn: async () => {
      const response = await httpClient.get<EstadisticasReportes>(
        endpoints.dashboard.estadisticasReportes
      );
      return response.data;
    },
  });
};
