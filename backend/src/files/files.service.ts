import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import {
  generateAnonymizedMetadata,
  isSensitiveDocumentType,
  hashSensitiveData,
} from '../common/utils/anonymizer';

export interface UploadedFile {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

export interface FileUploadOptions {
  documentType?: string;
  siniestroId?: string;
  uploaderId?: string;
}

@Injectable()
export class FilesService {
  private readonly uploadPath: string;
  private readonly maxFileMb: number;
  private readonly allowedMimeTypes: string[];
  private readonly anonymizationEnabled: boolean;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    this.uploadPath = this.configService.get<string>('storage.localPath') || './uploads';
    this.maxFileMb = this.configService.get<number>('limits.maxFileMb') || 10;
    this.allowedMimeTypes = this.configService.get<string[]>('limits.allowedMimeTypes') || [
      'application/pdf',
      'image/jpeg',
      'image/png',
    ];
    this.anonymizationEnabled = this.configService.get<boolean>('anonymization.enabled') ?? true;

    // Asegurar que el directorio de uploads existe
    this.ensureUploadDirectory();
  }

  private ensureUploadDirectory(): void {
    const dirs = [
      this.uploadPath,
      path.join(this.uploadPath, 'documents'),
      path.join(this.uploadPath, 'sensitive'),
      path.join(this.uploadPath, 'temp'),
    ];

    for (const dir of dirs) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    }
  }

  /**
   * Valida un archivo antes de subirlo
   */
  validateFile(file: UploadedFile): void {
    // Validar tamaño
    const maxSize = this.maxFileMb * 1024 * 1024;
    if (file.size > maxSize) {
      throw new BadRequestException(
        `El archivo excede el tamaño máximo permitido de ${this.maxFileMb}MB`,
      );
    }

    // Validar tipo MIME
    if (!this.allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `Tipo de archivo no permitido. Tipos aceptados: ${this.allowedMimeTypes.join(', ')}`,
      );
    }
  }

  /**
   * Sube un archivo con anonimización opcional de datos sensibles
   */
  async uploadFile(
    file: UploadedFile,
    options: FileUploadOptions = {},
  ): Promise<{ id: string; path: string; anonymized: boolean }> {
    this.validateFile(file);

    const isSensitive = options.documentType
      ? isSensitiveDocumentType(options.documentType)
      : false;

    // Generar checksum del archivo
    const checksum = crypto.createHash('sha256').update(file.buffer).digest('hex');

    // Generar nombre de archivo seguro
    const timestamp = Date.now();
    const randomSuffix = crypto.randomBytes(8).toString('hex');
    const extension = path.extname(file.originalname);
    
    let storedFilename: string;
    let storedPath: string;
    let bucket: string;

    if (this.anonymizationEnabled && isSensitive) {
      // Para archivos sensibles, usamos un nombre completamente anónimo
      const anonMeta = generateAnonymizedMetadata(
        file.originalname,
        options.documentType || 'UNKNOWN',
        options.uploaderId,
      );
      storedFilename = `${anonMeta.anonymousName}${extension}`;
      bucket = 'sensitive';
      storedPath = path.join(this.uploadPath, 'sensitive', storedFilename);
    } else {
      // Para archivos normales
      storedFilename = `${timestamp}_${randomSuffix}${extension}`;
      bucket = 'documents';
      storedPath = path.join(this.uploadPath, 'documents', storedFilename);
    }

    // Guardar archivo en disco
    fs.writeFileSync(storedPath, file.buffer);

    // Registrar en base de datos
    const fileRecord = await this.prisma.file.create({
      data: {
        bucket,
        path: storedFilename,
        originalName: this.anonymizationEnabled && isSensitive
          ? hashSensitiveData(file.originalname) // Almacenar hash del nombre original
          : file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        checksum,
      },
    });

    return {
      id: fileRecord.id,
      path: storedFilename,
      anonymized: this.anonymizationEnabled && isSensitive,
    };
  }

  /**
   * Obtiene un archivo por su ID
   */
  async getFile(id: string): Promise<{ file: Buffer; mimeType: string; filename: string }> {
    const fileRecord = await this.prisma.file.findUnique({
      where: { id },
    });

    if (!fileRecord) {
      throw new NotFoundException('Archivo no encontrado');
    }

    const filePath = path.join(this.uploadPath, fileRecord.bucket, fileRecord.path);

    if (!fs.existsSync(filePath)) {
      throw new NotFoundException('Archivo no encontrado en el sistema de archivos');
    }

    const file = fs.readFileSync(filePath);

    return {
      file,
      mimeType: fileRecord.mimeType,
      filename: fileRecord.originalName,
    };
  }

  /**
   * Obtiene información de un archivo sin descargar el contenido
   */
  async getFileInfo(id: string) {
    const fileRecord = await this.prisma.file.findUnique({
      where: { id },
    });

    if (!fileRecord) {
      throw new NotFoundException('Archivo no encontrado');
    }

    return {
      id: fileRecord.id,
      originalName: fileRecord.originalName,
      mimeType: fileRecord.mimeType,
      size: fileRecord.size,
      createdAt: fileRecord.createdAt,
      bucket: fileRecord.bucket,
    };
  }

  /**
   * Elimina un archivo
   */
  async deleteFile(id: string): Promise<void> {
    const fileRecord = await this.prisma.file.findUnique({
      where: { id },
    });

    if (!fileRecord) {
      throw new NotFoundException('Archivo no encontrado');
    }

    const filePath = path.join(this.uploadPath, fileRecord.bucket, fileRecord.path);

    // Eliminar del sistema de archivos
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Eliminar registro de la base de datos
    await this.prisma.file.delete({
      where: { id },
    });
  }

  /**
   * Genera una URL temporal para descargar un archivo
   * En producción, esto debería generar URLs firmadas para S3/MinIO
   */
  generateDownloadUrl(fileId: string): string {
    // En desarrollo, retornamos una URL directa al controller
    return `/files/${fileId}/download`;
  }
}
