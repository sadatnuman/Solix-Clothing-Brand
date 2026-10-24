import { UpdateSizeDto } from './dto/update-size.dto';
import { CreateSizeDto } from './dto/create-size.dto';
import { SizeRecord, VariantRecord } from '../database/types';
import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
@Injectable()
export class SizesService {
  constructor(
    @InjectModel('Size') private readonly records: Model<SizeRecord>,
    @InjectModel('ProductVariant')
    private readonly references: Model<VariantRecord>,
  ) {}
  async create(dto: CreateSizeDto) {
    return { data: await this.records.create(dto) };
  }
  async findAll() {
    const data = await this.records.find().sort({ createdAt: 1 });
    return { data, count: data.length };
  }
  async findOne(id: string) {
    const data = await this.records.findById(id);
    if (!data) throw new NotFoundException('Size not found');
    return { data };
  }
  async update(id: string, dto: UpdateSizeDto) {
    await this.findOne(id);
    return {
      data: await this.records.findByIdAndUpdate(
        id,
        { $set: dto },
        { new: true, runValidators: true },
      ),
    };
  }
  async remove(id: string) {
    await this.findOne(id);
    if (await this.references.exists({ size: id }))
      throw new BadRequestException('This size is in use');
    await this.records.findByIdAndDelete(id);
    return { message: 'Size deleted', id };
  }
}
