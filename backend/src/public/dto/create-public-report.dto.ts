import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, IsDateString } from 'class-validator';
import { SiniestroTipo } from '@prisma/client';

export class CreatePublicReportDto {
  @IsEnum(SiniestroTipo)
  tipo: SiniestroTipo;

  @IsDateString()
  @IsOptional()
  fechaDefuncion?: string;

  @IsString()
  @IsOptional()
  observaciones?: string;

  @IsString()
  @IsOptional()
  fallecidoNombre?: string;

  @IsString()
  @IsOptional()
  fallecidoCedula?: string;

  @IsString()
  @IsNotEmpty()
  reportanteNombre: string;

  @IsEmail()
  reportanteEmail: string;

  @IsString()
  @IsNotEmpty()
  reportanteTelefono: string;

  @IsString()
  @IsNotEmpty()
  reportanteRelacion: string;
}
