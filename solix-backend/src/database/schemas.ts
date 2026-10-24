import { Schema } from 'mongoose';
const ref = (name: string) => ({
  type: Schema.Types.ObjectId,
  ref: name,
  required: true,
});
const money = { type: Number, min: 0, required: true };
const options = {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (_doc: unknown, ret: Record<string, unknown>) => {
      ret.id = String(ret._id);
      delete ret._id;
      delete ret.__v;
      delete ret.passwordHash;
      return ret;
    },
  },
  toObject: { virtuals: true },
};
export const UserSchema = new Schema(
  {
    fullName: { type: String, required: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: String,
    address: String,
    passwordHash: { type: String, required: true, select: false },
    role: {
      type: String,
      enum: ['admin', 'staff', 'customer'],
      default: 'customer',
    },
    permissions: [{ type: String }],
    mustChangePassword: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
  },
  options,
);
export const CategorySchema = new Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    slug: { type: String, trim: true },
    description: String,
    imageUrl: String,
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  options,
);
export const SizeSchema = new Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    sortOrder: { type: Number, default: 0 },
    measurements: { type: Map, of: String, default: {} },
  },
  options,
);
const ImageSchema = new Schema(
  {
    imageUrl: String,
    alt: String,
    colour: String,
    sortOrder: { type: Number, default: 0 },
    isPrimary: { type: Boolean, default: false },
  },
  options,
);
export const ProductSchema = new Schema(
  {
    category: ref('Category'),
    collections: [{ type: Schema.Types.ObjectId, ref: 'Collection' }],
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: String,
    basePrice: money,
    compareAtPrice: { type: Number, min: 0, default: null },
    material: String,
    fit: String,
    care: String,
    tags: [{ type: String, trim: true }],
    sizeGuide: String,
    seoTitle: String,
    seoDescription: String,
    status: {
      type: String,
      enum: ['draft', 'active', 'archived'],
      default: 'active',
    },
    featured: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    images: [ImageSchema],
  },
  options,
);
ProductSchema.virtual('variants', {
  ref: 'ProductVariant',
  localField: '_id',
  foreignField: 'product',
});
export const ProductVariantSchema = new Schema(
  {
    product: ref('Product'),
    size: ref('Size'),
    sku: { type: String, trim: true },
    colourName: { type: String, default: 'Default' },
    colourHex: { type: String, default: '#626d4d' },
    stockQuantity: { type: Number, min: 0, required: true },
    lowStockThreshold: { type: Number, min: 0, default: 5 },
    variantPrice: { type: Number, min: 0, default: null },
    isActive: { type: Boolean, default: true },
  },
  options,
);
ProductVariantSchema.index(
  { product: 1, size: 1, colourName: 1 },
  { unique: true },
);
ProductVariantSchema.index(
  { sku: 1 },
  { unique: true, partialFilterExpression: { sku: { $type: 'string' } } },
);
const CartItemSchema = new Schema(
  {
    productVariant: ref('ProductVariant'),
    quantity: { type: Number, min: 1, required: true },
  },
  options,
);
export const CartSchema = new Schema(
  { user: { ...ref('User'), unique: true }, items: [CartItemSchema] },
  options,
);
const OrderItemSchema = new Schema(
  {
    product: ref('Product'),
    productVariant: ref('ProductVariant'),
    productName: String,
    sizeName: String,
    colourName: String,
    sku: String,
    imageUrl: String,
    quantity: Number,
    unitPrice: Number,
    subtotal: Number,
  },
  options,
);
export const OrderSchema = new Schema(
  {
    user: ref('User'),
    orderNumber: { type: String, unique: true },
    checkoutKey: { type: String, required: true },
    addressSnapshot: { type: Schema.Types.Mixed },
    deliveryAddress: String,
    contactPhone: String,
    deliveryNotes: String,
    paymentMethod: {
      type: String,
      enum: ['cash_on_delivery', 'bkash', 'nagad'],
    },
    subtotalAmount: { type: Number, min: 0, default: 0 },
    discountAmount: { type: Number, min: 0, default: 0 },
    couponSnapshot: { type: Schema.Types.Mixed },
    totalAmount: money,
    shippingAmount: { type: Number, default: 0 },
    orderStatus: {
      type: String,
      enum: [
        'pending',
        'payment_review',
        'confirmed',
        'processing',
        'packed',
        'shipped',
        'delivered',
        'cancelled',
        'return_requested',
        'returned',
      ],
      default: 'pending',
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'submitted', 'verified', 'rejected', 'refunded'],
      default: 'pending',
    },
    stockRestored: { type: Boolean, default: false },
    tracking: { carrier: String, trackingNumber: String, trackingUrl: String },
    timeline: [
      { status: String, note: String, at: { type: Date, default: Date.now } },
    ],
    items: [OrderItemSchema],
  },
  options,
);
OrderSchema.index({ user: 1, checkoutKey: 1 }, { unique: true });
export const PaymentSchema = new Schema(
  {
    order: { ...ref('Order'), unique: true },
    method: { type: String, enum: ['cash_on_delivery', 'bkash', 'nagad'] },
    status: {
      type: String,
      enum: ['pending', 'submitted', 'verified', 'rejected', 'refunded'],
      default: 'pending',
    },
    transactionRef: String,
    senderLastFour: String,
    proofImageUrl: String,
    submittedAt: Date,
    verifiedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    rejectionReason: String,
    paidAt: Date,
  },
  options,
);
PaymentSchema.index(
  { method: 1, transactionRef: 1 },
  {
    unique: true,
    partialFilterExpression: { transactionRef: { $type: 'string' } },
  },
);

