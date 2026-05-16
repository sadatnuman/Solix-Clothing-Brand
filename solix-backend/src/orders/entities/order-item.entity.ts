import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Order } from './order.entity';
import { Product } from '../../products/entities/product.entity';

@Entity('order_items')
export class OrderItem {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Order, (order) => order.items, {
    onDelete: 'CASCADE',
  })
  order!: Order;

  @ManyToOne(() => Product, { eager: true, onDelete: 'RESTRICT' })
  product!: Product;

  @Column()
  productName!: string;

  @Column()
  sizeName!: string;

  @Column()
  quantity!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  unitPrice!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  subtotal!: number;
}
