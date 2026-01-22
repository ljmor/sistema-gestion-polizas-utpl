import { Test, TestingModule } from '@nestjs/testing';
import { SiniestrosController } from './siniestros.controller';
import { SiniestrosService } from './siniestros.service';

describe('SiniestrosController', () => {
  let controller: SiniestrosController;

  const mockSiniestrosService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SiniestrosController],
      providers: [
        {
          provide: SiniestrosService,
          useValue: mockSiniestrosService,
        },
      ],
    }).compile();

    controller = module.get<SiniestrosController>(SiniestrosController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
