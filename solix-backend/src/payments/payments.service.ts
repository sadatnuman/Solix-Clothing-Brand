import { UserRole } from '../common/enums/user-role.enum';
import { PaymentMethod } from '../common/enums/payment-method.enum';
import { PaymentStatus } from '../common/enums/payment-status.enum';
import { OrderStatus } from '../common/enums/order-status.enum';
import { UpdatePaymentStatusDto } from './dto/update-payment-status.dto';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { User } from '../users/entities/user.entity';
import {
  NotificationRecord,
  OrderRecord,
  PaymentRecord,
} from '../database/types';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model, Types } from 'mongoose';
@Injectable()
export class PaymentsService {
  constructor(
    @InjectModel('Payment') private readonly payments: Model<PaymentRecord>,
    @InjectModel('Order') private readonly orders: Model<OrderRecord>,
    @InjectModel('Notification')
    private readonly notifications: Model<NotificationRecord>,
    @InjectConnection() private readonly db: Connection,
  ) {}
  private authorize(order: OrderRecord, user: User) {
    if (
      ![UserRole.ADMIN, UserRole.STAFF].includes(user.role) &&
      String(order.user?._id ?? order.user) !== user.id
    )
      throw new ForbiddenException();
  }
  async create(dto: CreatePaymentDto, user: User) {
    let result: import('mongoose').HydratedDocument<PaymentRecord> | null =
      null;
    await this.db.transaction(async (session) => {
      const order = await this.orders.findById(dto.orderId).session(session);
      if (!order) throw new NotFoundException('Order not found');
      this.authorize(order, user);
      if (
        order.orderStatus === OrderStatus.CANCELLED ||
        order.paymentStatus === PaymentStatus.VERIFIED
      )
        throw new BadRequestException('Payment cannot be changed');
      if (dto.method !== order.paymentMethod)
        throw new BadRequestException('Payment method must match the order');
      const transactionRef = dto.transactionRef?.trim();
      if (dto.method !== PaymentMethod.CASH_ON_DELIVERY && !transactionRef)
        throw new BadRequestException('Transaction reference is required');
      if (dto.method === PaymentMethod.CASH_ON_DELIVERY && transactionRef)
        throw new BadRequestException(
          'COD does not require a transaction reference',
        );
      result = await this.payments.findOneAndUpdate(
        { order: order._id },
        {
          $set: {
            method: dto.method,
            status:
              dto.method === PaymentMethod.CASH_ON_DELIVERY
                ? 'pending'
                : 'submitted',
            submittedAt: transactionRef ? new Date() : undefined,
            senderLastFour: dto.senderLastFour,
            ...(transactionRef ? { transactionRef } : {}),
          },
        },
        { new: true, upsert: true, runValidators: true, session },
      );
      order.paymentStatus =
        dto.method === PaymentMethod.CASH_ON_DELIVERY
          ? PaymentStatus.PENDING
          : PaymentStatus.SUBMITTED;
      if (dto.method !== PaymentMethod.CASH_ON_DELIVERY)
        order.orderStatus = OrderStatus.PAYMENT_REVIEW;
      await order.save({ session });
    });
    await this.notifications.create({
      user: user.id,
      type: 'payment',
      title: 'Payment submitted',
      message: 'Your transaction is waiting for verification.',
      href: `/orders/${dto.orderId}`,
    });
    return { message: 'Payment submitted for verification', data: result };
  }
  async findAll() {
    const data = await this.payments
      .find()
      .populate('order')
      .sort({ createdAt: -1 });
    return { data, count: data.length };
  }
  async findOne(id: string, user: User) {
    const data = await this.payments
      .findById(id)
      .populate({ path: 'order', populate: { path: 'user' } });
    if (!data) throw new NotFoundException('Payment not found');
    this.authorize(data.order, user);
    return { data };
  }
  async findByOrder(order: string, user: User) {
    const data = await this.payments
      .findOne({ order })
      .populate({ path: 'order', populate: { path: 'user' } });
    if (!data) throw new NotFoundException('Payment not found');
    this.authorize(data.order, user);
    return { data };
  }
  async attachProof(id: string, proofImageUrl: string, user: User) {
    const payment = await this.payments.findById(id).populate('order');
    if (!payment) throw new NotFoundException('Payment not found');
    this.authorize(payment.order, user);
    if (
      [PaymentStatus.VERIFIED, PaymentStatus.REFUNDED].includes(payment.status)
    )
      throw new BadRequestException('Payment proof can no longer be changed');
    payment.proofImageUrl = proofImageUrl;
    await payment.save();
    return { message: 'Payment proof attached', data: payment };
  }
  async updateStatus(id: string, dto: UpdatePaymentStatusDto, user: User) {
    await this.db.transaction(async (session) => {
      const payment = await this.payments.findById(id).session(session);
      if (!payment) throw new NotFoundException('Payment not found');
      const order = await this.orders.findById(payment.order).session(session);
      if (!order) throw new NotFoundException('Order not found');
      if (order.orderStatus === OrderStatus.CANCELLED)
        throw new BadRequestException('Order is cancelled');
      if (
        payment.status === PaymentStatus.VERIFIED &&
        ![PaymentStatus.VERIFIED, PaymentStatus.REFUNDED].includes(dto.status)
      )
        throw new BadRequestException(
          'Verified payments cannot be reversed here',
        );
      if (dto.transactionRef?.trim())
        payment.transactionRef = dto.transactionRef.trim();
      if (
        dto.status === PaymentStatus.VERIFIED &&
        payment.method !== PaymentMethod.CASH_ON_DELIVERY &&
        !payment.transactionRef
      )
        throw new BadRequestException('Transaction reference is required');
      payment.status = dto.status;
      payment.verifiedBy =
        dto.status === PaymentStatus.VERIFIED
          ? new Types.ObjectId(user.id)
          : payment.verifiedBy;
      payment.rejectionReason = dto.rejectionReason;
      payment.paidAt =
        dto.status === PaymentStatus.VERIFIED
          ? (payment.paidAt ?? new Date())
          : null;
      order.paymentStatus = dto.status;
      if (
        dto.status === PaymentStatus.VERIFIED &&
        order.orderStatus === OrderStatus.PAYMENT_REVIEW
      )
        order.orderStatus = OrderStatus.CONFIRMED;
      order.timeline.push({
        status: `payment_${dto.status}`,
        note: dto.rejectionReason,
        at: new Date(),
      });
      await order.save({ session });
      await payment.save({ session });
    });
    const data = await this.payments.findById(id).populate('order');
    if (data)
      await this.notifications.create({
        user: data.order.user,
        type: 'payment',
        title: `Payment ${dto.status}`,
        message:
          dto.status === PaymentStatus.VERIFIED
            ? 'Your payment was verified.'
            : `Your payment is ${dto.status}.`,
        href: `/orders/${data.order.id}`,
      });
    return { data };
  }
  async remove(id: string) {
    if (!(await this.payments.exists({ _id: id })))
      throw new NotFoundException('Payment not found');
    throw new BadRequestException(
      'Payment records are retained for order history',
    );
  }
}
