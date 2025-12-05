import { Siniestro, SiniestroListItem } from '../../domain/types/siniestro';
import { Poliza, PolizaListItem } from '../../domain/types/poliza';

export const mapSiniestroToListItem = (siniestro: Siniestro): SiniestroListItem => ({
  id: siniestro.id,
  caseCode: siniestro.caseCode,
  fallecido: {
    nombreCompleto: siniestro.fallecido.nombreCompleto,
    cedula: siniestro.fallecido.cedula,
  },
  fechaDefuncion: siniestro.fallecido.fechaDefuncion,
  estado: siniestro.estado,
  tipo: siniestro.tipo,
  diasRestantes60: siniestro.diasRestantes60 ?? 0,
  updatedAt: siniestro.updatedAt,
});

export const mapPolizaToListItem = (poliza: Poliza): PolizaListItem => ({
  id: poliza.id,
  nombre: poliza.nombre,
  tipo: poliza.tipo,
  estado: poliza.estado,
  vigenciaDesde: poliza.vigenciaActual.desde,
  vigenciaHasta: poliza.vigenciaActual.hasta,
  prima: poliza.prima,
});

export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('es-EC', {
    style: 'currency',
    currency: 'USD',
  }).format(value);
};

export const formatDate = (date: string | null | undefined): string => {
  if (!date) return '-';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('es-EC', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
};

export const formatDateTime = (date: string | null | undefined): string => {
  if (!date) return '-';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '-';
  return d.toLocaleString('es-EC', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};
