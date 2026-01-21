import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { SearchService } from './search.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('search')
@Controller('search')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  @ApiOperation({ summary: 'Búsqueda global de casos y pólizas' })
  @ApiQuery({ name: 'q', required: true, description: 'Término de búsqueda (mínimo 2 caracteres)' })
  async search(@Query('q') query: string) {
    return this.searchService.globalSearch(query || '');
  }
}
