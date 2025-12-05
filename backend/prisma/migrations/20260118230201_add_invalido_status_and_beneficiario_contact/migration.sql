-- AlterEnum
ALTER TYPE "SiniestroEstado" ADD VALUE 'INVALIDO';

-- AlterTable
ALTER TABLE "Beneficiario" ADD COLUMN     "email" TEXT,
ADD COLUMN     "telefono" TEXT;

-- AlterTable
ALTER TABLE "Siniestro" ADD COLUMN     "motivoInvalidacion" TEXT;
