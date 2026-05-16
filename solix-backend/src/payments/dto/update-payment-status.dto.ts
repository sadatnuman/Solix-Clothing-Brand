import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PaymentStatus } from '../../common/enums/payment-status.enum';

export class UpdatePaymentStatusDto {
  @IsEnum(PaymentStatus)
  status!: PaymentStatus;

  @IsOptional()
  @IsString()
  transactionRef?: string;
}
