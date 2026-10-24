import { ObjectIdPipe } from '../common/object-id.pipe';
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { randomUUID } from 'crypto';
import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';

import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentStatusDto } from './dto/update-payment-status.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { User } from '../users/entities/user.entity';

@Controller('payments')
@UseGuards(JwtAuthGuard)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  create(@Body() dto: CreatePaymentDto, @GetUser() user: User) {
    return this.paymentsService.create(dto, user);
  }

  @Get()
  @UseGuards(RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @Permissions('fulfilment')
  findAll() {
    return this.paymentsService.findAll();
  }

  @Get('order/:orderId')
  findByOrder(
    @Param('orderId', ObjectIdPipe) orderId: string,
    @GetUser() user: User,
  ) {
    return this.paymentsService.findByOrder(orderId, user);
  }

  @Get(':id')
  findOne(@Param('id', ObjectIdPipe) id: string, @GetUser() user: User) {
    return this.paymentsService.findOne(id, user);
  }

  @Patch(':id/status')
  @UseGuards(RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @Permissions('fulfilment')
  updateStatus(
    @Param('id', ObjectIdPipe) id: string,
    @Body() dto: UpdatePaymentStatusDto,
    @GetUser() user: User,
  ) {
    return this.paymentsService.updateStatus(id, dto, user);
  }

  @Post(':id/proof')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 3 * 1024 * 1024 },
    }),
  )
  async uploadProof(
    @Param('id', ObjectIdPipe) id: string,
    @UploadedFile() file: Express.Multer.File,
    @GetUser() user: User,
  ) {
    if (!file) throw new BadRequestException('Choose a payment proof image');
    const bytes = file.buffer;
    const jpeg =
      bytes.length > 3 &&
      bytes[0] === 255 &&
      bytes[1] === 216 &&
      bytes[2] === 255;
    const png =
      bytes.length > 8 &&
      bytes
        .subarray(0, 8)
        .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
    const webp =
      bytes.length > 12 &&
      bytes.toString('ascii', 0, 4) === 'RIFF' &&
      bytes.toString('ascii', 8, 12) === 'WEBP';
    const extension = jpeg ? 'jpg' : png ? 'png' : webp ? 'webp' : '';
    if (!extension)
      throw new BadRequestException(
        'Only JPEG, PNG and WebP images are supported',
      );
    const filename = `${randomUUID()}.${extension}`;
    await mkdir(join(process.cwd(), 'uploads', 'payments'), {
      recursive: true,
    });
    await writeFile(
      join(process.cwd(), 'uploads', 'payments', filename),
      bytes,
    );
    return this.paymentsService.attachProof(
      id,
      `uploads/payments/${filename}`,
      user,
    );
  }

  @Delete(':id')
  @UseGuards(RolesGuard, PermissionsGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @Permissions('fulfilment')
  remove(@Param('id', ObjectIdPipe) id: string) {
    return this.paymentsService.remove(id);
  }
}
