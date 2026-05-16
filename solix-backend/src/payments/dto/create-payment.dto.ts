import { IsEnum, IsInt, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { PaymentMethod } from '../../common/enums/payment-method.enum';

export class CreatePaymentDto {
  @Type(() => Number)
  @IsInt()
  orderId!: number;

  @IsEnum(PaymentMethod)
  method!: PaymentMethod;

  @IsOptional()
  @IsString()
  transactionRef?: string;
}
