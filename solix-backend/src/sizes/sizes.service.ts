import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Size } from './entities/size.entity';
import { CreateSizeDto } from './dto/create-size.dto';
import { UpdateSizeDto } from './dto/update-size.dto';

@Injectable()
export class SizesService {
  constructor(
    @InjectRepository(Size)
    private readonly sizesRepo: Repository<Size>,
  ) {}

  async create(dto: CreateSizeDto) {
    const existing = await this.sizesRepo.findOne({
      where: { name: dto.name },
    });

    if (existing) {
      throw new BadRequestException('Size already exists');
    }

    const size = this.sizesRepo.create(dto);
    const saved = await this.sizesRepo.save(size);

    return {
      message: 'Size created successfully',
      data: saved,
    };
  }

  async findAll() {
    const sizes = await this.sizesRepo.find({
      order: { createdAt: 'ASC' },
    });

    return {
      message: 'Sizes fetched successfully',
      count: sizes.length,
      data: sizes,
    };
  }

  async findOne(id: number) {
    const size = await this.sizesRepo.findOne({ where: { id } });
    if (!size) {
      throw new NotFoundException(`Size with id ${id} not found`);
    }
    return {
      message: 'Size fetched successfully',
      data: size,
    };
  }

  async update(id: number, dto: UpdateSizeDto) {
    const size = await this.sizesRepo.findOne({ where: { id } });
    if (!size) {
      throw new NotFoundException(`Size with id ${id} not found`);
    }
    Object.assign(size, dto);
    const updated = await this.sizesRepo.save(size);
    return {
      message: 'Size updated successfully',
      data: updated,
    };
  }

  async remove(id: number) {
    const size = await this.sizesRepo.findOne({ where: { id } });
    if (!size) {
      throw new NotFoundException(`Size with id ${id} not found`);
    }
    await this.sizesRepo.remove(size);
    return {
      message: 'Size deleted successfully',
    };
  }
}
