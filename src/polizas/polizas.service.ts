import { Injectable, NotFoundException, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PolizaTipo, PolizaEstado, VigenciaEstado } from '@prisma/client';

@Injectable()
export class PolizasService {
  private readonly logger = new Logger(PolizasService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Crear una nueva póliza
   */
  async create(dto: {
    nombre: string;
    tipo: string;
    prima: number;
    montoCobertura: number;
    descripcion?: string;
    vigenciaDesde: string;
    vigenciaHasta: string;
  }) {
    // Generar código único
    const count = await this.prisma.poliza.count();
    const tipoPrefix = dto.tipo.substring(0, 3).toUpperCase();
    const codigo = `POL-${tipoPrefix}-${(count + 1).toString().padStart(3, '0')}`;

    // Crear póliza con vigencia inicial
    const poliza = await this.prisma.poliza.create({
      data: {
        codigo,
        nombre: dto.nombre,
        tipo: dto.tipo as PolizaTipo,
        estado: PolizaEstado.ACTIVA,
        prima: dto.prima,
        montoCobertura: dto.montoCobertura,
        descripcion: dto.descripcion || null,
        moneda: 'USD',
        vigencias: {
          create: {
            desde: new Date(dto.vigenciaDesde),
            hasta: new Date(dto.vigenciaHasta),
            estado: VigenciaEstado.ABIERTA,
            configJson: {
              cobertura: dto.montoCobertura,
              descripcion: dto.descripcion || '',
            },
          },
        },
      },
      include: {
        vigencias: true,
      },
    });

    this.logger.log(`Póliza creada: ${codigo}`);
    return {
      ...poliza,
      vigenciaActual: (poliza as any).vigencias?.[0] || null,
    };
  }

  /**
   * Actualizar una póliza existente
   */
  async update(id: string, dto: {
    nombre?: string;
    tipo?: string;
    prima?: number;
    montoCobertura?: number;
    descripcion?: string;
    estado?: string;
    vigenciaDesde?: string;
    vigenciaHasta?: string;
  }) {
    const existing = await this.prisma.poliza.findUnique({ 
      where: { id },
      include: { vigencias: { orderBy: { desde: 'desc' }, take: 1 } },
    });
    if (!existing) {
      throw new NotFoundException('Póliza no encontrada');
    }

    const poliza = await this.prisma.poliza.update({
      where: { id },
      data: {
        ...(dto.nombre && { nombre: dto.nombre }),
        ...(dto.tipo && { tipo: dto.tipo as PolizaTipo }),
        ...(dto.prima !== undefined && { prima: dto.prima }),
        ...(dto.montoCobertura !== undefined && { montoCobertura: dto.montoCobertura }),
        ...(dto.descripcion !== undefined && { descripcion: dto.descripcion }),
        ...(dto.estado && { estado: dto.estado as PolizaEstado }),
      },
      include: {
        vigencias: { orderBy: { desde: 'desc' }, take: 1 },
      },
    });

    // Si hay nuevas fechas de vigencia, actualizar la vigencia actual
    if (dto.vigenciaDesde || dto.vigenciaHasta) {
      const vigenciaActual = (existing as any).vigencias?.[0];
      if (vigenciaActual) {
        await this.prisma.polizaVigencia.update({
          where: { id: vigenciaActual.id },
          data: {
            ...(dto.vigenciaDesde && { desde: new Date(dto.vigenciaDesde) }),
            ...(dto.vigenciaHasta && { hasta: new Date(dto.vigenciaHasta) }),
          },
        });
      }
    }

    this.logger.log(`Póliza actualizada: ${poliza.codigo}`);
    return {
      ...poliza,
      vigenciaActual: (poliza as any).vigencias?.[0] || null,
    };
  }

  /**
   * Eliminar una póliza
   */
  async delete(id: string) {
    const existing = await this.prisma.poliza.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException('Póliza no encontrada');
    }

    // Verificar si hay siniestros asociados
    const siniestrosCount = await this.prisma.siniestro.count({
      where: { polizaId: id },
    });

    if (siniestrosCount > 0) {
      throw new BadRequestException('No se puede eliminar una póliza que tiene siniestros asociados');
    }

    // Eliminar vigencias primero
    await this.prisma.polizaVigencia.deleteMany({ where: { polizaId: id } });
    
    // Eliminar pagos si existen
    await this.prisma.polizaPago.deleteMany({ where: { polizaId: id } });
    
    // Eliminar la póliza
    await this.prisma.poliza.delete({ where: { id } });

    this.logger.log(`Póliza eliminada: ${existing.codigo}`);
    return { success: true, message: 'Póliza eliminada correctamente' };
  }

