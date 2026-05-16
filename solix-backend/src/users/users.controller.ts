import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { User } from './entities/user.entity';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { RolesGuard } from '../auth/guards/roles.guard';

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
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  getAllCustomers() {
    return this.usersService.findAllCustomers();
  }
}
