import { IsEnum, IsOptional, IsString } from 'class-validator';
import { SiniestroEstado } from '@prisma/client';

export class ChangeStateDto {
  @IsEnum(SiniestroEstado)
  nextState: SiniestroEstado;

  @IsString()
  @IsOptional()
  notas?: string;
}
