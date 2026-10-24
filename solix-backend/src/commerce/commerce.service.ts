import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import {
  AddressRecord,
  AuditLogRecord,
  CollectionRecord,
  CouponRecord,
  InventoryMovementRecord,
  NotificationRecord,
  OrderRecord,
  ProductRecord,
  ReturnRequestRecord,
  ReviewRecord,
  SiteContentRecord,
  StoreSettingsRecord,
  SupportTicketRecord,
  UserRecord,
  VariantRecord,
  WishlistRecord,
} from '../database/types';
import { User } from '../users/entities/user.entity';
import { OrderStatus } from '../common/enums/order-status.enum';
import { UserRole } from '../common/enums/user-role.enum';
import {
  AddressDto,
  CollectionDto,
  ContentDto,
  CouponDto,
  ReturnRequestDto,
  ReturnStatusDto,
  ReviewDto,
  SettingsDto,
  StaffDto,
  StaffUpdateDto,
  StockAdjustmentDto,
  SupportTicketDto,
  TicketReplyDto,
} from './dto/commerce.dto';

const slugify = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

@Injectable()
export class CommerceService {
  constructor(
    @InjectModel('Address') private readonly addresses: Model<AddressRecord>,
    @InjectModel('Collection')
    private readonly collections: Model<CollectionRecord>,
    @InjectModel('Wishlist') private readonly wishlists: Model<WishlistRecord>,
    @InjectModel('Coupon') private readonly coupons: Model<CouponRecord>,
    @InjectModel('Review') private readonly reviews: Model<ReviewRecord>,
    @InjectModel('ReturnRequest')
    private readonly returns: Model<ReturnRequestRecord>,
    @InjectModel('SupportTicket')
    private readonly tickets: Model<SupportTicketRecord>,
    @InjectModel('Notification')
    private readonly notifications: Model<NotificationRecord>,
    @InjectModel('InventoryMovement')
    private readonly movements: Model<InventoryMovementRecord>,
    @InjectModel('SiteContent')
    private readonly content: Model<SiteContentRecord>,
    @InjectModel('StoreSettings')
    private readonly settings: Model<StoreSettingsRecord>,
    @InjectModel('AuditLog') private readonly auditLogs: Model<AuditLogRecord>,
    @InjectModel('Product') private readonly products: Model<ProductRecord>,
    @InjectModel('ProductVariant')
    private readonly variants: Model<VariantRecord>,
    @InjectModel('Order') private readonly orders: Model<OrderRecord>,
    @InjectModel('User') private readonly users: Model<UserRecord>,
    @InjectConnection() private readonly db: Connection,
  ) {}

  private async recordAudit(
    actor: string,
    action: string,
    targetType: string,
    targetId?: string,
    after?: unknown,
  ) {
    await this.auditLogs.create({ actor, action, targetType, targetId, after });
  }

  async listAddresses(userId: string) {
    return {
      data: await this.addresses
        .find({ user: userId })
        .sort({ isDefault: -1, createdAt: -1 }),
    };
  }
  async createAddress(userId: string, dto: AddressDto) {
    const count = await this.addresses.countDocuments({ user: userId });
    if (dto.isDefault || count === 0)
      await this.addresses.updateMany(
        { user: userId },
        { $set: { isDefault: false } },
      );
    return {
      message: 'Address saved',
      data: await this.addresses.create({
        ...dto,
        user: userId,
        isDefault: dto.isDefault || count === 0,
      }),
    };
  }
  async updateAddress(userId: string, id: string, dto: Partial<AddressDto>) {
    const address = await this.addresses.findOne({ _id: id, user: userId });
    if (!address) throw new NotFoundException('Address not found');
    if (dto.isDefault)
      await this.addresses.updateMany(
        { user: userId },
        { $set: { isDefault: false } },
      );
    Object.assign(address, dto);
    await address.save();
    return { message: 'Address updated', data: address };
  }
  async deleteAddress(userId: string, id: string) {
    const address = await this.addresses.findOneAndDelete({
      _id: id,
      user: userId,
    });
    if (!address) throw new NotFoundException('Address not found');
    if (address.isDefault) {
      const next = await this.addresses
        .findOne({ user: userId })
        .sort({ createdAt: -1 });
      if (next) {
        next.isDefault = true;
        await next.save();
      }
    }
    return { message: 'Address removed', id };
  }

