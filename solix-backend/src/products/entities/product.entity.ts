import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Category } from '../../categories/entities/category.entity';
import { ProductImage } from './product-image.entity';
import { ProductVariant } from '../../product-variants/entities/product-variant.entity';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Category, { eager: true, onDelete: 'RESTRICT' })
  category!: Category;

  @Column()
  name!: string;

  @Column({ unique: true })
  slug!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  basePrice!: number;

  @Column({ type: 'text', nullable: true })
  sizeGuide!: string | null;

  @Column({ default: true })
  isActive!: boolean;

  @OneToMany(() => ProductImage, (image) => image.product, { cascade: true })
  images!: ProductImage[];

  @OneToMany(() => ProductVariant, (variant) => variant.product)
  variants!: ProductVariant[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
