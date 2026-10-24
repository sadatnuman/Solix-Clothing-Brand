import { PaymentMethod } from '../common/enums/payment-method.enum';
import { OrderStatus } from '../common/enums/order-status.enum';
import { PaymentStatus } from '../common/enums/payment-status.enum';
import { HydratedDocument, Types } from 'mongoose';
import { UserRole } from '../common/enums/user-role.enum';
export interface BaseRecord {
  _id: Types.ObjectId;
  id: string;
  createdAt: Date;
  updatedAt: Date;
}
// Populated references are used by the service read paths. Writes use explicit IDs.
export type Ref<T> = Types.ObjectId & T;
export interface UserRecord extends BaseRecord {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  passwordHash: string;
  role: UserRole;
  permissions: string[];
  mustChangePassword: boolean;
  isActive: boolean;
}
export interface CategoryRecord extends BaseRecord {
  name: string;
  description: string;
  slug: string;
  imageUrl?: string;
  sortOrder: number;
  isActive: boolean;
}
export interface SizeRecord extends BaseRecord {
  name: string;
  sortOrder: number;
  measurements: Map<string, string>;
}
export interface ProductImageRecord extends BaseRecord {
  imageUrl: string;
  alt?: string;
  colour?: string;
  sortOrder: number;
  isPrimary: boolean;
}
export interface ProductRecord extends BaseRecord {
  category: Ref<CategoryRecord>;
  collections: Types.ObjectId[];
  name: string;
  slug: string;
  description: string;
  basePrice: number;
  compareAtPrice?: number | null;
  material?: string;
  fit?: string;
  care?: string;
  tags: string[];
  sizeGuide: string;
  seoTitle?: string;
  seoDescription?: string;
  status: 'draft' | 'active' | 'archived';
  featured: boolean;
  isActive: boolean;
  images: ProductImageRecord[];
  variants: VariantRecord[];
}
export interface VariantRecord extends BaseRecord {
  product: Ref<ProductRecord>;
  size: Ref<SizeRecord>;
  sku?: string;
  colourName: string;
  colourHex: string;
  stockQuantity: number;
  lowStockThreshold: number;
  variantPrice: number | null;
  isActive: boolean;
}
export interface CartItemRecord extends BaseRecord {
  productVariant: Ref<VariantRecord>;
  quantity: number;
}
export interface CartRecord extends BaseRecord {
  user: Ref<UserRecord>;
  items: Types.DocumentArray<CartItemRecord>;
}
export interface OrderItemRecord extends BaseRecord {
  product: Ref<ProductRecord>;
  productVariant: Ref<VariantRecord>;
  productName: string;
  sizeName: string;
  colourName?: string;
  sku?: string;
  imageUrl?: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}
export interface OrderRecord extends BaseRecord {
  user: Ref<UserRecord>;
  orderNumber: string;
  checkoutKey: string;
  addressSnapshot?: Record<string, unknown>;
  deliveryAddress: string;
  contactPhone: string;
  deliveryNotes?: string;
  paymentMethod: PaymentMethod;
  totalAmount: number;
  subtotalAmount: number;
  discountAmount: number;
  couponSnapshot?: Record<string, unknown>;
  shippingAmount: number;
  orderStatus: OrderStatus;
  paymentStatus: PaymentStatus;
  stockRestored: boolean;
  tracking?: {
    carrier?: string;
    trackingNumber?: string;
    trackingUrl?: string;
  };
  timeline: Array<{ status: string; note?: string; at: Date }>;
  items: OrderItemRecord[];
}
export interface PaymentRecord extends BaseRecord {
  order: Ref<OrderRecord>;
  method: PaymentMethod;
  status: PaymentStatus;
  transactionRef?: string;
  senderLastFour?: string;
  proofImageUrl?: string;
  submittedAt?: Date | null;
  verifiedBy?: Types.ObjectId;
  rejectionReason?: string;
  paidAt: Date | null;
}
export interface AddressRecord extends BaseRecord {
  user: Ref<UserRecord>;
  label: string;
  recipientName: string;
  phone: string;
  line1: string;
  line2?: string;
  area?: string;
  city: string;
  postalCode?: string;
  isDefault: boolean;
}
export interface CollectionRecord extends BaseRecord {
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  sortOrder: number;
  isActive: boolean;
}
export interface WishlistRecord extends BaseRecord {
  user: Ref<UserRecord>;
  items: Array<{ product: Ref<ProductRecord>; addedAt: Date }>;
}
export interface CouponRecord extends BaseRecord {
  code: string;
  type: 'fixed' | 'percentage';
  value: number;
  minSpend: number;
  maxDiscount?: number | null;
  startsAt?: Date;
  endsAt?: Date;
  usageLimit?: number | null;
  perCustomerLimit: number;
  usedCount: number;
  usedBy: Array<{ user: Types.ObjectId; count: number }>;
  eligibleProducts: Types.ObjectId[];
  eligibleCategories: Types.ObjectId[];
  isActive: boolean;
}
export interface ReviewRecord extends BaseRecord {
  user: Ref<UserRecord>;
  product: Ref<ProductRecord>;
  order?: Ref<OrderRecord>;
  rating: number;
  title?: string;
  body: string;
  images: string[];
  verifiedPurchase: boolean;
  status: 'pending' | 'approved' | 'rejected';
}
export interface ReturnRequestRecord extends BaseRecord {
  user: Ref<UserRecord>;
  order: Ref<OrderRecord>;
  type: 'return' | 'exchange';
  items: Array<{
    orderItemId: string;
    quantity: number;
    requestedSize?: Types.ObjectId;
  }>;
  reason: string;
  notes?: string;
  status: 'requested' | 'approved' | 'rejected' | 'received' | 'completed';
  adminNote?: string;
}
export interface SupportTicketRecord extends BaseRecord {
  user?: Ref<UserRecord>;
  name?: string;
  phone?: string;
  subject: string;
  message: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  messages: Array<{
    sender?: Types.ObjectId;
    senderRole: string;
    body: string;
    at: Date;
  }>;
}
export interface NotificationRecord extends BaseRecord {
  user: Ref<UserRecord>;
  type: string;
  title: string;
  message: string;
  href?: string;
  readAt?: Date;
}
export interface InventoryMovementRecord extends BaseRecord {
  variant: Ref<VariantRecord>;
  type: string;
  quantity: number;
  previousStock: number;
  newStock: number;
  referenceType?: string;
  referenceId?: string;
  note?: string;
  actor?: Types.ObjectId;
}
export interface SiteContentRecord extends BaseRecord {
  key: string;
  title?: string;
  body?: string;
  metadata?: Record<string, unknown>;
  isPublished: boolean;
}
export interface StoreSettingsRecord extends BaseRecord {
  key: string;
  brandTagline?: string;
  address?: string;
  phone?: string;
  whatsapp?: string;
  mapUrl?: string;
  mapPlusCode?: string;
  latitude?: number;
  longitude?: number;
  socialLinks?: Record<string, string>;
  freeShipping: boolean;
  shippingZones: Array<{ name: string; cities: string[]; amount: number }>;
}
export interface SessionRecord extends BaseRecord {
  user: Ref<UserRecord>;
  refreshTokenHash: string;
  expiresAt: Date;
  revokedAt?: Date;
  userAgent?: string;
  ip?: string;
}
export interface AuditLogRecord extends BaseRecord {
  actor?: Types.ObjectId;
  action: string;
  targetType: string;
  targetId?: string;
  before?: unknown;
  after?: unknown;
  ip?: string;
}
export type OrderDocument = HydratedDocument<OrderRecord>;
