import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { ConfigController } from './config.controller';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [NestConfigModule, MailModule],
  controllers: [ConfigController],
})
export class AppConfigModule {}
