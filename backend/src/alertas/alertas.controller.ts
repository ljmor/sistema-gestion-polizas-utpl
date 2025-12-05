import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AlertasService } from './alertas.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AlertaTipo, AlertaSeveridad } from '@prisma/client';

@ApiTags('alertas')
@Controller('alertas')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AlertasController {
  constructor(private readonly alertasService: AlertasService) {}

  @Get()
  @ApiOperation({ summary: 'Obtener todas las alertas' })
  @ApiQuery({ name: 'tipo', required: false, enum: AlertaTipo })
  @ApiQuery({ name: 'severidad', required: false, enum: AlertaSeveridad })
  @ApiQuery({ name: 'isResolved', required: false, type: Boolean })
  async findAll(
    @Query('tipo') tipo?: AlertaTipo,
    @Query('severidad') severidad?: AlertaSeveridad,
    @Query('isResolved') isResolved?: string,
  ) {
    return this.alertasService.findAll({
      tipo,
      severidad,
      isResolved: isResolved === undefined ? undefined : isResolved === 'true',
    });
  }

  @Get('unresolved')
  @ApiOperation({ summary: 'Obtener alertas no resueltas para notificaciones' })
  async getUnresolved() {
    return this.alertasService.getUnresolvedAlerts();
  }

  @Get('counts')
  @ApiOperation({ summary: 'Obtener conteo de alertas por severidad' })
  async getCounts() {
    return this.alertasService.getAlertCounts();
  }

  @Post(':id/resolver')
  @ApiOperation({ summary: 'Marcar una alerta como resuelta' })
  async resolve(@Param('id') id: string) {
    return this.alertasService.resolveAlert(id);
  }

  @Post('resolver-todas')
  @ApiOperation({ summary: 'Marcar todas las alertas como resueltas' })
  async resolveAll() {
    return this.alertasService.resolveAllAlerts();
  }

  @Post('check-plazos')
  @ApiOperation({ summary: 'Ejecutar verificación manual de plazos (para testing)' })
  async manualCheckPlazos() {
    await this.alertasService.checkSiniestroPlazos();
    await this.alertasService.checkPolizaVencimientos();
    return { message: 'Verificación de plazos ejecutada' };
  }
}
