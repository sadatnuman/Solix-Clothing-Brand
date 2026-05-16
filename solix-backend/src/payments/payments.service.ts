import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Payment } from './entities/payment.entity';
import { Order } from '../orders/entities/order.entity';

import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentStatusDto } from './dto/update-payment-status.dto';

import { PaymentStatus } from '../common/enums/payment-status.enum';
import { UserRole } from '../common/enums/user-role.enum';
import { User } from '../users/entities/user.entity';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment)
    private readonly paymentsRepo: Repository<Payment>,
    @InjectRepository(Order)
    private readonly ordersRepo: Repository<Order>,
  ) {}

  async create(dto: CreatePaymentDto, currentUser: User) {
    const order = await this.ordersRepo.findOne({
      where: { id: dto.orderId },
      relations: ['user'],
    });

    if (!order) {
      throw new NotFoundException(`Order with id ${dto.orderId} not found`);
    }

    if (
      currentUser.role !== UserRole.ADMIN &&
      order.user.id !== currentUser.id
    ) {
      throw new ForbiddenException(
        'You can create payment only for your own order',
      );
    }

    const existingPayment = await this.paymentsRepo.findOne({
      where: { order: { id: dto.orderId } },
      relations: ['order'],
    });

    if (existingPayment) {
      throw new BadRequestException(
        'Payment record already exists for this order',
      );
    }

    const payment = this.paymentsRepo.create({
      order,
      method: dto.method,
      status: PaymentStatus.PENDING,
      transactionRef: dto.transactionRef ?? null,
      paidAt: null,
    });

    const saved = await this.paymentsRepo.save(payment);

    return {
      message: 'Payment record created successfully',
      data: saved,
    };
  }

  async findAll() {
    const payments = await this.paymentsRepo.find({
      order: { createdAt: 'DESC' },
    });

    return {
      message: 'Payments fetched successfully',
      count: payments.length,
      data: payments,
    };
  }

  async findOne(id: number, currentUser: User) {
    const payment = await this.paymentsRepo.findOne({
      where: { id },
      relations: ['order', 'order.user'],
    });

    if (!payment) {
      throw new NotFoundException(`Payment with id ${id} not found`);
    }

    if (
      currentUser.role !== UserRole.ADMIN &&
      payment.order.user.id !== currentUser.id
    ) {
      throw new ForbiddenException('You can view only your own payment');
    }

    return {
      message: 'Payment fetched successfully',
      data: payment,
    };
  }

  async findByOrder(orderId: number, currentUser: User) {
    const payment = await this.paymentsRepo.findOne({
      where: { order: { id: orderId } },
      relations: ['order', 'order.user'],
    });

    if (!payment) {
      throw new NotFoundException(`Payment for order id ${orderId} not found`);
    }

    if (
      currentUser.role !== UserRole.ADMIN &&
      payment.order.user.id !== currentUser.id
    ) {
      throw new ForbiddenException('You can view only your own payment');
    }

    return {
      message: 'Payment fetched successfully',
      data: payment,
    };
  }

  async updateStatus(id: number, dto: UpdatePaymentStatusDto) {
    const payment = await this.paymentsRepo.findOne({
      where: { id },
      relations: ['order'],
    });

    if (!payment) {
      throw new NotFoundException(`Payment with id ${id} not found`);
    }

    payment.status = dto.status;

    if (dto.transactionRef !== undefined) {
      payment.transactionRef = dto.transactionRef;
    }

    if (dto.status === PaymentStatus.PAID) {
      payment.paidAt = new Date();
      payment.order.paymentStatus = PaymentStatus.PAID;
    }

    if (dto.status === PaymentStatus.FAILED) {
      payment.order.paymentStatus = PaymentStatus.FAILED;
    }

    if (dto.status === PaymentStatus.PENDING) {
      payment.order.paymentStatus = PaymentStatus.PENDING;
    }

    await this.ordersRepo.save(payment.order);
    const updated = await this.paymentsRepo.save(payment);

    return {
      message: 'Payment status updated successfully',
      data: updated,
    };
  }

  async remove(id: number) {
    const payment = await this.paymentsRepo.findOne({
      where: { id },
    });

    if (!payment) {
      throw new NotFoundException(`Payment with id ${id} not found`);
    }

    await this.paymentsRepo.remove(payment);

    return {
      message: 'Payment deleted successfully',
      id,
    };
  }
}
