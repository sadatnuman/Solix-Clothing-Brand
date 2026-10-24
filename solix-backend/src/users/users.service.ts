import { UserRecord } from '../database/types';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from './entities/user.entity';
import { UpdateProfileDto } from './dto/update-profile.dto';
import * as bcrypt from 'bcrypt';
@Injectable()
export class UsersService {
  constructor(@InjectModel('User') private readonly users: Model<UserRecord>) {}
  async create(
    data: Partial<User>,
  ): Promise<import('mongoose').HydratedDocument<UserRecord>> {
    return this.users.create(data);
  }
  async findByEmail(
    email: string,
  ): Promise<import('mongoose').HydratedDocument<UserRecord> | null> {
    return this.users
      .findOne({ email: email.trim().toLowerCase() })
      .select('+passwordHash');
  }
  async findById(
    id: string,
  ): Promise<import('mongoose').HydratedDocument<UserRecord>> {
    const user = await this.users.findById(id);
    if (!user) throw new NotFoundException('User not found');
    return user;
  }
  async getMyProfile(id: string) {
    return { data: await this.findById(id) };
  }
  async updateMyProfile(id: string, dto: UpdateProfileDto) {
    return {
      data: await this.users.findByIdAndUpdate(
        id,
        { $set: dto },
        { new: true, runValidators: true },
      ),
    };
  }
  async findAllCustomers() {
    const data = await this.users
      .find({ role: 'customer' })
      .sort({ createdAt: -1 });
    return { data, count: data.length };
  }
  async setStatus(id: string, isActive: boolean) {
    const data = await this.users.findByIdAndUpdate(
      id,
      { $set: { isActive } },
      { new: true },
    );
    if (!data) throw new NotFoundException('User not found');
    return { data };
  }
  async resetPassword(
    id: string,
    temporaryPassword: string,
    mustChangePassword = true,
  ) {
    const data = await this.users.findByIdAndUpdate(
      id,
      {
        $set: {
          passwordHash: await bcrypt.hash(temporaryPassword, 12),
          mustChangePassword,
        },
      },
      { new: true },
    );
    if (!data) throw new NotFoundException('User not found');
    return {
      message: 'Temporary password set',
      data: {
        id: String(data._id),
        mustChangePassword: Boolean(data.mustChangePassword),
      },
    };
  }
}
