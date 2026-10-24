import {
  IsBoolean,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { PaymentMethod } from '../../common/enums/payment-method.enum';

export class CreateOrderDto {
  @IsUUID()
  checkoutKey: string;

  @IsString()
  @IsNotEmpty()
  deliveryAddress: string;

  @IsString()
  @IsNotEmpty()
  contactPhone: string;

  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @IsOptional() @IsMongoId() addressId?: string;
  @IsOptional() @IsString() couponCode?: string;
  @IsOptional() @IsString() @MaxLength(500) deliveryNotes?: string;
  @IsBoolean() acceptTerms: boolean;
}
