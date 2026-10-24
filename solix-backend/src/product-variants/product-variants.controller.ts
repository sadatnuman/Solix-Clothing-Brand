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

import { ProductVariantsService } from './product-variants.service';
import { CreateProductVariantDto } from './dto/create-product-variant.dto';
import { UpdateProductVariantDto } from './dto/update-product-variant.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';

@Controller('product-variants')
export class ProductVariantsController {
  constructor(
    private readonly productVariantsService: ProductVariantsService,
  ) {}

  @Get()
  findAll() {
    return this.productVariantsService.findAll();
  }

  @Get('product/:productId')
  findByProduct(@Param('productId', ObjectIdPipe) productId: string) {
    return this.productVariantsService.findByProduct(productId);
  }

  @Get(':id')
  findOne(@Param('id', ObjectIdPipe) id: string) {
    return this.productVariantsService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @Permissions('catalog')
  create(@Body() dto: CreateProductVariantDto) {
    return this.productVariantsService.create(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @Permissions('catalog')
  update(
    @Param('id', ObjectIdPipe) id: string,
    @Body() dto: UpdateProductVariantDto,
  ) {
    return this.productVariantsService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @Permissions('catalog')
  remove(@Param('id', ObjectIdPipe) id: string) {
    return this.productVariantsService.remove(id);
  }
}
