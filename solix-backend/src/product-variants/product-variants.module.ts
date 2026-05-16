import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ProductVariant } from './entities/product-variant.entity';
import { Product } from '../products/entities/product.entity';
import { Size } from '../sizes/entities/size.entity';

import { ProductVariantsController } from './product-variants.controller';
import { ProductVariantsService } from './product-variants.service';

@Module({
  imports: [TypeOrmModule.forFeature([ProductVariant, Product, Size])],
  controllers: [ProductVariantsController],
  providers: [ProductVariantsService],
  exports: [ProductVariantsService, TypeOrmModule],
})
export class ProductVariantsModule {}
