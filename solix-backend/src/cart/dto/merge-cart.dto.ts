import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsMongoId,
  Min,
  ValidateNested,
} from 'class-validator';

class MergeCartItemDto {
  @IsMongoId() productVariantId: string;
  @Type(() => Number) @IsInt() @Min(1) quantity: number;
}
export class MergeCartDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MergeCartItemDto)
  items: MergeCartItemDto[];
}
