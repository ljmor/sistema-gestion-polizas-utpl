export default () => ({
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  
  database: {
    url: process.env.DATABASE_URL,
  },
  
  jwt: {
    secret: process.env.JWT_SECRET || 'default_secret_change_in_production',
    expiresIn: process.env.JWT_EXPIRES_IN || '8h',
  },
  
  // Gestor UTPL - Usuario único del sistema
  gestor: {
    email: process.env.GESTOR_EMAIL || 'gestor@utpl.edu.ec',
    name: process.env.GESTOR_NAME || 'Gestor UTPL',
    password: process.env.GESTOR_PASSWORD || 'GestorUTPL2025!',
  },
  
  // Aseguradora - Email para envío de expedientes
  aseguradora: {
    email: process.env.ASEGURADORA_EMAIL || 'seguros@aseguradora.com.ec',
    nombre: process.env.ASEGURADORA_NOMBRE || 'Aseguradora',
  },
  
  // Email / SMTP
  mail: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.SMTP_FROM || 'Sistema SGP <noreply@utpl.edu.ec>',
  },
  
  // Brevo API (alternativa a SMTP para producción en servicios cloud)
  brevoApiKey: process.env.BREVO_API_KEY || '',
  
  // Storage
  storage: {
    type: process.env.STORAGE_TYPE || 'local',
    localPath: process.env.STORAGE_LOCAL_PATH || './uploads',
    s3: {
      endpoint: process.env.S3_ENDPOINT,
      accessKey: process.env.S3_ACCESS_KEY,
      secretKey: process.env.S3_SECRET_KEY,
      bucket: process.env.S3_BUCKET || 'sgp-files',
    },
  },
  
  // Anonimización
  anonymization: {
    enabled: process.env.ANONYMIZE_SENSITIVE_FILES === 'true',
    retentionDays: parseInt(process.env.SENSITIVE_FILE_RETENTION_DAYS || '365', 10),
  },
  
  // Redis
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },
  
  // Plazos de negocio
  plazos: {
    reporteDias: parseInt(process.env.PLAZO_REPORTE_DIAS || '60', 10),
    liquidacionDiasHabiles: parseInt(process.env.PLAZO_LIQUIDACION_DIAS_HABILES || '15', 10),
    pagoHoras: parseInt(process.env.PLAZO_PAGO_HORAS || '72', 10),
    umbralCriticoDias: parseInt(process.env.UMBRAL_CRITICO_DIAS || '10', 10),
  },
  
  // Límites
  limits: {
    maxFileMb: parseInt(process.env.MAX_FILE_MB || '10', 10),
    allowedMimeTypes: (process.env.ALLOWED_MIME_TYPES || 'application/pdf,image/jpeg,image/png').split(','),
    publicRateLimit: parseInt(process.env.PUBLIC_RATE_LIMIT || '20', 10),
  },
  
  // CORS
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  },
});
