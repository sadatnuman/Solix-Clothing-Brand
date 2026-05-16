import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { PaymentMethod } from '../../common/enums/payment-method.enum';

export class CreateOrderDto {
  @IsString()
  @IsNotEmpty()
  deliveryAddress: string;

  @IsString()
  @IsNotEmpty()
  contactPhone: string;

  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;
}
