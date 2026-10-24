import { UpdateProductDto } from './dto/update-product.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { ProductQueryDto } from './dto/product-query.dto';
import {
  CategoryRecord,
  CollectionRecord,
  ProductRecord,
  SizeRecord,
  VariantRecord,
} from '../database/types';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

@Injectable()
export class ProductsService {
  constructor(
    @InjectModel('Product') private readonly products: Model<ProductRecord>,
    @InjectModel('Category') private readonly categories: Model<CategoryRecord>,
    @InjectModel('Collection')
    private readonly collections: Model<CollectionRecord>,
    @InjectModel('ProductVariant')
    private readonly variants: Model<VariantRecord>,
    @InjectModel('Size') private readonly sizes: Model<SizeRecord>,
  ) {}

  private slug(name: string) {
    const slug = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    if (!slug)
      throw new BadRequestException(
        'Use a product name with letters or numbers',
      );
    return slug;
  }
  private escape(value: string) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  async create(dto: CreateProductDto) {
    if (!(await this.categories.exists({ _id: dto.categoryId })))
      throw new NotFoundException('Category not found');
    const { categoryId, collectionIds, ...rest } = dto;
    const data = await this.products.create({
      ...rest,
      category: categoryId,
      collections: collectionIds || [],
      slug: this.slug(dto.name),
      status: dto.status || 'active',
      isActive: dto.status !== 'archived',
    });
    return { data };
  }

