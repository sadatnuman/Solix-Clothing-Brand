import { UpdateCategoryDto } from './dto/update-category.dto';
import { CreateCategoryDto } from './dto/create-category.dto';
import { CategoryRecord, ProductRecord } from '../database/types';
import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
@Injectable()
export class CategoriesService {
  constructor(
    @InjectModel('Category') private readonly records: Model<CategoryRecord>,
    @InjectModel('Product') private readonly references: Model<ProductRecord>,
  ) {}
  async create(dto: CreateCategoryDto) {
    return { data: await this.records.create(dto) };
  }
  async findAll() {
    const data = await this.records.find().sort({ createdAt: 1 });
    return { data, count: data.length };
  }
  async findOne(id: string) {
    const data = await this.records.findById(id);
    if (!data) throw new NotFoundException('Category not found');
    return { data };
  }
  async update(id: string, dto: UpdateCategoryDto) {
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
    if (await this.references.exists({ category: id }))
      throw new BadRequestException('This category is in use');
    await this.records.findByIdAndDelete(id);
    return { message: 'Category deleted', id };
  }
}
