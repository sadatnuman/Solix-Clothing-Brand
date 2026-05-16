import { Type } from 'class-transformer';
import { IsInt, IsNumber, IsOptional, IsPositive, Min } from 'class-validator';

export class CreateProductVariantDto {
  @Type(() => Number)
  @IsInt()
  productId!: number;

  @Type(() => Number)
  @IsInt()
  sizeId!: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  stockQuantity!: number;

  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  @IsPositive()
  variantPrice?: number;
}
