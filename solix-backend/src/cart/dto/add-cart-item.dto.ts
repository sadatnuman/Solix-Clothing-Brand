import { IsMongoId } from 'class-validator';
import { Type } from 'class-transformer';
import { IsInt, Min } from 'class-validator';

export class AddCartItemDto {
  @IsMongoId()
  productVariantId!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity!: number;
}
