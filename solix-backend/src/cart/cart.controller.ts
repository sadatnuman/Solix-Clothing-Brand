import { ObjectIdPipe } from '../common/object-id.pipe';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';

import { CartService } from './cart.service';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { MergeCartDto } from './dto/merge-cart.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { User } from '../users/entities/user.entity';

@Controller('cart')
@UseGuards(JwtAuthGuard)
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  getMyCart(@GetUser() user: User) {
    return this.cartService.getMyCart(user.id);
  }

  @Post('items')
  addItem(@GetUser() user: User, @Body() dto: AddCartItemDto) {
    return this.cartService.addItem(user.id, dto);
  }

  @Post('merge')
  merge(@GetUser() user: User, @Body() dto: MergeCartDto) {
    return this.cartService.merge(user.id, dto.items);
  }

  @Patch('items/:id')
  updateItem(
    @GetUser() user: User,
    @Param('id', ObjectIdPipe) id: string,
    @Body() dto: UpdateCartItemDto,
  ) {
    return this.cartService.updateItem(user.id, id, dto);
  }

  @Delete('items/:id')
  removeItem(@GetUser() user: User, @Param('id', ObjectIdPipe) id: string) {
    return this.cartService.removeItem(user.id, id);
  }

  @Delete('clear')
  clearCart(@GetUser() user: User) {
    return this.cartService.clearCart(user.id);
  }
}
