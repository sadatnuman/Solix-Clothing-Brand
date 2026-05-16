import { IsEnum, IsOptional } from 'class-validator';
import { OrderStatus } from '../../common/enums/order-status.enum';

export class UpdateOrderDto {
  @IsOptional()
  @IsEnum(OrderStatus)
  orderStatus?: OrderStatus;
}
