import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

export interface SendMailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  attachments?: Array<{
    filename: string;
    path?: string;
    content?: Buffer;
  }>;
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter | null = null;
  private readonly fromAddress: string;
  private readonly gestorEmail: string;
  private aseguradoraEmail: string;  // Mutable para actualización en runtime
  private aseguradoraNombre: string;  // Mutable para actualización en runtime

  constructor(private configService: ConfigService) {
    this.fromAddress = this.configService.get<string>('mail.from') || 'Sistema SGP <noreply@utpl.edu.ec>';
    this.gestorEmail = this.configService.get<string>('gestor.email') || 'gestor@utpl.edu.ec';
    this.aseguradoraEmail = this.configService.get<string>('aseguradora.email') || 'seguros@aseguradora.com.ec';
    this.aseguradoraNombre = this.configService.get<string>('aseguradora.nombre') || 'Aseguradora';

    const host = this.configService.get<string>('mail.host');
    const user = this.configService.get<string>('mail.user');
    const pass = this.configService.get<string>('mail.pass');
    const port = this.configService.get<number>('mail.port') || 587;

    this.logger.log(`SMTP Config - Host: ${host || 'NOT SET'}, Port: ${port}, User: ${user ? user.substring(0, 5) + '***' : 'NOT SET'}`);

    if (host && user && pass) {
      // Configuración mejorada para diferentes proveedores
      const transportConfig: nodemailer.TransportOptions = {
        host,
        port,
        secure: port === 465, // true para 465, false para otros puertos
        auth: { user, pass },
        // Configuraciones adicionales para mejor compatibilidad
        tls: {
          // No fallar en certificados no válidos (útil para desarrollo)
          rejectUnauthorized: this.configService.get<string>('nodeEnv') === 'production',
        },
        // Timeout settings (aumentados para servicios cloud)
        connectionTimeout: 30000,
        greetingTimeout: 30000,
        socketTimeout: 60000,
      } as any;

      this.transporter = nodemailer.createTransport(transportConfig);
      
      // Verificar conexión al iniciar
      this.verifyConnection();
    } else {
      this.logger.warn('Mail transporter not configured - emails will be logged only');
      this.logger.warn('Configure SMTP_HOST, SMTP_USER, and SMTP_PASS in .env to enable email sending');
    }
  }

  private async verifyConnection() {
    if (!this.transporter) return;
    
    try {
      await this.transporter.verify();
      this.logger.log('✅ SMTP connection verified successfully');
    } catch (error: any) {
      this.logger.error(`❌ SMTP connection failed: ${error.message}`);
      this.logger.error('Check your SMTP credentials and settings');
      // No deshabilitamos el transporter, pero logueamos el error
    }
  }

  getAseguradoraEmail(): string {
    return this.aseguradoraEmail;
  }

  getAseguradoraNombre(): string {
    return this.aseguradoraNombre;
  }

  /**
   * Actualiza la configuración de la aseguradora en tiempo de ejecución
   */
  setAseguradoraConfig(email: string, nombre: string): void {
    if (email) {
      this.aseguradoraEmail = email;
    }
    if (nombre) {
      this.aseguradoraNombre = nombre;
    }
    this.logger.log(`Aseguradora config updated: ${this.aseguradoraNombre} <${this.aseguradoraEmail}>`);
  }

  async sendMail(options: SendMailOptions): Promise<boolean> {
    try {
      if (this.transporter) {
        this.logger.log(`Attempting to send email to ${options.to}...`);
        if (options.attachments && options.attachments.length > 0) {
          this.logger.log(`   With ${options.attachments.length} attachment(s): ${options.attachments.map(a => a.filename).join(', ')}`);
        }
        
        const info = await this.transporter.sendMail({
          from: this.fromAddress,
          to: options.to,
          subject: options.subject,
          html: options.html,
          text: options.text,
          attachments: options.attachments, // ¡IMPORTANTE: Pasar los attachments!
        });
        
        this.logger.log(`✅ Email sent successfully to ${options.to}`);
        this.logger.log(`   Subject: ${options.subject}`);
        this.logger.log(`   Message ID: ${info.messageId}`);
        if (options.attachments && options.attachments.length > 0) {
          this.logger.log(`   Attachments: ${options.attachments.length} file(s)`);
        }
        if (info.response) {
          this.logger.log(`   Server response: ${info.response}`);
        }
        return true;
      } else {
        // En desarrollo sin SMTP, solo logueamos el email
        this.logger.log(`════════════════════════════════════════════════════════`);
        this.logger.log(`📧 [DEV MODE - EMAIL NOT SENT]`);
        this.logger.log(`   To: ${options.to}`);
        this.logger.log(`   Subject: ${options.subject}`);
        this.logger.log(`   Body preview: ${(options.text || options.html).substring(0, 150)}...`);
        if (options.attachments && options.attachments.length > 0) {
          this.logger.log(`   Attachments: ${options.attachments.map(a => a.filename).join(', ')}`);
        }
        this.logger.log(`════════════════════════════════════════════════════════`);
        return true; // Retornamos true para no bloquear flujos en desarrollo
      }
    } catch (error: any) {
      this.logger.error(`❌ Failed to send email to ${options.to}`);
      this.logger.error(`   Error: ${error.message}`);
      if (error.code) {
        this.logger.error(`   Error code: ${error.code}`);
      }
      if (error.responseCode) {
        this.logger.error(`   SMTP Response code: ${error.responseCode}`);
      }
      // Sugerencias de solución según el error
      if (error.code === 'ECONNREFUSED') {
        this.logger.error(`   💡 Tip: Check if SMTP host and port are correct`);
      } else if (error.code === 'EAUTH' || error.responseCode === 535) {
        this.logger.error(`   💡 Tip: Check SMTP credentials (user/password)`);
        this.logger.error(`   💡 For Gmail: Use App Password, not regular password`);
        this.logger.error(`   💡 For Brevo: Use SMTP key from settings`);
      }
      return false;
    }
  }

  /**
   * Envía una alerta al gestor UTPL
   */
  async sendAlertToGestor(alert: {
    tipo: string;
    severidad: string;
    mensaje: string;
    caseCode?: string;
    fechaLimite?: Date;
  }): Promise<boolean> {
    const severityConfig: Record<string, { bg: string; icon: string; label: string }> = {
      INFO: { bg: '#0D47A1', icon: 'ℹ️', label: 'Información' },
      WARNING: { bg: '#E65100', icon: '⚠️', label: 'Advertencia' },
      CRITICAL: { bg: '#B71C1C', icon: '🚨', label: '¡URGENTE!' },
    };

    const config = severityConfig[alert.severidad] || severityConfig.INFO;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
          .header { background: ${config.bg}; color: #ffffff !important; padding: 25px; text-align: center; border-bottom: 3px solid rgba(0,0,0,0.2); }
          .header-icon { font-size: 36px; margin-bottom: 10px; }
          .header h1 { margin: 0; font-size: 20px; font-weight: 600; color: #ffffff !important; }
          .header p { margin: 8px 0 0 0; opacity: 0.95; font-size: 13px; color: #ffffff !important; }
          .content { padding: 25px; background: white; }
          .message-box { background: #fafafa; padding: 20px; border-radius: 8px; border-left: 4px solid ${config.bg}; margin-bottom: 20px; }
          .message-box p { margin: 0; color: #333; font-size: 15px; line-height: 1.6; }
          .meta-info { background: #f5f5f5; padding: 15px; border-radius: 8px; }
          .meta-row { display: flex; justify-content: space-between; margin-bottom: 8px; flex-wrap: wrap; }
          .meta-row:last-child { margin-bottom: 0; }
          .meta-label { color: #666; font-size: 13px; }
          .meta-value { color: #333; font-weight: 600; font-size: 13px; }
          .button { display: inline-block; background: ${config.bg}; color: white; padding: 12px 24px; 
                    text-decoration: none; border-radius: 6px; margin-top: 20px; font-weight: 500; }
          .footer { background: #263238; color: #B0BEC5; padding: 15px; text-align: center; font-size: 11px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header" style="background: ${config.bg}; padding: 25px; text-align: center;">
            <div class="header-icon" style="font-size: 36px; margin-bottom: 10px;">${config.icon}</div>
            <h1 style="margin: 0; font-size: 20px; font-weight: bold; color: #FFFFFF; background-color: ${config.bg}; padding: 4px 12px; display: inline-block; border-radius: 4px;">${config.label}</h1>
            <p style="margin: 8px 0 0 0; color: #FFFFFF; font-size: 13px; font-weight: 500;">${alert.tipo}</p>
          </div>
          <div class="content">
            <div class="message-box">
              <p>${alert.mensaje}</p>
            </div>
            ${alert.caseCode || alert.fechaLimite ? `
            <div class="meta-info">
              ${alert.caseCode ? `
              <div class="meta-row">
                <span class="meta-label">📁 Caso:</span>
                <span class="meta-value">${alert.caseCode}</span>
              </div>
              ` : ''}
              ${alert.fechaLimite ? `
              <div class="meta-row">
                <span class="meta-label">📅 Fecha límite:</span>
                <span class="meta-value">${alert.fechaLimite.toLocaleDateString('es-EC', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </div>
              ` : ''}
            </div>
            ` : ''}
            <center>
              <a href="${process.env.CORS_ORIGIN || 'http://localhost:5173'}/app/alertas" class="button">
                Ver en el sistema →
              </a>
            </center>
          </div>
          <div class="footer">
            Sistema de Gestión de Pólizas UTPL
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
══════════════════════════════════════════════
  ${config.icon} ${config.label} - ${alert.tipo}
══════════════════════════════════════════════

${alert.mensaje}

${alert.caseCode ? `Caso: ${alert.caseCode}` : ''}
${alert.fechaLimite ? `Fecha límite: ${alert.fechaLimite.toLocaleDateString('es-EC')}` : ''}

──────────────────────────────────────────────
Sistema de Gestión de Pólizas UTPL
    `;

    return this.sendMail({
      to: this.gestorEmail,
      subject: `[SGP UTPL] ${config.icon} ${config.label} - ${alert.tipo}`,
      html,
      text,
    });
  }

  /**
   * Envía expediente a la aseguradora con archivos adjuntos
   */
  async sendExpedienteToAseguradora(data: {
    caseCode: string;
    fallecidoNombre: string;
    fallecidoCedula: string;
    fechaDefuncion: string;
    tipo: string;
    documentosAdjuntos: number;
    montoCobertura?: number;
    observaciones?: string;
    attachments?: Array<{ filename: string; path?: string; content?: Buffer }>;
  }): Promise<boolean> {
    const attachmentInfo = data.attachments && data.attachments.length > 0
      ? `<div style="background: #e8f5e9; border: 1px solid #4CAF50; border-radius: 8px; padding: 15px; margin-top: 15px;">
          <p style="margin: 0; color: #2e7d32; font-weight: 600;">📎 Archivos adjuntos (${data.attachments.length}):</p>
          <ul style="margin: 10px 0 0 0; padding-left: 20px; color: #333;">
            ${data.attachments.map(a => `<li>${a.filename}</li>`).join('')}
          </ul>
        </div>`
      : '';

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; background: #f5f5f5; margin: 0; padding: 20px; }
          .container { max-width: 650px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
          .header { background: #0D47A1; color: #ffffff !important; padding: 30px; text-align: center; border-bottom: 4px solid #1565C0; }
          .header h1 { margin: 0; font-size: 24px; font-weight: 600; color: #ffffff !important; }
          .header p { margin: 10px 0 0 0; opacity: 0.95; font-size: 14px; color: #ffffff !important; }
          .logo { font-size: 40px; margin-bottom: 10px; }
          .content { padding: 30px; background: white; }
          .info-card { background: #fafafa; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #0D47A1; }
          .info-card h3 { margin: 0 0 15px 0; color: #0D47A1; font-size: 16px; font-weight: 600; }
          .info-row { display: flex; margin-bottom: 12px; flex-wrap: wrap; }
          .info-label { font-weight: 600; color: #333; min-width: 160px; }
          .info-value { color: #555; }
          .highlight { background: #E3F2FD; padding: 4px 10px; border-radius: 4px; font-weight: 600; color: #0D47A1; }
          .footer { background: #263238; color: #B0BEC5; padding: 20px; text-align: center; font-size: 12px; }
          .footer a { color: #90CAF9; text-decoration: none; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header" style="background: #0D47A1; padding: 30px; text-align: center;">
            <div class="logo" style="font-size: 40px; margin-bottom: 10px;">📋</div>
            <h1 style="margin: 0; font-size: 24px; font-weight: bold; color: #FFFFFF; background-color: #0D47A1; padding: 6px 14px; display: inline-block; border-radius: 4px;">Nuevo Expediente de Siniestro</h1>
            <p style="margin: 10px 0 0 0; color: #FFFFFF; font-size: 14px; font-weight: 500;">Universidad Técnica Particular de Loja</p>
          </div>
          <div class="content">
            <div class="info-card">
              <h3>📁 Datos del Caso</h3>
              <div class="info-row">
                <span class="info-label">Código de caso:</span>
                <span class="info-value"><span class="highlight">${data.caseCode}</span></span>
              </div>
              <div class="info-row">
                <span class="info-label">Tipo de siniestro:</span>
                <span class="info-value">${data.tipo}</span>
              </div>
              ${data.montoCobertura ? `
              <div class="info-row">
                <span class="info-label">Monto cobertura:</span>
                <span class="info-value"><strong>$${data.montoCobertura.toLocaleString()}</strong></span>
              </div>
              ` : ''}
            </div>
            
            <div class="info-card">
              <h3>👤 Datos del Asegurado Fallecido</h3>
              <div class="info-row">
                <span class="info-label">Nombre completo:</span>
                <span class="info-value">${data.fallecidoNombre}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Cédula:</span>
                <span class="info-value">${data.fallecidoCedula}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Fecha de defunción:</span>
                <span class="info-value">${data.fechaDefuncion}</span>
              </div>
            </div>

            <div class="info-card">
              <h3>📄 Documentación</h3>
              <p style="margin: 0; color: #555;">Se adjuntan <strong>${data.documentosAdjuntos}</strong> documento(s) de respaldo del expediente.</p>
              ${data.observaciones ? `<p style="margin: 15px 0 0 0; padding: 10px; background: #fff3e0; border-radius: 4px; color: #e65100;"><strong>Observaciones:</strong> ${data.observaciones}</p>` : ''}
              ${attachmentInfo}
            </div>
          </div>
          <div class="footer">
            <p style="margin: 0;">Este correo ha sido generado automáticamente por el<br><strong>Sistema de Gestión de Pólizas UTPL</strong></p>
            <p style="margin: 10px 0 0 0;">Para consultas: <a href="mailto:${this.gestorEmail}">${this.gestorEmail}</a></p>
          </div>
        </div>
      </body>
      </html>
    `;

    const attachmentList = data.attachments && data.attachments.length > 0
      ? `\nARCHIVOS ADJUNTOS:\n${data.attachments.map(a => `  - ${a.filename}`).join('\n')}`
      : '';

    const text = `
══════════════════════════════════════════════
    NUEVO EXPEDIENTE DE SINIESTRO - UTPL
══════════════════════════════════════════════

DATOS DEL CASO
─────────────────────────────────────────────
Código de caso: ${data.caseCode}
Tipo de siniestro: ${data.tipo}
${data.montoCobertura ? `Monto cobertura: $${data.montoCobertura.toLocaleString()}` : ''}

DATOS DEL ASEGURADO FALLECIDO
─────────────────────────────────────────────
Nombre: ${data.fallecidoNombre}
Cédula: ${data.fallecidoCedula}
Fecha de defunción: ${data.fechaDefuncion}

DOCUMENTACIÓN
─────────────────────────────────────────────
Se adjuntan ${data.documentosAdjuntos} documento(s) de respaldo.
${data.observaciones ? `Observaciones: ${data.observaciones}` : ''}
${attachmentList}

══════════════════════════════════════════════
Sistema de Gestión de Pólizas UTPL
Contacto: ${this.gestorEmail}
══════════════════════════════════════════════
    `;

    return this.sendMail({
      to: this.aseguradoraEmail,
      subject: `[UTPL] Expediente de Siniestro - ${data.caseCode} - ${data.fallecidoNombre}`,
      html,
      text,
      attachments: data.attachments,
    });
  }

  /**
   * Envía solicitud de documentos faltantes a beneficiarios
   */
  async sendDocumentosRequeridosToBeneficiarios(data: {
    caseCode: string;
    fallecidoNombre: string;
    beneficiarioEmail: string;
    beneficiarioNombre: string;
    documentosFaltantes: string[];
    fechaLimite?: Date;
  }): Promise<boolean> {
    const docList = data.documentosFaltantes.map(d => `<li>${d}</li>`).join('');
    const docListText = data.documentosFaltantes.map(d => `  • ${d}`).join('\n');

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #FF9800, #F57C00); color: #ffffff !important; padding: 25px; border-radius: 8px 8px 0 0; border-bottom: 3px solid #E65100; }
          .header h1 { margin: 0; font-size: 20px; color: #ffffff !important; text-shadow: 0 1px 2px rgba(0,0,0,0.3); }
          .content { background: #fff8e1; padding: 25px; border-radius: 0 0 8px 8px; }
          .message { background: white; padding: 20px; border-radius: 8px; margin-bottom: 15px; }
          .doc-list { background: #fff3e0; padding: 15px 15px 15px 30px; border-radius: 8px; border-left: 4px solid #FF9800; }
          .doc-list li { margin: 8px 0; color: #e65100; font-weight: 500; }
          .important { background: #ffecb3; padding: 15px; border-radius: 8px; margin-top: 15px; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 13px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header" style="background: #E65100; padding: 25px; border-radius: 8px 8px 0 0; text-align: center;">
            <h1 style="margin: 0; font-size: 22px; color: #FFFFFF; font-weight: bold; background-color: #E65100; padding: 8px 16px; display: inline-block; border-radius: 4px;">📄 Solicitud de Documentación Adicional</h1>
            <p style="margin: 12px 0 0 0; color: #FFFFFF; font-size: 14px; font-weight: 500;">Sistema de Gestión de Pólizas - UTPL</p>
          </div>
          <div class="content">
            <div class="message">
              <p>Estimado/a <strong>${data.beneficiarioNombre}</strong>,</p>
              <p>Le escribimos respecto al caso de siniestro <strong>${data.caseCode}</strong> relacionado con el fallecimiento de <strong>${data.fallecidoNombre}</strong>.</p>
              <p>Para continuar con el proceso de liquidación, necesitamos que nos proporcione la siguiente documentación:</p>
            </div>
            
            <ul class="doc-list">
              ${docList}
            </ul>

            ${data.fechaLimite ? `
            <div class="important">
              <strong>⚠️ Fecha límite:</strong> ${data.fechaLimite.toLocaleDateString('es-EC', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
            ` : ''}
            
            <div class="message" style="margin-top: 20px;">
              <p>Puede enviar los documentos respondiendo a este correo o comunicándose con nosotros.</p>
              <p>Agradecemos su pronta colaboración.</p>
              <p style="margin-bottom: 0;">Atentamente,<br><strong>Gestión de Seguros UTPL</strong></p>
            </div>
          </div>
          <div class="footer">
            <p>Universidad Técnica Particular de Loja</p>
            <p>Contacto: ${this.gestorEmail}</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
SOLICITUD DE DOCUMENTACIÓN ADICIONAL
Sistema de Gestión de Pólizas - UTPL

Estimado/a ${data.beneficiarioNombre},

Le escribimos respecto al caso de siniestro ${data.caseCode} relacionado con el fallecimiento de ${data.fallecidoNombre}.

Para continuar con el proceso de liquidación, necesitamos que nos proporcione la siguiente documentación:

${docListText}

${data.fechaLimite ? `FECHA LÍMITE: ${data.fechaLimite.toLocaleDateString('es-EC')}` : ''}

Puede enviar los documentos respondiendo a este correo o comunicándose con nosotros.

Agradecemos su pronta colaboración.

Atentamente,
Gestión de Seguros UTPL
Contacto: ${this.gestorEmail}
    `;

    return this.sendMail({
      to: data.beneficiarioEmail,
      subject: `[UTPL] Documentación requerida - Caso ${data.caseCode}`,
      html,
      text,
    });
  }

  /**
   * Envía comprobante de liquidación a beneficiarios
   */
  async sendLiquidacionToBeneficiario(data: {
    caseCode: string;
    fallecidoNombre: string;
    beneficiarioEmail: string;
    beneficiarioNombre: string;
    montoLiquidado: number;
    porcentajeBeneficiario: number;
    montoBeneficiario: number;
    banco?: string;
    cuenta?: string;
    fechaLiquidacion: string;
    attachments?: Array<{ filename: string; path?: string; content?: Buffer }>;
  }): Promise<boolean> {
    const attachmentInfo = data.attachments && data.attachments.length > 0
      ? `<div style="background: #e8f5e9; border: 1px solid #4CAF50; border-radius: 8px; padding: 15px; margin-top: 20px;">
          <p style="margin: 0; color: #2e7d32; font-weight: 600;">📎 Documentos adjuntos:</p>
          <ul style="margin: 10px 0 0 0; padding-left: 20px; color: #333;">
            ${data.attachments.map(a => `<li>${a.filename}</li>`).join('')}
          </ul>
        </div>`
      : '';

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; background: #f5f5f5; margin: 0; padding: 20px; }
          .container { max-width: 650px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
          .header { background: #2E7D32; color: #ffffff !important; padding: 30px; text-align: center; border-bottom: 4px solid #1B5E20; }
          .header-icon { font-size: 50px; margin-bottom: 10px; }
          .header h1 { margin: 0; font-size: 24px; font-weight: 600; color: #ffffff !important; }
          .header p { margin: 10px 0 0 0; opacity: 0.95; font-size: 14px; color: #ffffff !important; }
          .content { padding: 30px; background: white; }
          .greeting { font-size: 16px; color: #333; margin-bottom: 20px; }
          .amount-box { background: linear-gradient(135deg, #E8F5E9, #C8E6C9); padding: 25px; border-radius: 12px; text-align: center; margin: 20px 0; border: 2px solid #4CAF50; }
          .amount-label { color: #2E7D32; font-size: 14px; margin-bottom: 5px; }
          .amount-value { color: #1B5E20; font-size: 36px; font-weight: 700; }
          .info-card { background: #fafafa; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .info-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
          .info-row:last-child { border-bottom: none; }
          .info-label { color: #666; }
          .info-value { color: #333; font-weight: 500; }
          .bank-info { background: #E3F2FD; padding: 15px; border-radius: 8px; margin-top: 20px; }
          .bank-info h4 { margin: 0 0 10px 0; color: #1565C0; }
          .footer { background: #263238; color: #B0BEC5; padding: 20px; text-align: center; font-size: 12px; }
          .footer a { color: #90CAF9; text-decoration: none; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header" style="background: #2E7D32; padding: 30px; text-align: center;">
            <div class="header-icon" style="font-size: 50px; margin-bottom: 10px;">✅</div>
            <h1 style="margin: 0; font-size: 24px; font-weight: bold; color: #FFFFFF; background-color: #2E7D32; padding: 6px 14px; display: inline-block; border-radius: 4px;">Liquidación Aprobada</h1>
            <p style="margin: 10px 0 0 0; color: #FFFFFF; font-size: 14px; font-weight: 500;">Caso ${data.caseCode}</p>
          </div>
          <div class="content">
            <p class="greeting">Estimado/a <strong>${data.beneficiarioNombre}</strong>,</p>
            
            <p>Nos complace informarle que la liquidación del siniestro relacionado con el fallecimiento de <strong>${data.fallecidoNombre}</strong> ha sido aprobada.</p>

            <div class="amount-box">
              <div class="amount-label">MONTO A RECIBIR</div>
              <div class="amount-value">$${data.montoBeneficiario.toLocaleString('es-EC', { minimumFractionDigits: 2 })}</div>
            </div>

            <div class="info-card">
              <div class="info-row">
                <span class="info-label">Monto total liquidado:</span>
                <span class="info-value">$${data.montoLiquidado.toLocaleString('es-EC', { minimumFractionDigits: 2 })}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Su porcentaje:</span>
                <span class="info-value">${data.porcentajeBeneficiario}%</span>
              </div>
              <div class="info-row">
                <span class="info-label">Fecha de liquidación:</span>
                <span class="info-value">${data.fechaLiquidacion}</span>
              </div>
            </div>

            ${data.banco && data.cuenta ? `
            <div class="bank-info">
              <h4>🏦 Datos bancarios registrados</h4>
              <p style="margin: 5px 0;"><strong>Banco:</strong> ${data.banco}</p>
              <p style="margin: 5px 0;"><strong>Cuenta:</strong> ${data.cuenta}</p>
              <p style="margin: 10px 0 0 0; font-size: 13px; color: #666;">El depósito se realizará en esta cuenta. Si los datos son incorrectos, comuníquese con nosotros.</p>
            </div>
            ` : `
            <div class="bank-info" style="background: #FFF3E0; border: 1px solid #FF9800;">
              <h4 style="color: #E65100;">⚠️ Datos bancarios pendientes</h4>
              <p style="margin: 0; color: #E65100;">Por favor, proporcione sus datos bancarios para realizar el depósito.</p>
            </div>
            `}

            ${attachmentInfo}

            <p style="margin-top: 25px; color: #666;">Si tiene alguna consulta, no dude en contactarnos.</p>
          </div>
          <div class="footer">
            <p style="margin: 0;"><strong>Sistema de Gestión de Pólizas UTPL</strong></p>
            <p style="margin: 10px 0 0 0;">Contacto: <a href="mailto:${this.gestorEmail}">${this.gestorEmail}</a></p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
══════════════════════════════════════════════
  ✅ LIQUIDACIÓN APROBADA - UTPL
══════════════════════════════════════════════

Estimado/a ${data.beneficiarioNombre},

La liquidación del siniestro relacionado con el fallecimiento de ${data.fallecidoNombre} ha sido aprobada.

MONTO A RECIBIR: $${data.montoBeneficiario.toLocaleString('es-EC', { minimumFractionDigits: 2 })}

─────────────────────────────────────────────
DETALLES DE LA LIQUIDACIÓN
─────────────────────────────────────────────
Caso: ${data.caseCode}
Monto total liquidado: $${data.montoLiquidado.toLocaleString('es-EC', { minimumFractionDigits: 2 })}
Su porcentaje: ${data.porcentajeBeneficiario}%
Fecha de liquidación: ${data.fechaLiquidacion}

${data.banco && data.cuenta ? `
DATOS BANCARIOS REGISTRADOS
─────────────────────────────────────────────
Banco: ${data.banco}
Cuenta: ${data.cuenta}
` : `
⚠️ DATOS BANCARIOS PENDIENTES
Por favor proporcione sus datos bancarios.
`}

══════════════════════════════════════════════
Sistema de Gestión de Pólizas UTPL
Contacto: ${this.gestorEmail}
══════════════════════════════════════════════
    `;

    return this.sendMail({
      to: data.beneficiarioEmail,
      subject: `[UTPL] ✅ Liquidación Aprobada - Caso ${data.caseCode} - $${data.montoBeneficiario.toLocaleString()}`,
      html,
      text,
      attachments: data.attachments,
    });
  }

  /**
   * Envía comprobante de pago realizado a beneficiarios
   */
  async sendComprobantePagoToBeneficiario(data: {
    caseCode: string;
    fallecidoNombre: string;
    beneficiarioEmail: string;
    beneficiarioNombre: string;
    montoPagado: number;
    fechaPago: string;
    docContable?: string;
    banco?: string;
    cuenta?: string;
    observaciones?: string;
    attachments?: Array<{ filename: string; path?: string; content?: Buffer }>;
  }): Promise<boolean> {
    const attachmentInfo = data.attachments && data.attachments.length > 0
      ? `<div style="background: #e8f5e9; border: 1px solid #4CAF50; border-radius: 8px; padding: 15px; margin-top: 20px;">
          <p style="margin: 0; color: #2e7d32; font-weight: 600;">📎 Comprobante de pago adjunto:</p>
          <ul style="margin: 10px 0 0 0; padding-left: 20px; color: #333;">
            ${data.attachments.map(a => `<li>${a.filename}</li>`).join('')}
          </ul>
        </div>`
      : '';

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; background: #f5f5f5; margin: 0; padding: 20px; }
          .container { max-width: 650px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
          .header { background: #1565C0; color: white; padding: 30px; text-align: center; }
          .header-icon { font-size: 50px; margin-bottom: 10px; }
          .header h1 { margin: 0; font-size: 24px; font-weight: 600; }
          .header p { margin: 10px 0 0 0; opacity: 0.9; font-size: 14px; }
          .content { padding: 30px; background: white; }
          .greeting { font-size: 16px; color: #333; margin-bottom: 20px; }
          .amount-box { background: linear-gradient(135deg, #E3F2FD, #BBDEFB); padding: 25px; border-radius: 12px; text-align: center; margin: 20px 0; border: 2px solid #1976D2; }
          .amount-label { color: #1565C0; font-size: 14px; margin-bottom: 5px; }
          .amount-value { color: #0D47A1; font-size: 36px; font-weight: 700; }
          .success-badge { display: inline-block; background: #4CAF50; color: white; padding: 8px 16px; border-radius: 20px; font-size: 14px; margin-top: 10px; }
          .info-card { background: #fafafa; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .info-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
          .info-row:last-child { border-bottom: none; }
          .info-label { color: #666; }
          .info-value { color: #333; font-weight: 500; }
          .footer { background: #263238; color: #B0BEC5; padding: 20px; text-align: center; font-size: 12px; }
          .footer a { color: #90CAF9; text-decoration: none; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header" style="background: #1565C0; padding: 30px; text-align: center;">
            <div class="header-icon" style="font-size: 50px; margin-bottom: 10px;">💰</div>
            <h1 style="margin: 0; font-size: 24px; font-weight: bold; color: #FFFFFF; background-color: #1565C0; padding: 6px 14px; display: inline-block; border-radius: 4px;">Pago Realizado</h1>
            <p style="margin: 10px 0 0 0; color: #FFFFFF; font-size: 14px; font-weight: 500;">Caso ${data.caseCode}</p>
          </div>
          <div class="content">
            <p class="greeting">Estimado/a <strong>${data.beneficiarioNombre}</strong>,</p>
            
            <p>Nos complace informarle que se ha realizado el pago correspondiente al siniestro relacionado con el fallecimiento de <strong>${data.fallecidoNombre}</strong>.</p>

            <div class="amount-box">
              <div class="amount-label">MONTO DEPOSITADO</div>
              <div class="amount-value">$${data.montoPagado.toLocaleString('es-EC', { minimumFractionDigits: 2 })}</div>
              <div class="success-badge">✓ Pago completado</div>
            </div>

            <div class="info-card">
              <div class="info-row">
                <span class="info-label">Fecha de pago:</span>
                <span class="info-value">${data.fechaPago}</span>
              </div>
              ${data.docContable ? `
              <div class="info-row">
                <span class="info-label">Documento contable:</span>
                <span class="info-value">${data.docContable}</span>
              </div>
              ` : ''}
              ${data.banco ? `
              <div class="info-row">
                <span class="info-label">Banco destino:</span>
                <span class="info-value">${data.banco}</span>
              </div>
              ` : ''}
              ${data.cuenta ? `
              <div class="info-row">
                <span class="info-label">Cuenta:</span>
                <span class="info-value">${data.cuenta}</span>
              </div>
              ` : ''}
            </div>

            ${data.observaciones ? `
            <div style="background: #FFF3E0; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #FF9800;">
              <p style="margin: 0; color: #E65100;"><strong>Observaciones:</strong> ${data.observaciones}</p>
            </div>
            ` : ''}

            ${attachmentInfo}

            <p style="margin-top: 25px; color: #666;">Adjunto encontrará el comprobante de pago para sus registros. Si tiene alguna consulta, no dude en contactarnos.</p>
          </div>
          <div class="footer">
            <p style="margin: 0;"><strong>Sistema de Gestión de Pólizas UTPL</strong></p>
            <p style="margin: 10px 0 0 0;">Contacto: <a href="mailto:${this.gestorEmail}">${this.gestorEmail}</a></p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
══════════════════════════════════════════════
  💰 PAGO REALIZADO - UTPL
══════════════════════════════════════════════

Estimado/a ${data.beneficiarioNombre},

Se ha realizado el pago correspondiente al siniestro relacionado con el fallecimiento de ${data.fallecidoNombre}.

MONTO DEPOSITADO: $${data.montoPagado.toLocaleString('es-EC', { minimumFractionDigits: 2 })}
✓ Pago completado

─────────────────────────────────────────────
DETALLES DEL PAGO
─────────────────────────────────────────────
Caso: ${data.caseCode}
Fecha de pago: ${data.fechaPago}
${data.docContable ? `Documento contable: ${data.docContable}` : ''}
${data.banco ? `Banco destino: ${data.banco}` : ''}
${data.cuenta ? `Cuenta: ${data.cuenta}` : ''}
${data.observaciones ? `\nObservaciones: ${data.observaciones}` : ''}

${data.attachments && data.attachments.length > 0 ? `
COMPROBANTE ADJUNTO
─────────────────────────────────────────────
${data.attachments.map(a => `- ${a.filename}`).join('\n')}
` : ''}

══════════════════════════════════════════════
Sistema de Gestión de Pólizas UTPL
Contacto: ${this.gestorEmail}
══════════════════════════════════════════════
    `;

    return this.sendMail({
      to: data.beneficiarioEmail,
      subject: `[UTPL] 💰 Pago Realizado - Caso ${data.caseCode} - $${data.montoPagado.toLocaleString()}`,
      html,
      text,
      attachments: data.attachments,
    });
  }

  /**
   * Enviar contraseña temporal para recuperación de cuenta
   */
  async sendTempPassword(email: string, userName: string, tempPassword: string): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; background: #f5f5f5; margin: 0; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #1565C0, #0D47A1); color: white; padding: 30px; text-align: center; }
          .header-icon { font-size: 50px; margin-bottom: 10px; }
          .header h1 { margin: 0; font-size: 24px; font-weight: 600; color: #FFFFFF !important; text-shadow: 0 1px 2px rgba(0,0,0,0.3); }
          .header p { margin: 10px 0 0 0; color: #FFFFFF; opacity: 0.9; font-size: 14px; }
          .content { padding: 30px; }
          .password-box { background: linear-gradient(135deg, #FFF3E0, #FFE0B2); padding: 25px; border-radius: 12px; text-align: center; margin: 25px 0; border: 2px dashed #FF9800; }
          .password-label { color: #E65100; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px; }
          .password-value { font-family: 'Courier New', monospace; font-size: 32px; font-weight: bold; color: #E65100; letter-spacing: 3px; background: white; padding: 15px 25px; border-radius: 8px; display: inline-block; }
          .warning-box { background: #FFEBEE; padding: 15px; border-radius: 8px; border-left: 4px solid #F44336; margin: 20px 0; }
          .warning-box p { margin: 0; color: #C62828; font-size: 14px; }
          .steps { background: #E3F2FD; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .steps h3 { margin: 0 0 15px 0; color: #1565C0; font-size: 16px; }
          .steps ol { margin: 0; padding-left: 20px; color: #333; }
          .steps li { margin-bottom: 10px; }
          .footer { background: #263238; color: #B0BEC5; padding: 20px; text-align: center; font-size: 12px; }
          .footer a { color: #90CAF9; text-decoration: none; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header" style="background: linear-gradient(135deg, #1565C0, #0D47A1); padding: 30px; text-align: center;">
            <div style="font-size: 50px; margin-bottom: 10px;">🔐</div>
            <h1 style="margin: 0; font-size: 24px; font-weight: bold; color: #FFFFFF; background-color: #0D47A1; padding: 8px 16px; display: inline-block; border-radius: 6px; text-shadow: 0 2px 4px rgba(0,0,0,0.4);">Recuperación de Contraseña</h1>
            <p style="margin: 12px 0 0 0; color: #FFFFFF; font-size: 14px; font-weight: 600; background-color: rgba(0,0,0,0.2); padding: 6px 12px; border-radius: 4px; display: inline-block;">Sistema de Gestión de Pólizas UTPL</p>
          </div>
          <div class="content">
            <p>Hola <strong>${userName}</strong>,</p>
            
            <p>Hemos recibido una solicitud para restablecer tu contraseña. A continuación encontrarás tu nueva contraseña temporal:</p>

            <div class="password-box">
              <div class="password-label">Tu contraseña temporal</div>
              <div class="password-value">${tempPassword}</div>
            </div>

            <div class="warning-box">
              <p>⚠️ <strong>Importante:</strong> Esta contraseña es temporal. Te recomendamos cambiarla inmediatamente después de iniciar sesión por una contraseña segura de tu elección.</p>
            </div>

            <div class="steps">
              <h3>📋 Pasos a seguir:</h3>
              <ol>
                <li>Ingresa al sistema con tu correo y esta contraseña temporal</li>
                <li>Ve a <strong>Mi Perfil</strong> en el menú</li>
                <li>Cambia tu contraseña por una nueva y segura</li>
              </ol>
            </div>

            <p style="color: #666; font-size: 14px;">Si no solicitaste este cambio, contacta inmediatamente al administrador del sistema.</p>
          </div>
          <div class="footer">
            <p style="margin: 0;"><strong>Sistema de Gestión de Pólizas UTPL</strong></p>
            <p style="margin: 10px 0 0 0;">Este es un correo automático, por favor no responda a este mensaje.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
══════════════════════════════════════════════
  🔐 RECUPERACIÓN DE CONTRASEÑA - UTPL
══════════════════════════════════════════════

Hola ${userName},

Hemos recibido una solicitud para restablecer tu contraseña.

TU CONTRASEÑA TEMPORAL: ${tempPassword}

─────────────────────────────────────────────
PASOS A SEGUIR:
─────────────────────────────────────────────
1. Ingresa al sistema con tu correo y esta contraseña temporal
2. Ve a "Mi Perfil" en el menú
3. Cambia tu contraseña por una nueva y segura

⚠️ IMPORTANTE: Esta contraseña es temporal. Te recomendamos
cambiarla inmediatamente después de iniciar sesión.

Si no solicitaste este cambio, contacta inmediatamente al
administrador del sistema.

══════════════════════════════════════════════
Sistema de Gestión de Pólizas UTPL
══════════════════════════════════════════════
    `;

    return this.sendMail({
      to: email,
      subject: '[UTPL] 🔐 Recuperación de Contraseña - Contraseña Temporal',
      html,
      text,
    });
  }
}
