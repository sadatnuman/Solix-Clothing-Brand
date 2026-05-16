import { Test, TestingModule } from '@nestjs/testing';
import { SizesController } from './sizes.controller';

describe('SizesController', () => {
  let controller: SizesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SizesController],
    }).compile();

    controller = module.get<SizesController>(SizesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
