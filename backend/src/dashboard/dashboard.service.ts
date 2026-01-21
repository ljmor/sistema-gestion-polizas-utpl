import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SiniestroEstado, AlertaSeveridad, SiniestroTipo } from '@prisma/client';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getKpis() {
    const [
      totalSiniestros,
      siniestrosRecibidos,
      siniestrosEnProceso,
      siniestroCerrados,
      alertasPendientes,
      montoTotalLiquidado,
      totalPolizas,
    ] = await Promise.all([
      this.prisma.siniestro.count(),
      this.prisma.siniestro.count({ where: { estado: SiniestroEstado.RECIBIDO } }),
      this.prisma.siniestro.count({
        where: {
          estado: {
            in: [
              SiniestroEstado.EN_VALIDACION,
              SiniestroEstado.BENEFICIARIOS,
              SiniestroEstado.LIQUIDACION,
              SiniestroEstado.PAGO,
            ],
          },
        },
      }),
      this.prisma.siniestro.count({ where: { estado: SiniestroEstado.CERRADO } }),
      this.prisma.alerta.count({ where: { isResolved: false } }),
      this.prisma.liquidacion.aggregate({
        _sum: { montoLiquidado: true },
      }),
      this.prisma.poliza.count(),
    ]);

    const montoTotal = montoTotalLiquidado._sum.montoLiquidado 
      ? Number(montoTotalLiquidado._sum.montoLiquidado) 
      : 0;

    return {
      totalSiniestros,
      siniestrosRecibidos,
      siniestrosEnProceso,
      siniestroCerrados,
      alertasPendientes,
      montoTotalLiquidado: montoTotal,
      promedioLiquidacion: siniestroCerrados > 0 ? Math.round(montoTotal / siniestroCerrados) : 0,
      totalPolizas,
      tasaCierre: totalSiniestros > 0 
        ? Math.round((siniestroCerrados / totalSiniestros) * 100) 
        : 0,
    };
  }

  // Estadísticas para reportes
  async getEstadisticasReportes() {
    // Siniestros por tipo
    const siniestrosPorTipo = await this.prisma.siniestro.groupBy({
      by: ['tipo'],
      _count: { id: true },
    });

    // Siniestros por estado
    const siniestrosPorEstado = await this.prisma.siniestro.groupBy({
      by: ['estado'],
      _count: { id: true },
    });

    // Evolución mensual (últimos 6 meses)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const siniestrosRecientes = await this.prisma.siniestro.findMany({
      where: { fechaReporte: { gte: sixMonthsAgo } },
      select: { fechaReporte: true, id: true },
    });

    // Agrupar por mes
    const evolucionMensual: Record<string, number> = {};
    siniestrosRecientes.forEach(s => {
      const mesKey = `${s.fechaReporte.getFullYear()}-${String(s.fechaReporte.getMonth() + 1).padStart(2, '0')}`;
      evolucionMensual[mesKey] = (evolucionMensual[mesKey] || 0) + 1;
    });

    // Convertir a array ordenado
    const evolucion = Object.entries(evolucionMensual)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([mes, cantidad]) => ({
        mes: this.formatMes(mes),
        cantidad,
      }));

    // Relación póliza-siniestros
    const polizasConSiniestros = await this.prisma.poliza.findMany({
      include: {
        siniestros: {
          include: { liquidacion: true },
        },
      },
    });

    const relacionPolizaSiniestros = polizasConSiniestros.map(p => {
      const totalSiniestros = p.siniestros.length;
      const montoLiquidado = p.siniestros.reduce((sum, s) => {
        return sum + (s.liquidacion?.montoLiquidado ? Number(s.liquidacion.montoLiquidado) : 0);
      }, 0);
      const prima = Number(p.prima) || 0;
      const ratio = prima > 0 ? (montoLiquidado / prima) * 100 : 0;

      return {
        poliza: p.nombre,
        polizaId: p.id,
        prima,
        siniestros: montoLiquidado,
        siniestrosCount: totalSiniestros,
        ratio: Math.round(ratio * 100) / 100,
      };
    });

    // Lista de siniestros con estado actual
    const siniestrosDetalle = await this.prisma.siniestro.findMany({
      include: { liquidacion: true },
      orderBy: { fechaReporte: 'desc' },
    });

    const estadoSiniestros = siniestrosDetalle.map((s: any) => {
      const diasEnProceso = Math.floor(
        (new Date().getTime() - new Date(s.fechaReporte).getTime()) / (1000 * 60 * 60 * 24)
      );
      return {
        caseCode: s.caseCode,
        fallecido: s.fallecidoNombre || 'N/A',
        fechaDefuncion: s.fechaDefuncion,
        estado: this.formatEstado(s.estado),
        diasEnProceso,
        montoLiquidado: s.liquidacion?.montoLiquidado 
          ? Number(s.liquidacion.montoLiquidado) 
          : null,
      };
    });

    return {
      siniestrosPorTipo: siniestrosPorTipo.map(s => ({
        name: s.tipo === SiniestroTipo.NATURAL ? 'Natural' : 'Accidente',
        value: s._count.id,
        color: s.tipo === SiniestroTipo.NATURAL ? '#4CAF50' : '#F44336',
      })),
      siniestrosPorEstado: siniestrosPorEstado.map(s => ({
        estado: this.formatEstado(s.estado),
        cantidad: s._count.id,
      })),
      evolucionMensual: evolucion,
      relacionPolizaSiniestros,
      estadoSiniestros,
    };
  }

  private formatMes(mesKey: string): string {
    const [year, month] = mesKey.split('-');
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    return `${meses[parseInt(month) - 1]} ${year.slice(2)}`;
  }

  private formatEstado(estado: SiniestroEstado): string {
    const map: Record<SiniestroEstado, string> = {
      RECIBIDO: 'Recibido',
      EN_VALIDACION: 'En Validación',
      BENEFICIARIOS: 'Beneficiarios',
      LIQUIDACION: 'Liquidación',
      PAGO: 'Pago',
      CERRADO: 'Cerrado',
      INVALIDO: 'Inválido',
    };
    return map[estado] || estado;
  }

  async getCasosRecientes(limit = 5) {
    const siniestros = await this.prisma.siniestro.findMany({
      take: limit,
      orderBy: { updatedAt: 'desc' },
    });

    return siniestros.map(s => ({
      id: s.id,
      caseCode: s.caseCode,
      estado: s.estado,
      tipo: s.tipo,
      fallecido: {
        nombreCompleto: s.fallecidoNombre,
        cedula: s.fallecidoCedula,
      },
      fechaDefuncion: s.fechaDefuncion,
      updatedAt: s.updatedAt,
    }));
  }

  async getAlertasCriticas(limit = 5) {
    const alertas = await this.prisma.alerta.findMany({
      where: {
        isResolved: false,
        severidad: { in: [AlertaSeveridad.WARNING, AlertaSeveridad.CRITICAL] },
      },
      take: limit,
      orderBy: [
        { severidad: 'desc' },
        { fechaLimite: 'asc' },
      ],
    });

    return alertas;
  }
}
