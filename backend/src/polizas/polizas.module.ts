import { Module } from '@nestjs/common';
import { PolizasController } from './polizas.controller';
import { PolizasService } from './polizas.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PolizasController],
  providers: [PolizasService],
  exports: [PolizasService],
})
export class PolizasModule {}
