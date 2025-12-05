import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { httpClient } from '../api/httpClient';
import { endpoints } from '../api/endpoints';
import { Poliza, PolizaListItem, PagoPoliza, Vigencia } from '../../domain/types/poliza';

export const usePolizas = () => {
  return useQuery({
    queryKey: ['polizas'],
    queryFn: async () => {
      const response = await httpClient.get<{ data: PolizaListItem[]; total: number } | PolizaListItem[]>(endpoints.polizas.list);
      
      if ('data' in response.data && Array.isArray(response.data.data)) {
        return response.data.data;
      }

      return response.data as PolizaListItem[];
    },
  });
};

export const usePoliza = (id: string) => {
  return useQuery({
    queryKey: ['poliza', id],
    queryFn: async () => {
      const response = await httpClient.get<Poliza>(endpoints.polizas.detail(id));
      return response.data;
    },
    enabled: !!id,
  });
};

export const useCreatePoliza = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      nombre: string;
      tipo: string;
      prima: number;
      montoCobertura: number;
      descripcion?: string;
      vigenciaDesde: string;
      vigenciaHasta: string;
    }) => {
      const response = await httpClient.post<Poliza>(endpoints.polizas.list, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['polizas'] });
    },
  });
};

export const useUpdatePoliza = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Poliza> }) => {
      const response = await httpClient.patch<Poliza>(endpoints.polizas.detail(id), data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['poliza', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['polizas'] });
    },
  });
};

export const useDeletePoliza = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await httpClient.delete(endpoints.polizas.detail(id));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['polizas'] });
    },
  });
};

export const useCreateVigencia = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      polizaId,
      data,
    }: {
      polizaId: string;
      data: { desde: string; hasta: string };
    }) => {
      const response = await httpClient.post<Vigencia>(
        endpoints.polizas.vigencias(polizaId),
        data
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['poliza', variables.polizaId] });
      queryClient.invalidateQueries({ queryKey: ['polizas'] });
    },
  });
};

export const useCerrarVigencia = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      polizaId,
      vigenciaId,
    }: {
      polizaId: string;
      vigenciaId: string;
    }) => {
      const response = await httpClient.patch<Vigencia>(
        endpoints.polizas.cerrarVigencia(polizaId, vigenciaId),
        {}
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['poliza', variables.polizaId] });
      queryClient.invalidateQueries({ queryKey: ['polizas'] });
    },
  });
};

export const useRegistrarPagoPoliza = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      polizaId,
      data,
      factura,
    }: {
      polizaId: string;
      data: Omit<PagoPoliza, 'id' | 'facturaUrl'>;
      factura?: File;
    }) => {
      const formData = new FormData();
      formData.append('data', JSON.stringify(data));
      if (factura) {
        formData.append('factura', factura);
      }

      const response = await httpClient.post<PagoPoliza>(
        endpoints.polizas.pagos(polizaId),
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['poliza', variables.polizaId] });
    },
  });
};
