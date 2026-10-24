import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { User } from './entities/user.entity';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { ObjectIdPipe } from '../common/object-id.pipe';
import {
  AdminResetPasswordDto,
  AdminUserStatusDto,
} from './dto/admin-user.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  getMyProfile(@GetUser() user: User) {
    return this.usersService.getMyProfile(user.id);
  }

  @Patch('profile')
  @UseGuards(JwtAuthGuard)
  updateMyProfile(@GetUser() user: User, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateMyProfile(user.id, dto);
  }

  @Get('customers')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @Permissions('support')
  getAllCustomers() {
    return this.usersService.findAllCustomers();
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  setStatus(
    @Param('id', ObjectIdPipe) id: string,
    @Body() dto: AdminUserStatusDto,
  ) {
    return this.usersService.setStatus(id, dto.isActive);
  }

  @Patch(':id/reset-password')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  resetPassword(
    @Param('id', ObjectIdPipe) id: string,
    @Body() dto: AdminResetPasswordDto,
  ) {
    return this.usersService.resetPassword(
      id,
      dto.temporaryPassword,
      dto.mustChangePassword ?? true,
    );
  }
}
