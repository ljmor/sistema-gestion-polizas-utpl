import { EstadoPoliza, TipoPoliza } from '../enums/estados';

export interface Vigencia {
  id: string;
  desde: string;
  hasta: string;
  activa: boolean;
}

export interface PagoPoliza {
  id: string;
  fecha: string;
  monto: number;
  estado: 'PENDIENTE' | 'PAGADO';
  facturaUrl?: string;
  descripcion?: string;
}

export interface Poliza {
  id: string;
  nombre: string;
  tipo: TipoPoliza;
  estado: EstadoPoliza;
  prima: number;
  vigenciaActual: Vigencia;
  vigencias: Vigencia[];
  pagos: PagoPoliza[];
  gruposAsegurados: string[];
  montoCobertura: number;
  descripcion?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PolizaListItem {
  id: string;
  nombre: string;
  tipo: TipoPoliza;
  estado: EstadoPoliza;
  vigenciaDesde: string;
  vigenciaHasta: string;
  prima: number;
  montoCobertura?: number;
  descripcion?: string;
}

export interface GrupoAsegurado {
  id: string;
  nombre: string;
  descripcion?: string;
  cantidadAsegurados: number;
}
