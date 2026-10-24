import { IsMongoId } from 'class-validator';
import { Type } from 'class-transformer';
import {
  IsHexColor,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Min,
} from 'class-validator';

export class CreateProductVariantDto {
  @IsMongoId()
  productId!: string;

  @IsMongoId()
  sizeId!: string;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  stockQuantity!: number;

  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  @IsPositive()
  variantPrice?: number | null;

  @IsOptional() @IsString() sku?: string;
  @IsOptional() @IsString() colourName?: string;
  @IsOptional() @IsHexColor() colourHex?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) lowStockThreshold?: number;
}
