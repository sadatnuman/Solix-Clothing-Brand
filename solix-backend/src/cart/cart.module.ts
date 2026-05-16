import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CartController } from './cart.controller';
import { CartService } from './cart.service';

import { Cart } from './entities/cart.entity';
import { CartItem } from './entities/cart-item.entity';
import { User } from '../users/entities/user.entity';
import { ProductVariant } from '../product-variants/entities/product-variant.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Cart, CartItem, User, ProductVariant])],
  controllers: [CartController],
  providers: [CartService],
  exports: [CartService],
})
export class CartModule {}
