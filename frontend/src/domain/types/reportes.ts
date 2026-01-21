export interface ReporteSiniestralidad {
  periodo: string;
  totalSiniestros: number;
  montoTotal: number;
  porTipo: {
    tipo: string;
    cantidad: number;
    monto: number;
  }[];
  porEstado: {
    estado: string;
    cantidad: number;
  }[];
}

export interface ReportePoblacion {
  grupoAsegurado: string;
  cantidadAsegurados: number;
  poliza: string;
  tipoPoliza: string;
}

export interface ReporteCostos {
  poliza: string;
  primaTotal: number;
  siniestrosPagados: number;
  siniestralidad: number;
  periodo: string;
}

export interface ReporteEstadoSiniestros {
  caseCode: string;
  fallecido: string;
  fechaDefuncion: string;
  estado: string;
  diasEnProceso: number;
  montoLiquidado?: number;
}

export interface ReporteFilters {
  fechaDesde?: string;
  fechaHasta?: string;
  polizaId?: string;
  grupoAsegurado?: string;
}

export type TipoReporte = 'siniestralidad' | 'poblacion' | 'costos' | 'estadoSiniestros';
