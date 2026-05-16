import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Order } from '../../orders/entities/order.entity';
import { PaymentMethod } from '../../common/enums/payment-method.enum';
import { PaymentStatus } from '../../common/enums/payment-status.enum';

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn()
  id!: number;

  @OneToOne(() => Order, (order) => order.payment, {
    onDelete: 'CASCADE',
    eager: true,
  })
  @JoinColumn()
  order!: Order;

  @Column({
    type: 'enum',
    enum: PaymentMethod,
  })
  method!: PaymentMethod;

  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
  })
  status!: PaymentStatus;

  @Column({ type: 'varchar', nullable: true })
  transactionRef!: string | null;

  @Column({ type: 'timestamp', nullable: true })
  paidAt!: Date | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
