import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { UserRole } from '../common/enums/user-role.enum';
import { SessionRecord, UserRecord } from '../database/types';

type ClientMeta = { ip?: string; userAgent?: string };

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    @InjectModel('Session') private readonly sessions: Model<SessionRecord>,
    @InjectModel('User') private readonly users: Model<UserRecord>,
  ) {}

  async register(dto: RegisterDto) {
    if (await this.usersService.findByEmail(dto.email))
      throw new BadRequestException('Email already exists');
    const user = await this.usersService.create({
      fullName: dto.fullName,
      email: dto.email.trim().toLowerCase(),
      phone: dto.phone,
      address: dto.address,
      passwordHash: await bcrypt.hash(dto.password, 12),
      role: UserRole.CUSTOMER,
      permissions: [],
      mustChangePassword: false,
      isActive: true,
    });
    return {
      message: 'User registered successfully',
      data: this.publicUser(user),
    };
  }

  async login(dto: LoginDto, meta: ClientMeta) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user || !(await bcrypt.compare(dto.password, user.passwordHash)))
      throw new UnauthorizedException('Invalid email or password');
    if (!user.isActive)
      throw new UnauthorizedException('User account is inactive');
    const tokens = await this.issue(user, meta);
    return { message: 'Login successful', user: this.publicUser(user), tokens };
  }

  async refresh(refreshToken: string | undefined, meta: ClientMeta) {
    if (!refreshToken) throw new UnauthorizedException('Session expired');
    let payload: { sub: string; sid: string; type: string };
    try {
      payload = await this.jwtService.verifyAsync(refreshToken);
    } catch {
      throw new UnauthorizedException('Session expired');
    }
    if (payload.type !== 'refresh')
      throw new UnauthorizedException('Invalid session');
    const session = await this.sessions
      .findOne({
        _id: payload.sid,
        user: payload.sub,
        revokedAt: null,
        expiresAt: { $gt: new Date() },
      })
      .select('+refreshTokenHash');
    if (
      !session ||
      !(await bcrypt.compare(refreshToken, session.refreshTokenHash))
    )
      throw new UnauthorizedException('Session expired');
    const user = await this.users.findById(payload.sub);
    if (!user?.isActive) throw new UnauthorizedException('Account unavailable');
    const tokens = await this.rotate(user, session, meta);
    return { user: this.publicUser(user), tokens };
  }

  async logout(refreshToken?: string) {
    if (refreshToken) {
      try {
        const payload = await this.jwtService.verifyAsync<{
          sid: string;
          type: string;
        }>(refreshToken);
        if (payload.type === 'refresh')
          await this.sessions.updateOne(
            { _id: payload.sid },
            { $set: { revokedAt: new Date() } },
          );
      } catch {
        /* Expired cookies are cleared by the controller. */
      }
    }
    return { message: 'Signed out' };
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.users.findById(userId).select('+passwordHash');
    if (
      !user ||
      !(await bcrypt.compare(dto.currentPassword, user.passwordHash))
    )
      throw new BadRequestException('Current password is incorrect');
    user.passwordHash = await bcrypt.hash(dto.newPassword, 12);
    user.mustChangePassword = false;
    await user.save();
    await this.sessions.updateMany(
      { user: userId, revokedAt: null },
      { $set: { revokedAt: new Date() } },
    );
    return { message: 'Password changed. Sign in again on your devices.' };
  }

  async me(userId: string) {
    return this.usersService.getMyProfile(userId);
  }

  private async issue(user: UserRecord, meta: ClientMeta) {
    const session = await this.sessions.create({
      user: user._id,
      refreshTokenHash: 'pending',
      expiresAt: new Date(Date.now() + 30 * 86400000),
      ...meta,
    });
    return this.rotate(user, session, meta);
  }
  private async rotate(
    user: UserRecord,
    session: SessionRecord & { save: () => Promise<unknown> },
    meta: ClientMeta,
  ) {
    const base = {
      sub: String(user._id),
      email: user.email,
      role: user.role,
      sid: String(session._id),
    };
    const accessToken = await this.jwtService.signAsync(
      { ...base, type: 'access' },
      { expiresIn: '15m' },
    );
    const refreshToken = await this.jwtService.signAsync(
      { ...base, type: 'refresh' },
      { expiresIn: '30d' },
    );
    session.refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    session.expiresAt = new Date(Date.now() + 30 * 86400000);
    session.userAgent = meta.userAgent;
    session.ip = meta.ip;
    await session.save();
    return { accessToken, refreshToken };
  }
  private publicUser(
    user: Pick<
      UserRecord,
      | '_id'
      | 'fullName'
      | 'email'
      | 'phone'
      | 'address'
      | 'role'
      | 'permissions'
      | 'mustChangePassword'
    >,
  ) {
    return {
      id: String(user._id),
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      address: user.address,
      role: user.role,
      permissions: user.permissions || [],
      mustChangePassword: Boolean(user.mustChangePassword),
    };
  }
}
