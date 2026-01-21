-- CreateEnum
CREATE TYPE "Role" AS ENUM ('GESTOR', 'FINANZAS', 'ASEGURADORA', 'ADMIN');

-- CreateEnum
CREATE TYPE "PolizaTipo" AS ENUM ('VIDA', 'ACCIDENTES', 'SALUD', 'OTRO');

-- CreateEnum
CREATE TYPE "PolizaEstado" AS ENUM ('ACTIVA', 'INACTIVA');

-- CreateEnum
CREATE TYPE "VigenciaEstado" AS ENUM ('ABIERTA', 'CERRADA');

-- CreateEnum
CREATE TYPE "PolizaPagoEstado" AS ENUM ('PENDIENTE', 'PAGADO');

-- CreateEnum
CREATE TYPE "SiniestroTipo" AS ENUM ('NATURAL', 'ACCIDENTE', 'DESCONOCIDO');

-- CreateEnum
CREATE TYPE "SiniestroEstado" AS ENUM ('RECIBIDO', 'EN_VALIDACION', 'BENEFICIARIOS', 'LIQUIDACION', 'PAGO', 'CERRADO');

-- CreateEnum
CREATE TYPE "DocumentoEstado" AS ENUM ('PENDIENTE', 'RECIBIDO', 'RECHAZADO');

-- CreateEnum
CREATE TYPE "FirmaEstado" AS ENUM ('PENDIENTE', 'RECIBIDA');

-- CreateEnum
CREATE TYPE "LiquidacionEstado" AS ENUM ('ENVIADA', 'OBSERVADA', 'APROBADA');

-- CreateEnum
CREATE TYPE "SiniestroPagoEstado" AS ENUM ('PENDIENTE', 'EJECUTADO');

-- CreateEnum
CREATE TYPE "AlertaTipo" AS ENUM ('PLAZO_60D', 'PLAZO_15D', 'PLAZO_72H', 'VENCIMIENTO_POLIZA', 'PAGO_POLIZA');

-- CreateEnum
CREATE TYPE "AlertaSeveridad" AS ENUM ('INFO', 'WARNING', 'CRITICAL');

