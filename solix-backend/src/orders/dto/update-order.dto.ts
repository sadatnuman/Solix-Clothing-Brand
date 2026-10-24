import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { OrderStatus } from '../../common/enums/order-status.enum';

export class UpdateOrderDto {
  @IsOptional()
  @IsEnum(OrderStatus)
  orderStatus?: OrderStatus;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  note?: string;
}

export class UpdateTrackingDto {
  @IsString() @MaxLength(80) carrier: string;
  @IsString() @MaxLength(120) trackingNumber: string;
  @IsOptional() @IsString() @MaxLength(300) trackingUrl?: string;
}
