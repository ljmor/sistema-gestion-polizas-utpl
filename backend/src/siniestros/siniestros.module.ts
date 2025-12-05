import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { SiniestrosService } from './siniestros.service';
import { SiniestrosController } from './siniestros.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [
    PrismaModule, 
    MailModule,
    MulterModule.register({
      // Guardar en memoria para enviar directamente por email
      storage: undefined, // memoryStorage por defecto
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB máximo
      },
    }),
  ],
  providers: [SiniestrosService],
  controllers: [SiniestrosController],
  exports: [SiniestrosService],
})
export class SiniestrosModule {}
