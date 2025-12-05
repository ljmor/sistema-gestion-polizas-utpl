import { Body, Controller, Post, UseInterceptors, UploadedFiles } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { PublicService } from './public.service';
import { CreatePublicReportDto } from './dto/create-public-report.dto';
import { ApiOperation, ApiResponse, ApiTags, ApiConsumes } from '@nestjs/swagger';

@ApiTags('Public')
@Controller('public')
export class PublicController {
  constructor(private readonly publicService: PublicService) {}

  @Post('siniestros')
  @ApiOperation({ summary: 'Create a public claim report' })
  @ApiResponse({ status: 201, description: 'Report created successfully.' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FilesInterceptor('archivos', 10)) // Máximo 10 archivos
  async create(
    @Body('data') dataStr: string,
    @UploadedFiles() archivos?: Express.Multer.File[],
  ) {
    // Parsear datos del frontend (formato anidado)
    const data = JSON.parse(dataStr || '{}');
    
    // Mapear al formato del DTO (incluyendo tipos de archivos)
    const dto: CreatePublicReportDto & { archivosTipos?: string[] } = {
      tipo: data.tipoPreliminar,
      fechaDefuncion: data.fallecido?.fechaDefuncion,
      observaciones: data.observaciones,
      fallecidoNombre: data.fallecido?.nombreCompleto,
      fallecidoCedula: data.fallecido?.cedula,
      reportanteNombre: data.reportante?.nombre,
      reportanteEmail: data.reportante?.email,
      reportanteTelefono: data.reportante?.telefono,
      reportanteRelacion: data.reportante?.relacion,
      // Incluir tipos de documentos para que el servicio los use
      archivosTipos: data.archivosTipos || [],
    };

    return this.publicService.createReport(dto, archivos);
  }
}

