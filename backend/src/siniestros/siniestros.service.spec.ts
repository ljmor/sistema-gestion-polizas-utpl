import { Test, TestingModule } from '@nestjs/testing';
import { SiniestrosService } from './siniestros.service';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { ConfigService } from '@nestjs/config';

describe('SiniestrosService', () => {
  let service: SiniestrosService;

  const mockPrismaService = {
    siniestro: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
    documento: {
      create: jest.fn(),
      update: jest.fn(),
    },
    beneficiario: {
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    liquidacion: {
      create: jest.fn(),
      update: jest.fn(),
    },
    pago: {
      create: jest.fn(),
      update: jest.fn(),
    },
    file: {
      create: jest.fn(),
    },
  };

  const mockMailService = {
    sendExpedienteToAseguradora: jest.fn(),
    sendDocumentosPendientes: jest.fn(),
    sendLiquidacionAprobada: jest.fn(),
    sendPagoRealizado: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn().mockReturnValue('test-value'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SiniestrosService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: MailService,
          useValue: mockMailService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<SiniestrosService>(SiniestrosService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
