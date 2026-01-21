import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { SiniestrosService } from './siniestros.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ChangeStateDto } from './dto/change-state.dto';
import { UpdateDocumentoDto } from './dto/update-documento.dto';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';

@ApiTags('Siniestros')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('siniestros')
export class SiniestrosController {
  constructor(private readonly siniestrosService: SiniestrosService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new siniestro manually' })
  create(@Body() dto: {
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
    return this.siniestrosService.createManual(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all siniestros with optional filters' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'estado', required: false })
  @ApiQuery({ name: 'tipo', required: false })
  @ApiQuery({ name: 'fechaDesde', required: false })
  @ApiQuery({ name: 'fechaHasta', required: false })
  @ApiQuery({ name: 'soloVencimientos', required: false })
  findAll(
    @Query('search') search?: string,
    @Query('estado') estado?: string,
    @Query('tipo') tipo?: string,
    @Query('fechaDesde') fechaDesde?: string,
    @Query('fechaHasta') fechaHasta?: string,
    @Query('soloVencimientos') soloVencimientos?: string,
  ) {
    return this.siniestrosService.findAll({
      search,
      estado,
      tipo,
      fechaDesde,
      fechaHasta,
      soloVencimientos: soloVencimientos === 'true',
    });
  }

  @Get('config/aseguradora')
  @ApiOperation({ summary: 'Get aseguradora email configuration' })
  getAseguradoraConfig() {
    return this.siniestrosService.getAseguradoraConfig();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get siniestro details' })
  findOne(@Param('id') id: string) {
    return this.siniestrosService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update siniestro' })
  update(@Param('id') id: string, @Body() dto: any) {
    return this.siniestrosService.update(id, dto);
  }

  @Patch(':id/estado')
  @ApiOperation({ summary: 'Change siniestro state' })
  changeState(@Param('id') id: string, @Body() dto: ChangeStateDto) {
    return this.siniestrosService.changeState(id, dto);
  }

  @Post(':id/documentos')
  @ApiOperation({ summary: 'Upload a document for a siniestro' })
  @UseInterceptors(FileInterceptor('file'))
  uploadDocumento(
    @Param('id') siniestroId: string,
    @Body('tipo') tipo: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.siniestrosService.uploadDocumento(siniestroId, tipo, file);
  }

  @Patch(':id/documentos/:docId')
  @ApiOperation({ summary: 'Update document status' })
  updateDocumento(
    @Param('id') siniestroId: string,
    @Param('docId') docId: string,
    @Body() dto: UpdateDocumentoDto,
  ) {
    return this.siniestrosService.updateDocumento(siniestroId, docId, dto);
  }

  @Post(':id/marcar-invalido')
  @ApiOperation({ summary: 'Mark siniestro as invalid (spam, not a student, etc.)' })
  marcarInvalido(@Param('id') id: string, @Body() dto: { motivo: string }) {
    return this.siniestrosService.marcarInvalido(id, dto.motivo);
  }

  @Post(':id/enviar-aseguradora')
  @ApiOperation({ summary: 'Send expediente to aseguradora via email with optional attachment' })
  @UseInterceptors(FileInterceptor('expediente'))
  enviarExpedienteAseguradora(
    @Param('id') id: string,
    @UploadedFile() expediente?: Express.Multer.File,
  ) {
    return this.siniestrosService.enviarExpedienteAseguradora(id, expediente);
  }

  @Post(':id/solicitar-documentos-beneficiarios')
  @ApiOperation({ summary: 'Request missing documents from beneficiarios via email' })
  solicitarDocumentosBeneficiarios(
    @Param('id') id: string,
    @Body() dto: { documentosFaltantes: string[] },
  ) {
    return this.siniestrosService.solicitarDocumentosBeneficiarios(id, dto.documentosFaltantes);
  }

  @Post(':id/liquidacion')
  @ApiOperation({ summary: 'Register liquidation response from aseguradora' })
  @UseInterceptors(FileInterceptor('liquidacion'))
  registrarLiquidacion(
    @Param('id') id: string,
    @Body('data') dataStr: string,
    @UploadedFile() liquidacion?: Express.Multer.File,
  ) {
    const data = JSON.parse(dataStr || '{}');
    return this.siniestrosService.registrarLiquidacion(id, data, liquidacion);
  }

  @Post(':id/enviar-liquidacion-beneficiarios')
  @ApiOperation({ summary: 'Send liquidation details to all beneficiarios with email' })
  @UseInterceptors(FileInterceptor('comprobante'))
  enviarLiquidacionBeneficiarios(
    @Param('id') id: string,
    @UploadedFile() comprobante?: Express.Multer.File,
  ) {
    return this.siniestrosService.enviarLiquidacionBeneficiarios(id, comprobante);
  }

  @Post(':id/registrar-pago')
  @ApiOperation({ summary: 'Register payment and send receipt to all beneficiarios' })
  @UseInterceptors(FileInterceptor('comprobante'))
  registrarPagoYNotificar(
    @Param('id') id: string,
    @Body() dto: { fechaPago?: string; docContable?: string; obsFinanzas?: string },
    @UploadedFile() comprobante?: Express.Multer.File,
  ) {
    return this.siniestrosService.registrarPagoYNotificar(id, dto, comprobante);
  }

  // ============ BENEFICIARIOS ============

  @Post(':id/beneficiarios')
  @ApiOperation({ summary: 'Create a new beneficiario for a siniestro' })
  createBeneficiario(
    @Param('id') siniestroId: string,
    @Body() dto: {
      nombre: string;
      cedula: string;
      parentesco: string;  // Se mapea a "relacion" en el schema
      porcentaje: number;
      email?: string;
      telefono?: string;
      banco?: string;
      tipoCuenta?: string;
      numeroCuenta?: string;
    },
  ) {
    return this.siniestrosService.createBeneficiario(siniestroId, dto);
  }

  @Patch(':id/beneficiarios/:beneficiarioId')
  @ApiOperation({ summary: 'Update a beneficiario' })
  updateBeneficiario(
    @Param('id') siniestroId: string,
    @Param('beneficiarioId') beneficiarioId: string,
    @Body() dto: {
      nombre?: string;
      cedula?: string;
      parentesco?: string;  // Se mapea a "relacion" en el schema
      porcentaje?: number;
      email?: string;
      telefono?: string;
      banco?: string;
      tipoCuenta?: string;
      numeroCuenta?: string;
      estadoFirma?: string;  // PENDIENTE, FIRMADO, etc.
    },
  ) {
    return this.siniestrosService.updateBeneficiario(siniestroId, beneficiarioId, dto);
  }

  @Delete(':id/beneficiarios/:beneficiarioId')
  @ApiOperation({ summary: 'Delete a beneficiario' })
  deleteBeneficiario(
    @Param('id') siniestroId: string,
    @Param('beneficiarioId') beneficiarioId: string,
  ) {
    return this.siniestrosService.deleteBeneficiario(siniestroId, beneficiarioId);
  }

  @Post(':id/beneficiarios/:beneficiarioId/firma')
  @ApiOperation({ summary: 'Upload firma for a beneficiario' })
  @UseInterceptors(FileInterceptor('firma'))
  uploadFirmaBeneficiario(
    @Param('id') siniestroId: string,
    @Param('beneficiarioId') beneficiarioId: string,
    @UploadedFile() firma: Express.Multer.File,
  ) {
    return this.siniestrosService.uploadFirmaBeneficiario(siniestroId, beneficiarioId, firma);
  }
}
