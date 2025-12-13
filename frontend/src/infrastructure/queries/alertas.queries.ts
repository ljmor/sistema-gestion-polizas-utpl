import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { httpClient } from '../api/httpClient';
import { endpoints } from '../api/endpoints';
import { Alerta, AlertaFilters } from '../../domain/types/alerta';
import { useAlertsStore } from '../../application/services/alertsService';

// Interfaz del backend (campos como vienen de la API)
interface AlertaBackend {
  id: string;
  tipo: string;
  severidad: string;
  mensaje: string;
  refType: 'SINIESTRO' | 'POLIZA';
  refId: string;
  fechaLimite: string;
  isResolved: boolean;
  createdAt: string;
}

// Mapear campos del backend al frontend
const mapAlerta = (a: AlertaBackend): Alerta => ({
  id: a.id,
  tipo: a.tipo as Alerta['tipo'],
  severidad: a.severidad as Alerta['severidad'],
  mensaje: a.mensaje,
  entidadId: a.refId,
  entidadTipo: a.refType,
  fechaLimite: a.fechaLimite,
  leida: a.isResolved, // isResolved también indica si fue "leída/descartada"
  isResolved: a.isResolved,
  createdAt: a.createdAt,
});

export const useAlertas = (filters?: AlertaFilters) => {
  const setAlertas = useAlertsStore((state) => state.setAlertas);

  return useQuery({
    queryKey: ['alertas', filters],
    queryFn: async () => {
      const response = await httpClient.get<AlertaBackend[]>(endpoints.alertas.list, {
        params: filters,
      });
      const mapped = response.data.map(mapAlerta);
      setAlertas(mapped);
      return mapped;
    },
  });
};

export const useMarcarAlertaLeida = () => {
  const queryClient = useQueryClient();
  const markAsRead = useAlertsStore((state) => state.markAsRead);

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await httpClient.patch(endpoints.alertas.marcarLeida(id));
      return response.data;
    },
    onSuccess: (_, id) => {
      markAsRead(id);
      queryClient.invalidateQueries({ queryKey: ['alertas'] });
    },
  });
};

// Resolver/descartar una alerta
export const useResolverAlerta = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // El backend usa POST, no PATCH
      const response = await httpClient.post(endpoints.alertas.resolver(id));
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alertas'] });
      queryClient.invalidateQueries({ queryKey: ['alertas-criticas'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-kpis'] });
    },
  });
};

// Resolver/descartar todas las alertas
export const useResolverTodasAlertas = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await httpClient.post('/alertas/resolver-todas');
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alertas'] });
      queryClient.invalidateQueries({ queryKey: ['alertas-criticas'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-kpis'] });
    },
  });
};
