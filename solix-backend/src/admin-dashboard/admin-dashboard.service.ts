import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Order } from '../orders/entities/order.entity';
import { OrderItem } from '../orders/entities/order-item.entity';
import { OrderStatus } from '../common/enums/order-status.enum';

@Injectable()
export class AdminDashboardService {
  constructor(
    @InjectRepository(Order)
    private readonly ordersRepo: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemsRepo: Repository<OrderItem>,
  ) {}

  async getRevenueSummary() {
    const deliveredOrders = await this.ordersRepo.find({
      where: { orderStatus: OrderStatus.DELIVERED },
      order: { createdAt: 'DESC' },
    });

    const totalRevenue = deliveredOrders.reduce((sum, order) => {
      return sum + Number(order.totalAmount);
    }, 0);

    const totalDeliveredOrders = deliveredOrders.length;

    const pendingOrders = await this.ordersRepo.count({
      where: { orderStatus: OrderStatus.PENDING },
    });

    const confirmedOrders = await this.ordersRepo.count({
      where: { orderStatus: OrderStatus.CONFIRMED },
    });

    const cancelledOrders = await this.ordersRepo.count({
      where: { orderStatus: OrderStatus.CANCELLED },
    });

    return {
      message: 'Revenue summary fetched successfully',
      data: {
        totalRevenue,
        totalDeliveredOrders,
        pendingOrders,
        confirmedOrders,
        cancelledOrders,
      },
    };
  }

  async getSoldProductsSummary() {
    const deliveredOrderItems = await this.orderItemsRepo.find({
      relations: ['order'],
      where: { order: { orderStatus: OrderStatus.DELIVERED } },
      order: {
        id: 'DESC',
      },
    });

    const productMap = new Map<
      string,
      {
        productName: string;
        totalQuantitySold: number;
        totalRevenue: number;
      }
    >();

    for (const item of deliveredOrderItems) {
      const key = `${item.productName}__${item.sizeName}`;

      if (!productMap.has(key)) {
        productMap.set(key, {
          productName: `${item.productName} (${item.sizeName})`,
          totalQuantitySold: 0,
          totalRevenue: 0,
        });
      }

      const current = productMap.get(key)!;
      current.totalQuantitySold += Number(item.quantity);
      current.totalRevenue += Number(item.subtotal);
    }

    const soldProducts = Array.from(productMap.values()).sort(
      (a, b) => b.totalQuantitySold - a.totalQuantitySold,
    );

    return {
      message: 'Sold products summary fetched successfully',
      count: soldProducts.length,
      data: soldProducts,
    };
  }
}
