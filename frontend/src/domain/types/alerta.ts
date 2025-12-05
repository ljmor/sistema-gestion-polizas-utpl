import { TipoAlerta, SeveridadAlerta } from '../enums/estados';

export interface Alerta {
  id: string;
  tipo: TipoAlerta;
  severidad: SeveridadAlerta;
  mensaje: string;
  entidadId: string;
  entidadTipo: 'SINIESTRO' | 'POLIZA';
  fechaLimite: string;
  leida: boolean;
  isResolved: boolean; // Campo del backend para alertas descartadas
  createdAt: string;
}

export interface AlertaFilters {
  tipo?: TipoAlerta;
  severidad?: SeveridadAlerta;
  leida?: boolean;
  isResolved?: boolean; // Filtro para alertas resueltas/descartadas
}

export const tipoAlertaLabels: Record<TipoAlerta, string> = {
  [TipoAlerta.PLAZO_60D]: 'Plazo 60 días reporte',
  [TipoAlerta.PLAZO_15D]: 'Plazo 15 días liquidación',
  [TipoAlerta.PLAZO_72H]: 'Plazo 72 horas pago',
  [TipoAlerta.VENCIMIENTO_POLIZA]: 'Vencimiento de póliza',
  [TipoAlerta.PAGO_POLIZA]: 'Pago de póliza',
};

export const severidadAlertaColors: Record<SeveridadAlerta, 'info' | 'warning' | 'error'> = {
  [SeveridadAlerta.INFO]: 'info',
  [SeveridadAlerta.WARNING]: 'warning',
  [SeveridadAlerta.CRITICAL]: 'error',
};
