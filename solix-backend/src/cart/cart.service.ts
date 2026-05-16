import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Cart } from './entities/cart.entity';
import { CartItem } from './entities/cart-item.entity';
import { User } from '../users/entities/user.entity';
import { ProductVariant } from '../product-variants/entities/product-variant.entity';

import { AddCartItemDto } from './dto/add-cart-item.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';

@Injectable()
export class CartService {
  constructor(
    @InjectRepository(Cart)
    private readonly cartRepo: Repository<Cart>,
    @InjectRepository(CartItem)
    private readonly cartItemRepo: Repository<CartItem>,
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    @InjectRepository(ProductVariant)
    private readonly productVariantsRepo: Repository<ProductVariant>,
  ) {}

  private calculateUnitPrice(variant: ProductVariant): number {
    if (variant.variantPrice !== null && variant.variantPrice !== undefined) {
      return Number(variant.variantPrice);
    }

    if (!variant.product || variant.product.basePrice === undefined) {
      throw new BadRequestException(
        'Product base price not found for this variant',
      );
    }

    return Number(variant.product.basePrice);
  }

  private async getOrCreateCart(userId: number): Promise<Cart> {
    let cart = await this.cartRepo.findOne({
      where: { user: { id: userId } },
      relations: [
        'user',
        'items',
        'items.productVariant',
        'items.productVariant.product',
        'items.productVariant.size',
      ],
    });

    if (cart) {
      return cart;
    }

    const user = await this.usersRepo.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`User with id ${userId} not found`);
    }

    cart = this.cartRepo.create({
      user,
      items: [],
    });

    return this.cartRepo.save(cart);
  }

  private async buildCartResponse(cart: Cart) {
    const freshCart = await this.cartRepo.findOne({
      where: { id: cart.id },
      relations: [
        'user',
        'items',
        'items.productVariant',
        'items.productVariant.product',
        'items.productVariant.product.category',
        'items.productVariant.size',
      ],
    });

    if (!freshCart) {
      throw new NotFoundException('Cart not found');
    }

    const totalAmount = freshCart.items.reduce(
      (sum, item) => sum + Number(item.subtotal),
      0,
    );

    return {
      message: 'Cart fetched successfully',
      data: {
        id: freshCart.id,
        userId: freshCart.user.id,
        totalItems: freshCart.items.length,
        totalAmount,
        items: freshCart.items.map((item) => ({
          id: item.id,
          quantity: item.quantity,
          unitPrice: Number(item.unitPrice),
          subtotal: Number(item.subtotal),
          productVariant: {
            id: item.productVariant.id,
            stockQuantity: item.productVariant.stockQuantity,
            variantPrice:
              item.productVariant.variantPrice !== null
                ? Number(item.productVariant.variantPrice)
                : null,
            size: item.productVariant.size
              ? {
                  id: item.productVariant.size.id,
                  name: item.productVariant.size.name,
                }
              : null,
            product: item.productVariant.product
              ? {
                  id: item.productVariant.product.id,
                  name: item.productVariant.product.name,
                  slug: item.productVariant.product.slug,
                  basePrice: Number(item.productVariant.product.basePrice),
                }
              : null,
          },
        })),
      },
    };
  }

  async getMyCart(userId: number) {
    const cart = await this.getOrCreateCart(userId);
    return this.buildCartResponse(cart);
  }

  async addItem(userId: number, dto: AddCartItemDto) {
    const cart = await this.getOrCreateCart(userId);

    const variant = await this.productVariantsRepo.findOne({
      where: { id: dto.productVariantId },
      relations: ['product', 'size'],
    });

    if (!variant) {
      throw new NotFoundException(
        `Product variant with id ${dto.productVariantId} not found`,
      );
    }

    if (variant.stockQuantity < dto.quantity) {
      throw new BadRequestException(
        'Requested quantity exceeds available stock',
      );
    }

    const existingItem = await this.cartItemRepo.findOne({
      where: {
        cart: { id: cart.id },
        productVariant: { id: dto.productVariantId },
      },
      relations: ['cart', 'productVariant', 'productVariant.product'],
    });

    const unitPrice = this.calculateUnitPrice(variant);

    if (existingItem) {
      const newQuantity = existingItem.quantity + dto.quantity;

      if (variant.stockQuantity < newQuantity) {
        throw new BadRequestException(
          'Requested quantity exceeds available stock',
        );
      }

      existingItem.quantity = newQuantity;
      existingItem.unitPrice = unitPrice;
      existingItem.subtotal = Number((unitPrice * newQuantity).toFixed(2));

      await this.cartItemRepo.save(existingItem);

      return {
        message: 'Cart item quantity updated successfully',
        data: {
          id: existingItem.id,
          quantity: existingItem.quantity,
          unitPrice: Number(existingItem.unitPrice),
          subtotal: Number(existingItem.subtotal),
        },
      };
    }

    const cartItem = this.cartItemRepo.create({
      cart,
      productVariant: variant,
      quantity: dto.quantity,
      unitPrice,
      subtotal: Number((unitPrice * dto.quantity).toFixed(2)),
    });

    const saved = await this.cartItemRepo.save(cartItem);

    return {
      message: 'Item added to cart successfully',
      data: {
        id: saved.id,
        quantity: saved.quantity,
        unitPrice: Number(saved.unitPrice),
        subtotal: Number(saved.subtotal),
      },
    };
  }

  async updateItem(userId: number, cartItemId: number, dto: UpdateCartItemDto) {
    const cartItem = await this.cartItemRepo.findOne({
      where: { id: cartItemId },
      relations: [
        'cart',
        'cart.user',
        'productVariant',
        'productVariant.product',
      ],
    });

    if (!cartItem) {
      throw new NotFoundException(`Cart item with id ${cartItemId} not found`);
    }

    if (cartItem.cart.user.id !== userId) {
      throw new ForbiddenException('You can update only your own cart item');
    }

    if (cartItem.productVariant.stockQuantity < dto.quantity) {
      throw new BadRequestException(
        'Requested quantity exceeds available stock',
      );
    }

    const unitPrice = this.calculateUnitPrice(cartItem.productVariant);

    cartItem.quantity = dto.quantity;
    cartItem.unitPrice = unitPrice;
    cartItem.subtotal = Number((unitPrice * dto.quantity).toFixed(2));

    const updated = await this.cartItemRepo.save(cartItem);

    return {
      message: 'Cart item updated successfully',
      data: {
        id: updated.id,
        quantity: updated.quantity,
        unitPrice: Number(updated.unitPrice),
        subtotal: Number(updated.subtotal),
      },
    };
  }

  async removeItem(userId: number, cartItemId: number) {
    const cartItem = await this.cartItemRepo.findOne({
      where: { id: cartItemId },
      relations: ['cart', 'cart.user'],
    });

    if (!cartItem) {
      throw new NotFoundException(`Cart item with id ${cartItemId} not found`);
    }

    if (cartItem.cart.user.id !== userId) {
      throw new ForbiddenException('You can remove only your own cart item');
    }

    await this.cartItemRepo.remove(cartItem);

    return {
      message: 'Cart item removed successfully',
      id: cartItemId,
    };
  }

  async clearCart(userId: number) {
    const cart = await this.getOrCreateCart(userId);

    const items = await this.cartItemRepo.find({
      where: { cart: { id: cart.id } },
      relations: ['cart'],
    });

    if (items.length > 0) {
      await this.cartItemRepo.remove(items);
    }

    return {
      message: 'Cart cleared successfully',
    };
  }
}
