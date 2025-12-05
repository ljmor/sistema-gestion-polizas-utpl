import { Test, TestingModule } from '@nestjs/testing';
import { SiniestrosService } from './siniestros.service';

describe('SiniestrosService', () => {
  let service: SiniestrosService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SiniestrosService],
    }).compile();

    service = module.get<SiniestrosService>(SiniestrosService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
