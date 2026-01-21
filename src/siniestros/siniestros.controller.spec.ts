import { Test, TestingModule } from '@nestjs/testing';
import { SiniestrosController } from './siniestros.controller';

describe('SiniestrosController', () => {
  let controller: SiniestrosController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SiniestrosController],
    }).compile();

    controller = module.get<SiniestrosController>(SiniestrosController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