  async findAll() {
    const polizas = await this.prisma.poliza.findMany({
      orderBy: { updatedAt: 'desc' },
      include: {
        vigencias: {
          orderBy: { desde: 'desc' },
          take: 1,
        },
      },
    });

    return polizas.map((p: any) => {
      const vigenciaActual = p.vigencias?.[0] || null;
      return {
        ...p,
        vigenciaActual,
        vigenciaDesde: vigenciaActual?.desde || null,
        vigenciaHasta: vigenciaActual?.hasta || null,
      };
    });
  }

  async findOne(id: string) {
    const poliza = await this.prisma.poliza.findUnique({
      where: { id },
      include: {
        vigencias: {
          orderBy: { desde: 'desc' },
        },
        pagos: {
          orderBy: { fecha: 'desc' },
        },
      },
    });

    if (!poliza) {
      throw new NotFoundException('Póliza no encontrada');
    }

    return {
      ...poliza,
      vigenciaActual: (poliza as any).vigencias?.[0] || null,
    };
  }

  async search(query: string) {
    const polizas = await this.prisma.poliza.findMany({
      where: {
        OR: [
          { codigo: { contains: query, mode: 'insensitive' } },
          { nombre: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: 10,
    });
    return polizas;
  }

  /**
   * Crear una nueva vigencia para una póliza
   */
  async createVigencia(polizaId: string, dto: { desde: string; hasta: string }) {
    const poliza = await this.prisma.poliza.findUnique({ where: { id: polizaId } });
    if (!poliza) {
      throw new NotFoundException('Póliza no encontrada');
    }

    // Cerrar vigencias anteriores
    await this.prisma.polizaVigencia.updateMany({
      where: { polizaId, estado: VigenciaEstado.ABIERTA },
      data: { estado: VigenciaEstado.CERRADA },
    });

    // Crear nueva vigencia
    const vigencia = await this.prisma.polizaVigencia.create({
      data: {
        polizaId,
        desde: new Date(dto.desde),
        hasta: new Date(dto.hasta),
        estado: VigenciaEstado.ABIERTA,
        configJson: {
          cobertura: poliza.montoCobertura,
        },
      },
    });

    this.logger.log(`Nueva vigencia creada para póliza ${poliza.codigo}`);
    return vigencia;
  }

  /**
   * Cerrar una vigencia activa
   */
  async cerrarVigencia(polizaId: string, vigenciaId: string) {
    const poliza = await this.prisma.poliza.findUnique({ where: { id: polizaId } });
    if (!poliza) {
      throw new NotFoundException('Póliza no encontrada');
    }

    const vigencia = await this.prisma.polizaVigencia.findFirst({
      where: { id: vigenciaId, polizaId },
    });
    if (!vigencia) {
      throw new NotFoundException('Vigencia no encontrada');
    }

    if (vigencia.estado !== VigenciaEstado.ABIERTA) {
      throw new BadRequestException('La vigencia ya está cerrada');
    }

    const updated = await this.prisma.polizaVigencia.update({
      where: { id: vigenciaId },
      data: { estado: VigenciaEstado.CERRADA },
    });

    this.logger.log(`Vigencia cerrada para póliza ${poliza.codigo}`);
    return updated;
  }
}
