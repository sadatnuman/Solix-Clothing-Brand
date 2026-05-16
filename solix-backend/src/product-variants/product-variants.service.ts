import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { ProductVariant } from './entities/product-variant.entity';
import { Product } from '../products/entities/product.entity';
import { Size } from '../sizes/entities/size.entity';

import { CreateProductVariantDto } from './dto/create-product-variant.dto';
import { UpdateProductVariantDto } from './dto/update-product-variant.dto';

@Injectable()
export class ProductVariantsService {
  constructor(
    @InjectRepository(ProductVariant)
    private readonly variantsRepo: Repository<ProductVariant>,
    @InjectRepository(Product)
    private readonly productsRepo: Repository<Product>,
    @InjectRepository(Size)
    private readonly sizesRepo: Repository<Size>,
  ) {}

  async create(dto: CreateProductVariantDto) {
    const product = await this.productsRepo.findOne({
      where: { id: dto.productId },
    });

    if (!product) {
      throw new NotFoundException(`Product with id ${dto.productId} not found`);
    }

    const size = await this.sizesRepo.findOne({
      where: { id: dto.sizeId },
    });

    if (!size) {
      throw new NotFoundException(`Size with id ${dto.sizeId} not found`);
    }

    const existing = await this.variantsRepo.findOne({
      where: {
        product: { id: dto.productId },
        size: { id: dto.sizeId },
      },
      relations: ['product', 'size'],
    });

    if (existing) {
      throw new BadRequestException(
        'This variant already exists for the selected product and size',
      );
    }

    const variant = this.variantsRepo.create({
      product,
      size,
      stockQuantity: dto.stockQuantity,
      variantPrice: dto.variantPrice ?? null,
    });

    const saved = await this.variantsRepo.save(variant);

    return {
      message: 'Product variant created successfully',
      data: saved,
    };
  }

  async findAll() {
    const variants = await this.variantsRepo.find({
      relations: ['product', 'product.category', 'size'],
      order: { id: 'DESC' },
    });

    return {
      message: 'Product variants fetched successfully',
      count: variants.length,
      data: variants,
    };
  }

  async findOne(id: number) {
    const variant = await this.variantsRepo.findOne({
      where: { id },
      relations: ['product', 'product.category', 'size'],
    });

    if (!variant) {
      throw new NotFoundException(`Product variant with id ${id} not found`);
    }

    return {
      message: 'Product variant fetched successfully',
      data: variant,
    };
  }

  async findByProduct(productId: number) {
    const variants = await this.variantsRepo.find({
      where: { product: { id: productId } },
      relations: ['product', 'size'],
      order: { id: 'ASC' },
    });

    return {
      message: 'Product variants fetched successfully',
      count: variants.length,
      data: variants,
    };
  }

  async update(id: number, dto: UpdateProductVariantDto) {
    const variant = await this.variantsRepo.findOne({
      where: { id },
      relations: ['product', 'size'],
    });

    if (!variant) {
      throw new NotFoundException(`Product variant with id ${id} not found`);
    }

    if (dto.productId !== undefined) {
      const product = await this.productsRepo.findOne({
        where: { id: dto.productId },
      });

      if (!product) {
        throw new NotFoundException(
          `Product with id ${dto.productId} not found`,
        );
      }

      variant.product = product;
    }

    if (dto.sizeId !== undefined) {
      const size = await this.sizesRepo.findOne({
        where: { id: dto.sizeId },
      });

      if (!size) {
        throw new NotFoundException(`Size with id ${dto.sizeId} not found`);
      }

      variant.size = size;
    }

    if (dto.productId !== undefined || dto.sizeId !== undefined) {
      const duplicate = await this.variantsRepo.findOne({
        where: {
          product: { id: variant.product.id },
          size: { id: variant.size.id },
        },
        relations: ['product', 'size'],
      });

      if (duplicate && duplicate.id !== id) {
        throw new BadRequestException(
          'Another variant already exists for this product and size',
        );
      }
    }

    if (dto.stockQuantity !== undefined) {
      variant.stockQuantity = dto.stockQuantity;
    }

    if (dto.variantPrice !== undefined) {
      variant.variantPrice = dto.variantPrice;
    }

    const updated = await this.variantsRepo.save(variant);

    return {
      message: 'Product variant updated successfully',
      data: updated,
    };
  }

  async remove(id: number) {
    const variant = await this.variantsRepo.findOne({
      where: { id },
    });

    if (!variant) {
      throw new NotFoundException(`Product variant with id ${id} not found`);
    }

    await this.variantsRepo.remove(variant);

    return {
      message: 'Product variant deleted successfully',
      id,
    };
  }
}