-- CreateEnum
CREATE TYPE "AlertaRefType" AS ENUM ('SINIESTRO', 'POLIZA');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Poliza" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo" "PolizaTipo" NOT NULL,
    "prima" DECIMAL(65,30) NOT NULL,
    "moneda" TEXT NOT NULL,
    "estado" "PolizaEstado" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Poliza_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PolizaVigencia" (
    "id" TEXT NOT NULL,
    "polizaId" TEXT NOT NULL,
    "desde" TIMESTAMP(3) NOT NULL,
    "hasta" TIMESTAMP(3) NOT NULL,
    "estado" "VigenciaEstado" NOT NULL,
    "configJson" JSONB,

    CONSTRAINT "PolizaVigencia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PolizaPago" (
    "id" TEXT NOT NULL,
    "polizaId" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "monto" DECIMAL(65,30) NOT NULL,
    "estado" "PolizaPagoEstado" NOT NULL,
    "facturaFileId" TEXT,

    CONSTRAINT "PolizaPago_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Siniestro" (
    "id" TEXT NOT NULL,
    "caseCode" TEXT NOT NULL,
    "tipo" "SiniestroTipo" NOT NULL,
    "estado" "SiniestroEstado" NOT NULL,
    "fechaDefuncion" TIMESTAMP(3),
    "observaciones" TEXT,
    "fallecidoNombre" TEXT,
    "fallecidoCedula" TEXT,
    "reportanteNombre" TEXT,
    "reportanteRelacion" TEXT,
    "reportanteEmail" TEXT,
    "reportanteTelefono" TEXT,
    "polizaId" TEXT,
    "polizaVigenciaId" TEXT,
    "assignedToUserId" TEXT,
    "fechaReporte" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaEnvioAseguradora" TIMESTAMP(3),
    "fechaFirmaRecibida" TIMESTAMP(3),
    "fechaLiquidacion" TIMESTAMP(3),
    "fechaPago" TIMESTAMP(3),
    "fechaCierre" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Siniestro_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Documento" (
    "id" TEXT NOT NULL,
    "siniestroId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "estado" "DocumentoEstado" NOT NULL,
    "motivoRechazo" TEXT,
    "fileId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Documento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Beneficiario" (
    "id" TEXT NOT NULL,
    "siniestroId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "cedula" TEXT NOT NULL,
    "relacion" TEXT NOT NULL,
    "porcentaje" DECIMAL(65,30) NOT NULL,
    "banco" TEXT,
    "cuenta" TEXT,
    "estadoFirma" "FirmaEstado" NOT NULL DEFAULT 'PENDIENTE',
    "firmaFileId" TEXT,

    CONSTRAINT "Beneficiario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Liquidacion" (
    "id" TEXT NOT NULL,
    "siniestroId" TEXT NOT NULL,
    "montoLiquidado" DECIMAL(65,30) NOT NULL,
    "notasAseguradora" TEXT,
    "liquidacionFileId" TEXT,
    "estado" "LiquidacionEstado" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Liquidacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pago" (
    "id" TEXT NOT NULL,
    "siniestroId" TEXT NOT NULL,
    "estado" "SiniestroPagoEstado" NOT NULL,
    "docContable" TEXT,
    "obsFinanzas" TEXT,
    "comprobanteFileId" TEXT,
    "fechaPago" TIMESTAMP(3),

    CONSTRAINT "Pago_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "File" (
    "id" TEXT NOT NULL,
    "bucket" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "checksum" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "File_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditEvent" (
    "id" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "meta" JSONB NOT NULL,
    "actorUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Alerta" (
    "id" TEXT NOT NULL,
    "tipo" "AlertaTipo" NOT NULL,
    "severidad" "AlertaSeveridad" NOT NULL,
    "mensaje" TEXT NOT NULL,
    "refType" "AlertaRefType" NOT NULL,
    "refId" TEXT NOT NULL,
    "fechaLimite" TIMESTAMP(3) NOT NULL,
    "isResolved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Alerta_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Poliza_codigo_key" ON "Poliza"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "Siniestro_caseCode_key" ON "Siniestro"("caseCode");

-- CreateIndex
CREATE UNIQUE INDEX "Liquidacion_siniestroId_key" ON "Liquidacion"("siniestroId");

-- CreateIndex
CREATE UNIQUE INDEX "Pago_siniestroId_key" ON "Pago"("siniestroId");

-- AddForeignKey
ALTER TABLE "PolizaVigencia" ADD CONSTRAINT "PolizaVigencia_polizaId_fkey" FOREIGN KEY ("polizaId") REFERENCES "Poliza"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PolizaPago" ADD CONSTRAINT "PolizaPago_polizaId_fkey" FOREIGN KEY ("polizaId") REFERENCES "Poliza"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PolizaPago" ADD CONSTRAINT "PolizaPago_facturaFileId_fkey" FOREIGN KEY ("facturaFileId") REFERENCES "File"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Documento" ADD CONSTRAINT "Documento_siniestroId_fkey" FOREIGN KEY ("siniestroId") REFERENCES "Siniestro"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Documento" ADD CONSTRAINT "Documento_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "File"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Beneficiario" ADD CONSTRAINT "Beneficiario_siniestroId_fkey" FOREIGN KEY ("siniestroId") REFERENCES "Siniestro"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Beneficiario" ADD CONSTRAINT "Beneficiario_firmaFileId_fkey" FOREIGN KEY ("firmaFileId") REFERENCES "File"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Liquidacion" ADD CONSTRAINT "Liquidacion_siniestroId_fkey" FOREIGN KEY ("siniestroId") REFERENCES "Siniestro"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Liquidacion" ADD CONSTRAINT "Liquidacion_liquidacionFileId_fkey" FOREIGN KEY ("liquidacionFileId") REFERENCES "File"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pago" ADD CONSTRAINT "Pago_siniestroId_fkey" FOREIGN KEY ("siniestroId") REFERENCES "Siniestro"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pago" ADD CONSTRAINT "Pago_comprobanteFileId_fkey" FOREIGN KEY ("comprobanteFileId") REFERENCES "File"("id") ON DELETE SET NULL ON UPDATE CASCADE;
