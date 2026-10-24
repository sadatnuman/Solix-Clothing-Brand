import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEmail,
  IsEnum,
  IsInt,
  IsIn,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class AddressDto {
  @IsString() @MaxLength(40) label: string;
  @IsString() @MaxLength(100) recipientName: string;
  @IsString() @MaxLength(30) phone: string;
  @IsString() @MaxLength(180) line1: string;
  @IsOptional() @IsString() @MaxLength(180) line2?: string;
  @IsOptional() @IsString() @MaxLength(80) area?: string;
  @IsString() @MaxLength(80) city: string;
  @IsOptional() @IsString() @MaxLength(20) postalCode?: string;
  @IsOptional() @IsBoolean() isDefault?: boolean;
}

export class CouponValidateDto {
  @IsString() @IsNotEmpty() code: string;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) subtotal?: number;
}

export class CouponDto {
  @IsString() @IsNotEmpty() code: string;
  @IsEnum(['fixed', 'percentage']) type: 'fixed' | 'percentage';
  @Type(() => Number) @IsNumber() @Min(0) value: number;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) minSpend?: number;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) maxDiscount?: number;
  @IsOptional() @IsDateString() startsAt?: string;
  @IsOptional() @IsDateString() endsAt?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) usageLimit?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) perCustomerLimit?: number;
  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  eligibleProducts?: string[];
  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  eligibleCategories?: string[];
  @IsOptional() @IsBoolean() isActive?: boolean;
}

export class ReviewDto {
  @IsMongoId() productId: string;
  @Type(() => Number) @IsInt() @Min(1) @Max(5) rating: number;
  @IsOptional() @IsString() @MaxLength(100) title?: string;
  @IsString() @IsNotEmpty() @MaxLength(1500) body: string;
}

export class ReviewModerationDto {
  @IsEnum(['approved', 'rejected']) status: 'approved' | 'rejected';
}

export class CollectionDto {
  @IsString() @IsNotEmpty() name: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() imageUrl?: string;
  @IsOptional() @Type(() => Number) @IsInt() sortOrder?: number;
  @IsOptional() @IsBoolean() isActive?: boolean;
}

export class ReturnItemDto {
  @IsString() orderItemId: string;
  @Type(() => Number) @IsInt() @Min(1) quantity: number;
  @IsOptional() @IsMongoId() requestedSize?: string;
}

export class ReturnRequestDto {
  @IsMongoId() orderId: string;
  @IsEnum(['return', 'exchange']) type: 'return' | 'exchange';
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReturnItemDto)
  items: ReturnItemDto[];
  @IsString() @IsNotEmpty() @MaxLength(300) reason: string;
  @IsOptional() @IsString() @MaxLength(1000) notes?: string;
}

export class ReturnStatusDto {
  @IsEnum(['approved', 'rejected', 'received', 'completed']) status:
    | 'approved'
    | 'rejected'
    | 'received'
    | 'completed';
  @IsOptional() @IsString() @MaxLength(1000) adminNote?: string;
}

export class SupportTicketDto {
  @IsString() @IsNotEmpty() @MaxLength(100) name: string;
  @IsString() @IsNotEmpty() @MaxLength(30) phone: string;
  @IsOptional() @IsEmail() email?: string;
  @IsString() @IsNotEmpty() @MaxLength(150) subject: string;
  @IsString() @IsNotEmpty() @MaxLength(2000) message: string;
}

export class TicketReplyDto {
  @IsString() @IsNotEmpty() @MaxLength(2000) body: string;
}

export class TicketStatusDto {
  @IsEnum(['open', 'in_progress', 'resolved', 'closed']) status:
    | 'open'
    | 'in_progress'
    | 'resolved'
    | 'closed';
}

export class ContentDto {
  @IsOptional() @IsString() title?: string;
  @IsOptional() @IsString() body?: string;
  @IsOptional() metadata?: Record<string, unknown>;
  @IsOptional() @IsBoolean() isPublished?: boolean;
}

export class SettingsDto {
  @IsOptional() @IsString() @MaxLength(180) brandTagline?: string;
  @IsOptional() @IsString() @MaxLength(250) address?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() whatsapp?: string;
  @IsOptional() @IsString() @MaxLength(1000) mapUrl?: string;
  @IsOptional() @IsString() @MaxLength(40) mapPlusCode?: string;
  @IsOptional() @Type(() => Number) @IsNumber() latitude?: number;
  @IsOptional() @Type(() => Number) @IsNumber() longitude?: number;
  @IsOptional() socialLinks?: Record<string, string>;
  @IsOptional() @IsBoolean() freeShipping?: boolean;
  @IsOptional() @IsArray() shippingZones?: Array<{
    name: string;
    cities: string[];
    amount: number;
  }>;
}

export class StockAdjustmentDto {
  @Type(() => Number) @IsInt() quantity: number;
  @IsOptional() @IsString() @MaxLength(300) note?: string;
}

export class StaffDto {
  @IsString() @IsNotEmpty() fullName: string;
  @IsEmail() email: string;
  @IsString() @MinLength(8) password: string;
  @IsOptional()
  @IsArray()
  @IsIn(['catalog', 'fulfilment', 'support'], { each: true })
  permissions?: string[];
}

export class StaffUpdateDto {
  @IsArray()
  @IsIn(['catalog', 'fulfilment', 'support'], { each: true })
  permissions: string[];
  @IsBoolean() isActive: boolean;
}
