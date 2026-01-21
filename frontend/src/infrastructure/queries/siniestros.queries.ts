import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { httpClient, publicHttpClient } from '../api/httpClient';
import { endpoints } from '../api/endpoints';
import {
  Siniestro,
  SiniestroListItem,
  SiniestroFilters,
  CreateReportePublico,
  Beneficiario,
  Documento,
} from '../../domain/types/siniestro';

export const useSiniestros = (filters?: SiniestroFilters) => {
  return useQuery({
    queryKey: ['siniestros', filters],
    queryFn: async () => {
      const response = await httpClient.get<{ data: SiniestroListItem[]; total: number } | SiniestroListItem[]>(
        endpoints.siniestros.list,
        { params: filters }
      );
      
      // Handle wrapped response from mock/API
      if ('data' in response.data && Array.isArray(response.data.data)) {
        return response.data.data;
      }
      
      return response.data as SiniestroListItem[];
    },
  });
};

export const useSiniestro = (id: string) => {
  return useQuery({
    queryKey: ['siniestro', id],
    queryFn: async () => {
      const response = await httpClient.get<Siniestro>(
        endpoints.siniestros.detail(id)
      );
      return response.data;
    },
    enabled: !!id,
  });
};

export const useCreateReportePublico = () => {
  return useMutation({
    mutationFn: async (data: CreateReportePublico & { archivosTipos?: string[] }) => {
      const formData = new FormData();
      formData.append('data', JSON.stringify({
        fallecido: data.fallecido,
        tipoPreliminar: data.tipoPreliminar,
        observaciones: data.observaciones,
        reportante: data.reportante,
        archivosTipos: data.archivosTipos || [],
      }));

      if (data.archivosIniciales) {
        data.archivosIniciales.forEach((file) => {
          formData.append('archivos', file);
        });
      }

      const response = await publicHttpClient.post<{ caseCode: string }>(
        endpoints.public.createSiniestro,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      return response.data;
    },
  });
};

// Mutation para crear siniestro manualmente (gestor)
export const useCreateSiniestroManual = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      tipo: string;
      fechaDefuncion?: string;
      observaciones?: string;
      fallecidoNombre: string;
      fallecidoCedula: string;
      reportanteNombre?: string;
      reportanteEmail?: string;
      reportanteTelefono?: string;
      reportanteRelacion?: string;
    }) => {
      const response = await httpClient.post(endpoints.siniestros.list, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['siniestros'] });
    },
  });
};

export const useUpdateSiniestro = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Siniestro> }) => {
      const response = await httpClient.patch<Siniestro>(
        endpoints.siniestros.update(id),
        data
      );
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['siniestro', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['siniestros'] });
    },
  });
};

export const useUploadDocumento = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      siniestroId,
      file,
      tipo,
    }: {
      siniestroId: string;
      file: File;
      tipo: string;
    }) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('tipo', tipo);

      const response = await httpClient.post<Documento>(
        endpoints.siniestros.documentos(siniestroId),
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['siniestro', variables.siniestroId] });
    },
  });
};

export const useUpdateDocumento = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      siniestroId,
      docId,
      data,
    }: {
      siniestroId: string;
      docId: string;
      data: Partial<Documento>;
    }) => {
      const response = await httpClient.patch<Documento>(
        endpoints.siniestros.documento(siniestroId, docId),
        data
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['siniestro', variables.siniestroId] });
    },
  });
};

export const useCreateBeneficiario = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      siniestroId,
      data,
    }: {
      siniestroId: string;
      data: Omit<Beneficiario, 'id' | 'estadoFirma'>;
    }) => {
      const response = await httpClient.post<Beneficiario>(
        endpoints.siniestros.beneficiarios(siniestroId),
        data
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['siniestro', variables.siniestroId] });
    },
  });
};

export const useUpdateBeneficiario = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      siniestroId,
      beneficiarioId,
      data,
    }: {
      siniestroId: string;
      beneficiarioId: string;
      data: Partial<Beneficiario>;
    }) => {
      const response = await httpClient.patch<Beneficiario>(
        endpoints.siniestros.beneficiario(siniestroId, beneficiarioId),
        data
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['siniestro', variables.siniestroId] });
    },
  });
};

export const useDeleteBeneficiario = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      siniestroId,
      beneficiarioId,
    }: {
      siniestroId: string;
      beneficiarioId: string;
    }) => {
      await httpClient.delete(
        endpoints.siniestros.beneficiario(siniestroId, beneficiarioId)
      );
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['siniestro', variables.siniestroId] });
    },
  });
};

export const useRegistrarLiquidacion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      siniestroId,
      data,
      file,
    }: {
      siniestroId: string;
      data: {
        fechaLiquidacion?: string;
        montoLiquidado?: number;
        notasAseguradora?: string;
        estado?: string; // Para marcar como APROBADO
      };
      file?: File;
    }) => {
      const formData = new FormData();
      formData.append('data', JSON.stringify(data));
      if (file) {
        formData.append('liquidacion', file);
      }

      const response = await httpClient.post(
        endpoints.siniestros.liquidacion(siniestroId),
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['siniestro', variables.siniestroId] });
    },
  });
};

