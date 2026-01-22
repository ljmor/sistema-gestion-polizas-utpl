import { Test, TestingModule } from '@nestjs/testing';
import { PublicService } from './public.service';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';

describe('PublicService', () => {
  let service: PublicService;

  const mockPrismaService = {
    siniestro: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    documento: {
      create: jest.fn(),
    },
    file: {
      create: jest.fn(),
    },
  };

  const mockMailService = {
    sendNewPublicReportNotification: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PublicService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: MailService,
          useValue: mockMailService,
        },
      ],
    }).compile();

    service = module.get<PublicService>(PublicService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
