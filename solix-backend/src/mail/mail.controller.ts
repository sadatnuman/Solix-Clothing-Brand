import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { MailService } from './mail.service';
import { SendMailDto } from './dto/send-mail.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';

@Controller('mail')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class MailController {
  constructor(private readonly mailService: MailService) {}

  @Post('send')
  sendMail(@Body() dto: SendMailDto) {
    return this.mailService.sendMail(dto);
  }
}
