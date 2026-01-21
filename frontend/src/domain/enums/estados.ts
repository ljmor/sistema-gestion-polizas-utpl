export enum EstadoSiniestro {
  RECIBIDO = 'RECIBIDO',
  EN_VALIDACION = 'EN_VALIDACION',
  BENEFICIARIOS = 'BENEFICIARIOS',
  LIQUIDACION = 'LIQUIDACION',
  PAGO = 'PAGO',
  CERRADO = 'CERRADO',
  INVALIDO = 'INVALIDO',
}

export enum TipoSiniestro {
  NATURAL = 'NATURAL',
  ACCIDENTE = 'ACCIDENTE',
  DESCONOCIDO = 'DESCONOCIDO',
}

export enum EstadoDocumento {
  PENDIENTE = 'PENDIENTE',
  RECIBIDO = 'RECIBIDO',
  RECHAZADO = 'RECHAZADO',
}

export enum EstadoFirma {
  PENDIENTE = 'PENDIENTE',
  RECIBIDA = 'RECIBIDA',
}

export enum EstadoPago {
  PENDIENTE = 'PENDIENTE',
  EJECUTADO = 'EJECUTADO',
}

export enum EstadoLiquidacion {
  ENVIADO = 'ENVIADO',
  OBSERVADO = 'OBSERVADO',
  APROBADO = 'APROBADO',
}

export enum TipoAlerta {
  PLAZO_60D = 'PLAZO_60D',
  PLAZO_15D = 'PLAZO_15D',
  PLAZO_72H = 'PLAZO_72H',
  VENCIMIENTO_POLIZA = 'VENCIMIENTO_POLIZA',
  PAGO_POLIZA = 'PAGO_POLIZA',
}

export enum SeveridadAlerta {
  INFO = 'INFO',
  WARNING = 'WARNING',
  CRITICAL = 'CRITICAL',
}

export enum EstadoPoliza {
  ACTIVA = 'ACTIVA',
  VENCIDA = 'VENCIDA',
  CANCELADA = 'CANCELADA',
}

// Solo póliza de vida estudiantil para UTPL
export enum TipoPoliza {
  VIDA = 'VIDA',
  ACCIDENTES = 'ACCIDENTES', // Deprecated - mantener para compatibilidad
  MEDICA = 'MEDICA', // Deprecated - mantener para compatibilidad
}

export const estadoSiniestroLabels: Record<EstadoSiniestro, string> = {
  [EstadoSiniestro.RECIBIDO]: 'Recibido',
  [EstadoSiniestro.EN_VALIDACION]: 'En Validación',
  [EstadoSiniestro.BENEFICIARIOS]: 'Beneficiarios',
  [EstadoSiniestro.LIQUIDACION]: 'Liquidación',
  [EstadoSiniestro.PAGO]: 'Pago',
  [EstadoSiniestro.CERRADO]: 'Cerrado',
  [EstadoSiniestro.INVALIDO]: 'Inválido',
};

export const tipoSiniestroLabels: Record<TipoSiniestro, string> = {
  [TipoSiniestro.NATURAL]: 'Muerte Natural',
  [TipoSiniestro.ACCIDENTE]: 'Muerte por Accidente',
  [TipoSiniestro.DESCONOCIDO]: 'Por Determinar',
};
