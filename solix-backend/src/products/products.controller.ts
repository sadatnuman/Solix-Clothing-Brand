import { ObjectIdPipe } from '../common/object-id.pipe';
import {
  Body,
  BadRequestException,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { randomUUID } from 'crypto';
import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';

import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { UserRole } from '../common/enums/user-role.enum';
import { ProductQueryDto } from './dto/product-query.dto';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  findAll(@Query() query: ProductQueryDto) {
    return this.productsService.findAll(query);
  }

  @Get('suggestions/search')
  suggestions(@Query('q') query = '') {
    return this.productsService.suggestions(query);
  }

  @Get('filter-options')
  filterOptions() {
    return this.productsService.filterOptions();
  }

  @Get('slug/:slug')
  findBySlug(@Param('slug') slug: string) {
    return this.productsService.findBySlug(slug);
  }

  @Get(':id/related')
  related(@Param('id', ObjectIdPipe) id: string) {
    return this.productsService.related(id);
  }

  @Get(':id')
  findOne(@Param('id', ObjectIdPipe) id: string) {
    return this.productsService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @Permissions('catalog')
  create(@Body() dto: CreateProductDto) {
    return this.productsService.create(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @Permissions('catalog')
  update(@Param('id', ObjectIdPipe) id: string, @Body() dto: UpdateProductDto) {
    return this.productsService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @Permissions('catalog')
  remove(@Param('id', ObjectIdPipe) id: string) {
    return this.productsService.remove(id);
  }

  @Post(':id/images')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @Permissions('catalog')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: {
        fileSize: 2 * 1024 * 1024,
      },
    }),
  )
  async uploadImage(
    @Param('id', ObjectIdPipe) id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('Choose an image');
    const b = file.buffer;
    let ext = '';
    if (b.length > 3 && b[0] === 255 && b[1] === 216 && b[2] === 255)
      ext = 'jpg';
    if (
      b.length > 8 &&
      b.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
    )
      ext = 'png';
    if (
      b.length > 12 &&
      b.toString('ascii', 0, 4) === 'RIFF' &&
      b.toString('ascii', 8, 12) === 'WEBP'
    )
      ext = 'webp';
    if (!ext)
      throw new BadRequestException(
        'Only JPEG, PNG and WebP images are supported',
      );
    await this.productsService.findOne(id);
    file.filename = `${randomUUID()}.${ext}`;
    await mkdir(join(process.cwd(), 'uploads'), { recursive: true });
    await writeFile(join(process.cwd(), 'uploads', file.filename), b);
    return this.productsService.uploadImage(id, file);
  }
}
