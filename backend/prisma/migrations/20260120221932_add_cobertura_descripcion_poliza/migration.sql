-- AlterTable
ALTER TABLE "Poliza" ADD COLUMN     "descripcion" TEXT,
ADD COLUMN     "montoCobertura" DECIMAL(65,30),
ALTER COLUMN "moneda" SET DEFAULT 'USD';

-- AddForeignKey
ALTER TABLE "Siniestro" ADD CONSTRAINT "Siniestro_polizaId_fkey" FOREIGN KEY ("polizaId") REFERENCES "Poliza"("id") ON DELETE SET NULL ON UPDATE CASCADE;
