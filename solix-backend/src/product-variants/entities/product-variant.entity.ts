import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Product } from '../../products/entities/product.entity';
import { Size } from '../../sizes/entities/size.entity';

@Entity('product_variants')
export class ProductVariant {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Product, (product) => product.variants, {
    eager: true,
    onDelete: 'CASCADE',
  })
  product!: Product;

  @ManyToOne(() => Size, { eager: true, onDelete: 'RESTRICT' })
  size!: Size;

  @Column({ default: 0 })
  stockQuantity!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  variantPrice!: number | null;
}
