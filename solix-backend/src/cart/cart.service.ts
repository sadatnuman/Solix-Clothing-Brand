import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { CartRecord, VariantRecord } from '../database/types';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model } from 'mongoose';
@Injectable()
export class CartService {
  constructor(
    @InjectModel('Cart') private readonly carts: Model<CartRecord>,
    @InjectModel('ProductVariant')
    private readonly variants: Model<VariantRecord>,
    @InjectConnection() private readonly db: Connection,
  ) {}
  async getMyCart(user: string) {
    const cart = await this.carts.findOne({ user }).populate({
      path: 'items.productVariant',
      populate: [{ path: 'product' }, { path: 'size' }],
    });
    const items = (cart?.items || []).map(
      (item: import('../database/types').CartItemRecord) => {
        const v = item.productVariant;
        const unitPrice = Number(v?.variantPrice ?? v?.product?.basePrice ?? 0);
        return {
          id: item.id,
          quantity: item.quantity,
          unitPrice,
          subtotal: Math.round(unitPrice * item.quantity * 100) / 100,
          productVariant: v,
          unavailable: !v || !v.isActive || !v.product?.isActive,
        };
      },
    );
    return {
      data: {
        id: cart ? String(cart._id) : undefined,
        userId: user,
        items,
        totalItems: items.reduce((n, i) => n + i.quantity, 0),
        totalAmount:
          Math.round(items.reduce((n, i) => n + i.subtotal, 0) * 100) / 100,
      },
    };
  }
  async addItem(user: string, dto: AddCartItemDto) {
    // Initialize before the transaction; the unique user index resolves first-cart races.
    try {
      await this.carts.updateOne(
        { user },
        { $setOnInsert: { user, items: [] } },
        { upsert: true },
      );
    } catch (e) {
      if (!(e instanceof Error) || !('code' in e) || e.code !== 11000) throw e;
    }
    await this.db.transaction(async (session) => {
      const variant = await this.variants
        .findOne({ _id: dto.productVariantId, isActive: true })
        .populate('product')
        .session(session);
      if (!variant || !variant.product?.isActive)
        throw new NotFoundException('Product is unavailable');
      const cart = await this.carts.findOne({ user }).session(session);
      if (!cart) throw new NotFoundException('Cart not found');
      const item = cart.items.find(
        (i) => String(i.productVariant) === dto.productVariantId,
      );
      const quantity = (item?.quantity || 0) + dto.quantity;
      if (quantity > variant.stockQuantity)
        throw new BadRequestException(
          'Requested quantity exceeds available stock',
        );
      if (item) item.quantity = quantity;
      else cart.items.push({ productVariant: variant._id, quantity });
      await cart.save({ session });
    });
    return this.getMyCart(user);
  }
  async updateItem(user: string, id: string, dto: UpdateCartItemDto) {
    await this.db.transaction(async (session) => {
      const cart = await this.carts
        .findOne({ user, 'items._id': id })
        .session(session);
      if (!cart) throw new NotFoundException('Cart item not found');
      const item = cart.items.id(id);
      if (!item) throw new NotFoundException('Cart item not found');
      const variant = await this.variants
        .findOne({ _id: item.productVariant, isActive: true })
        .populate('product')
        .session(session);
      if (
        !variant ||
        !variant.product?.isActive ||
        dto.quantity > variant.stockQuantity
      )
        throw new BadRequestException('Requested quantity is unavailable');
      item.quantity = dto.quantity;
      await cart.save({ session });
    });
    return this.getMyCart(user);
  }
  async removeItem(user: string, id: string) {
    const result = await this.carts.updateOne(
      { user, 'items._id': id },
      { $pull: { items: { _id: id } } },
    );
    if (!result.matchedCount)
      throw new NotFoundException('Cart item not found');
    return { message: 'Item removed', id };
  }
  async clearCart(user: string) {
    await this.carts.updateOne({ user }, { $set: { items: [] } });
    return { message: 'Cart cleared' };
  }
  async merge(
    user: string,
    items: Array<{ productVariantId: string; quantity: number }>,
  ) {
    for (const item of items.slice(0, 50)) {
      try {
        await this.addItem(user, item);
      } catch (error) {
        if (
          !(
            error instanceof BadRequestException ||
            error instanceof NotFoundException
          )
        )
          throw error;
      }
    }
    return this.getMyCart(user);
  }
}
