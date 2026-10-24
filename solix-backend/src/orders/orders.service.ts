import { UserRole } from '../common/enums/user-role.enum';
import { PaymentMethod } from '../common/enums/payment-method.enum';
import { PaymentStatus } from '../common/enums/payment-status.enum';
import { OrderStatus } from '../common/enums/order-status.enum';
import { UpdateOrderDto } from './dto/update-order.dto';
import { UpdateTrackingDto } from './dto/update-order.dto';
import { CreateOrderDto } from './dto/create-order.dto';
import { User } from '../users/entities/user.entity';
import {
  CartRecord,
  CouponRecord,
  InventoryMovementRecord,
  NotificationRecord,
  OrderRecord,
  PaymentRecord,
  VariantRecord,
} from '../database/types';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model, Types } from 'mongoose';
import { randomUUID } from 'crypto';
import { ConfigService } from '@nestjs/config';
@Injectable()
export class OrdersService {
  constructor(
    @InjectModel('Order') private readonly orders: Model<OrderRecord>,
    @InjectModel('Cart') private readonly carts: Model<CartRecord>,
    @InjectModel('ProductVariant')
    private readonly variants: Model<VariantRecord>,
    @InjectModel('Payment') private readonly payments: Model<PaymentRecord>,
    @InjectModel('Coupon') private readonly coupons: Model<CouponRecord>,
    @InjectModel('InventoryMovement')
    private readonly movements: Model<InventoryMovementRecord>,
    @InjectModel('Notification')
    private readonly notifications: Model<NotificationRecord>,
    @InjectConnection() private readonly db: Connection,
    private readonly config: ConfigService,
  ) {}
  async create(dto: CreateOrderDto, user: User) {
    let result: import('../database/types').OrderDocument | null = null;
    try {
      await this.db.transaction(async (session) => {
        const existing = await this.orders
          .findOne({ user: user.id, checkoutKey: dto.checkoutKey })
          .session(session);
        if (existing) {
          result = existing;
          return;
        }
        if (
          dto.paymentMethod !== PaymentMethod.CASH_ON_DELIVERY &&
          !this.config.get(`${dto.paymentMethod.toUpperCase()}_NUMBER`)
        )
          throw new BadRequestException(
            'This payment method is not configured',
          );
        if (!dto.acceptTerms)
          throw new BadRequestException('Accept the store terms to continue');
        const cart = await this.carts
          .findOne({ user: user.id })
          .session(session);
        if (!cart?.items?.length)
          throw new BadRequestException('Cart is empty');
        const items: Array<
          Omit<
            import('../database/types').OrderItemRecord,
            | keyof import('../database/types').BaseRecord
            | 'product'
            | 'productVariant'
          > & {
            product: import('mongoose').Types.ObjectId;
            productVariant: import('mongoose').Types.ObjectId;
          }
        > = [];
        for (const item of cart.items) {
          const v = await this.variants
            .findOne({ _id: item.productVariant, isActive: true })
            .populate('product')
            .populate('size')
            .session(session);
          if (!v || !v.product?.isActive || !v.size)
            throw new BadRequestException('A product is no longer available');
          const stock = await this.variants.updateOne(
            {
              _id: v._id,
              isActive: true,
              stockQuantity: { $gte: item.quantity },
            },
            { $inc: { stockQuantity: -item.quantity } },
            { session },
          );
          if (stock.modifiedCount !== 1)
            throw new BadRequestException(
              `Insufficient stock for ${v.product.name}`,
            );
          const unitPrice = Number(v.variantPrice ?? v.product.basePrice);
          items.push({
            product: v.product._id,
            productVariant: v._id,

            productName: v.product.name,
            sizeName: v.size.name,
            colourName: v.colourName,
            sku: v.sku,
            imageUrl: v.product.images?.[0]?.imageUrl,
            quantity: item.quantity,
            unitPrice,
            subtotal: Math.round(unitPrice * item.quantity * 100) / 100,
          });
          await this.movements.create(
            [
              {
                variant: v._id,
                type: 'sale',
                quantity: -item.quantity,
                previousStock: v.stockQuantity,
                newStock: v.stockQuantity - item.quantity,
                referenceType: 'checkout',
                referenceId: dto.checkoutKey,
              },
            ],
            { session },
          );
        }
        const subtotalAmount =
          Math.round(items.reduce((n, i) => n + i.subtotal, 0) * 100) / 100;
        let discountAmount = 0;
        let couponSnapshot: Record<string, unknown> | undefined;
        let coupon: import('mongoose').HydratedDocument<CouponRecord> | null =
          null;
        if (dto.couponCode) {
          coupon = await this.coupons
            .findOne({
              code: dto.couponCode.trim().toUpperCase(),
              isActive: true,
            })
            .session(session);
          if (!coupon) throw new BadRequestException('Coupon is not valid');
          const now = new Date();
          const used =
            coupon.usedBy.find((entry) => String(entry.user) === user.id)
              ?.count || 0;
          if (
            (coupon.startsAt && coupon.startsAt > now) ||
            (coupon.endsAt && coupon.endsAt < now) ||
            (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) ||
            used >= coupon.perCustomerLimit ||
            subtotalAmount < coupon.minSpend
          )
            throw new BadRequestException(
              'Coupon cannot be used for this order',
            );
          const raw =
            coupon.type === 'percentage'
              ? (subtotalAmount * coupon.value) / 100
              : coupon.value;
          discountAmount =
            Math.round(
              Math.min(
                subtotalAmount,
                coupon.maxDiscount ? Math.min(raw, coupon.maxDiscount) : raw,
              ) * 100,
            ) / 100;
          couponSnapshot = {
            code: coupon.code,
            type: coupon.type,
            value: coupon.value,
          };
        }
        const orderStatus =
          dto.paymentMethod === PaymentMethod.CASH_ON_DELIVERY
            ? OrderStatus.PENDING
            : OrderStatus.PAYMENT_REVIEW;
        const orderInput = {
          checkoutKey: dto.checkoutKey,
          deliveryAddress: dto.deliveryAddress,
          contactPhone: dto.contactPhone,
          deliveryNotes: dto.deliveryNotes,
          paymentMethod: dto.paymentMethod,
        };
        const [order] = await this.orders.create(
          [
            {
              ...orderInput,
              user: user.id,
              orderNumber: `SLX-${randomUUID().slice(0, 12).toUpperCase()}`,
              items,
              subtotalAmount,
              discountAmount,
              couponSnapshot,
              totalAmount: subtotalAmount - discountAmount,
              shippingAmount: 0,
              orderStatus,
              timeline: [
                { status: orderStatus, note: 'Order placed', at: new Date() },
              ],
            },
          ],
          { session },
        );
        if (coupon) {
          const prior = coupon.usedBy.find(
            (entry) => String(entry.user) === user.id,
          );
          if (prior) prior.count += 1;
          else
            coupon.usedBy.push({ user: new Types.ObjectId(user.id), count: 1 });
          coupon.usedCount += 1;
          await coupon.save({ session });
        }
        await this.payments.create(
          [{ order: order._id, method: dto.paymentMethod, status: 'pending' }],
          { session },
        );
        cart.items.splice(0);
        await cart.save({ session });
        result = order;
      });
    } catch (error) {
      if (
        !(error instanceof Error) ||
        !('code' in error) ||
        error.code !== 11000
      )
        throw error;
      result = await this.orders.findOne({
        user: user.id,
        checkoutKey: dto.checkoutKey,
      });
      if (!result) throw error;
    }
    if (result)
      await this.notifications.create({
        user: user.id,
        type: 'order',
        title: 'Order placed',
        message: `Your order ${result.orderNumber} was received.`,
        href: `/orders/${result.id}`,
      });
    return { message: 'Order placed successfully', data: result };
  }
  async findAll(user: User) {
    if (![UserRole.ADMIN, UserRole.STAFF].includes(user.role))
      throw new ForbiddenException();
    const data = await this.orders
      .find()
      .populate('user')
      .sort({ createdAt: -1 });
    return { data, count: data.length };
  }
  async findMyOrders(user: User) {
    const data = await this.orders
      .find({ user: user.id })
      .sort({ createdAt: -1 });
    return { data, count: data.length };
  }
  async findOne(id: string, user: User) {
    const data = await this.orders.findById(id).populate('user');
    if (!data) throw new NotFoundException('Order not found');
    if (
      ![UserRole.ADMIN, UserRole.STAFF].includes(user.role) &&
      String(data.user._id) !== user.id
    )
      throw new ForbiddenException();
    return { data };
  }
  async updateStatus(id: string, dto: UpdateOrderDto, user: User) {
    if (![UserRole.ADMIN, UserRole.STAFF].includes(user.role))
      throw new ForbiddenException();
    await this.db.transaction(async (session) => {
      const order = await this.orders.findById(id).session(session);
      if (!order) throw new NotFoundException('Order not found');
      const next = dto.orderStatus;
      if (!next) return;
      if (next === order.orderStatus) {
        if (next === OrderStatus.CANCELLED)
          throw new BadRequestException('Order is already cancelled');
        return;
      }
      const transitions: Record<string, string[]> = {
        pending: ['confirmed', 'cancelled'],
        payment_review: ['confirmed', 'cancelled'],
        confirmed: ['processing', 'cancelled'],
        processing: ['packed', 'cancelled'],
        packed: ['shipped', 'cancelled'],
        shipped: ['delivered'],
        delivered: ['return_requested'],
        return_requested: ['returned'],
        returned: [],
        cancelled: [],
      };
      if (!transitions[order.orderStatus].includes(next))
        throw new BadRequestException('Invalid order status transition');
      if (next === OrderStatus.CANCELLED) {
        if (order.paymentStatus === PaymentStatus.VERIFIED)
          throw new BadRequestException(
            'Paid orders require a refund; cancellation is unavailable',
          );
        if (!order.stockRestored) {
          for (const item of order.items) {
            const variant = await this.variants
              .findById(item.productVariant)
              .session(session);
            if (!variant) continue;
            const previousStock = variant.stockQuantity;
            variant.stockQuantity += item.quantity;
            await variant.save({ session });
            await this.movements.create(
              [
                {
                  variant: variant._id,
                  type: 'cancellation',
                  quantity: item.quantity,
                  previousStock,
                  newStock: variant.stockQuantity,
                  referenceType: 'order',
                  referenceId: String(order._id),
                },
              ],
              { session },
            );
          }
          order.stockRestored = true;
        }
        order.paymentStatus = PaymentStatus.REJECTED;
        await this.payments.updateOne(
          { order: id },
          { $set: { status: 'rejected' } },
          { session },
        );
      }
      if (
        next === OrderStatus.DELIVERED &&
        order.paymentMethod !== PaymentMethod.CASH_ON_DELIVERY &&
        order.paymentStatus !== PaymentStatus.VERIFIED
      )
        throw new BadRequestException(
          'Verify payment before marking delivered',
        );
      order.orderStatus = next;
      if (
        next === OrderStatus.DELIVERED &&
        order.paymentMethod === PaymentMethod.CASH_ON_DELIVERY
      ) {
        order.paymentStatus = PaymentStatus.VERIFIED;
        await this.payments.updateOne(
          { order: id },
          {
            $set: {
              status: 'verified',
              paidAt: new Date(),
              verifiedBy: user.id,
            },
          },
          { session },
        );
      }
      order.timeline.push({ status: next, note: dto.note, at: new Date() });
      await order.save({ session });
    });
    return this.findOne(id, user);
  }

  async cancel(id: string, user: User) {
    const order = await this.orders.findOne({ _id: id, user: user.id });
    if (!order) throw new NotFoundException('Order not found');
    if (
      ![OrderStatus.PENDING, OrderStatus.PAYMENT_REVIEW].includes(
        order.orderStatus,
      )
    )
      throw new BadRequestException(
        'This order can no longer be cancelled online',
      );
    return this.updateStatus(
      id,
      { orderStatus: OrderStatus.CANCELLED, note: 'Cancelled by customer' },
      { ...user, role: UserRole.ADMIN },
    );
  }

  async updateTracking(id: string, dto: UpdateTrackingDto, user: User) {
    if (![UserRole.ADMIN, UserRole.STAFF].includes(user.role))
      throw new ForbiddenException();
    const data = await this.orders.findByIdAndUpdate(
      id,
      { $set: { tracking: dto } },
      { new: true },
    );
    if (!data) throw new NotFoundException('Order not found');
    await this.notifications.create({
      user: data.user,
      type: 'shipping',
      title: 'Tracking updated',
      message: `${dto.carrier}: ${dto.trackingNumber}`,
      href: `/orders/${data.id}`,
    });
    return { data };
  }
}
