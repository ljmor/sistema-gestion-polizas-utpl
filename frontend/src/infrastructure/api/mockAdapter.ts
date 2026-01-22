import AxiosMockAdapter from 'axios-mock-adapter';
import { httpClient } from './httpClient';
import { Role } from '../../domain/enums/roles';
import { endpoints } from './endpoints';
import {
  EstadoSiniestro,
  TipoSiniestro,
  SeveridadAlerta,
  TipoAlerta,
  EstadoPoliza,
  TipoPoliza
} from '../../domain/enums/estados';

export const setupMockAdapter = () => {
  const mock = new AxiosMockAdapter(httpClient, { delayResponse: 500 });
  
  console.log('Initializing Mock Adapter...');

  // --- Auth ---
  mock.onPost(endpoints.auth.login).reply(200, {
    token: 'fake-jwt-token-123',
    user: {
      id: '1',
      name: 'Usuario Gestor',
      email: 'gestor@utpl.edu.ec',
      role: Role.GESTOR,
    },
  });

  mock.onGet(endpoints.auth.me).reply(200, {
    id: '1',
    name: 'Usuario Gestor',
    email: 'gestor@utpl.edu.ec',
    role: Role.GESTOR,
  });

  // --- Dashboard ---
  mock.onGet(endpoints.dashboard.kpis).reply(200, {
    casosAbiertos: 12,
    casosPorVencerReporte: 3,
    liquidacionesPendientes: 5,
    pagosPorEjecutar: 2,
  });

  mock.onGet(endpoints.dashboard.casosRecientes).reply(200, [
    {
      id: '1',
      caseCode: 'SIN-2026-001',
      fallecido: { nombreCompleto: 'Juan Pérez', cedula: '1102345678' },
      fechaDefuncion: new Date().toISOString(),
      estado: EstadoSiniestro.RECIBIDO,
      tipo: TipoSiniestro.NATURAL,
      diasRestantes60: 59,
      updatedAt: new Date().toISOString(),
    },
    {
      id: '2',
      caseCode: 'SIN-2026-002',
      fallecido: { nombreCompleto: 'María Gómez', cedula: '1712345678' },
      fechaDefuncion: new Date(Date.now() - 86400000).toISOString(), // Yesterday
      estado: EstadoSiniestro.EN_VALIDACION,
      tipo: TipoSiniestro.ACCIDENTE,
      diasRestantes60: 50,
      updatedAt: new Date().toISOString(),
    },
     {
      id: '3',
      caseCode: 'SIN-2026-003',
      fallecido: { nombreCompleto: 'Carlos Ruiz', cedula: '0102345678' },
      fechaDefuncion: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
      estado: EstadoSiniestro.LIQUIDACION,
      tipo: TipoSiniestro.NATURAL,
      diasRestantes60: 45,
      updatedAt: new Date().toISOString(),
    }
  ]);

  mock.onGet(endpoints.dashboard.alertasCriticas).reply(200, [
    {
      id: '1',
      tipo: TipoAlerta.PLAZO_60D,
      severidad: SeveridadAlerta.CRITICAL,
      mensaje: 'Caso SIN-2025-099 vence reporte en 2 días',
      entidadId: '99',
      entidadTipo: 'SINIESTRO',
      fechaLimite: new Date(Date.now() + 172800000).toISOString(),
      leida: false,
      createdAt: new Date().toISOString(),
    },
    {
      id: '2',
      tipo: TipoAlerta.PLAZO_15D,
      severidad: SeveridadAlerta.WARNING,
      mensaje: 'Liquidación pendiente caso SIN-2026-001',
      entidadId: '1',
      entidadTipo: 'SINIESTRO',
      fechaLimite: new Date(Date.now() + 432000000).toISOString(),
      leida: false,
      createdAt: new Date().toISOString(),
    }
  ]);

  // --- Siniestros ---
  // Regex to match /siniestros but not /siniestros/something
  mock.onGet(new RegExp(`^${endpoints.siniestros.list}$`)).reply(200, {
    data: [
       {
        id: '1',
        caseCode: 'SIN-2026-001',
        fallecido: { nombreCompleto: 'Juan Pérez', cedula: '1102345678' },
        fechaDefuncion: new Date().toISOString(),
        estado: EstadoSiniestro.RECIBIDO,
        tipo: TipoSiniestro.NATURAL,
        diasRestantes60: 59,
        updatedAt: new Date().toISOString(),
      },
      {
        id: '2',
        caseCode: 'SIN-2026-002',
        fallecido: { nombreCompleto: 'María Gómez', cedula: '1712345678' },
        fechaDefuncion: new Date(Date.now() - 86400000).toISOString(),
        estado: EstadoSiniestro.EN_VALIDACION,
        tipo: TipoSiniestro.ACCIDENTE,
        diasRestantes60: 50,
        updatedAt: new Date().toISOString(),
      },
       {
        id: '3',
        caseCode: 'SIN-2026-003',
        fallecido: { nombreCompleto: 'Carlos Ruiz', cedula: '0102345678' },
        fechaDefuncion: new Date(Date.now() - 172800000).toISOString(),
        estado: EstadoSiniestro.LIQUIDACION,
        tipo: TipoSiniestro.NATURAL,
        diasRestantes60: 45,
        updatedAt: new Date().toISOString(),
      }
    ],
    total: 3
  });

  // Detail
  mock.onGet(new RegExp(`^${endpoints.siniestros.list}/\\d+$`)).reply(config => {
      // Extract ID from URL
      const id = config.url?.split('/').pop() || '1';
      return [200, {
        id: id,
        caseCode: `SIN-2026-00${id}`,
        fallecido: { id: id, nombreCompleto: 'Juan Pérez', cedula: '1102345678', fechaDefuncion: new Date().toISOString() },
        reportante: { id: 'r1', nombre: 'Ana Pérez', relacion: 'FAMILIAR', email: 'ana@mail.com', telefono: '0999999999' },
        tipo: TipoSiniestro.NATURAL,
        tipoPreliminar: TipoSiniestro.NATURAL,
        estado: EstadoSiniestro.RECIBIDO,
        documentos: [],
        beneficiarios: [],
        auditTrail: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }];
  });

    // --- Polizas ---
    mock.onGet(new RegExp(`^${endpoints.polizas.list}$`)).reply(200, {
      data: [
          { 
              id: '1', 
              numero: 'POL-VIDA-001', 
              contratante: 'Universidad Técnica Particular de Loja', 
              tipo: TipoPoliza.VIDA,
              vigenciaDesde: '2025-01-01',
              vigenciaHasta: '2025-12-31',
              estado: EstadoPoliza.ACTIVA 
          },
          { 
              id: '2', 
              numero: 'POL-ACC-002', 
              contratante: 'Universidad Técnica Particular de Loja', 
              tipo: TipoPoliza.ACCIDENTES,
              vigenciaDesde: '2025-01-01',
              vigenciaHasta: '2025-12-31',
              estado: EstadoPoliza.ACTIVA 
          }
      ],
      total: 2
    });
  
    // Poliza Detail
    mock.onGet(new RegExp(`^${endpoints.polizas.list}/\\d+$`)).reply(config => {
        const id = config.url?.split('/').pop() || '1';
        return [200, {
          id: id,
          nombre: 'Póliza de Vida Colectiva',
          tipo: TipoPoliza.VIDA,
          estado: EstadoPoliza.ACTIVA,
          prima: 50000,
          montoCobertura: 15000,
          descripcion: 'Póliza de vida colectiva para estudiantes y personal de la UTPL',
          gruposAsegurados: ['ESTUDIANTES', 'PERSONAL_LOJA', 'PERSONAL_CENTROS'],
          vigenciaActual: {
            id: '1',
            desde: '2024-01-01',
            hasta: '2024-12-31',
            activa: true,
          },
          vigencias: [
            { id: '1', desde: '2024-01-01', hasta: '2024-12-31', activa: true },
            { id: '2', desde: '2023-01-01', hasta: '2023-12-31', activa: false },
          ],
          pagos: [
            { id: '1', fecha: '2024-01-15', monto: 12500, estado: 'PAGADO', descripcion: 'Primer trimestre' },
            { id: '2', fecha: '2024-04-15', monto: 12500, estado: 'PAGADO', descripcion: 'Segundo trimestre' },
          ],
          createdAt: '2024-01-01',
          updatedAt: '2024-01-15',
        }];
    });  
  // Pass through any request that doesn't match (though mostly everything should be matched or 404)
  mock.onAny().passThrough();
};