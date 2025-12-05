import { BadRequestException, Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SiniestroEstado, DocumentoEstado, FirmaEstado, LiquidacionEstado } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import { ChangeStateDto } from './dto/change-state.dto';
import { UpdateDocumentoDto } from './dto/update-documento.dto';
import { MailService } from '../mail/mail.service';

@Injectable()
export class SiniestrosService {
  private readonly logger = new Logger(SiniestrosService.name);

  private readonly uploadsPath: string;

  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
    private configService: ConfigService,
  ) {
    this.uploadsPath = this.configService.get<string>('storage.localPath') || './uploads';
  }

  /**
   * Calcula los días restantes para el plazo de 60 días desde la fecha de REPORTE
   * El plazo se considera completado si ya se envió a la aseguradora
   */
  private calcularDiasRestantes60(fechaReporte: Date | null, fechaEnvioAseguradora: Date | null): number | null {
    // Si ya se envió a la aseguradora, el plazo está cumplido
    if (fechaEnvioAseguradora) return null;
    
    if (!fechaReporte) return null;
    
    const fechaLimite = new Date(fechaReporte);
    fechaLimite.setDate(fechaLimite.getDate() + 60);
    
    const hoy = new Date();
    const diffTime = fechaLimite.getTime() - hoy.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return Math.max(0, diffDays);
  }

  /**
   * Calcula los días hábiles restantes para respuesta de aseguradora (15 días hábiles)
   */
  private calcularDiasHabilesRestantes15(fechaEnvio: Date | null): number | null {
    if (!fechaEnvio) return null;
    
    // Simplificación: asumimos 15 días hábiles ≈ 21 días calendario
    const fechaLimite = new Date(fechaEnvio);
    fechaLimite.setDate(fechaLimite.getDate() + 21);
    
    const hoy = new Date();
    const diffTime = fechaLimite.getTime() - hoy.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return Math.max(0, Math.ceil(diffDays * 15 / 21)); // Convertir a días hábiles aproximados
  }

  /**
   * Calcula las horas restantes para el pago (72 horas desde liquidación)
   */
  private calcularHorasRestantes72(fechaLiquidacion: Date | null): number | null {
    if (!fechaLiquidacion) return null;
    
    const fechaLimite = new Date(fechaLiquidacion);
    fechaLimite.setHours(fechaLimite.getHours() + 72);
    
    const ahora = new Date();
    const diffTime = fechaLimite.getTime() - ahora.getTime();
    const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
    
    return Math.max(0, diffHours);
  }

  // Transforma el siniestro de la BD a la estructura que espera el frontend
  private transformSiniestro(siniestro: any) {
    // Obtener monto de cobertura de la póliza si está asociada
    const montoCobertura = siniestro.poliza?.montoCobertura 
      ? Number(siniestro.poliza.montoCobertura)
      : null;

    // Transformar documentos para incluir URLs
    const documentos = (siniestro.documentos || []).map((doc: any) => ({
      ...doc,
      // Construir URL del documento si tiene archivo asociado
      // Los archivos se guardan en uploads/documents
      url: doc.file?.path ? `/uploads/documents/${doc.file.path}` : null,
      nombre: doc.file?.originalName || doc.tipo,
    }));

    // Transformar liquidación para incluir URLs
    const liquidacion = siniestro.liquidacion ? {
      ...siniestro.liquidacion,
      montoLiquidado: siniestro.liquidacion.montoLiquidado 
        ? Number(siniestro.liquidacion.montoLiquidado) 
        : 0,
      // URL del archivo de liquidación
      liquidacionUrl: siniestro.liquidacion.liquidacion?.path 
        ? `/uploads/documents/${siniestro.liquidacion.liquidacion.path}` 
        : null,
    } : null;

    return {
      ...siniestro,
      // Documentos con URLs
      documentos,
      // Liquidación transformada
      liquidacion,
      // Campos transformados para el frontend
      fallecido: {
        nombreCompleto: siniestro.fallecidoNombre || '',
        cedula: siniestro.fallecidoCedula || '',
        fechaDefuncion: siniestro.fechaDefuncion,
      },
      reportante: {
        nombre: siniestro.reportanteNombre || '',
        relacion: siniestro.reportanteRelacion || '',
        email: siniestro.reportanteEmail || '',
        telefono: siniestro.reportanteTelefono || '',
      },
      // Monto de cobertura de la póliza
      montoCobertura,
      // Indicar si el plazo 60d está cumplido (se envió a aseguradora)
      plazo60dCompletado: !!siniestro.fechaEnvioAseguradora || !!siniestro.liquidacion?.fechaEnvioAseguradora,
      // Calcular plazos - usar la fecha de la liquidación si existe, si no la del siniestro
      diasRestantes60: this.calcularDiasRestantes60(
        siniestro.fechaReporte, 
        siniestro.fechaEnvioAseguradora || siniestro.liquidacion?.fechaEnvioAseguradora
      ),
      diasHabilesRestantes15: this.calcularDiasHabilesRestantes15(
        siniestro.fechaEnvioAseguradora || siniestro.liquidacion?.fechaEnvioAseguradora
      ),
      horasRestantes72: this.calcularHorasRestantes72(siniestro.fechaLiquidacion),
      // Mapear pago para compatibilidad con frontend
      pago: siniestro.pago ? {
        ...siniestro.pago,
        estadoPago: siniestro.pago.estado, // El frontend espera estadoPago
      } : null,
    };
  }

  /**
   * Crea un siniestro manualmente (desde el panel del gestor)
   */
  async createManual(dto: {
    tipo: string;
    fechaDefuncion?: string;
    observaciones?: string;
    fallecidoNombre: string;
    fallecidoCedula: string;
    reportanteNombre?: string;
    reportanteEmail?: string;
    reportanteTelefono?: string;
    reportanteRelacion?: string;
  }) {
    const year = new Date().getFullYear();
    const count = await this.prisma.siniestro.count();
    const caseCode = `SIN-${year}-${(count + 1).toString().padStart(6, '0')}`;

    const siniestro = await this.prisma.siniestro.create({
      data: {
        caseCode,
        tipo: dto.tipo as any,
        estado: SiniestroEstado.RECIBIDO,
        fechaDefuncion: dto.fechaDefuncion ? new Date(dto.fechaDefuncion) : null,
        observaciones: dto.observaciones || 'Caso creado manualmente por el gestor.',
        fallecidoNombre: dto.fallecidoNombre,
        fallecidoCedula: dto.fallecidoCedula,
        reportanteNombre: dto.reportanteNombre,
        reportanteEmail: dto.reportanteEmail,
        reportanteTelefono: dto.reportanteTelefono,
        reportanteRelacion: dto.reportanteRelacion,
      },
    });

    // Registrar evento de auditoría
    await this.createAuditEvent(siniestro.id, 'CASO_CREADO', {
      description: `Caso ${caseCode} creado manualmente por el gestor`,
      performedBy: 'GESTOR',
    });

    this.logger.log(`Caso ${caseCode} creado manualmente`);

    return this.transformSiniestro(siniestro);
  }

  async findAll(filters?: {
    search?: string;
    estado?: string;
    tipo?: string;
    fechaDesde?: string;
    fechaHasta?: string;
    soloVencimientos?: boolean;
  }) {
    const where: any = {};

    // Filtro por búsqueda (nombre, cédula, caseCode)
    if (filters?.search) {
      where.OR = [
        { caseCode: { contains: filters.search, mode: 'insensitive' } },
        { fallecidoNombre: { contains: filters.search, mode: 'insensitive' } },
        { fallecidoCedula: { contains: filters.search, mode: 'insensitive' } },
        { reportanteNombre: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    // Filtro por estado
    if (filters?.estado) {
      where.estado = filters.estado;
    }

    // Filtro por tipo
    if (filters?.tipo) {
      where.tipo = filters.tipo;
    }

    // Filtro por fecha de defunción
    if (filters?.fechaDesde || filters?.fechaHasta) {
      where.fechaDefuncion = {};
      if (filters.fechaDesde) {
        where.fechaDefuncion.gte = new Date(filters.fechaDesde);
      }
      if (filters.fechaHasta) {
        where.fechaDefuncion.lte = new Date(filters.fechaHasta);
      }
    }

    // Filtro de solo vencimientos próximos (menos de 15 días)
    if (filters?.soloVencimientos) {
      const ahora = new Date();
      const limite = new Date();
      limite.setDate(ahora.getDate() + 15);
      
      // Casos que no están cerrados ni inválidos y tienen fechas próximas a vencer
      where.estado = { notIn: ['CERRADO', 'INVALIDO'] };
    }

    const siniestros = await this.prisma.siniestro.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      include: {
        poliza: true, // Incluir póliza para obtener montoCobertura
      },
    });
    return siniestros.map(s => this.transformSiniestro(s));
  }

  async findOne(id: string) {
    const siniestro = await this.prisma.siniestro.findUnique({
      where: { id },
      include: {
        poliza: true, // Incluir póliza para obtener montoCobertura
        documentos: {
          include: {
            file: true, // Incluir archivo para obtener la URL
          },
        },
        beneficiarios: true,
        liquidacion: {
          include: {
            liquidacion: true, // Incluir archivo de liquidación
          },
        },
        pago: true,
      },
    });
    if (!siniestro) throw new NotFoundException('Siniestro not found');
    
    // Consultar eventos de auditoría por separado (usa campos genéricos entity/entityId)
    const auditEvents = await this.prisma.auditEvent.findMany({
      where: {
        entity: 'SINIESTRO',
        entityId: id,
      },
      orderBy: { createdAt: 'desc' },
    });
    
    // Transformar eventos de auditoría al formato del frontend
    const auditTrail = auditEvents.map((event: any) => ({
      id: event.id,
      fecha: event.createdAt,
      usuario: (event.meta as any)?.performedBy || 'Sistema',
      accion: this.formatAuditAction(event.action),
      detalles: (event.meta as any)?.description || '',
    }));

    return {
      ...this.transformSiniestro(siniestro),
      auditTrail,
    };
  }

  private formatAuditAction(action: string): string {
    const actionMap: Record<string, string> = {
      'CASO_CREADO': 'Caso creado',
      'DOCUMENTO_APROBADO': 'Documento aprobado',
      'DOCUMENTO_RECHAZADO': 'Documento rechazado',
      'ESTADO_CAMBIADO': 'Estado cambiado',
      'ENVIADO_A_ASEGURADORA': 'Expediente enviado a aseguradora',
      'LIQUIDACION_REGISTRADA': 'Liquidación registrada',
      'LIQUIDACION_ENVIADA': 'Liquidación enviada a beneficiarios',
      'PAGO_REGISTRADO': 'Pago registrado',
      'CASO_CERRADO': 'Caso cerrado',
      'BENEFICIARIO_AGREGADO': 'Beneficiario agregado',
      'BENEFICIARIO_ACTUALIZADO': 'Beneficiario actualizado',
      'MARCADO_INVALIDO': 'Marcado como inválido',
      'DOCUMENTOS_SOLICITADOS': 'Documentos solicitados',
      'RECEPCION_COMPLETADA': 'Recepción completada',
    };
    return actionMap[action] || action;
  }

  /**
   * Helper para crear eventos de auditoría con formato correcto
   */
  private async createAuditEvent(siniestroId: string, action: string, meta: { description: string; performedBy?: string }) {
    await this.prisma.auditEvent.create({
      data: {
        entity: 'SINIESTRO',
        entityId: siniestroId,
        action,
        meta: meta as any,
      },
    });
  }

  async update(id: string, data: any) {
    this.logger.log(`Actualizando siniestro ${id} con datos: ${JSON.stringify(data)}`);
    
    const siniestro = await this.prisma.siniestro.findUnique({
      where: { id },
    });
    if (!siniestro) {
      throw new NotFoundException('Siniestro no encontrado');
    }

    const updateData: any = {};
    
    // Solo actualizar campos que vienen con valor válido
    if (data.tipo && typeof data.tipo === 'string') {
      updateData.tipo = data.tipo;
    }
    if (data.estado && typeof data.estado === 'string') {
      updateData.estado = data.estado;
    }
    if (data.observaciones !== undefined) {
      updateData.observaciones = data.observaciones || '';
    }
    
    // polizaId: usar sintaxis de relación de Prisma
    if (data.polizaId !== undefined) {
      if (data.polizaId && typeof data.polizaId === 'string' && data.polizaId.trim() !== '') {
        updateData.poliza = { connect: { id: data.polizaId } };
      } else {
        updateData.poliza = { disconnect: true };
      }
    }
    
    if (data.grupoAsegurado !== undefined) {
      updateData.grupoAsegurado = data.grupoAsegurado && data.grupoAsegurado.trim() !== '' ? data.grupoAsegurado : null;
    }
    
    // Campos del fallecido
    if (data.fallecidoNombre !== undefined && data.fallecidoNombre) {
      updateData.fallecidoNombre = data.fallecidoNombre;
    }
    if (data.fallecidoCedula !== undefined && data.fallecidoCedula) {
      updateData.fallecidoCedula = data.fallecidoCedula;
    }
    if (data.fechaDefuncion !== undefined) {
      try {
        updateData.fechaDefuncion = data.fechaDefuncion ? new Date(data.fechaDefuncion) : null;
      } catch {
        this.logger.warn(`Fecha de defunción inválida: ${data.fechaDefuncion}`);
      }
    }
    
    // Si se está cerrando el caso, agregar fecha de cierre
    if (data.estado === 'CERRADO') {
      updateData.fechaCierre = new Date();
    }

    this.logger.log(`Datos a actualizar: ${JSON.stringify(updateData)}`);

    const updated = await this.prisma.siniestro.update({
      where: { id },
      data: updateData,
    });

    // Registrar evento de auditoría si cambió el estado
    if (data.estado && data.estado !== siniestro.estado) {
      if (data.estado === 'CERRADO') {
        await this.createAuditEvent(id, 'CASO_CERRADO', {
          description: 'Caso cerrado exitosamente',
          performedBy: 'GESTOR',
        });
      } else if (data.estado === 'RECIBIDO') {
        await this.createAuditEvent(id, 'RECEPCION_COMPLETADA', {
          description: 'Documentación marcada como recibida',
          performedBy: 'GESTOR',
        });
      } else {
        await this.createAuditEvent(id, 'ESTADO_CAMBIADO', {
          description: `Estado cambiado de ${siniestro.estado} a ${data.estado}`,
          performedBy: 'GESTOR',
        });
      }
    }

    return this.transformSiniestro(updated);
  }

  async changeState(id: string, dto: ChangeStateDto) {
    const siniestro = await this.findOne(id);
    const currentState = siniestro.estado;
    const nextState = dto.nextState;

    // Basic transition validation (simplified)
    if (currentState === nextState) return siniestro;

    // TODO: Implement full state machine rules here
    // Example: if (nextState === 'BENEFICIARIOS' && !checklistComplete(siniestro)) throw Error...

    return this.prisma.siniestro.update({
      where: { id },
      data: {
        estado: nextState,
        // Update specific date fields based on transition if needed
      },
    });
  }

  async updateDocumento(siniestroId: string, docId: string, dto: UpdateDocumentoDto) {
    // Verify siniestro exists
    const siniestro = await this.prisma.siniestro.findUnique({
      where: { id: siniestroId },
    });
    if (!siniestro) {
      throw new NotFoundException('Siniestro no encontrado');
    }

    // Verify document belongs to this siniestro
    const documento = await this.prisma.documento.findFirst({
      where: { id: docId, siniestroId },
    });
    if (!documento) {
      throw new NotFoundException('Documento no encontrado');
    }

    // Update the document
    const updated = await this.prisma.documento.update({
      where: { id: docId },
      data: {
        estado: dto.estado,
        motivoRechazo: dto.motivoRechazo,
      },
    });

    // Registrar evento de auditoría
    const estadoStr = dto.estado ? String(dto.estado) : 'actualizado';
    const actionType = estadoStr === 'APROBADO' ? 'DOCUMENTO_APROBADO' : estadoStr === 'RECHAZADO' ? 'DOCUMENTO_RECHAZADO' : 'DOCUMENTO_ACTUALIZADO';
    await this.createAuditEvent(siniestroId, actionType, {
      description: `Documento ${documento.tipo} ${estadoStr.toLowerCase()}${dto.motivoRechazo ? `: ${dto.motivoRechazo}` : ''}`,
      performedBy: 'GESTOR',
    });

    return updated;
  }

  /**
   * Subir un documento para un siniestro
   */
  async uploadDocumento(siniestroId: string, tipo: string, file: Express.Multer.File) {
    // Verificar que el siniestro existe
    const siniestro = await this.prisma.siniestro.findUnique({
      where: { id: siniestroId },
    });
    if (!siniestro) {
      throw new NotFoundException('Siniestro no encontrado');
    }

    // Guardar el archivo
    const documentsPath = path.join(this.uploadsPath, 'documents', siniestroId);
    if (!fs.existsSync(documentsPath)) {
      fs.mkdirSync(documentsPath, { recursive: true });
    }
    
    const fileName = `${tipo}_${Date.now()}_${file.originalname}`;
    const filePath = path.join(documentsPath, fileName);
    fs.writeFileSync(filePath, file.buffer);

    // Crear registro de archivo
    const fileRecord = await this.prisma.file.create({
      data: {
        bucket: 'documents',
        path: `documents/${siniestroId}/${fileName}`,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
      },
    });

    // Buscar si ya existe un documento de este tipo
    const existingDoc = await this.prisma.documento.findFirst({
      where: { siniestroId, tipo },
    });

    let documento;
    if (existingDoc) {
      // Actualizar el documento existente
      documento = await this.prisma.documento.update({
        where: { id: existingDoc.id },
        data: {
          estado: DocumentoEstado.RECIBIDO,
          fileId: fileRecord.id,
          motivoRechazo: null,
        },
      });
    } else {
      // Crear nuevo documento
      documento = await this.prisma.documento.create({
        data: {
          siniestroId,
          tipo,
          estado: DocumentoEstado.RECIBIDO,
          fileId: fileRecord.id,
        },
      });
    }

    // Registrar evento de auditoría
    await this.createAuditEvent(siniestroId, 'DOCUMENTO_SUBIDO', {
      description: `Documento ${tipo} subido: ${file.originalname}`,
      performedBy: 'GESTOR',
    });

    this.logger.log(`Documento ${tipo} subido para siniestro ${siniestro.caseCode}`);

    return {
      ...documento,
      url: `/uploads/documents/${fileRecord.path}`,
    };
  }

  /**
   * Marca un siniestro como inválido (spam, no es estudiante, etc.)
   */
  async marcarInvalido(id: string, motivo: string) {
    const siniestro = await this.prisma.siniestro.findUnique({
      where: { id },
    });
    if (!siniestro) {
      throw new NotFoundException('Siniestro no encontrado');
    }

    // Solo se puede marcar como inválido si está en RECIBIDO o EN_VALIDACION
    if (!['RECIBIDO', 'EN_VALIDACION'].includes(siniestro.estado)) {
      throw new BadRequestException('Solo se puede marcar como inválido casos en estado RECIBIDO o EN_VALIDACION');
    }

    const updated = await this.prisma.siniestro.update({
      where: { id },
      data: {
        estado: SiniestroEstado.INVALIDO,
        motivoInvalidacion: motivo,
        fechaCierre: new Date(),
      },
    });

    this.logger.log(`Siniestro ${siniestro.caseCode} marcado como INVALIDO: ${motivo}`);

    // Registrar evento de auditoría
    await this.createAuditEvent(id, 'MARCADO_INVALIDO', {
      description: `Caso marcado como inválido: ${motivo}`,
      performedBy: 'GESTOR',
    });

    return this.transformSiniestro(updated);
  }

  /**
   * Envía expediente a la aseguradora por email con archivos adjuntos
   */
  async enviarExpedienteAseguradora(id: string, uploadedFile?: Express.Multer.File) {
    const siniestro = await this.prisma.siniestro.findUnique({
      where: { id },
      include: {
        documentos: {
          include: {
            file: true,  // Incluir información del archivo
          },
        },
      },
    });
    if (!siniestro) {
      throw new NotFoundException('Siniestro no encontrado');
    }

    // Preparar archivos adjuntos
    const attachments: Array<{ filename: string; path?: string; content?: Buffer }> = [];

    // 1. Primero agregar el archivo subido directamente (si existe)
    if (uploadedFile) {
      attachments.push({
        filename: uploadedFile.originalname,
        content: uploadedFile.buffer,
      });
      this.logger.log(`Adjuntando archivo subido: ${uploadedFile.originalname}`);
    }

    // 2. Luego agregar documentos del sistema que tengan archivo físico
    const documentosConArchivo = siniestro.documentos.filter(
      d => d.estado === DocumentoEstado.RECIBIDO && d.file
    );
    
    for (const doc of documentosConArchivo) {
      if (doc.file && doc.file.path) {
        const filePath = path.resolve(this.uploadsPath, doc.file.path);
        
        // Verificar que el archivo existe
        if (fs.existsSync(filePath)) {
          attachments.push({
            filename: doc.file.originalName || `${doc.tipo}_${doc.id}.pdf`,
            path: filePath,
          });
          this.logger.log(`Adjuntando documento del sistema: ${doc.file.originalName}`);
        } else {
          this.logger.warn(`Archivo no encontrado: ${filePath}`);
        }
      }
    }

    this.logger.log(`Enviando expediente con ${attachments.length} archivo(s) adjunto(s)`);

    // Formatear fecha de defunción correctamente (evitando problemas de timezone)
    let fechaDefuncionFormateada = 'N/A';
    if (siniestro.fechaDefuncion) {
      const d = new Date(siniestro.fechaDefuncion);
      // Usar UTC para evitar conversiones de zona horaria
      const day = String(d.getUTCDate()).padStart(2, '0');
      const month = String(d.getUTCMonth() + 1).padStart(2, '0');
      const year = d.getUTCFullYear();
      fechaDefuncionFormateada = `${day}/${month}/${year}`;
    }

    // Enviar email a la aseguradora con archivos adjuntos
    const emailSent = await this.mailService.sendExpedienteToAseguradora({
      caseCode: siniestro.caseCode,
      fallecidoNombre: siniestro.fallecidoNombre || 'N/A',
      fallecidoCedula: siniestro.fallecidoCedula || 'N/A',
      fechaDefuncion: fechaDefuncionFormateada,
      tipo: siniestro.tipo,
      documentosAdjuntos: attachments.length,
      observaciones: siniestro.observaciones || undefined,
      attachments: attachments.length > 0 ? attachments : undefined,
    });

    if (!emailSent) {
      this.logger.warn(`No se pudo enviar email a aseguradora para ${siniestro.caseCode}`);
    }

    // Actualizar fecha de envío en el siniestro
    await this.prisma.siniestro.update({
      where: { id },
      data: {
        fechaEnvioAseguradora: new Date(),
        estado: SiniestroEstado.LIQUIDACION,
      },
    });

    // Crear o actualizar la liquidación con la fecha de envío
    const existingLiquidacion = await this.prisma.liquidacion.findUnique({
      where: { siniestroId: id },
    });

    if (existingLiquidacion) {
      await this.prisma.liquidacion.update({
        where: { siniestroId: id },
        data: {
          fechaEnvioAseguradora: new Date(),
          estado: LiquidacionEstado.ENVIADA,
        },
      });
    } else {
      await this.prisma.liquidacion.create({
        data: {
          siniestroId: id,
          fechaEnvioAseguradora: new Date(),
          estado: LiquidacionEstado.ENVIADA,
          montoLiquidado: 0,
        },
      });
    }

    this.logger.log(`Expediente ${siniestro.caseCode} enviado a aseguradora con ${attachments.length} archivo(s)`);

    // Registrar evento de auditoría
    await this.createAuditEvent(id, 'ENVIADO_A_ASEGURADORA', {
      description: `Expediente enviado a ${this.mailService.getAseguradoraEmail()} con ${attachments.length} archivo(s) adjunto(s)`,
      performedBy: 'GESTOR',
    });

    // Volver a obtener el siniestro completo con todas sus relaciones
    const updatedSiniestro = await this.prisma.siniestro.findUnique({
      where: { id },
      include: {
        poliza: true,
        documentos: { include: { file: true } },
        beneficiarios: true,
        liquidacion: true,
        pago: true,
      },
    });

    return {
      ...this.transformSiniestro(updatedSiniestro),
      emailEnviado: emailSent,
      aseguradoraEmail: this.mailService.getAseguradoraEmail(),
      archivosAdjuntos: attachments.length,
    };
  }

  /**
   * Solicita documentos faltantes a los beneficiarios por email
   */
  async solicitarDocumentosBeneficiarios(id: string, documentosFaltantes: string[]) {
    const siniestro = await this.prisma.siniestro.findUnique({
      where: { id },
      include: {
        beneficiarios: true,
      },
    });
    if (!siniestro) {
      throw new NotFoundException('Siniestro no encontrado');
    }

    if (siniestro.beneficiarios.length === 0) {
      throw new BadRequestException('No hay beneficiarios registrados para este siniestro');
    }

    // Filtrar beneficiarios con email
    const beneficiariosConEmail = siniestro.beneficiarios.filter(b => b.email);

    if (beneficiariosConEmail.length === 0) {
      throw new BadRequestException('Ningún beneficiario tiene email registrado');
    }

    // Enviar email a cada beneficiario con email
    const resultados: { beneficiario: string; enviado: boolean }[] = [];

    for (const beneficiario of beneficiariosConEmail) {
      const enviado = await this.mailService.sendDocumentosRequeridosToBeneficiarios({
        caseCode: siniestro.caseCode,
        fallecidoNombre: siniestro.fallecidoNombre || 'N/A',
        beneficiarioEmail: beneficiario.email!,
        beneficiarioNombre: beneficiario.nombre,
        documentosFaltantes,
      });

      resultados.push({
        beneficiario: beneficiario.nombre,
        enviado,
      });

      if (enviado) {
        this.logger.log(`Email de documentos faltantes enviado a ${beneficiario.nombre} (${beneficiario.email})`);
      }
    }

    return {
      totalBeneficiarios: siniestro.beneficiarios.length,
      beneficiariosConEmail: beneficiariosConEmail.length,
      resultados,
      documentosSolicitados: documentosFaltantes,
    };
  }

  /**
   * Obtiene la configuración del email de aseguradora
   * Nota: Ahora usa la configuración centralizada del ConfigController
   */
  getAseguradoraConfig() {
    // Importamos la configuración actualizable
    // Este método ahora es un proxy al servicio de configuración
    return {
      email: this.mailService.getAseguradoraEmail(),
      nombre: this.mailService.getAseguradoraNombre(),
    };
  }

  /**
   * Actualiza la configuración de aseguradora en el MailService
   */
  updateAseguradoraConfig(email: string, nombre: string) {
    this.mailService.setAseguradoraConfig(email, nombre);
    return this.getAseguradoraConfig();
  }

  /**
   * Registra la respuesta de liquidación de la aseguradora
   */
  async registrarLiquidacion(
    id: string,
    data: { fechaLiquidacion?: string; montoLiquidado?: number; notasAseguradora?: string; estado?: string },
    archivo?: Express.Multer.File
  ) {
    const siniestro = await this.prisma.siniestro.findUnique({
      where: { id },
      include: { liquidacion: true },
    });
    if (!siniestro) {
      throw new NotFoundException('Siniestro no encontrado');
    }

    const fs = require('fs');
    const pathModule = require('path');
    
    // Guardar archivo si existe
    let archivoPath: string | undefined;
    let fileId: string | undefined;
    
    if (archivo) {
      const uploadsDir = './uploads/documents';
      
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      
      const filename = `liquidacion_${id}_${Date.now()}_${archivo.originalname}`;
      const filepath = pathModule.join(uploadsDir, filename);
      fs.writeFileSync(filepath, archivo.buffer);
      archivoPath = filepath;
      
      // Crear registro de File
      const file = await this.prisma.file.create({
        data: {
          bucket: 'documents',
          path: filename,
          originalName: archivo.originalname,
          mimeType: archivo.mimetype,
          size: archivo.size,
        },
      });
      fileId = file.id;
      
      this.logger.log(`Archivo de liquidación guardado: ${filename}`);
    }

    // Crear o actualizar liquidación
    // Usar el estado proporcionado o ENVIADO por defecto (si es un nuevo registro con datos)
    const liquidacionData: any = {};
    
    if (data.montoLiquidado !== undefined) {
      liquidacionData.montoLiquidado = data.montoLiquidado;
    }
    if (data.notasAseguradora !== undefined) {
      liquidacionData.notasAseguradora = data.notasAseguradora;
    }
    if (data.estado) {
      // Mapear estados: APROBADO en el frontend = APROBADA en Prisma
      const estadoMap: Record<string, LiquidacionEstado> = {
        'APROBADO': LiquidacionEstado.APROBADA,
        'APROBADA': LiquidacionEstado.APROBADA,
        'OBSERVADO': LiquidacionEstado.OBSERVADA,
        'OBSERVADA': LiquidacionEstado.OBSERVADA,
        'ENVIADO': LiquidacionEstado.ENVIADA,
        'ENVIADA': LiquidacionEstado.ENVIADA,
      };
      liquidacionData.estado = estadoMap[data.estado.toUpperCase()] || LiquidacionEstado.ENVIADA;
    } else if (data.montoLiquidado) {
      // Si hay monto pero no se especificó estado, marcar como ENVIADA
      liquidacionData.estado = LiquidacionEstado.ENVIADA;
    }
    
    if (fileId) {
      liquidacionData.liquidacionFileId = fileId;
    }

    let liquidacion;
    if (siniestro.liquidacion) {
      liquidacion = await this.prisma.liquidacion.update({
        where: { id: siniestro.liquidacion.id },
        data: liquidacionData,
      });
    } else {
      liquidacion = await this.prisma.liquidacion.create({
        data: {
          ...liquidacionData,
          siniestroId: id,
        },
      });
    }

    // Actualizar estado del siniestro según la liquidación
    if (data.montoLiquidado || data.estado) {
      const nuevoEstadoSiniestro = liquidacionData.estado === LiquidacionEstado.APROBADA 
        ? SiniestroEstado.PAGO  // Si se aprueba, pasar a PAGO
        : SiniestroEstado.LIQUIDACION; // Si solo se registra datos, quedarse en LIQUIDACION
      
      await this.prisma.siniestro.update({
        where: { id },
        data: { 
          fechaLiquidacion: data.fechaLiquidacion ? new Date(data.fechaLiquidacion) : undefined,
          estado: nuevoEstadoSiniestro,
        },
      });
    }

    // Registrar evento de auditoría
    await this.createAuditEvent(id, 'LIQUIDACION_REGISTRADA', {
      description: `Liquidación registrada por ${data.montoLiquidado ? `$${data.montoLiquidado}` : 'sin monto'}${archivo ? ' con documento adjunto' : ''}`,
      performedBy: 'GESTOR',
    });

    this.logger.log(`Liquidación registrada para siniestro ${siniestro.caseCode}: $${data.montoLiquidado}`);

    return {
      ...liquidacion,
      archivoGuardado: !!archivoPath,
    };
  }

  /**
   * Envía comprobante de liquidación a todos los beneficiarios con email
   */
  async enviarLiquidacionBeneficiarios(id: string, comprobante?: Express.Multer.File) {
    const siniestro = await this.prisma.siniestro.findUnique({
      where: { id },
      include: {
        beneficiarios: true,
        liquidacion: {
          include: {
            liquidacion: true, // Esto es el File relacionado
          },
        },
      },
    });
    if (!siniestro) {
      throw new NotFoundException('Siniestro no encontrado');
    }

    if (!siniestro.liquidacion || !siniestro.liquidacion.montoLiquidado) {
      throw new BadRequestException('El siniestro no tiene liquidación registrada');
    }

    const beneficiariosConEmail = siniestro.beneficiarios.filter(b => b.email);
    if (beneficiariosConEmail.length === 0) {
      throw new BadRequestException('Ningún beneficiario tiene email registrado');
    }

    // Preparar archivo adjunto
    const attachments: Array<{ filename: string; content?: Buffer; path?: string }> = [];
    const fs = require('fs');
    const pathModule = require('path');
    
    if (comprobante) {
      // Usar archivo subido directamente
      attachments.push({
        filename: comprobante.originalname,
        content: comprobante.buffer,
      });
      this.logger.log(`Adjuntando archivo subido: ${comprobante.originalname}`);
    } else if ((siniestro.liquidacion as any).liquidacion?.path) {
      // Usar archivo guardado previamente en registrar liquidación
      const liquidacionFile = (siniestro.liquidacion as any).liquidacion;
      const filePath = pathModule.join('./uploads/documents', liquidacionFile.path);
      if (fs.existsSync(filePath)) {
        attachments.push({
          filename: liquidacionFile.originalName || pathModule.basename(filePath),
          path: filePath,
        });
        this.logger.log(`Adjuntando archivo guardado: ${liquidacionFile.originalName}`);
      }
    }

    const montoTotal = Number(siniestro.liquidacion.montoLiquidado);
    const fechaLiquidacion = siniestro.liquidacion.createdAt?.toLocaleDateString('es-EC') || new Date().toLocaleDateString('es-EC');

    const resultados: { beneficiario: string; email: string; enviado: boolean; monto: number }[] = [];

    for (const beneficiario of beneficiariosConEmail) {
      const porcentaje = Number(beneficiario.porcentaje);
      const montoBeneficiario = (montoTotal * porcentaje) / 100;

      const enviado = await this.mailService.sendLiquidacionToBeneficiario({
        caseCode: siniestro.caseCode,
        fallecidoNombre: siniestro.fallecidoNombre || 'N/A',
        beneficiarioEmail: beneficiario.email!,
        beneficiarioNombre: beneficiario.nombre,
        montoLiquidado: montoTotal,
        porcentajeBeneficiario: porcentaje,
        montoBeneficiario,
        banco: beneficiario.banco || undefined,
        cuenta: beneficiario.cuenta || undefined,
        fechaLiquidacion,
        attachments: attachments.length > 0 ? attachments : undefined,
      });

      resultados.push({
        beneficiario: beneficiario.nombre,
        email: beneficiario.email!,
        enviado,
        monto: montoBeneficiario,
      });

      if (enviado) {
        this.logger.log(`Liquidación enviada a ${beneficiario.nombre} (${beneficiario.email}) - $${montoBeneficiario}`);
      }
    }

    // Actualizar estado del siniestro a PAGO después de enviar a beneficiarios
    await this.prisma.siniestro.update({
      where: { id },
      data: { estado: SiniestroEstado.PAGO },
    });

    // Registrar evento de auditoría
    await this.createAuditEvent(id, 'LIQUIDACION_ENVIADA', {
      description: `Liquidación por $${montoTotal.toLocaleString()} enviada a ${beneficiariosConEmail.length} beneficiario(s)${attachments.length > 0 ? ' con documento adjunto' : ''}`,
      performedBy: 'GESTOR',
    });

    // Retornar siniestro actualizado
    const updatedSiniestro = await this.findOne(id);
    return {
      ...updatedSiniestro,
      totalBeneficiarios: siniestro.beneficiarios.length,
      beneficiariosNotificados: beneficiariosConEmail.length,
      montoTotal,
      resultados,
      comprobanteAdjunto: attachments.length > 0,
    };
  }

  /**
   * Registra pago y envía comprobante a todos los beneficiarios con email
   */
  async registrarPagoYNotificar(
    id: string, 
    data: { fechaPago?: string; docContable?: string; obsFinanzas?: string },
    comprobante?: Express.Multer.File
  ) {
    const siniestro = await this.prisma.siniestro.findUnique({
      where: { id },
      include: {
        beneficiarios: true,
        liquidacion: true,
        pago: true,
      },
    });
    if (!siniestro) {
      throw new NotFoundException('Siniestro no encontrado');
    }

    if (!siniestro.liquidacion || !siniestro.liquidacion.montoLiquidado) {
      throw new BadRequestException('El siniestro debe tener liquidación antes de registrar el pago');
    }

    // Crear o actualizar el pago - usar el string literal del enum ya que Prisma lo espera así
    const pagoData = {
      fechaPago: data.fechaPago ? new Date(data.fechaPago) : new Date(),
      docContable: data.docContable,
      obsFinanzas: data.obsFinanzas,
      estado: 'EJECUTADO' as const,
    };

    let pago;
    if (siniestro.pago) {
      pago = await this.prisma.pago.update({
        where: { id: siniestro.pago.id },
        data: pagoData,
      });
    } else {
      pago = await this.prisma.pago.create({
        data: {
          ...pagoData,
          siniestroId: id,
        },
      });
    }

    // Preparar archivo adjunto
    const attachments: Array<{ filename: string; content?: Buffer }> = [];
    if (comprobante) {
      attachments.push({
        filename: comprobante.originalname,
        content: comprobante.buffer,
      });
    }

    // Enviar a beneficiarios con email
    const beneficiariosConEmail = siniestro.beneficiarios.filter(b => b.email);
    const montoTotal = Number(siniestro.liquidacion.montoLiquidado);
    const fechaPago = pago.fechaPago?.toLocaleDateString('es-EC') || new Date().toLocaleDateString('es-EC');

    const resultados: { beneficiario: string; email: string; enviado: boolean; monto: number }[] = [];

    for (const beneficiario of beneficiariosConEmail) {
      const porcentaje = Number(beneficiario.porcentaje);
      const montoBeneficiario = (montoTotal * porcentaje) / 100;

      const enviado = await this.mailService.sendComprobantePagoToBeneficiario({
        caseCode: siniestro.caseCode,
        fallecidoNombre: siniestro.fallecidoNombre || 'N/A',
        beneficiarioEmail: beneficiario.email!,
        beneficiarioNombre: beneficiario.nombre,
        montoPagado: montoBeneficiario,
        fechaPago,
        docContable: data.docContable,
        banco: beneficiario.banco || undefined,
        cuenta: beneficiario.cuenta || undefined,
        observaciones: data.obsFinanzas,
        attachments: attachments.length > 0 ? attachments : undefined,
      });

      resultados.push({
        beneficiario: beneficiario.nombre,
        email: beneficiario.email!,
        enviado,
        monto: montoBeneficiario,
      });

      if (enviado) {
        this.logger.log(`Comprobante de pago enviado a ${beneficiario.nombre} (${beneficiario.email}) - $${montoBeneficiario}`);
      }
    }

    // Actualizar siniestro a estado PAGO o CERRADO
    await this.prisma.siniestro.update({
      where: { id },
      data: {
        fechaPago: pago.fechaPago,
        estado: SiniestroEstado.PAGO,
      },
    });

    // Registrar evento de auditoría
    await this.createAuditEvent(id, 'PAGO_REGISTRADO', {
      description: `Pago registrado por $${montoTotal.toLocaleString()} - Notificados ${beneficiariosConEmail.length} beneficiario(s)${attachments.length > 0 ? ' con comprobante adjunto' : ''}`,
      performedBy: 'GESTOR',
    });

    return {
      pago,
      totalBeneficiarios: siniestro.beneficiarios.length,
      beneficiariosNotificados: beneficiariosConEmail.length,
      montoTotal,
      resultados,
      comprobanteAdjunto: attachments.length > 0,
    };
  }

  // ============ BENEFICIARIOS ============

  /**
   * Crea un nuevo beneficiario para un siniestro
   */
  async createBeneficiario(siniestroId: string, data: {
    nombre: string;
    cedula: string;
    parentesco: string;
    porcentaje: number;
    email?: string;
    telefono?: string;
    banco?: string;
    tipoCuenta?: string;
    numeroCuenta?: string;
  }) {
    // Verificar que el siniestro existe
    const siniestro = await this.prisma.siniestro.findUnique({
      where: { id: siniestroId },
    });
    if (!siniestro) {
      throw new NotFoundException('Siniestro no encontrado');
    }

    // Verificar que el siniestro no está cerrado ni inválido
    if (siniestro.estado === SiniestroEstado.CERRADO || siniestro.estado === SiniestroEstado.INVALIDO) {
      throw new BadRequestException('No se puede agregar beneficiarios a un caso cerrado o inválido');
    }

    // Construir cuenta bancaria completa si se proporcionan datos
    const cuenta = data.numeroCuenta 
      ? `${data.tipoCuenta || 'Cuenta'}: ${data.numeroCuenta}`
      : undefined;

    const beneficiario = await this.prisma.beneficiario.create({
      data: {
        siniestroId,
        nombre: data.nombre,
        cedula: data.cedula,
        relacion: data.parentesco, // El schema usa "relacion" no "parentesco"
        porcentaje: data.porcentaje,
        email: data.email,
        telefono: data.telefono,
        banco: data.banco,
        cuenta, // El schema usa "cuenta" no "tipoCuenta/numeroCuenta"
        estadoFirma: FirmaEstado.PENDIENTE,
      },
    });

    this.logger.log(`Beneficiario ${data.nombre} creado para siniestro ${siniestro.caseCode}`);

    // Registrar evento de auditoría
    await this.createAuditEvent(siniestroId, 'BENEFICIARIO_AGREGADO', {
      description: `Beneficiario agregado: ${data.nombre} (${data.parentesco}) - ${data.porcentaje}%`,
      performedBy: 'GESTOR',
    });

    return beneficiario;
  }

  /**
   * Actualiza un beneficiario existente
   */
  async updateBeneficiario(siniestroId: string, beneficiarioId: string, data: {
    nombre?: string;
    cedula?: string;
    parentesco?: string;
    porcentaje?: number;
    email?: string;
    telefono?: string;
    banco?: string;
    tipoCuenta?: string;
    numeroCuenta?: string;
    estadoFirma?: string;
  }) {
    // Verificar que el siniestro existe
    const siniestro = await this.prisma.siniestro.findUnique({
      where: { id: siniestroId },
    });
    if (!siniestro) {
      throw new NotFoundException('Siniestro no encontrado');
    }

    // Verificar que el siniestro no está cerrado ni inválido
    if (siniestro.estado === SiniestroEstado.CERRADO || siniestro.estado === SiniestroEstado.INVALIDO) {
      throw new BadRequestException('No se puede modificar beneficiarios de un caso cerrado o inválido');
    }

    // Verificar que el beneficiario existe y pertenece al siniestro
    const beneficiario = await this.prisma.beneficiario.findFirst({
      where: {
        id: beneficiarioId,
        siniestroId,
      },
    });
    if (!beneficiario) {
      throw new NotFoundException('Beneficiario no encontrado');
    }

    // Construir cuenta si se proporcionan datos nuevos
    let cuenta: string | undefined = undefined;
    if (data.numeroCuenta !== undefined) {
      cuenta = data.numeroCuenta 
        ? `${data.tipoCuenta || 'Cuenta'}: ${data.numeroCuenta}`
        : undefined;
    }

    // Mapear estadoFirma string a enum
    let estadoFirma: FirmaEstado | undefined = undefined;
    if (data.estadoFirma) {
      estadoFirma = data.estadoFirma as FirmaEstado;
    }

    const updated = await this.prisma.beneficiario.update({
      where: { id: beneficiarioId },
      data: {
        nombre: data.nombre,
        cedula: data.cedula,
        relacion: data.parentesco, // El schema usa "relacion"
        porcentaje: data.porcentaje,
        email: data.email,
        telefono: data.telefono,
        banco: data.banco,
        cuenta, // El schema usa "cuenta"
        estadoFirma,
      },
    });

    this.logger.log(`Beneficiario ${beneficiario.nombre} actualizado en siniestro ${siniestro.caseCode}`);

    // Registrar evento de auditoría
    await this.createAuditEvent(siniestroId, 'BENEFICIARIO_ACTUALIZADO', {
      description: `Beneficiario actualizado: ${updated.nombre}`,
      performedBy: 'GESTOR',
    });

    return updated;
  }

  /**
   * Elimina un beneficiario
   */
  async deleteBeneficiario(siniestroId: string, beneficiarioId: string) {
    // Verificar que el siniestro existe
    const siniestro = await this.prisma.siniestro.findUnique({
      where: { id: siniestroId },
    });
    if (!siniestro) {
      throw new NotFoundException('Siniestro no encontrado');
    }

    // Verificar que el siniestro no está cerrado ni inválido
    if (siniestro.estado === SiniestroEstado.CERRADO || siniestro.estado === SiniestroEstado.INVALIDO) {
      throw new BadRequestException('No se puede eliminar beneficiarios de un caso cerrado o inválido');
    }

    // Verificar que el beneficiario existe y pertenece al siniestro
    const beneficiario = await this.prisma.beneficiario.findFirst({
      where: {
        id: beneficiarioId,
        siniestroId,
      },
    });
    if (!beneficiario) {
      throw new NotFoundException('Beneficiario no encontrado');
    }

    await this.prisma.beneficiario.delete({
      where: { id: beneficiarioId },
    });

    this.logger.log(`Beneficiario ${beneficiario.nombre} eliminado del siniestro ${siniestro.caseCode}`);

    // Registrar evento de auditoría
    await this.createAuditEvent(siniestroId, 'BENEFICIARIO_ELIMINADO', {
      description: `Beneficiario eliminado: ${beneficiario.nombre}`,
      performedBy: 'GESTOR',
    });

    return { message: 'Beneficiario eliminado exitosamente' };
  }

  /**
   * Sube el archivo de firma de un beneficiario
   */
  async uploadFirmaBeneficiario(
    siniestroId: string,
    beneficiarioId: string,
    archivo: Express.Multer.File
  ) {
    // Verificar que el siniestro existe
    const siniestro = await this.prisma.siniestro.findUnique({
      where: { id: siniestroId },
    });
    if (!siniestro) {
      throw new NotFoundException('Siniestro no encontrado');
    }

    // Verificar que el beneficiario existe
    const beneficiario = await this.prisma.beneficiario.findFirst({
      where: {
        id: beneficiarioId,
        siniestroId,
      },
    });
    if (!beneficiario) {
      throw new NotFoundException('Beneficiario no encontrado');
    }

    if (!archivo) {
      throw new BadRequestException('No se proporcionó archivo de firma');
    }

    // Guardar el archivo
    const uploadsDir = './uploads/firmas';
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const filename = `firma_${beneficiarioId}_${Date.now()}_${archivo.originalname}`;
    const filepath = path.join(uploadsDir, filename);
    fs.writeFileSync(filepath, archivo.buffer);

    // Crear registro de File
    const file = await this.prisma.file.create({
      data: {
        bucket: 'firmas',
        path: filename,
        originalName: archivo.originalname,
        mimeType: archivo.mimetype,
        size: archivo.size,
      },
    });

    // Actualizar beneficiario con la ruta del archivo y estado
    const updated = await this.prisma.beneficiario.update({
      where: { id: beneficiarioId },
      data: {
        archivoFirma: `/uploads/firmas/${filename}`,
        estadoFirma: FirmaEstado.RECIBIDA,
      },
    });

    this.logger.log(`Firma subida para beneficiario ${beneficiario.nombre}: ${filename}`);

    // Registrar evento de auditoría
    await this.createAuditEvent(siniestroId, 'FIRMA_RECIBIDA', {
      description: `Firma recibida de beneficiario: ${beneficiario.nombre}`,
      performedBy: 'GESTOR',
    });

    return {
      ...updated,
      archivoFirma: `/uploads/firmas/${filename}`,
      fileId: file.id,
    };
  }
}

