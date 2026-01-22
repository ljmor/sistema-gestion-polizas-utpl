import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Res,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Body,
  StreamableFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { FilesService, UploadedFile as IUploadedFile } from './files.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

// Interfaz para el archivo de Multer
interface MulterFile {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

@ApiTags('files')
@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post('upload')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Subir un archivo' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        documentType: { type: 'string' },
        siniestroId: { type: 'string' },
      },
    },
  })
  async uploadFile(
    @UploadedFile() file: MulterFile,
    @Body('documentType') documentType?: string,
    @Body('siniestroId') siniestroId?: string,
  ) {
    if (!file) {
      throw new BadRequestException('No se proporcionó ningún archivo');
    }

    const uploadedFile: IUploadedFile = {
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      buffer: file.buffer,
    };

    const result = await this.filesService.uploadFile(uploadedFile, {
      documentType,
      siniestroId,
    });

    return {
      message: 'Archivo subido exitosamente',
      fileId: result.id,
      anonymized: result.anonymized,
    };
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener información de un archivo' })
  async getFileInfo(@Param('id') id: string) {
    return this.filesService.getFileInfo(id);
  }

  @Get(':id/download')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Descargar un archivo' })
  async downloadFile(@Param('id') id: string, @Res({ passthrough: true }) res: any) {
    const { file, mimeType, filename } = await this.filesService.getFile(id);

    res.set({
      'Content-Type': mimeType,
      'Content-Disposition': `attachment; filename="${filename}"`,
    });

    return new StreamableFile(file);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Eliminar un archivo' })
  async deleteFile(@Param('id') id: string) {
    await this.filesService.deleteFile(id);
    return { message: 'Archivo eliminado exitosamente' };
  }
}
