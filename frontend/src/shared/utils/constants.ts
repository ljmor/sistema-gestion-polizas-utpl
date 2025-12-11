export const PLAZOS = {
  REPORTE_DIAS: 60,
  LIQUIDACION_DIAS_HABILES: 15,
  PAGO_HORAS: 72,
};

export const COPAGOS = {
  GENERAL: 0.30,
  ESPECIAL: 0.65,
  LICENCIA: 1.00,
};

export const DOCUMENTOS_BASE_NATURAL = [
  { tipo: 'CEDULA_FALLECIDO', nombre: 'Cédula del fallecido', requerido: true },
  { tipo: 'CERTIFICADO_DEFUNCION', nombre: 'Certificado de defunción', requerido: true },
  { tipo: 'POSESION_EFECTIVA', nombre: 'Posesión efectiva', requerido: true },
  { tipo: 'CEDULAS_BENEFICIARIOS', nombre: 'Cédulas de beneficiarios', requerido: true },
  { tipo: 'CUENTA_BANCARIA', nombre: 'Cuenta bancaria beneficiarios', requerido: true },
  { tipo: 'CERTIFICADO_MATRICULA', nombre: 'Certificado de matrícula', requerido: false },
];

export const DOCUMENTOS_ADICIONALES_ACCIDENTE = [
  { tipo: 'ACTA_LEVANTAMIENTO', nombre: 'Acta de levantamiento de cadáver', requerido: true },
  { tipo: 'PARTE_POLICIAL', nombre: 'Parte policial', requerido: true },
  { tipo: 'AUTOPSIA', nombre: 'Autopsia', requerido: true },
  { tipo: 'ALCOHOLEMIA', nombre: 'Examen de alcoholemia', requerido: true },
];

export const RELACIONES_REPORTANTE = [
  { value: 'FAMILIAR', label: 'Familiar' },
  { value: 'COMPANERO', label: 'Compañero' },
  { value: 'PERSONAL', label: 'Personal institucional' },
  { value: 'OTRO', label: 'Otro' },
];

// Solo estudiantes UTPL tienen cobertura de póliza de vida
export const GRUPOS_ASEGURADOS = [
  { value: 'ESTUDIANTES_PRESENCIAL', label: 'Estudiantes Modalidad Presencial' },
  { value: 'ESTUDIANTES_DISTANCIA', label: 'Estudiantes Modalidad a Distancia' },
  { value: 'ESTUDIANTES_ONLINE', label: 'Estudiantes Modalidad Online' },
];

// Solo póliza de vida para estudiantes UTPL
export const TIPOS_POLIZA = [
  { value: 'VIDA', label: 'Póliza de Vida Estudiantil' },
];

export const ACCEPTED_FILE_TYPES = {
  documents: {
    'application/pdf': ['.pdf'],
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/png': ['.png'],
  },
  all: {
    'application/pdf': ['.pdf'],
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/png': ['.png'],
    'application/zip': ['.zip'],
    'application/x-rar-compressed': ['.rar'],
  },
};

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export const APP_NAME = import.meta.env.VITE_APP_NAME || 'Sistema de Gestión de Siniestros';
