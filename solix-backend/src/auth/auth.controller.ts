import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { GetUser } from './decorators/get-user.decorator';
import { User } from '../users/entities/user.entity';

const cookieBase = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
};

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register') register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(dto, {
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });
    this.setCookies(res, result.tokens);
    return { message: result.message, user: result.user };
  }

  @Post('refresh')
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.refresh(
      req.cookies?.solix_refresh_token as string | undefined,
      { ip: req.ip, userAgent: req.get('user-agent') },
    );
    this.setCookies(res, result.tokens);
    return { data: result.user };
  }

  @Post('logout')
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.logout(
      req.cookies?.solix_refresh_token as string | undefined,
    );
    res.clearCookie('solix_access_token', { ...cookieBase, path: '/' });
    res.clearCookie('solix_refresh_token', { ...cookieBase, path: '/auth' });
    return result;
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@GetUser() user: User) {
    return this.authService.me(user.id);
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  async changePassword(
    @GetUser() user: User,
    @Body() dto: ChangePasswordDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.changePassword(user.id, dto);
    res.clearCookie('solix_access_token', { ...cookieBase, path: '/' });
    res.clearCookie('solix_refresh_token', { ...cookieBase, path: '/auth' });
    return result;
  }

  private setCookies(
    res: Response,
    tokens: { accessToken: string; refreshToken: string },
  ) {
    res.cookie('solix_access_token', tokens.accessToken, {
      ...cookieBase,
      path: '/',
      maxAge: 15 * 60 * 1000,
    });
    res.cookie('solix_refresh_token', tokens.refreshToken, {
      ...cookieBase,
      path: '/auth',
      maxAge: 30 * 86400000,
    });
  }
}
