import { IsMongoId } from 'class-validator';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PaymentMethod } from '../../common/enums/payment-method.enum';

export class CreatePaymentDto {
  @IsMongoId()
  orderId!: string;

  @IsEnum(PaymentMethod)
  method!: PaymentMethod;

  @IsOptional()
  @IsString()
  transactionRef?: string;

  @IsOptional()
  @IsString()
  senderLastFour?: string;
}