  async wishlist(userId: string) {
    const list = await this.wishlists
      .findOne({ user: userId })
      .populate({ path: 'items.product', populate: ['category', 'variants'] });
    return { data: list?.items || [] };
  }
  async addWishlist(userId: string, productId: string) {
    if (!(await this.products.exists({ _id: productId, isActive: true })))
      throw new NotFoundException('Product not found');
    await this.wishlists.updateOne(
      { user: userId, 'items.product': { $ne: productId } },
      {
        $setOnInsert: { user: userId },
        $push: { items: { product: productId, addedAt: new Date() } },
      },
      { upsert: true },
    );
    return this.wishlist(userId);
  }
  async removeWishlist(userId: string, productId: string) {
    await this.wishlists.updateOne(
      { user: userId },
      { $pull: { items: { product: productId } } },
    );
    return this.wishlist(userId);
  }

  async listCollections(admin = false) {
    const data = await this.collections
      .find(admin ? {} : { isActive: true })
      .sort({ sortOrder: 1, name: 1 });
    return {
      data,
      meta: { page: 1, limit: data.length, total: data.length, pages: 1 },
    };
  }
  async saveCollection(actor: string, dto: CollectionDto, id?: string) {
    const values = { ...dto, slug: slugify(dto.name) };
    const data = id
      ? await this.collections.findByIdAndUpdate(
          id,
          { $set: values },
          { new: true, runValidators: true },
        )
      : await this.collections.create(values);
    if (!data) throw new NotFoundException('Collection not found');
    await this.recordAudit(
      actor,
      id ? 'collection.update' : 'collection.create',
      'Collection',
      String(data._id),
      values,
    );
    return { data };
  }

