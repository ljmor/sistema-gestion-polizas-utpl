import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('dashboard')
@Controller('dashboard')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('kpis')
  @ApiOperation({ summary: 'Obtener KPIs del dashboard' })
  async getKpis() {
    return this.dashboardService.getKpis();
  }

  @Get('casos-recientes')
  @ApiOperation({ summary: 'Obtener casos recientes' })
  async getCasosRecientes() {
    return this.dashboardService.getCasosRecientes();
  }

  @Get('alertas-criticas')
  @ApiOperation({ summary: 'Obtener alertas críticas' })
  async getAlertasCriticas() {
    return this.dashboardService.getAlertasCriticas();
  }

  @Get('estadisticas-reportes')
  @ApiOperation({ summary: 'Obtener estadísticas completas para reportes' })
  async getEstadisticasReportes() {
    return this.dashboardService.getEstadisticasReportes();
  }
}
