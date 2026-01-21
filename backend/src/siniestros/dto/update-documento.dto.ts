import { IsEnum, IsOptional, IsString } from 'class-validator';
import { DocumentoEstado } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateDocumentoDto {
  @ApiProperty({ enum: DocumentoEstado, required: false })
  @IsEnum(DocumentoEstado)
  @IsOptional()
  estado?: DocumentoEstado;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  observaciones?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  motivoRechazo?: string;
}
