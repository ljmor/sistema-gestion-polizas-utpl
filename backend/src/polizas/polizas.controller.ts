import { Controller, Get, Post, Patch, Delete, Param, Query, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { PolizasService } from './polizas.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('polizas')
@Controller('polizas')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PolizasController {
  constructor(private readonly polizasService: PolizasService) {}

  @Post()
  @ApiOperation({ summary: 'Crear una nueva póliza' })
  async create(@Body() dto: {
    nombre: string;
    tipo: string;
    prima: number;
    montoCobertura: number;
    descripcion?: string;
    vigenciaDesde: string;
    vigenciaHasta: string;
  }) {
    return this.polizasService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todas las pólizas' })
  async findAll() {
    return this.polizasService.findAll();
  }

  @Get('search')
  @ApiOperation({ summary: 'Buscar pólizas' })
  @ApiQuery({ name: 'q', required: true, description: 'Término de búsqueda' })
  async search(@Query('q') query: string) {
    return this.polizasService.search(query || '');
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener detalle de una póliza' })
  async findOne(@Param('id') id: string) {
    return this.polizasService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar una póliza' })
  async update(@Param('id') id: string, @Body() dto: {
    nombre?: string;
    tipo?: string;
    prima?: number;
    montoCobertura?: number;
    descripcion?: string;
    estado?: string;
  }) {
    return this.polizasService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar una póliza' })
  async delete(@Param('id') id: string) {
    return this.polizasService.delete(id);
  }

  // ========== VIGENCIAS ==========

  @Post(':id/vigencias')
  @ApiOperation({ summary: 'Crear una nueva vigencia para una póliza' })
  async createVigencia(
    @Param('id') polizaId: string,
    @Body() dto: { desde: string; hasta: string }
  ) {
    return this.polizasService.createVigencia(polizaId, dto);
  }

  @Patch(':id/vigencias/:vigenciaId/cerrar')
  @ApiOperation({ summary: 'Cerrar una vigencia activa' })
  async cerrarVigencia(
    @Param('id') polizaId: string,
    @Param('vigenciaId') vigenciaId: string
  ) {
    return this.polizasService.cerrarVigencia(polizaId, vigenciaId);
  }
}