export const AddressSchema = new Schema(
  {
    user: ref('User'),
    label: { type: String, default: 'Home' },
    recipientName: { type: String, required: true },
    phone: { type: String, required: true },
    line1: { type: String, required: true },
    line2: String,
    area: String,
    city: { type: String, required: true },
    postalCode: String,
    isDefault: { type: Boolean, default: false },
  },
  options,
);
AddressSchema.index({ user: 1, createdAt: -1 });

export const CollectionSchema = new Schema(
  {
    name: { type: String, required: true, unique: true },
    slug: { type: String, required: true, unique: true },
    description: String,
    imageUrl: String,
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  options,
);

export const WishlistSchema = new Schema(
  {
    user: { ...ref('User'), unique: true },
    items: [
      { product: ref('Product'), addedAt: { type: Date, default: Date.now } },
    ],
  },
  options,
);

export const CouponSchema = new Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    type: { type: String, enum: ['fixed', 'percentage'], required: true },
    value: { type: Number, min: 0, required: true },
    minSpend: { type: Number, min: 0, default: 0 },
    maxDiscount: { type: Number, min: 0, default: null },
    startsAt: Date,
    endsAt: Date,
    usageLimit: { type: Number, min: 1, default: null },
    perCustomerLimit: { type: Number, min: 1, default: 1 },
    usedCount: { type: Number, default: 0 },
    usedBy: [{ user: ref('User'), count: { type: Number, default: 1 } }],
    eligibleProducts: [{ type: Schema.Types.ObjectId, ref: 'Product' }],
    eligibleCategories: [{ type: Schema.Types.ObjectId, ref: 'Category' }],
    isActive: { type: Boolean, default: true },
  },
  options,
);

export const ReviewSchema = new Schema(
  {
    user: ref('User'),
    product: ref('Product'),
    order: { type: Schema.Types.ObjectId, ref: 'Order' },
    rating: { type: Number, min: 1, max: 5, required: true },
    title: String,
    body: { type: String, required: true },
    images: [String],
    verifiedPurchase: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
  },
  options,
);
ReviewSchema.index({ user: 1, product: 1 }, { unique: true });

const ReturnItemSchema = new Schema(
  {
    orderItemId: String,
    quantity: { type: Number, min: 1 },
    requestedSize: { type: Schema.Types.ObjectId, ref: 'Size' },
  },
  { _id: false },
);
export const ReturnRequestSchema = new Schema(
  {
    user: ref('User'),
    order: ref('Order'),
    type: { type: String, enum: ['return', 'exchange'], required: true },
    items: [ReturnItemSchema],
    reason: { type: String, required: true },
    notes: String,
    status: {
      type: String,
      enum: ['requested', 'approved', 'rejected', 'received', 'completed'],
      default: 'requested',
    },
    adminNote: String,
  },
  options,
);

