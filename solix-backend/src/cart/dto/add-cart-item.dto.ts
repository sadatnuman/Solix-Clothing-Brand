import { Type } from 'class-transformer';
import { IsInt, Min } from 'class-validator';

export class AddCartItemDto {
  @Type(() => Number)
  @IsInt()
  productVariantId!: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity!: number;
}
