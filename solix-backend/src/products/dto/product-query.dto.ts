import { Type } from 'class-transformer';
import {
  IsBooleanString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class ProductQueryDto {
  @IsOptional() @IsString() search?: string;
  @IsOptional() @IsString() category?: string;
  @IsOptional() @IsString() collection?: string;
  @IsOptional() @IsString() colour?: string;
  @IsOptional() @IsString() size?: string;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) minPrice?: number;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) maxPrice?: number;
  @IsOptional() @IsBooleanString() inStock?: string;
  @IsOptional() @IsBooleanString() discounted?: string;
  @IsOptional() @IsBooleanString() featured?: string;
  @IsOptional()
  @IsEnum(['newest', 'price-low', 'price-high', 'name', 'popular'])
  sort?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page = 1;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(48) limit = 12;
}
