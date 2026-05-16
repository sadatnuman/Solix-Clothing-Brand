import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Size } from './entities/size.entity';
import { SizesService } from './sizes.service';
import { SizesController } from './sizes.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Size])],
  providers: [SizesService],
  controllers: [SizesController],
  exports: [SizesService, TypeOrmModule],
})
export class SizesModule {}
