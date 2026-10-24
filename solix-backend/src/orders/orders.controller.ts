import { ObjectIdPipe } from '../common/object-id.pipe';
import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto, UpdateTrackingDto } from './dto/update-order.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
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
  @UseGuards(RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @Permissions('fulfilment')
  findAll(@GetUser() user: User) {
    return this.ordersService.findAll(user);
  }

  @Get(':id')
  findOne(@GetUser() user: User, @Param('id', ObjectIdPipe) id: string) {
    return this.ordersService.findOne(id, user);
  }

  @Patch(':id/status')
  @UseGuards(RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @Permissions('fulfilment')
  updateStatus(
    @Param('id', ObjectIdPipe) id: string,
    @Body() dto: UpdateOrderDto,
    @GetUser() user: User,
  ) {
    return this.ordersService.updateStatus(id, dto, user);
  }

  @Post(':id/cancel')
  cancel(@Param('id', ObjectIdPipe) id: string, @GetUser() user: User) {
    return this.ordersService.cancel(id, user);
  }

  @Patch(':id/tracking')
  @UseGuards(RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @Permissions('fulfilment')
  updateTracking(
    @Param('id', ObjectIdPipe) id: string,
    @Body() dto: UpdateTrackingDto,
    @GetUser() user: User,
  ) {
    return this.ordersService.updateTracking(id, dto, user);
  }
}
