import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { AlertaTipo, AlertaSeveridad, AlertaRefType, SiniestroEstado } from '@prisma/client';

@Injectable()
export class AlertasService {
  private readonly logger = new Logger(AlertasService.name);
  private readonly plazoReporteDias: number;
  private readonly plazoLiquidacionDias: number;
  private readonly plazoPagoHoras: number;
  private readonly umbralCriticoDias: number;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    private mailService: MailService,
  ) {
    this.plazoReporteDias = this.configService.get<number>('plazos.reporteDias') || 60;
    this.plazoLiquidacionDias = this.configService.get<number>('plazos.liquidacionDiasHabiles') || 15;
    this.plazoPagoHoras = this.configService.get<number>('plazos.pagoHoras') || 72;
    this.umbralCriticoDias = this.configService.get<number>('plazos.umbralCriticoDias') || 10;
  }

  /**
   * Obtener todas las alertas con filtros opcionales
   */
  async findAll(filters?: {
    tipo?: AlertaTipo;
    severidad?: AlertaSeveridad;
    isResolved?: boolean;
  }) {
    const where: any = {};

    if (filters?.tipo) where.tipo = filters.tipo;
    if (filters?.severidad) where.severidad = filters.severidad;
    if (filters?.isResolved !== undefined) where.isResolved = filters.isResolved;

    return this.prisma.alerta.findMany({
      where,
      orderBy: [
        { isResolved: 'asc' },
        { severidad: 'desc' },
        { fechaLimite: 'asc' },
      ],
    });
  }

  /**
   * Obtener alertas no resueltas (para notificaciones)
   */
  async getUnresolvedAlerts() {
    return this.prisma.alerta.findMany({
      where: { isResolved: false },
      orderBy: [
        { severidad: 'desc' },
        { fechaLimite: 'asc' },
      ],
    });
  }

  /**
   * Obtener conteo de alertas no resueltas por severidad
   */
  async getAlertCounts() {
    const alerts = await this.prisma.alerta.groupBy({
      by: ['severidad'],
      where: { isResolved: false },
      _count: true,
    });

    return {
      total: alerts.reduce((sum, a) => sum + a._count, 0),
      critical: alerts.find((a) => a.severidad === 'CRITICAL')?._count || 0,
      warning: alerts.find((a) => a.severidad === 'WARNING')?._count || 0,
      info: alerts.find((a) => a.severidad === 'INFO')?._count || 0,
    };
  }

  /**
   * Marcar una alerta como resuelta
   */
  async resolveAlert(id: string) {
    const alert = await this.prisma.alerta.findUnique({ where: { id } });
    if (!alert) throw new NotFoundException('Alerta no encontrada');

    // Eliminar permanentemente la alerta
    await this.prisma.alerta.delete({ where: { id } });
    return { message: 'Alerta eliminada' };
  }

  /**
   * Eliminar todas las alertas
   */
  async resolveAllAlerts() {
    const result = await this.prisma.alerta.deleteMany({});

    this.logger.log(`${result.count} alertas eliminadas`);
    return { 
      message: `${result.count} alertas eliminadas`,
      count: result.count,
    };
  }

  /**
   * Crear una nueva alerta
   */
  async createAlert(data: {
    tipo: AlertaTipo;
    severidad: AlertaSeveridad;
    mensaje: string;
    refType: AlertaRefType;
    refId: string;
    fechaLimite: Date;
  }) {
    // Verificar si ya existe una alerta similar no resuelta
    const existing = await this.prisma.alerta.findFirst({
      where: {
        tipo: data.tipo,
        refType: data.refType,
        refId: data.refId,
        isResolved: false,
      },
    });

    if (existing) {
      // Actualizar la existente si la severidad cambió
      if (existing.severidad !== data.severidad) {
        return this.prisma.alerta.update({
          where: { id: existing.id },
          data: {
            severidad: data.severidad,
            mensaje: data.mensaje,
            fechaLimite: data.fechaLimite,
          },
        });
      }
      return existing;
    }

    // Crear nueva alerta
    const newAlert = await this.prisma.alerta.create({ data });

    // Enviar notificación por email
    await this.mailService.sendAlertToGestor({
      tipo: data.tipo,
      severidad: data.severidad,
      mensaje: data.mensaje,
      fechaLimite: data.fechaLimite,
    });

    return newAlert;
  }

  /**
   * Job programado: Verificar plazos de siniestros cada día a las 6:00 AM
   */
  @Cron(CronExpression.EVERY_DAY_AT_6AM)
  async checkSiniestroPlazos() {
    this.logger.log('Ejecutando verificación de plazos de siniestros...');

    const siniestros = await this.prisma.siniestro.findMany({
      where: {
        estado: {
          notIn: [SiniestroEstado.CERRADO],
        },
        // Solo siniestros que NO han sido enviados a aseguradora
        fechaEnvioAseguradora: null,
      },
    });

    const now = new Date();

    for (const siniestro of siniestros) {
      // Verificar plazo de 60 días desde REPORTE (no defunción)
      // El plazo solo aplica si aún no se ha enviado a la aseguradora
      if (siniestro.fechaReporte) {
        const deadline = new Date(siniestro.fechaReporte);
        deadline.setDate(deadline.getDate() + this.plazoReporteDias);
        
        const daysRemaining = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        // Alerta para plazo expirado (0 días)
        if (daysRemaining <= 0) {
          await this.createAlert({
            tipo: AlertaTipo.PLAZO_60D,
            severidad: AlertaSeveridad.CRITICAL,
            mensaje: `⚠️ PLAZO EXPIRADO: El caso ${siniestro.caseCode} ha excedido los 60 días para reportar a la aseguradora`,
            refType: AlertaRefType.SINIESTRO,
            refId: siniestro.id,
            fechaLimite: deadline,
          });
        }
        // Alerta para plazo por expirar
        else if (daysRemaining <= this.umbralCriticoDias) {
          const severidad = daysRemaining <= 5 ? AlertaSeveridad.CRITICAL : AlertaSeveridad.WARNING;
          await this.createAlert({
            tipo: AlertaTipo.PLAZO_60D,
            severidad,
            mensaje: `Quedan ${daysRemaining} días para reportar el caso ${siniestro.caseCode} a la aseguradora`,
            refType: AlertaRefType.SINIESTRO,
            refId: siniestro.id,
            fechaLimite: deadline,
          });
        }
      }

      // Verificar plazo de 15 días hábiles desde envío a aseguradora
      if (siniestro.fechaEnvioAseguradora && siniestro.estado === SiniestroEstado.LIQUIDACION) {
        const deadline = new Date(siniestro.fechaEnvioAseguradora);
        deadline.setDate(deadline.getDate() + this.plazoLiquidacionDias);
        
        const daysRemaining = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        if (daysRemaining <= 5 && daysRemaining > 0) {
          const severidad = daysRemaining <= 2 ? AlertaSeveridad.CRITICAL : AlertaSeveridad.WARNING;
          await this.createAlert({
            tipo: AlertaTipo.PLAZO_15D,
            severidad,
            mensaje: `Quedan ${daysRemaining} días hábiles para la liquidación del caso ${siniestro.caseCode}`,
            refType: AlertaRefType.SINIESTRO,
            refId: siniestro.id,
            fechaLimite: deadline,
          });
        }
      }

      // Verificar plazo de 72 horas para pago
      if (siniestro.fechaFirmaRecibida && siniestro.estado === SiniestroEstado.PAGO) {
        const deadline = new Date(siniestro.fechaFirmaRecibida);
        deadline.setHours(deadline.getHours() + this.plazoPagoHoras);
        
        const hoursRemaining = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60));

        if (hoursRemaining <= 48 && hoursRemaining > 0) {
          const severidad = hoursRemaining <= 24 ? AlertaSeveridad.CRITICAL : AlertaSeveridad.WARNING;
          await this.createAlert({
            tipo: AlertaTipo.PLAZO_72H,
            severidad,
            mensaje: `Quedan ${hoursRemaining} horas para ejecutar el pago del caso ${siniestro.caseCode}`,
            refType: AlertaRefType.SINIESTRO,
            refId: siniestro.id,
            fechaLimite: deadline,
          });
        }
      }
    }

    this.logger.log('Verificación de plazos completada');
  }

  /**
   * Job programado: Verificar vencimientos de pólizas
   */
  @Cron(CronExpression.EVERY_DAY_AT_6AM)
  async checkPolizaVencimientos() {
    this.logger.log('Ejecutando verificación de vencimientos de pólizas...');

    const vigencias = await this.prisma.polizaVigencia.findMany({
      where: {
        estado: 'ABIERTA',
      },
      include: {
        poliza: true,
      },
    });

    const now = new Date();

    for (const vigencia of vigencias) {
      const daysUntilExpiry = Math.ceil(
        (vigencia.hasta.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
      );

      if (daysUntilExpiry <= 30 && daysUntilExpiry > 0) {
        const severidad =
          daysUntilExpiry <= 7
            ? AlertaSeveridad.CRITICAL
            : daysUntilExpiry <= 15
            ? AlertaSeveridad.WARNING
            : AlertaSeveridad.INFO;

        await this.createAlert({
          tipo: AlertaTipo.VENCIMIENTO_POLIZA,
          severidad,
          mensaje: `La póliza ${vigencia.poliza.codigo} vence en ${daysUntilExpiry} días`,
          refType: AlertaRefType.POLIZA,
          refId: vigencia.polizaId,
          fechaLimite: vigencia.hasta,
        });
      }
    }

    this.logger.log('Verificación de vencimientos de pólizas completada');
  }
}
