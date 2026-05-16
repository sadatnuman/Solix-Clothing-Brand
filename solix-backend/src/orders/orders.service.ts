import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { Cart } from '../cart/entities/cart.entity';
import { CartItem } from '../cart/entities/cart-item.entity';
import { ProductVariant } from '../product-variants/entities/product-variant.entity';
import { User } from '../users/entities/user.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { OrderStatus } from '../common/enums/order-status.enum';
import { UserRole } from '../common/enums/user-role.enum';
import { PaymentStatus } from '../common/enums/payment-status.enum';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly ordersRepo: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemsRepo: Repository<OrderItem>,
    @InjectRepository(Cart)
    private readonly cartsRepo: Repository<Cart>,
    @InjectRepository(CartItem)
    private readonly cartItemsRepo: Repository<CartItem>,
    @InjectRepository(ProductVariant)
    private readonly variantsRepo: Repository<ProductVariant>,
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
  ) {}

  async create(dto: CreateOrderDto, currentUser: User) {
    const user = await this.usersRepo.findOne({
      where: { id: currentUser.id },
      relations: [
        'cart',
        'cart.items',
        'cart.items.productVariant',
        'cart.items.productVariant.product',
        'cart.items.productVariant.size',
      ],
    });

    if (!user || !user.cart || user.cart.items.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    // Check stock
    for (const item of user.cart.items) {
      if (item.quantity > item.productVariant.stockQuantity) {
        throw new BadRequestException(
          `Insufficient stock for ${item.productVariant.product.name} (${item.productVariant.size.name})`,
        );
      }
    }

    // Generate order number
    const orderNumber = `ORD-${Date.now()}-${currentUser.id}`;

    // Calculate total
    const totalAmount = user.cart.items.reduce((sum, item) => {
      const unitPrice =
        item.productVariant.variantPrice ||
        item.productVariant.product.basePrice;
      return sum + unitPrice * item.quantity;
    }, 0);

    // Create order
    const order = this.ordersRepo.create({
      user,
      orderNumber,
      deliveryAddress: dto.deliveryAddress,
      contactPhone: dto.contactPhone,
      paymentMethod: dto.paymentMethod,
      totalAmount,
      orderStatus: OrderStatus.PENDING,
      paymentStatus: PaymentStatus.PENDING,
    });

    const savedOrder = await this.ordersRepo.save(order);

    // Create order items
    const orderItems = user.cart.items.map((item) => {
      const unitPrice =
        item.productVariant.variantPrice ||
        item.productVariant.product.basePrice;
      return this.orderItemsRepo.create({
        order: savedOrder,
        product: item.productVariant.product,
        productName: item.productVariant.product.name,
        sizeName: item.productVariant.size.name,
        quantity: item.quantity,
        unitPrice,
        subtotal: unitPrice * item.quantity,
      });
    });

    await this.orderItemsRepo.save(orderItems);

    // Reduce stock
    for (const item of user.cart.items) {
      item.productVariant.stockQuantity -= item.quantity;
      await this.variantsRepo.save(item.productVariant);
    }

    // Clear cart
    await this.cartItemsRepo.delete({ cart: { id: user.cart.id } });

    return {
      message: 'Order placed successfully',
      data: savedOrder,
    };
  }

  async findAll(currentUser: User) {
    if (currentUser.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Admin access required');
    }

    const orders = await this.ordersRepo.find({
      relations: ['user', 'items'],
      order: { createdAt: 'DESC' },
    });

    return {
      message: 'Orders fetched successfully',
      count: orders.length,
      data: orders,
    };
  }

  async findMyOrders(currentUser: User) {
    const orders = await this.ordersRepo.find({
      where: { user: { id: currentUser.id } },
      relations: ['items'],
      order: { createdAt: 'DESC' },
    });

    return {
      message: 'My orders fetched successfully',
      count: orders.length,
      data: orders,
    };
  }

  async findOne(id: number, currentUser: User) {
    const order = await this.ordersRepo.findOne({
      where: { id },
      relations: ['user', 'items'],
    });

    if (!order) {
      throw new NotFoundException(`Order with id ${id} not found`);
    }

    if (
      currentUser.role !== UserRole.ADMIN &&
      order.user.id !== currentUser.id
    ) {
      throw new ForbiddenException('You can view only your own orders');
    }

    return {
      message: 'Order fetched successfully',
      data: order,
    };
  }

  async updateStatus(id: number, dto: UpdateOrderDto, currentUser: User) {
    if (currentUser.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Admin access required');
    }

    const order = await this.ordersRepo.findOne({ where: { id } });
    if (!order) {
      throw new NotFoundException(`Order with id ${id} not found`);
    }

    Object.assign(order, dto);
    const updated = await this.ordersRepo.save(order);

    return {
      message: 'Order status updated successfully',
      data: updated,
    };
  }
}
