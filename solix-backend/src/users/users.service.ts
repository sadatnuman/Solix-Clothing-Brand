import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UserRole } from '../common/enums/user-role.enum';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
  ) {}

  async create(userData: Partial<User>): Promise<User> {
    const user = this.usersRepo.create(userData);
    return this.usersRepo.save(user);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepo.findOne({ where: { email } });
  }

  async findById(id: number): Promise<User> {
    const user = await this.usersRepo.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }
    return user;
  }

  async getMyProfile(userId: number) {
    const user = await this.findById(userId);

    return {
      message: 'Profile fetched successfully',
      data: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        address: user.address,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    };
  }

  async updateMyProfile(userId: number, dto: UpdateProfileDto) {
    const user = await this.findById(userId);

    Object.assign(user, dto);
    const updatedUser = await this.usersRepo.save(user);

    return {
      message: 'Profile updated successfully',
      data: {
        id: updatedUser.id,
        fullName: updatedUser.fullName,
        email: updatedUser.email,
        phone: updatedUser.phone,
        address: updatedUser.address,
        role: updatedUser.role,
        isActive: updatedUser.isActive,
        updatedAt: updatedUser.updatedAt,
      },
    };
  }

  async findAllCustomers() {
    const customers = await this.usersRepo.find({
      where: { role: UserRole.CUSTOMER },
      order: { createdAt: 'DESC' },
    });

    return {
      message: 'Customers fetched successfully',
      count: customers.length,
      data: customers.map((user) => ({
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        address: user.address,
        role: user.role,
        isActive: user.isActive,
      })),
    };
  }
}
