import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Product } from './entities/product.entity';
import { ProductImage } from './entities/product-image.entity';
import { Category } from '../categories/entities/category.entity';

import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productsRepo: Repository<Product>,
    @InjectRepository(ProductImage)
    private readonly productImagesRepo: Repository<ProductImage>,
    @InjectRepository(Category)
    private readonly categoriesRepo: Repository<Category>,
  ) {}

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]/g, '');
  }

  async create(dto: CreateProductDto) {
    const category = await this.categoriesRepo.findOne({
      where: { id: dto.categoryId },
    });

    if (!category) {
      throw new NotFoundException(
        `Category with id ${dto.categoryId} not found`,
      );
    }

    const slug = this.generateSlug(dto.name);

    const existingSlug = await this.productsRepo.findOne({
      where: { slug },
    });

    if (existingSlug) {
      throw new BadRequestException('A product with this slug already exists');
    }

    const product = this.productsRepo.create({
      category,
      name: dto.name,
      slug,
      description: dto.description ?? null,
      basePrice: dto.basePrice,
      sizeGuide: dto.sizeGuide ?? null,
    });

    const saved = await this.productsRepo.save(product);

    return {
      message: 'Product created successfully',
      data: saved,
    };
  }

  async findAll() {
    const products = await this.productsRepo.find({
      relations: ['images', 'variants', 'variants.size'],
      order: { createdAt: 'DESC' },
    });

    return {
      message: 'Products fetched successfully',
      count: products.length,
      data: products,
    };
  }

  async findOne(id: number) {
    const product = await this.productsRepo.findOne({
      where: { id },
      relations: ['images', 'variants', 'variants.size'],
    });

    if (!product) {
      throw new NotFoundException(`Product with id ${id} not found`);
    }

    return {
      message: 'Product fetched successfully',
      data: product,
    };
  }

  async update(id: number, dto: UpdateProductDto) {
    const product = await this.productsRepo.findOne({
      where: { id },
    });

    if (!product) {
      throw new NotFoundException(`Product with id ${id} not found`);
    }

    if (dto.categoryId !== undefined) {
      const category = await this.categoriesRepo.findOne({
        where: { id: dto.categoryId },
      });

      if (!category) {
        throw new NotFoundException(
          `Category with id ${dto.categoryId} not found`,
        );
      }

      product.category = category;
    }

    if (dto.name !== undefined) {
      const slug = this.generateSlug(dto.name);

      const existingSlug = await this.productsRepo.findOne({
        where: { slug },
      });

      if (existingSlug && existingSlug.id !== id) {
        throw new BadRequestException(
          'A product with this slug already exists',
        );
      }

      product.name = dto.name;
      product.slug = slug;
    }

    if (dto.description !== undefined) {
      product.description = dto.description;
    }

    if (dto.basePrice !== undefined) {
      product.basePrice = dto.basePrice;
    }

    if (dto.sizeGuide !== undefined) {
      product.sizeGuide = dto.sizeGuide;
    }

    const updated = await this.productsRepo.save(product);

    return {
      message: 'Product updated successfully',
      data: updated,
    };
  }

  async remove(id: number) {
    const product = await this.productsRepo.findOne({
      where: { id },
    });

    if (!product) {
      throw new NotFoundException(`Product with id ${id} not found`);
    }

    await this.productsRepo.remove(product);

    return {
      message: 'Product deleted successfully',
      id,
    };
  }

  async uploadImage(productId: number, file: Express.Multer.File) {
    const product = await this.productsRepo.findOne({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException(`Product with id ${productId} not found`);
    }

    const image = this.productImagesRepo.create({
      product,
      imageUrl: `uploads/${file.filename}`,
      isPrimary: false,
    });

    const saved = await this.productImagesRepo.save(image);

    return {
      message: 'Product image uploaded successfully',
      data: saved,
    };
  }
}
