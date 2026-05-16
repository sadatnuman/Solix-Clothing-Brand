import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { User } from '../users/entities/user.entity';

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  create(@GetUser() user: User, @Body() dto: CreateOrderDto) {
    return this.ordersService.create(dto, user);
  }

  @Get('my-orders')
  getMyOrders(@GetUser() user: User) {
    return this.ordersService.findMyOrders(user);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  findAll(@GetUser() user: User) {
    return this.ordersService.findAll(user);
  }

  @Get(':id')
  findOne(@GetUser() user: User, @Param('id', ParseIntPipe) id: number) {
    return this.ordersService.findOne(id, user);
  }

  @Patch(':id/status')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateOrderDto,
    @GetUser() user: User,
  ) {
    return this.ordersService.updateStatus(id, dto, user);
  }
}
