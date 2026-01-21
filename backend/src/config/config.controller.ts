import { Body, Controller, Get, Post, Put, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { MailService } from '../mail/mail.service';

interface AseguradoraConfig {
  email: string;
  nombre: string;
}

// Almacenamiento en memoria para configuración editable (en producción usar BD)
let aseguradoraConfig: AseguradoraConfig = {
  email: '',
  nombre: '',
};

@ApiTags('Configuración')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('config')
export class ConfigController {
  constructor(
    private configService: ConfigService,
    private mailService: MailService,
  ) {
    // Inicializar con valores del .env
    aseguradoraConfig = {
      email: this.configService.get<string>('aseguradora.email') || 'seguros@aseguradora.com.ec',
      nombre: this.configService.get<string>('aseguradora.nombre') || 'Aseguradora',
    };
  }

  @Get('aseguradora')
  @ApiOperation({ summary: 'Get aseguradora configuration' })
  getAseguradoraConfig(): AseguradoraConfig {
    return aseguradoraConfig;
  }

  @Put('aseguradora')
  @ApiOperation({ summary: 'Update aseguradora configuration' })
  updateAseguradoraConfig(@Body() config: AseguradoraConfig): AseguradoraConfig {
    aseguradoraConfig = {
      email: config.email || aseguradoraConfig.email,
      nombre: config.nombre || aseguradoraConfig.nombre,
    };
    // También actualizar en MailService para que se use en envíos
    this.mailService.setAseguradoraConfig(aseguradoraConfig.email, aseguradoraConfig.nombre);
    return aseguradoraConfig;
  }

  @Get('smtp-status')
  @ApiOperation({ summary: 'Get SMTP configuration status' })
  getSMTPStatus() {
    const host = this.configService.get<string>('mail.host');
    const port = this.configService.get<number>('mail.port');
    const user = this.configService.get<string>('mail.user');
    const pass = this.configService.get<string>('mail.pass');
    const from = this.configService.get<string>('mail.from');
    
    const configured = !!(host && user && pass);
    
    return {
      configured,
      host: configured ? host : undefined,
      port: configured ? port : undefined,
      user: configured ? `${user?.substring(0, 5)}***` : undefined,
      passConfigured: !!pass,
      passLength: pass?.length || 0,
      from: from || 'NOT SET',
      // Debug: mostrar primeros caracteres del pass para verificar formato
      passPrefix: pass ? pass.substring(0, 8) : undefined,
    };
  }

  @Post('test-email')
  @ApiOperation({ summary: 'Send test email to gestor' })
  async sendTestEmail() {
    const gestorEmail = this.configService.get<string>('gestor.email') || 'gestor@utpl.edu.ec';
    
    const result = await this.mailService.sendMail({
      to: gestorEmail,
      subject: '[SGP UTPL] Email de prueba',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
            .container { max-width: 500px; margin: 0 auto; padding: 20px; }
            .header { background: #1976D2; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; }
            .content { background: #f5f5f5; padding: 20px; border-radius: 0 0 8px 8px; }
            .success { color: #4CAF50; font-size: 48px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>✅ Configuración de Email Exitosa</h2>
            </div>
            <div class="content">
              <p>¡Hola!</p>
              <p>Si estás recibiendo este correo, significa que la configuración SMTP del Sistema de Gestión de Pólizas está funcionando correctamente.</p>
              <p>Ahora podrás recibir:</p>
              <ul>
                <li>Alertas de vencimiento de plazos</li>
                <li>Notificaciones de nuevos casos</li>
                <li>Avisos de expedientes enviados</li>
              </ul>
              <p><strong>Fecha del test:</strong> ${new Date().toLocaleString('es-EC')}</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: 'Email de prueba - La configuración SMTP está funcionando correctamente.',
    });

    return { 
      success: result, 
      sentTo: gestorEmail,
      message: result 
        ? 'Email enviado correctamente. Revisa tu bandeja de entrada (y spam).'
        : 'Error al enviar email. Revisa los logs del backend y las credenciales SMTP.',
    };
  }

  @Get('smtp-debug')
  @ApiOperation({ summary: 'Debug SMTP configuration (shows what values are being read)' })
  getSMTPDebug() {
    const host = this.configService.get<string>('mail.host');
    const port = this.configService.get<number>('mail.port');
    const user = this.configService.get<string>('mail.user');
    const pass = this.configService.get<string>('mail.pass');
    const from = this.configService.get<string>('mail.from');
    
    return {
      status: 'Para Brevo, verifica:',
      checks: [
        {
          check: 'SMTP_HOST',
          value: host,
          expected: 'smtp-relay.brevo.com',
          ok: host === 'smtp-relay.brevo.com',
        },
        {
          check: 'SMTP_PORT',
          value: port,
          expected: 587,
          ok: port === 587,
        },
        {
          check: 'SMTP_USER',
          value: user ? `${user.substring(0, 10)}...` : 'NOT SET',
          expected: 'Tu email completo de Brevo (ej: user@domain.com)',
          hint: 'Debe ser el email con el que te registraste en Brevo',
        },
        {
          check: 'SMTP_PASS',
          value: pass ? `${pass.substring(0, 12)}... (${pass.length} chars)` : 'NOT SET',
          expected: 'Debe empezar con "xkeysib-" o "xsmtpsib-"',
          hint: 'Settings → SMTP & API → SMTP → Copiar SMTP Key',
          looksValid: pass?.startsWith('xkeysib') || pass?.startsWith('xsmtpsib'),
        },
        {
          check: 'SMTP_FROM',
          value: from,
          hint: 'El dominio del remitente debe estar verificado en Brevo si usas dominio custom',
        },
      ],
      brevoHelp: {
        step1: 'Login en https://app.brevo.com/',
        step2: 'Settings (icono engranaje) → SMTP & API',
        step3: 'En la pestaña SMTP, copia el "Login" (es tu email de Brevo)',
        step4: 'Genera o copia la SMTP Key (es la contraseña)',
        step5: 'Verifica que el dominio del From esté verificado o usa email de Brevo',
      },
    };
  }
}