  async validateCoupon(userId: string, code: string, subtotal = 0) {
    const coupon = await this.coupons.findOne({
      code: code.trim().toUpperCase(),
      isActive: true,
    });
    if (!coupon) throw new NotFoundException('Coupon is not valid');
    const now = new Date();
    const used =
      coupon.usedBy.find((entry) => String(entry.user) === userId)?.count || 0;
    if (
      (coupon.startsAt && coupon.startsAt > now) ||
      (coupon.endsAt && coupon.endsAt < now)
    )
      throw new BadRequestException('Coupon is outside its valid date');
    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit)
      throw new BadRequestException('Coupon usage limit reached');
    if (used >= coupon.perCustomerLimit)
      throw new BadRequestException('You have already used this coupon');
    if (subtotal && subtotal < coupon.minSpend)
      throw new BadRequestException(`Minimum spend is BDT ${coupon.minSpend}`);
    const raw =
      coupon.type === 'percentage'
        ? (subtotal * coupon.value) / 100
        : coupon.value;
    const discount = Math.max(
      0,
      Math.min(
        subtotal,
        coupon.maxDiscount ? Math.min(raw, coupon.maxDiscount) : raw,
      ),
    );
    return {
      data: {
        code: coupon.code,
        type: coupon.type,
        value: coupon.value,
        minSpend: coupon.minSpend,
        discount: Math.round(discount * 100) / 100,
      },
    };
  }
  async listCoupons() {
    return { data: await this.coupons.find().sort({ createdAt: -1 }) };
  }
  async saveCoupon(actor: string, dto: CouponDto, id?: string) {
    const values = { ...dto, code: dto.code.trim().toUpperCase() };
    const data = id
      ? await this.coupons.findByIdAndUpdate(
          id,
          { $set: values },
          { new: true, runValidators: true },
        )
      : await this.coupons.create(values);
    if (!data) throw new NotFoundException('Coupon not found');
    await this.recordAudit(
      actor,
      id ? 'coupon.update' : 'coupon.create',
      'Coupon',
      String(data._id),
      values,
    );
    return { data };
  }

  async productReviews(productId: string) {
    const data = await this.reviews
      .find({ product: productId, status: 'approved' })
      .populate('user', 'fullName')
      .sort({ createdAt: -1 });
    const average = data.length
      ? data.reduce((sum, item) => sum + item.rating, 0) / data.length
      : 0;
    return {
      data,
      meta: { total: data.length, average: Math.round(average * 10) / 10 },
    };
  }
  async createReview(userId: string, dto: ReviewDto) {
    const delivered = await this.orders.findOne({
      user: userId,
      orderStatus: 'delivered',
      'items.product': dto.productId,
    });
    if (!delivered)
      throw new ForbiddenException(
        'Only verified buyers can review this product',
      );
    try {
      const data = await this.reviews.create({
        ...dto,
        product: dto.productId,
        user: userId,
        order: delivered._id,
        verifiedPurchase: true,
      });
      return { message: 'Review submitted for moderation', data };
    } catch (error) {
      if (error instanceof Error && 'code' in error && error.code === 11000)
        throw new ConflictException('You already reviewed this product');
      throw error;
    }
  }
  async adminReviews() {
    return {
      data: await this.reviews
        .find()
        .populate(['user', 'product'])
        .sort({ createdAt: -1 }),
    };
  }
  async moderateReview(
    actor: string,
    id: string,
    status: 'approved' | 'rejected',
  ) {
    const data = await this.reviews.findByIdAndUpdate(
      id,
      { $set: { status } },
      { new: true },
    );
    if (!data) throw new NotFoundException('Review not found');
    await this.recordAudit(actor, 'review.moderate', 'Review', id, { status });
    return { data };
  }

  async createReturn(userId: string, dto: ReturnRequestDto) {
    const order = await this.orders.findOne({ _id: dto.orderId, user: userId });
    if (!order || order.orderStatus !== OrderStatus.DELIVERED)
      throw new BadRequestException(
        'Only delivered orders can be returned or exchanged',
      );
    if (
      await this.returns.exists({
        order: dto.orderId,
        status: { $in: ['requested', 'approved', 'received'] },
      })
    )
      throw new ConflictException('This order already has an open request');
    const data = await this.returns.create({
      ...dto,
      user: userId,
      order: dto.orderId,
    });
    order.orderStatus = 'return_requested' as never;
    order.timeline.push({
      status: 'return_requested',
      note: dto.reason,
      at: new Date(),
    });
    await order.save();
    await this.notifications.create({
      user: userId,
      type: 'return',
      title: 'Request received',
      message: `Your ${dto.type} request for ${order.orderNumber} is under review.`,
      href: `/orders/${order.id}`,
    });
    return { message: 'Request submitted', data };
  }
  async myReturns(userId: string) {
    return {
      data: await this.returns
        .find({ user: userId })
        .populate('order')
        .sort({ createdAt: -1 }),
    };
  }
  async adminReturns() {
    return {
      data: await this.returns
        .find()
        .populate(['user', 'order'])
        .sort({ createdAt: -1 }),
    };
  }
  async updateReturn(actor: string, id: string, dto: ReturnStatusDto) {
    const data = await this.returns
      .findByIdAndUpdate(id, { $set: dto }, { new: true })
      .populate('order');
    if (!data) throw new NotFoundException('Request not found');
    await this.notifications.create({
      user: data.user,
      type: 'return',
      title: `Request ${dto.status}`,
      message: `Your ${data.type} request is now ${dto.status}.`,
      href: `/orders/${String(data.order._id)}`,
    });
    await this.recordAudit(actor, 'return.update', 'ReturnRequest', id, dto);
    return { data };
  }

  async createTicket(dto: SupportTicketDto, userId?: string) {
    const data = await this.tickets.create({
      ...dto,
      user: userId,
      messages: [],
    });
    return { message: 'Support request received', data };
  }
  async myTickets(userId: string) {
    return {
      data: await this.tickets.find({ user: userId }).sort({ createdAt: -1 }),
    };
  }
  async listTickets() {
    return {
      data: await this.tickets.find().populate('user').sort({ createdAt: -1 }),
    };
  }
  async replyTicket(user: User, id: string, dto: TicketReplyDto) {
    const filter =
      user.role === UserRole.CUSTOMER
        ? { _id: id, user: user.id }
        : { _id: id };
    const data = await this.tickets.findOneAndUpdate(
      filter,
      {
        $push: {
          messages: {
            sender: user.id,
            senderRole: user.role,
            body: dto.body,
            at: new Date(),
          },
        },
      },
      { new: true },
    );
    if (!data) throw new NotFoundException('Support request not found');
    return { data };
  }
  async updateTicket(actor: string, id: string, status: string) {
    const data = await this.tickets.findByIdAndUpdate(
      id,
      { $set: { status } },
      { new: true },
    );
    if (!data) throw new NotFoundException('Support request not found');
    await this.recordAudit(actor, 'support.update', 'SupportTicket', id, {
      status,
    });
    return { data };
  }

  async myNotifications(userId: string) {
    return {
      data: await this.notifications
        .find({ user: userId })
        .sort({ createdAt: -1 })
        .limit(100),
    };
  }
  async readNotification(userId: string, id: string) {
    const data = await this.notifications.findOneAndUpdate(
      { _id: id, user: userId },
      { $set: { readAt: new Date() } },
      { new: true },
    );
    if (!data) throw new NotFoundException('Notification not found');
    return { data };
  }

  async getContent(key: string) {
    const data = await this.content.findOne({ key, isPublished: true });
    if (!data) throw new NotFoundException('Page not found');
    return { data };
  }
  async saveContent(actor: string, key: string, dto: ContentDto) {
    const data = await this.content.findOneAndUpdate(
      { key },
      { $set: dto, $setOnInsert: { key } },
      { upsert: true, new: true },
    );
    await this.recordAudit(
      actor,
      'content.update',
      'SiteContent',
      String(data._id),
      {
        key,
      },
    );
    return { data };
  }
  async getSettings() {
    const data = await this.settings.findOneAndUpdate(
      { key: 'store' },
      {
        $setOnInsert: {
          key: 'store',
          freeShipping: true,
          shippingZones: [{ name: 'Bangladesh', cities: [], amount: 0 }],
        },
      },
      { upsert: true, new: true },
    );
    return { data };
  }
  async saveSettings(actor: string, dto: SettingsDto) {
    const data = await this.settings.findOneAndUpdate(
      { key: 'store' },
      { $set: dto, $setOnInsert: { key: 'store' } },
      { upsert: true, new: true },
    );
    await this.recordAudit(
      actor,
      'settings.update',
      'StoreSettings',
      String(data._id),
      dto,
    );
    return { data };
  }

  async inventory() {
    return {
      data: await this.movements
        .find()
        .populate({ path: 'variant', populate: ['product', 'size'] })
        .sort({ createdAt: -1 })
        .limit(500),
    };
  }
  async adjustStock(actor: string, variantId: string, dto: StockAdjustmentDto) {
    let response: VariantRecord | null = null;
    await this.db.transaction(async (session) => {
      const variant = await this.variants.findById(variantId).session(session);
      if (!variant) throw new NotFoundException('Variant not found');
      const previousStock = variant.stockQuantity;
      const next = previousStock + dto.quantity;
      if (next < 0) throw new BadRequestException('Stock cannot be negative');
      variant.stockQuantity = next;
      await variant.save({ session });
      await this.movements.create(
        [
          {
            variant: variant._id,
            type: 'adjustment',
            quantity: dto.quantity,
            previousStock,
            newStock: next,
            note: dto.note,
            actor,
          },
        ],
        { session },
      );
      response = variant;
    });
    await this.recordAudit(
      actor,
      'inventory.adjust',
      'ProductVariant',
      variantId,
      dto,
    );
    return { data: response };
  }
  async lowStock() {
    const data = await this.variants
      .find({
        isActive: true,
        $expr: { $lte: ['$stockQuantity', '$lowStockThreshold'] },
      })
      .populate(['product', 'size'])
      .sort({ stockQuantity: 1 });
    return { data };
  }
  async listAudit() {
    return {
      data: await this.auditLogs
        .find()
        .populate('actor', 'fullName email')
        .sort({ createdAt: -1 })
        .limit(500),
    };
  }

  async createStaff(actor: string, dto: StaffDto) {
    if (await this.users.exists({ email: dto.email.trim().toLowerCase() }))
      throw new ConflictException('Email already exists');
    const data = await this.users.create({
      fullName: dto.fullName,
      email: dto.email.trim().toLowerCase(),
      passwordHash: await bcrypt.hash(dto.password, 12),
      role: 'staff',
      permissions: dto.permissions || [],
      mustChangePassword: true,
      isActive: true,
    });
    await this.recordAudit(actor, 'staff.create', 'User', String(data._id), {
      email: data.email,
      permissions: data.permissions,
    });
    return { data };
  }

  async listStaff() {
    return {
      data: await this.users
        .find({ role: UserRole.STAFF })
        .sort({ createdAt: -1 }),
    };
  }

  async updateStaff(actor: string, id: string, dto: StaffUpdateDto) {
    const data = await this.users.findOneAndUpdate(
      { _id: id, role: UserRole.STAFF },
      { $set: { permissions: dto.permissions, isActive: dto.isActive } },
      { new: true, runValidators: true },
    );
    if (!data) throw new NotFoundException('Staff account not found');
    await this.recordAudit(actor, 'staff.update', 'User', id, {
      permissions: data.permissions,
      isActive: data.isActive,
    });
    return { data };
  }
}
