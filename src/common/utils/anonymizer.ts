import * as crypto from 'crypto';

/**
 * Utilidades para anonimización de datos sensibles
 * Esto protege datos como cédulas, nombres, etc. en archivos almacenados
 */

// Salt para hashing (en producción debería venir de una variable de entorno segura)
const ANONYMIZATION_SALT = process.env.ANONYMIZATION_SALT || 'sgp_utpl_anon_salt_2025';

/**
 * Genera un hash SHA-256 de un valor sensible
 * El hash es irreversible, protegiendo los datos originales
 */
export function hashSensitiveData(value: string): string {
  return crypto
    .createHmac('sha256', ANONYMIZATION_SALT)
    .update(value)
    .digest('hex')
    .substring(0, 16); // Tomamos solo 16 caracteres para que sea más manejable
}

/**
 * Anonimiza una cédula de identidad
 * Ejemplo: "1104567890" -> "110****890"
 */
export function anonymizeCedula(cedula: string): string {
  if (!cedula || cedula.length < 6) return '***';
  return cedula.substring(0, 3) + '****' + cedula.substring(cedula.length - 3);
}

/**
 * Anonimiza un nombre completo
 * Ejemplo: "Juan Carlos Pérez García" -> "J*** C*** P*** G***"
 */
export function anonymizeName(name: string): string {
  if (!name) return '***';
  return name
    .split(' ')
    .map((word) => (word.length > 0 ? word[0] + '***' : ''))
    .join(' ');
}

/**
 * Anonimiza un email
 * Ejemplo: "juan.perez@email.com" -> "j***@e***.com"
 */
export function anonymizeEmail(email: string): string {
  if (!email || !email.includes('@')) return '***@***.***';
  const [local, domain] = email.split('@');
  const domainParts = domain.split('.');
  const anonLocal = local.length > 0 ? local[0] + '***' : '***';
  const anonDomain = domainParts[0].length > 0 ? domainParts[0][0] + '***' : '***';
  const tld = domainParts.length > 1 ? domainParts[domainParts.length - 1] : 'com';
  return `${anonLocal}@${anonDomain}.${tld}`;
}

/**
 * Anonimiza un número de teléfono
 * Ejemplo: "0991234567" -> "099****567"
 */
export function anonymizePhone(phone: string): string {
  if (!phone || phone.length < 6) return '***';
  return phone.substring(0, 3) + '****' + phone.substring(phone.length - 3);
}

/**
 * Genera un identificador único anónimo para rastrear archivos
 * sin exponer datos personales
 */
export function generateAnonymousId(originalId: string, type: string): string {
  const combined = `${type}_${originalId}_${Date.now()}`;
  return hashSensitiveData(combined);
}

/**
 * Tipos de documentos sensibles que requieren anonimización especial
 */
export const SENSITIVE_DOCUMENT_TYPES = [
  'CEDULA_FALLECIDO',
  'CEDULA_BENEFICIARIO',
  'CEDULA_REPORTANTE',
  'CERTIFICADO_DEFUNCION',
  'CERTIFICADO_NACIMIENTO',
  'POSESION_EFECTIVA',
  'DOCUMENTO_IDENTIDAD',
];

/**
 * Verifica si un tipo de documento es sensible
 */
export function isSensitiveDocumentType(type: string): boolean {
  return SENSITIVE_DOCUMENT_TYPES.includes(type.toUpperCase());
}

/**
 * Genera metadata anonimizada para un archivo
 */
export function generateAnonymizedMetadata(
  originalName: string,
  documentType: string,
  uploaderId?: string,
) {
  const timestamp = Date.now();
  const anonymousName = `doc_${hashSensitiveData(originalName + timestamp)}.encrypted`;
  
  return {
    anonymousName,
    originalNameHash: hashSensitiveData(originalName),
    documentTypeHash: hashSensitiveData(documentType),
    uploaderHash: uploaderId ? hashSensitiveData(uploaderId) : null,
    timestamp,
    isSensitive: isSensitiveDocumentType(documentType),
  };
}
