import { UpdateProductVariantDto } from './dto/update-product-variant.dto';
import { CreateProductVariantDto } from './dto/create-product-variant.dto';
import { ProductRecord, SizeRecord, VariantRecord } from '../database/types';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
@Injectable()
export class ProductVariantsService {
  constructor(
    @InjectModel('ProductVariant')
    private readonly variants: Model<VariantRecord>,
    @InjectModel('Product') private readonly products: Model<ProductRecord>,
    @InjectModel('Size') private readonly sizes: Model<SizeRecord>,
  ) {}
  private async payload(dto: UpdateProductVariantDto) {
    const { productId, sizeId, ...fields } = dto;
    const rest: UpdateProductVariantDto & { product?: string; size?: string } =
      fields;
    if (productId) {
      if (!(await this.products.exists({ _id: productId, isActive: true })))
        throw new NotFoundException('Product not found');
      rest.product = productId;
    }
    if (sizeId) {
      if (!(await this.sizes.exists({ _id: sizeId })))
        throw new NotFoundException('Size not found');
      rest.size = sizeId;
    }
    return rest;
  }
  async create(dto: CreateProductVariantDto) {
    return { data: await this.variants.create(await this.payload(dto)) };
  }
  async findAll() {
    const records = await this.variants
      .find({ isActive: true })
      .populate({
        path: 'product',
        match: { isActive: true },
        populate: { path: 'category' },
      })
      .populate('size');
    const data = records.filter((variant) => Boolean(variant.product));
    return { data, count: data.length };
  }
  async findOne(id: string) {
    const data = await this.variants
      .findOne({ _id: id, isActive: true })
      .populate({
        path: 'product',
        match: { isActive: true },
        populate: { path: 'category' },
      })
      .populate('size');
    if (!data || !data.product)
      throw new NotFoundException('Variant not found');
    return { data };
  }
  async findByProduct(product: string) {
    if (!(await this.products.exists({ _id: product, isActive: true })))
      throw new NotFoundException('Product not found');
    const data = await this.variants
      .find({ product, isActive: true })
      .populate({ path: 'product', populate: { path: 'category' } })
      .populate('size');
    return { data, count: data.length };
  }
  async update(id: string, dto: UpdateProductVariantDto) {
    await this.findOne(id);
    return {
      data: await this.variants.findByIdAndUpdate(
        id,
        { $set: await this.payload(dto) },
        { new: true, runValidators: true },
      ),
    };
  }
  async remove(id: string) {
    await this.findOne(id);
    await this.variants.findByIdAndUpdate(id, { isActive: false });
    return { message: 'Variant archived', id };
  }
}
