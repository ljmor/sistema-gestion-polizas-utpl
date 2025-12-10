import { PrismaClient, Role, PolizaTipo, PolizaEstado, VigenciaEstado, SiniestroTipo, SiniestroEstado, DocumentoEstado, FirmaEstado, LiquidacionEstado, SiniestroPagoEstado, AlertaTipo, AlertaSeveridad, AlertaRefType, Poliza, Siniestro } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed de la base de datos...');

  // 1. Crear usuario Gestor UTPL
  console.log('👤 Creando usuario Gestor UTPL...');
  const gestorEmail = process.env.GESTOR_EMAIL || 'gestor@utpl.edu.ec';
  const gestorPassword = process.env.GESTOR_PASSWORD || 'GestorUTPL2025!';
  const salt = await bcrypt.genSalt();
  const passwordHash = await bcrypt.hash(gestorPassword, salt);

  const gestor = await prisma.user.upsert({
    where: { email: gestorEmail },
    update: {},
    create: {
      email: gestorEmail,
      name: 'Gestor UTPL',
      role: Role.GESTOR,
      passwordHash,
      isActive: true,
    },
  });
  console.log(`✅ Gestor creado: ${gestor.email}`);

  // 2. Crear Pólizas
  console.log('📋 Creando pólizas...');
  const polizas = [
    {
      codigo: 'POL-VIDA-001',
      nombre: 'Póliza de Vida Colectiva - Docentes UTPL',
      tipo: PolizaTipo.VIDA,
      prima: 50000.00,
      moneda: 'USD',
      estado: PolizaEstado.ACTIVA,
    },
    {
      codigo: 'POL-ACC-001',
      nombre: 'Póliza de Accidentes Personales - Estudiantes',
      tipo: PolizaTipo.ACCIDENTES,
      prima: 25000.00,
      moneda: 'USD',
      estado: PolizaEstado.ACTIVA,
    },
    {
      codigo: 'POL-SALUD-001',
      nombre: 'Póliza de Salud - Empleados Administrativos',
      tipo: PolizaTipo.SALUD,
      prima: 35000.00,
      moneda: 'USD',
      estado: PolizaEstado.ACTIVA,
    },
  ];

  const createdPolizas: Poliza[] = [];
  for (const poliza of polizas) {
    const created = await prisma.poliza.upsert({
      where: { codigo: poliza.codigo },
      update: {},
      create: poliza,
    });
    createdPolizas.push(created);
    console.log(`✅ Póliza creada: ${created.codigo}`);
  }

  // 3. Crear Vigencias para las pólizas
  console.log('📅 Creando vigencias de pólizas...');
  const now = new Date();
  const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), 1);
  const oneYearFromNow = new Date(now.getFullYear() + 1, now.getMonth(), 1);
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  for (const poliza of createdPolizas) {
    // Vigencia activa normal
    await prisma.polizaVigencia.create({
      data: {
        polizaId: poliza.id,
        desde: oneYearAgo,
        hasta: oneYearFromNow,
        estado: VigenciaEstado.ABIERTA,
        configJson: {
          cobertura: poliza.tipo === PolizaTipo.VIDA ? 15000 : 10000,
          deducible: 0,
          beneficiarios: ['familiares directos'],
        },
      },
    });
  }

  // Una vigencia próxima a vencer para alertas
  await prisma.polizaVigencia.create({
    data: {
      polizaId: createdPolizas[1].id,
      desde: oneYearAgo,
      hasta: thirtyDaysFromNow,
      estado: VigenciaEstado.ABIERTA,
      configJson: {
        cobertura: 8000,
        nota: 'Vigencia próxima a vencer',
      },
    },
  });
  console.log('✅ Vigencias creadas');

  // 4. Crear Siniestros de ejemplo
  console.log('⚠️ Creando siniestros de ejemplo...');
  const siniestrosData = [
    {
      caseCode: 'SIN-2025-000001',
      tipo: SiniestroTipo.NATURAL,
      estado: SiniestroEstado.EN_VALIDACION,
      fechaDefuncion: new Date('2025-01-05'),
      observaciones: 'Fallecimiento por causas naturales. Documentación en proceso de validación.',
      fallecidoNombre: 'Juan Carlos Mendoza García',
      fallecidoCedula: '1104567890',
      reportanteNombre: 'María Elena Mendoza López',
      reportanteRelacion: 'Cónyuge',
      reportanteEmail: 'maria.mendoza@email.com',
      reportanteTelefono: '0991234567',
    },
    {
      caseCode: 'SIN-2025-000002',
      tipo: SiniestroTipo.ACCIDENTE,
      estado: SiniestroEstado.BENEFICIARIOS,
      fechaDefuncion: new Date('2024-12-20'),
      observaciones: 'Accidente de tránsito. Documentación completa, pendiente firma de beneficiarios.',
      fallecidoNombre: 'Pedro Luis Ramírez Torres',
      fallecidoCedula: '1105678901',
      reportanteNombre: 'Ana Lucía Ramírez Vega',
      reportanteRelacion: 'Hija',
      reportanteEmail: 'ana.ramirez@email.com',
      reportanteTelefono: '0987654321',
      fechaEnvioAseguradora: new Date('2024-12-28'),
    },
    {
      caseCode: 'SIN-2025-000003',
      tipo: SiniestroTipo.NATURAL,
      estado: SiniestroEstado.LIQUIDACION,
      fechaDefuncion: new Date('2024-12-10'),
      observaciones: 'Caso en proceso de liquidación con la aseguradora.',
      fallecidoNombre: 'Rosa María Aguirre Sánchez',
      fallecidoCedula: '1106789012',
      reportanteNombre: 'Carlos Eduardo Aguirre',
      reportanteRelacion: 'Hijo',
      reportanteEmail: 'carlos.aguirre@email.com',
      reportanteTelefono: '0976543210',
      fechaEnvioAseguradora: new Date('2024-12-15'),
      fechaFirmaRecibida: new Date('2024-12-22'),
    },
    {
      caseCode: 'SIN-2025-000004',
      tipo: SiniestroTipo.NATURAL,
      estado: SiniestroEstado.PAGO,
      fechaDefuncion: new Date('2024-11-25'),
      observaciones: 'Liquidación aprobada. Pendiente ejecución de pago.',
      fallecidoNombre: 'Luis Fernando Paredes Mora',
      fallecidoCedula: '1107890123',
      reportanteNombre: 'Sofía Patricia Paredes',
      reportanteRelacion: 'Hija',
      reportanteEmail: 'sofia.paredes@email.com',
      reportanteTelefono: '0965432109',
      fechaEnvioAseguradora: new Date('2024-12-01'),
      fechaFirmaRecibida: new Date('2024-12-10'),
      fechaLiquidacion: new Date('2024-12-18'),
    },
    {
      caseCode: 'SIN-2024-000010',
      tipo: SiniestroTipo.ACCIDENTE,
      estado: SiniestroEstado.CERRADO,
      fechaDefuncion: new Date('2024-10-15'),
      observaciones: 'Caso cerrado exitosamente. Pago realizado a beneficiarios.',
      fallecidoNombre: 'Miguel Ángel Torres Ruiz',
      fallecidoCedula: '1108901234',
      reportanteNombre: 'Carmen Torres Vega',
      reportanteRelacion: 'Hermana',
      reportanteEmail: 'carmen.torres@email.com',
      reportanteTelefono: '0954321098',
      fechaEnvioAseguradora: new Date('2024-10-20'),
      fechaFirmaRecibida: new Date('2024-10-28'),
      fechaLiquidacion: new Date('2024-11-05'),
      fechaPago: new Date('2024-11-10'),
      fechaCierre: new Date('2024-11-10'),
    },
    {
      caseCode: 'SIN-2025-000005',
      tipo: SiniestroTipo.NATURAL,
      estado: SiniestroEstado.RECIBIDO,
      fechaDefuncion: new Date('2025-01-10'),
      observaciones: 'Caso recién recibido desde portal público.',
      fallecidoNombre: 'Diego Armando López Celi',
      fallecidoCedula: '1109012345',
      reportanteNombre: 'Patricia López Medina',
      reportanteRelacion: 'Esposa',
      reportanteEmail: 'patricia.lopez@email.com',
      reportanteTelefono: '0943210987',
    },
  ];

  const createdSiniestros: Siniestro[] = [];
  for (const siniestro of siniestrosData) {
    const created = await prisma.siniestro.upsert({
      where: { caseCode: siniestro.caseCode },
      update: {},
      create: siniestro,
    });
    createdSiniestros.push(created);
    console.log(`✅ Siniestro creado: ${created.caseCode}`);
  }

  // 5. Crear Documentos para los siniestros
  console.log('📄 Creando documentos de siniestros...');
  const documentTypes = [
    'CEDULA_FALLECIDO',
    'CERTIFICADO_DEFUNCION',
    'POSESION_EFECTIVA',
    'CEDULAS_BENEFICIARIOS',
    'CERTIFICADO_BANCARIO',
  ];

  for (const siniestro of createdSiniestros) {
    for (const tipo of documentTypes) {
      let estado: DocumentoEstado = DocumentoEstado.PENDIENTE;
      
      // Asignar estados según el estado del siniestro
      if (siniestro.estado !== SiniestroEstado.RECIBIDO) {
        if (tipo === 'CEDULA_FALLECIDO' || tipo === 'CERTIFICADO_DEFUNCION') {
          estado = DocumentoEstado.RECIBIDO;
        }
        if (siniestro.estado === SiniestroEstado.CERRADO || 
            siniestro.estado === SiniestroEstado.PAGO ||
            siniestro.estado === SiniestroEstado.LIQUIDACION) {
          estado = DocumentoEstado.RECIBIDO;
        }
      }

      await prisma.documento.create({
        data: {
          siniestroId: siniestro.id,
          tipo,
          estado,
        },
      });
    }
  }
  console.log('✅ Documentos creados');

  // 6. Crear Beneficiarios
  console.log('👥 Creando beneficiarios...');
  const beneficiariosData = [
    // Siniestro 1 (EN_VALIDACION)
    { siniestroIndex: 0, nombre: 'María Elena Mendoza López', cedula: '1111234567', relacion: 'Cónyuge', porcentaje: 50, banco: 'Banco Pichincha', cuenta: '2200123456', email: 'maria.mendoza@email.com', telefono: '0991234567', estadoFirma: FirmaEstado.PENDIENTE },
    { siniestroIndex: 0, nombre: 'Juan Pablo Mendoza López', cedula: '1112345678', relacion: 'Hijo', porcentaje: 25, banco: 'Banco Guayaquil', cuenta: '3300234567', email: 'juanpablo.mendoza@email.com', telefono: '0982345678', estadoFirma: FirmaEstado.PENDIENTE },
    { siniestroIndex: 0, nombre: 'Carla Andrea Mendoza López', cedula: '1113456789', relacion: 'Hija', porcentaje: 25, banco: 'Banco Bolivariano', cuenta: '4400345678', email: 'carla.mendoza@email.com', telefono: '0973456789', estadoFirma: FirmaEstado.PENDIENTE },
    
    // Siniestro 2 (BENEFICIARIOS)
    { siniestroIndex: 1, nombre: 'Ana Lucía Ramírez Vega', cedula: '1114567890', relacion: 'Hija', porcentaje: 50, banco: 'Banco Pichincha', cuenta: '2200456789', email: 'ana.ramirez@email.com', telefono: '0964567890', estadoFirma: FirmaEstado.RECIBIDA },
    { siniestroIndex: 1, nombre: 'Roberto Ramírez Vega', cedula: '1115678901', relacion: 'Hijo', porcentaje: 50, banco: 'Produbanco', cuenta: '5500567890', email: 'roberto.ramirez@email.com', telefono: '0955678901', estadoFirma: FirmaEstado.PENDIENTE },
    
    // Siniestro 3 (LIQUIDACION)
    { siniestroIndex: 2, nombre: 'Carlos Eduardo Aguirre', cedula: '1116789012', relacion: 'Hijo', porcentaje: 100, banco: 'Banco Internacional', cuenta: '6600678901', email: 'carlos.aguirre@email.com', telefono: '0946789012', estadoFirma: FirmaEstado.RECIBIDA },
    
    // Siniestro 4 (PAGO)
    { siniestroIndex: 3, nombre: 'Sofía Patricia Paredes', cedula: '1117890123', relacion: 'Hija', porcentaje: 60, banco: 'Banco Pichincha', cuenta: '2200789012', email: 'sofia.paredes@email.com', telefono: '0937890123', estadoFirma: FirmaEstado.RECIBIDA },
    { siniestroIndex: 3, nombre: 'Andrés Paredes Mora', cedula: '1118901234', relacion: 'Hijo', porcentaje: 40, banco: 'Banco Guayaquil', cuenta: '3300890123', email: 'andres.paredes@email.com', telefono: '0928901234', estadoFirma: FirmaEstado.RECIBIDA },
    
    // Siniestro 5 (CERRADO)
    { siniestroIndex: 4, nombre: 'Carmen Torres Vega', cedula: '1119012345', relacion: 'Hermana', porcentaje: 100, banco: 'Produbanco', cuenta: '5500901234', email: 'carmen.torres@email.com', telefono: '0919012345', estadoFirma: FirmaEstado.RECIBIDA },
  ];

  for (const ben of beneficiariosData) {
    await prisma.beneficiario.create({
      data: {
        siniestroId: createdSiniestros[ben.siniestroIndex].id,
        nombre: ben.nombre,
        cedula: ben.cedula,
        relacion: ben.relacion,
        porcentaje: ben.porcentaje,
        banco: ben.banco,
        cuenta: ben.cuenta,
        email: ben.email,
        telefono: ben.telefono,
        estadoFirma: ben.estadoFirma,
      },
    });
  }
  console.log('✅ Beneficiarios creados');

  // 7. Crear Liquidaciones
  console.log('💰 Creando liquidaciones...');
  // Liquidación para siniestro en estado LIQUIDACION
  await prisma.liquidacion.create({
    data: {
      siniestroId: createdSiniestros[2].id,
      montoLiquidado: 12500.00,
      notasAseguradora: 'Liquidación aprobada según cobertura de póliza.',
      estado: LiquidacionEstado.ENVIADA,
    },
  });

  // Liquidación para siniestro en estado PAGO
  await prisma.liquidacion.create({
    data: {
      siniestroId: createdSiniestros[3].id,
      montoLiquidado: 15000.00,
      notasAseguradora: 'Liquidación completa aprobada.',
      estado: LiquidacionEstado.APROBADA,
    },
  });

  // Liquidación para siniestro CERRADO
  await prisma.liquidacion.create({
    data: {
      siniestroId: createdSiniestros[4].id,
      montoLiquidado: 10000.00,
      notasAseguradora: 'Caso cerrado. Pago ejecutado correctamente.',
      estado: LiquidacionEstado.APROBADA,
    },
  });
  console.log('✅ Liquidaciones creadas');

  // 8. Crear Pagos
  console.log('💵 Creando pagos...');
  // Pago pendiente para siniestro en estado PAGO
  await prisma.pago.create({
    data: {
      siniestroId: createdSiniestros[3].id,
      estado: SiniestroPagoEstado.PENDIENTE,
      docContable: 'DOC-2024-0045',
      obsFinanzas: 'Pago programado para próxima semana.',
    },
  });

  // Pago ejecutado para siniestro CERRADO
  await prisma.pago.create({
    data: {
      siniestroId: createdSiniestros[4].id,
      estado: SiniestroPagoEstado.EJECUTADO,
      docContable: 'DOC-2024-0032',
      obsFinanzas: 'Pago realizado mediante transferencia bancaria.',
      fechaPago: new Date('2024-11-10'),
    },
  });
  console.log('✅ Pagos creados');

  // 9. Crear Alertas de ejemplo
  console.log('🔔 Creando alertas...');
  const alertas = [
    {
      tipo: AlertaTipo.PLAZO_60D,
      severidad: AlertaSeveridad.WARNING,
      mensaje: `El caso ${createdSiniestros[5].caseCode} tiene 45 días para ser reportado a la aseguradora`,
      refType: AlertaRefType.SINIESTRO,
      refId: createdSiniestros[5].id,
      fechaLimite: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
      isResolved: false,
    },
    {
      tipo: AlertaTipo.PLAZO_72H,
      severidad: AlertaSeveridad.CRITICAL,
      mensaje: `¡Urgente! Quedan menos de 48 horas para ejecutar el pago del caso ${createdSiniestros[3].caseCode}`,
      refType: AlertaRefType.SINIESTRO,
      refId: createdSiniestros[3].id,
      fechaLimite: new Date(Date.now() + 48 * 60 * 60 * 1000),
      isResolved: false,
    },
    {
      tipo: AlertaTipo.VENCIMIENTO_POLIZA,
      severidad: AlertaSeveridad.INFO,
      mensaje: `La póliza ${createdPolizas[1].codigo} vence en 30 días`,
      refType: AlertaRefType.POLIZA,
      refId: createdPolizas[1].id,
      fechaLimite: thirtyDaysFromNow,
      isResolved: false,
    },
    {
      tipo: AlertaTipo.PLAZO_15D,
      severidad: AlertaSeveridad.WARNING,
      mensaje: `Quedan 8 días hábiles para la respuesta de liquidación del caso ${createdSiniestros[2].caseCode}`,
      refType: AlertaRefType.SINIESTRO,
      refId: createdSiniestros[2].id,
      fechaLimite: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000),
      isResolved: false,
    },
  ];

  for (const alerta of alertas) {
    await prisma.alerta.create({ data: alerta });
  }
  console.log('✅ Alertas creadas');

  // 10. Crear eventos de auditoría
  console.log('📝 Creando eventos de auditoría...');
  const auditEvents = [
    {
      entity: 'SINIESTRO',
      entityId: createdSiniestros[0].id,
      action: 'CREATED',
      meta: { caseCode: createdSiniestros[0].caseCode, source: 'portal_publico' },
      actorUserId: null,
    },
    {
      entity: 'SINIESTRO',
      entityId: createdSiniestros[0].id,
      action: 'STATE_CHANGE',
      meta: { from: 'RECIBIDO', to: 'EN_VALIDACION', reason: 'Documentación inicial recibida' },
      actorUserId: gestor.id,
    },
    {
      entity: 'SINIESTRO',
      entityId: createdSiniestros[4].id,
      action: 'CLOSED',
      meta: { caseCode: createdSiniestros[4].caseCode, montoTotal: 10000 },
      actorUserId: gestor.id,
    },
  ];

  for (const event of auditEvents) {
    await prisma.auditEvent.create({ data: event });
  }
  console.log('✅ Eventos de auditoría creados');

  console.log('\n🎉 Seed completado exitosamente!');
  console.log('=========================================');
  console.log(`📧 Usuario Gestor: ${gestorEmail}`);
  console.log(`🔑 Contraseña: ${gestorPassword}`);
  console.log('=========================================\n');
}

main()
  .catch((e) => {
    console.error('❌ Error durante el seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
