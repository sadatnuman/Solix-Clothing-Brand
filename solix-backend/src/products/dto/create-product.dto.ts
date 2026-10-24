import { IsArray, IsBoolean, IsEnum, IsMongoId } from 'class-validator';
import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';

export class CreateProductDto {
  @IsMongoId()
  categoryId!: string;

  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  basePrice!: number;

  @IsOptional()
  @IsString()
  sizeGuide?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  compareAtPrice?: number;
  @IsOptional() @IsString() material?: string;
  @IsOptional() @IsString() fit?: string;
  @IsOptional() @IsString() care?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) tags?: string[];
  @IsOptional() @IsArray() @IsMongoId({ each: true }) collectionIds?: string[];
  @IsOptional() @IsString() seoTitle?: string;
  @IsOptional() @IsString() seoDescription?: string;
  @IsOptional() @IsEnum(['draft', 'active', 'archived']) status?:
    | 'draft'
    | 'active'
    | 'archived';
  @IsOptional() @IsBoolean() featured?: boolean;
}