export const useRegistrarPago = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      siniestroId,
      data,
      comprobante,
    }: {
      siniestroId: string;
      data: {
        fechaPago: string;
        docContable?: string;
        obsFinanzas?: string;
      };
      comprobante?: File;
    }) => {
      const formData = new FormData();
      formData.append('data', JSON.stringify(data));
      if (comprobante) {
        formData.append('comprobante', comprobante);
      }

      const response = await httpClient.post(
        endpoints.siniestros.pago(siniestroId),
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['siniestro', variables.siniestroId] });
      queryClient.invalidateQueries({ queryKey: ['siniestros'] });
    },
  });
};

// Nueva mutation para marcar siniestro como inválido
export const useMarcarInvalido = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      siniestroId,
      motivo,
    }: {
      siniestroId: string;
      motivo: string;
    }) => {
      const response = await httpClient.post(
        endpoints.siniestros.marcarInvalido(siniestroId),
        { motivo }
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['siniestro', variables.siniestroId] });
      queryClient.invalidateQueries({ queryKey: ['siniestros'] });
    },
  });
};

// Nueva mutation para enviar expediente a aseguradora
export const useEnviarExpedienteAseguradora = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ siniestroId, expediente }: { siniestroId: string; expediente?: File }) => {
      const formData = new FormData();
      if (expediente) {
        formData.append('expediente', expediente);
      }

      const response = await httpClient.post<{
        emailEnviado: boolean;
        aseguradoraEmail: string;
        archivosAdjuntos: number;
      }>(endpoints.siniestros.enviarAseguradora(siniestroId), formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['siniestro', variables.siniestroId] });
      queryClient.invalidateQueries({ queryKey: ['siniestros'] });
    },
  });
};

// Nueva mutation para solicitar documentos a beneficiarios
export const useSolicitarDocumentosBeneficiarios = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      siniestroId,
      documentosFaltantes,
    }: {
      siniestroId: string;
      documentosFaltantes: string[];
    }) => {
      const response = await httpClient.post<{
        totalBeneficiarios: number;
        beneficiariosConEmail: number;
        resultados: { beneficiario: string; enviado: boolean }[];
        documentosSolicitados: string[];
      }>(endpoints.siniestros.solicitarDocsBeneficiarios(siniestroId), {
        documentosFaltantes,
      });
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['siniestro', variables.siniestroId] });
    },
  });
};

// Query para obtener configuración de aseguradora
export const useAseguradoraConfig = () => {
  return useQuery({
    queryKey: ['aseguradora-config'],
    queryFn: async () => {
      const response = await httpClient.get<{
        email: string;
        nombre: string;
      }>(endpoints.siniestros.aseguradoraConfig);
      return response.data;
    },
  });
};

// Mutation para enviar liquidación a beneficiarios
export const useEnviarLiquidacionBeneficiarios = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ siniestroId, comprobante }: { siniestroId: string; comprobante?: File }) => {
      const formData = new FormData();
      if (comprobante) {
        formData.append('comprobante', comprobante);
      }

      const response = await httpClient.post<{
        totalBeneficiarios: number;
        beneficiariosNotificados: number;
        montoTotal: number;
        resultados: Array<{ beneficiario: string; email: string; enviado: boolean; monto: number }>;
        comprobanteAdjunto: boolean;
      }>(endpoints.siniestros.enviarLiquidacionBeneficiarios(siniestroId), formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['siniestro', variables.siniestroId] });
    },
  });
};

// Mutation para registrar pago y notificar a beneficiarios
export const useRegistrarPagoYNotificar = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      siniestroId, 
      data, 
      comprobante 
    }: { 
      siniestroId: string; 
      data: { fechaPago?: string; docContable?: string; obsFinanzas?: string };
      comprobante?: File;
    }) => {
      const formData = new FormData();
      formData.append('fechaPago', data.fechaPago || '');
      if (data.docContable) formData.append('docContable', data.docContable);
      if (data.obsFinanzas) formData.append('obsFinanzas', data.obsFinanzas);
      if (comprobante) {
        formData.append('comprobante', comprobante);
      }

      const response = await httpClient.post<{
        pago: any;
        totalBeneficiarios: number;
        beneficiariosNotificados: number;
        montoTotal: number;
        resultados: Array<{ beneficiario: string; email: string; enviado: boolean; monto: number }>;
        comprobanteAdjunto: boolean;
      }>(endpoints.siniestros.registrarPago(siniestroId), formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['siniestro', variables.siniestroId] });
      queryClient.invalidateQueries({ queryKey: ['siniestros'] });
    },
  });
};