const TicketMessageSchema = new Schema(
  {
    sender: { type: Schema.Types.ObjectId, ref: 'User' },
    senderRole: String,
    body: String,
    at: { type: Date, default: Date.now },
  },
  { _id: true },
);
export const SupportTicketSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    name: String,
    phone: String,
    subject: { type: String, required: true },
    message: { type: String, required: true },
    status: {
      type: String,
      enum: ['open', 'in_progress', 'resolved', 'closed'],
      default: 'open',
    },
    messages: [TicketMessageSchema],
  },
  options,
);

export const NotificationSchema = new Schema(
  {
    user: ref('User'),
    type: String,
    title: String,
    message: String,
    href: String,
    readAt: Date,
  },
  options,
);
NotificationSchema.index({ user: 1, createdAt: -1 });

export const InventoryMovementSchema = new Schema(
  {
    variant: ref('ProductVariant'),
    type: {
      type: String,
      enum: [
        'initial',
        'adjustment',
        'sale',
        'cancellation',
        'return',
        'exchange',
      ],
      required: true,
    },
    quantity: { type: Number, required: true },
    previousStock: Number,
    newStock: Number,
    referenceType: String,
    referenceId: String,
    note: String,
    actor: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  options,
);

export const SiteContentSchema = new Schema(
  {
    key: { type: String, required: true, unique: true },
    title: String,
    body: String,
    metadata: Schema.Types.Mixed,
    isPublished: { type: Boolean, default: true },
  },
  options,
);
export const StoreSettingsSchema = new Schema(
  {
    key: { type: String, default: 'store', unique: true },
    brandTagline: String,
    address: String,
    phone: String,
    whatsapp: String,
    mapUrl: String,
    mapPlusCode: String,
    latitude: Number,
    longitude: Number,
    socialLinks: Schema.Types.Mixed,
    freeShipping: { type: Boolean, default: true },
    shippingZones: [
      { name: String, cities: [String], amount: { type: Number, default: 0 } },
    ],
  },
  options,
);
export const SessionSchema = new Schema(
  {
    user: ref('User'),
    refreshTokenHash: { type: String, required: true, select: false },
    expiresAt: { type: Date, required: true },
    revokedAt: Date,
    userAgent: String,
    ip: String,
  },
  options,
);
SessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
export const AuditLogSchema = new Schema(
  {
    actor: { type: Schema.Types.ObjectId, ref: 'User' },
    action: String,
    targetType: String,
    targetId: String,
    before: Schema.Types.Mixed,
    after: Schema.Types.Mixed,
    ip: String,
  },
  options,
);
export const models = [
  { name: 'User', schema: UserSchema },
  { name: 'Category', schema: CategorySchema },
  { name: 'Size', schema: SizeSchema },
  { name: 'Product', schema: ProductSchema },
  { name: 'ProductVariant', schema: ProductVariantSchema },
  { name: 'Cart', schema: CartSchema },
  { name: 'Order', schema: OrderSchema },
  { name: 'Payment', schema: PaymentSchema },
  { name: 'Address', schema: AddressSchema },
  { name: 'Collection', schema: CollectionSchema },
  { name: 'Wishlist', schema: WishlistSchema },
  { name: 'Coupon', schema: CouponSchema },
  { name: 'Review', schema: ReviewSchema },
  { name: 'ReturnRequest', schema: ReturnRequestSchema },
  { name: 'SupportTicket', schema: SupportTicketSchema },
  { name: 'Notification', schema: NotificationSchema },
  { name: 'InventoryMovement', schema: InventoryMovementSchema },
  { name: 'SiteContent', schema: SiteContentSchema },
  { name: 'StoreSettings', schema: StoreSettingsSchema },
  { name: 'Session', schema: SessionSchema },
  { name: 'AuditLog', schema: AuditLogSchema },
];
