import {
  EstadoSiniestro,
  TipoSiniestro,
  EstadoDocumento,
  EstadoFirma,
  EstadoPago,
  EstadoLiquidacion,
} from '../enums/estados';

export interface Fallecido {
  id: string;
  nombreCompleto: string;
  cedula: string;
  fechaDefuncion: string;
}

export interface Reportante {
  id: string;
  nombre: string;
  relacion: 'FAMILIAR' | 'COMPANERO' | 'PERSONAL' | 'OTRO';
  email: string;
  telefono: string;
}

export interface Documento {
  id: string;
  nombre: string;
  tipo: string;
  estado: EstadoDocumento;
  motivoRechazo?: string;
  url?: string;
  fechaSubida?: string;
  requerido: boolean;
}

export interface Beneficiario {
  id: string;
  nombre: string;
  cedula: string;
  relacion: string;
  porcentaje: number;
  cuentaBancaria?: string; // Alias para compatibilidad frontend
  cuenta?: string;         // Campo del backend
  banco?: string;
  email?: string;  // Email para contactar al beneficiario
  telefono?: string;
  estadoFirma: EstadoFirma;
  archivoFirma?: string;
}

export interface Liquidacion {
  fechaEnvioAseguradora?: string;
  expedienteUrl?: string;
  estado: EstadoLiquidacion;
  fechaLiquidacion?: string;
  liquidacionUrl?: string;
  montoLiquidado?: number;
  notasAseguradora?: string;
}

export interface Pago {
  fechaFirmaRecibida?: string;
  fechaPago?: string;
  comprobantePagoUrl?: string;
  estadoPago: EstadoPago;
  estado?: string; // Alias de estadoPago para compatibilidad con backend
  docContable?: string;
  obsFinanzas?: string;
}

export interface EventoAuditoria {
  id: string;
  usuario: string;
  accion: string;
  fecha: string;
  detalles?: string;
}

export interface Siniestro {
  id: string;
  caseCode: string;
  fallecido: Fallecido;
  reportante: Reportante;
  tipo: TipoSiniestro;
  tipoPreliminar: TipoSiniestro;
  estado: EstadoSiniestro;
  observaciones?: string;
  polizaId?: string;
  grupoAsegurado?: string;
  montoCobertura?: number;
  fechaDefuncion?: string; // Fecha a nivel raíz (del backend)
  fechaReporte?: string;   // Fecha del reporte inicial
  fechaEnvioAseguradora?: string; // Fecha cuando se envió a la aseguradora
  plazo60dCompletado?: boolean;   // Si el plazo de 60d ya se cumplió
  documentos: Documento[];
  beneficiarios: Beneficiario[];
  liquidacion?: Liquidacion;
  pago?: Pago;
  auditTrail: EventoAuditoria[];
  diasRestantes60?: number;
  diasHabilesRestantes15?: number;
  horasRestantes72?: number;
  createdAt: string;
  updatedAt: string;
}

export interface SiniestroFilters {
  search?: string;
  estado?: EstadoSiniestro;
  tipo?: TipoSiniestro;
  fechaDesde?: string;
  fechaHasta?: string;
  soloVencimientos?: boolean;
}

export interface CreateReportePublico {
  fallecido: {
    nombreCompleto: string;
    cedula: string;
    fechaDefuncion: string;
  };
  tipoPreliminar: TipoSiniestro;
  observaciones?: string;
  reportante: {
    nombre: string;
    relacion: 'FAMILIAR' | 'COMPANERO' | 'PERSONAL' | 'OTRO';
    email: string;
    telefono: string;
  };
  archivosIniciales?: File[];
}

export interface SiniestroListItem {
  id: string;
  caseCode: string;
  fallecido: {
    nombreCompleto: string;
    cedula: string;
  };
  fechaDefuncion: string;
  estado: EstadoSiniestro;
  tipo: TipoSiniestro;
  diasRestantes60: number | null;
  plazo60dCompletado?: boolean;
  updatedAt: string;
}