  async findAll(query: ProductQueryDto = new ProductQueryDto()) {
    const filter: Record<string, unknown> = {
      isActive: true,
      status: { $ne: 'archived' },
    };
    if (query.search) {
      const expression = new RegExp(this.escape(query.search.trim()), 'i');
      filter.$or = [
        { name: expression },
        { description: expression },
        { tags: expression },
        { material: expression },
      ];
    }
    if (query.category) {
      const category = await this.categories.findOne(
        Types.ObjectId.isValid(query.category)
          ? { $or: [{ _id: query.category }, { slug: query.category }] }
          : {
              $or: [
                { name: new RegExp(`^${this.escape(query.category)}$`, 'i') },
                { slug: query.category },
              ],
            },
      );
      if (!category) return this.empty(query);
      filter.category = category._id;
    }
    if (query.collection) {
      const collection = await this.collections.findOne(
        Types.ObjectId.isValid(query.collection)
          ? { $or: [{ _id: query.collection }, { slug: query.collection }] }
          : {
              $or: [
                { name: new RegExp(`^${this.escape(query.collection)}$`, 'i') },
                { slug: query.collection },
              ],
            },
      );
      if (!collection) return this.empty(query);
      filter.collections = collection._id;
    }
    if (query.minPrice !== undefined || query.maxPrice !== undefined) {
      filter.basePrice = {
        ...(query.minPrice !== undefined ? { $gte: query.minPrice } : {}),
        ...(query.maxPrice !== undefined ? { $lte: query.maxPrice } : {}),
      };
    }
    if (query.discounted === 'true')
      filter.$expr = { $gt: ['$compareAtPrice', '$basePrice'] };
    if (query.featured === 'true') filter.featured = true;
    if (query.size || query.colour || query.inStock === 'true') {
      const variantFilter: Record<string, unknown> = { isActive: true };
      if (query.colour)
        variantFilter.colourName = new RegExp(
          `^${this.escape(query.colour)}$`,
          'i',
        );
      if (query.inStock === 'true') variantFilter.stockQuantity = { $gt: 0 };
      if (query.size) {
        const size = await this.sizes.findOne(
          Types.ObjectId.isValid(query.size)
            ? { _id: query.size }
            : { name: query.size },
        );
        if (!size) return this.empty(query);
        variantFilter.size = size._id;
      }
      filter._id = {
        $in: await this.variants.distinct('product', variantFilter),
      };
    }
    const page = query.page || 1;
    const limit = query.limit || 12;
    const total = await this.products.countDocuments(filter);
    const sort: Record<string, 1 | -1> =
      query.sort === 'price-low'
        ? { basePrice: 1 }
        : query.sort === 'price-high'
          ? { basePrice: -1 }
          : query.sort === 'name'
            ? { name: 1 }
            : { createdAt: -1 };
    const data = await this.products
      .find(filter)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('category')
      .populate('collections')
      .populate({
        path: 'variants',
        match: { isActive: true },
        populate: { path: 'size' },
      });
    return {
      data,
      meta: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  }
  async filterOptions() {
    const colours = (
      await this.variants.distinct('colourName', {
        isActive: true,
        colourName: { $nin: [null, '', 'Default'] },
      })
    ).sort((a, b) => String(a).localeCompare(String(b)));
    const price = await this.products.aggregate<{ max: number }>([
      { $match: { isActive: true, status: { $ne: 'archived' } } },
      { $group: { _id: null, max: { $max: '$basePrice' } } },
    ]);
    return { data: { colours, maxPrice: price[0]?.max || 0 } };
  }
  private empty(query: ProductQueryDto) {
    return {
      data: [],
      meta: {
        page: query.page || 1,
        limit: query.limit || 12,
        total: 0,
        pages: 0,
      },
    };
  }

  async findOne(id: string) {
    const data = await this.products
      .findOne({ _id: id, isActive: true, status: { $ne: 'archived' } })
      .populate('category')
      .populate('collections')
      .populate({
        path: 'variants',
        match: { isActive: true },
        populate: { path: 'size' },
      });
    if (!data) throw new NotFoundException('Product not found');
    return { data };
  }
  async findBySlug(slug: string) {
    const data = await this.products
      .findOne({ slug, isActive: true, status: { $ne: 'archived' } })
      .populate('category')
      .populate('collections')
      .populate({
        path: 'variants',
        match: { isActive: true },
        populate: { path: 'size' },
      });
    if (!data) throw new NotFoundException('Product not found');
    return { data };
  }
  async suggestions(query: string) {
    const needle = query.trim();
    if (needle.length < 2) return { data: [] };
    const data = await this.products
      .find({
        isActive: true,
        status: { $ne: 'archived' },
        name: new RegExp(this.escape(needle), 'i'),
      })
      .select('name slug images basePrice')
      .limit(6);
    return { data };
  }
  async related(id: string) {
    const product = await this.products.findById(id);
    if (!product) throw new NotFoundException('Product not found');
    const data = await this.products
      .find({
        _id: { $ne: id },
        isActive: true,
        status: { $ne: 'archived' },
        $or: [
          { category: product.category },
          { tags: { $in: product.tags || [] } },
        ],
      })
      .populate('category')
      .populate({
        path: 'variants',
        match: { isActive: true },
        populate: { path: 'size' },
      })
      .limit(4);
    return { data };
  }

  async update(id: string, dto: UpdateProductDto) {
    await this.findOne(id);
    const { categoryId, collectionIds, ...fields } = dto;
    const rest: Record<string, unknown> = { ...fields };
    if (categoryId) {
      if (!(await this.categories.exists({ _id: categoryId })))
        throw new NotFoundException('Category not found');
      rest.category = categoryId;
    }
    if (collectionIds) rest.collections = collectionIds;
    if (dto.name) rest.slug = this.slug(dto.name);
    if (dto.status) rest.isActive = dto.status !== 'archived';
    return {
      data: await this.products.findByIdAndUpdate(
        id,
        { $set: rest },
        { new: true, runValidators: true },
      ),
    };
  }
  async remove(id: string) {
    await this.findOne(id);
    await this.products.findByIdAndUpdate(id, {
      status: 'archived',
      isActive: false,
    });
    return { message: 'Product archived', id };
  }
  async uploadImage(id: string, file: Express.Multer.File) {
    if (!file)
      throw new BadRequestException('Choose a JPEG, PNG or WebP image');
    await this.findOne(id);
    const image = {
      imageUrl: `uploads/${file.filename}`,
      alt: '',
      sortOrder: 0,
      isPrimary: false,
    };
    const product = await this.products.findByIdAndUpdate(
      id,
      { $push: { images: image } },
      { new: true },
    );
    if (!product) throw new NotFoundException('Product not found');
    return { data: product.images[product.images.length - 1] };
  }
}
