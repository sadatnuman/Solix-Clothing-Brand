import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './entities/category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categoriesRepo: Repository<Category>,
  ) {}

  async create(dto: CreateCategoryDto) {
    const existing = await this.categoriesRepo.findOne({
      where: { name: dto.name },
    });

    if (existing) {
      throw new BadRequestException('Category name already exists');
    }

    const category = this.categoriesRepo.create(dto);
    const saved = await this.categoriesRepo.save(category);

    return {
      message: 'Category created successfully',
      data: saved,
    };
  }

  async findAll() {
    const categories = await this.categoriesRepo.find({
      order: { createdAt: 'DESC' },
    });

    return {
      message: 'Categories fetched successfully',
      count: categories.length,
      data: categories,
    };
  }

  async findOne(id: number) {
    const category = await this.categoriesRepo.findOne({ where: { id } });

    if (!category) {
      throw new NotFoundException(`Category with id ${id} not found`);
    }

    return {
      message: 'Category fetched successfully',
      data: category,
    };
  }

  async update(id: number, dto: UpdateCategoryDto) {
    const category = await this.categoriesRepo.findOne({ where: { id } });

    if (!category) {
      throw new NotFoundException(`Category with id ${id} not found`);
    }

    if (dto.name) {
      const existing = await this.categoriesRepo.findOne({
        where: { name: dto.name },
      });

      if (existing && existing.id !== id) {
        throw new BadRequestException('Category name already exists');
      }
    }

    Object.assign(category, dto);
    const updated = await this.categoriesRepo.save(category);

    return {
      message: 'Category updated successfully',
      data: updated,
    };
  }

  async remove(id: number) {
    const category = await this.categoriesRepo.findOne({ where: { id } });

    if (!category) {
      throw new NotFoundException(`Category with id ${id} not found`);
    }

    await this.categoriesRepo.remove(category);

    return {
      message: 'Category deleted successfully',
      id,
    };
  }
}
