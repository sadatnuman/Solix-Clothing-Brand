import { ObjectIdPipe } from '../common/object-id.pipe';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { SizesService } from './sizes.service';
import { CreateSizeDto } from './dto/create-size.dto';
import { UpdateSizeDto } from './dto/update-size.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';

@Controller('sizes')
export class SizesController {
  constructor(private readonly sizesService: SizesService) {}

  @Get()
  findAll() {
    return this.sizesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ObjectIdPipe) id: string) {
    return this.sizesService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @Permissions('catalog')
  create(@Body() dto: CreateSizeDto) {
    return this.sizesService.create(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @Permissions('catalog')
  update(@Param('id', ObjectIdPipe) id: string, @Body() dto: UpdateSizeDto) {
    return this.sizesService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @Permissions('catalog')
  remove(@Param('id', ObjectIdPipe) id: string) {
    return this.sizesService.remove(id);
  }
}
