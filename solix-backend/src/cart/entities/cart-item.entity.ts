import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Cart } from './cart.entity';
import { ProductVariant } from '../../product-variants/entities/product-variant.entity';

@Entity('cart_items')
export class CartItem {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Cart, (cart) => cart.items, {
    onDelete: 'CASCADE',
  })
  cart!: Cart;

  @ManyToOne(() => ProductVariant, { eager: true, onDelete: 'RESTRICT' })
  productVariant!: ProductVariant;

  @Column()
  quantity!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  unitPrice!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  subtotal!: number;
}
