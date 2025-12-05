import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface SearchResult {
  type: 'siniestro' | 'poliza';
  id: string;
  title: string;
  subtitle: string;
  status?: string;
}

@Injectable()
export class SearchService {
  constructor(private prisma: PrismaService) {}

  async globalSearch(query: string): Promise<SearchResult[]> {
    if (!query || query.length < 2) {
      return [];
    }

    const results: SearchResult[] = [];

    // Buscar siniestros
    const siniestros = await this.prisma.siniestro.findMany({
      where: {
        OR: [
          { caseCode: { contains: query, mode: 'insensitive' } },
          { fallecidoNombre: { contains: query, mode: 'insensitive' } },
          { fallecidoCedula: { contains: query, mode: 'insensitive' } },
          { reportanteNombre: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: 5,
      orderBy: { updatedAt: 'desc' },
    });

    for (const s of siniestros) {
      results.push({
        type: 'siniestro',
        id: s.id,
        title: s.caseCode,
        subtitle: s.fallecidoNombre || 'Sin nombre',
        status: s.estado,
      });
    }

    // Buscar pólizas
    const polizas = await this.prisma.poliza.findMany({
      where: {
        OR: [
          { codigo: { contains: query, mode: 'insensitive' } },
          { nombre: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: 5,
      orderBy: { updatedAt: 'desc' },
    });

    for (const p of polizas) {
      results.push({
        type: 'poliza',
        id: p.id,
        title: p.codigo,
        subtitle: p.nombre,
        status: p.estado,
      });
    }

    return results;
  }
}
