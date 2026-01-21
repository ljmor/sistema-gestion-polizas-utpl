import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { PublicModule } from './public/public.module';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import { SiniestrosModule } from './siniestros/siniestros.module';
import { FilesModule } from './files/files.module';
import { AlertasModule } from './alertas/alertas.module';
import { MailModule } from './mail/mail.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { PolizasModule } from './polizas/polizas.module';
import { SearchModule } from './search/search.module';
import { AppConfigModule } from './config/config.module';
import configuration from './config/configuration';

@Module({
  imports: [
    ConfigModule.forRoot({ 
      isGlobal: true,
      load: [configuration],
    }),
    LoggerModule.forRoot(),
    PrismaModule,
    UsersModule,
    AuthModule,
    PublicModule,
    SiniestrosModule,
    PolizasModule,
    FilesModule,
    AlertasModule,
    MailModule,
    DashboardModule,
    SearchModule,
    AppConfigModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

