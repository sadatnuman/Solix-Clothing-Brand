import { OrderRecord } from '../database/types';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
@Injectable()
export class AdminDashboardService {
  constructor(
    @InjectModel('Order') private readonly orders: Model<OrderRecord>,
  ) {}
  async getRevenueSummary() {
    const groups = await this.orders.aggregate<{
      _id: string;
      count: number;
      total: number;
    }>([
      {
        $group: {
          _id: '$orderStatus',
          count: { $sum: 1 },
          total: { $sum: '$totalAmount' },
        },
      },
    ]);
    const count = (s: string) => groups.find((g) => g._id === s)?.count || 0;
    return {
      data: {
        totalRevenue: groups.find((g) => g._id === 'delivered')?.total || 0,
        totalDeliveredOrders: count('delivered'),
        pendingOrders: count('pending'),
        confirmedOrders: count('confirmed'),
        cancelledOrders: count('cancelled'),
      },
    };
  }
  async getSoldProductsSummary() {
    const data = await this.orders.aggregate<{
      productName: string;
      totalQuantitySold: number;
      totalRevenue: number;
    }>([
      { $match: { orderStatus: 'delivered' } },
      { $unwind: '$items' },
      {
        $group: {
          _id: {
            product: '$items.product',
            name: '$items.productName',
            size: '$items.sizeName',
          },
          totalQuantitySold: { $sum: '$items.quantity' },
          totalRevenue: { $sum: '$items.subtotal' },
        },
      },
      {
        $project: {
          _id: 0,
          productName: { $concat: ['$_id.name', ' (', '$_id.size', ')'] },
          totalQuantitySold: 1,
          totalRevenue: 1,
        },
      },
      { $sort: { totalQuantitySold: -1 } },
    ]);
    return { data, count: data.length };
  }
}
