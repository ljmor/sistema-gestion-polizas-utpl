import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePublicReportDto } from './dto/create-public-report.dto';
import { SiniestroEstado, DocumentoEstado } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class PublicService {
  private readonly logger = new Logger(PublicService.name);
  private readonly uploadsPath = './uploads/documents';

  constructor(private prisma: PrismaService) {
    // Asegurar que existe el directorio de uploads
    if (!fs.existsSync(this.uploadsPath)) {
      fs.mkdirSync(this.uploadsPath, { recursive: true });
    }
  }

  async createReport(dto: CreatePublicReportDto, archivos?: Express.Multer.File[]) {
    const year = new Date().getFullYear();
    const count = await this.prisma.siniestro.count();
    const caseCode = `SIN-${year}-${(count + 1).toString().padStart(6, '0')}`;

    // Crear el siniestro
    const siniestro = await this.prisma.siniestro.create({
      data: {
        caseCode,
        tipo: dto.tipo,
        estado: SiniestroEstado.RECIBIDO,
        fechaDefuncion: dto.fechaDefuncion ? new Date(dto.fechaDefuncion) : null,
        observaciones: dto.observaciones || 'Caso recién recibido desde portal público.',
        fallecidoNombre: dto.fallecidoNombre,
        fallecidoCedula: dto.fallecidoCedula,
        reportanteNombre: dto.reportanteNombre,
        reportanteEmail: dto.reportanteEmail,
        reportanteTelefono: dto.reportanteTelefono,
        reportanteRelacion: dto.reportanteRelacion,
      },
    });

    // Procesar archivos adjuntos si existen
    if (archivos && archivos.length > 0) {
      // Obtener tipos de documentos del DTO si están disponibles
      const tiposDocumentos = (dto as any).archivosTipos || [];
      
      for (let i = 0; i < archivos.length; i++) {
        const archivo = archivos[i];
        // Usar el tipo especificado o detectar automáticamente
        const tipoDocumento = tiposDocumentos[i] || this.detectarTipoDocumento(archivo.originalname);
        
        // Guardar archivo físico
        const filename = `${siniestro.id}_${Date.now()}_${archivo.originalname}`;
        const filepath = path.join(this.uploadsPath, filename);
        fs.writeFileSync(filepath, archivo.buffer);

        // Crear registro File
        const file = await this.prisma.file.create({
          data: {
            bucket: 'documents',
            path: filename,
            originalName: archivo.originalname,
            mimeType: archivo.mimetype,
            size: archivo.size,
          },
        });

        // Crear documento asociado al siniestro - Marcado como PENDIENTE para revisión del gestor
        await this.prisma.documento.create({
          data: {
            siniestroId: siniestro.id,
            tipo: tipoDocumento,
            estado: DocumentoEstado.PENDIENTE, // El gestor debe revisar y aprobar
            fileId: file.id,
          },
        });

        this.logger.log(`Archivo ${archivo.originalname} guardado como ${tipoDocumento} para caso ${caseCode}`);
      }
    }

    // Registrar evento de auditoría
    await this.prisma.auditEvent.create({
      data: {
        entity: 'SINIESTRO',
        entityId: siniestro.id,
        action: 'CASO_CREADO',
        meta: {
          description: `Caso ${caseCode} creado desde portal público por ${dto.reportanteNombre}${archivos?.length ? ` con ${archivos.length} archivo(s) adjunto(s)` : ''}`,
          performedBy: 'PORTAL_PUBLICO',
        },
      },
    });

    this.logger.log(`Caso ${caseCode} creado exitosamente`);

    return {
      caseCode: siniestro.caseCode,
      id: siniestro.id,
      fechaReporte: siniestro.fechaReporte,
      archivosRecibidos: archivos?.length || 0,
    };
  }

  /**
   * Detecta el tipo de documento basado en el nombre del archivo
   */
  private detectarTipoDocumento(filename: string): string {
    const lower = filename.toLowerCase();
    
    if (lower.includes('cedula') || lower.includes('ci') || lower.includes('identificacion')) {
      return 'CEDULA_FALLECIDO';
    }
    if (lower.includes('defuncion') || lower.includes('muerte') || lower.includes('certificado')) {
      return 'CERTIFICADO_DEFUNCION';
    }
    if (lower.includes('poliza') || lower.includes('seguro')) {
      return 'POLIZA';
    }
    if (lower.includes('acta') || lower.includes('nacimiento')) {
      return 'ACTA_NACIMIENTO';
    }
    
    return 'OTRO_DOCUMENTO';
  }
}

