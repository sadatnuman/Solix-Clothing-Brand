import { NestFactory } from '@nestjs/core';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AppModule } from '../app.module';

const slug = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

async function migrate() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });
  try {
    const model = (name: string) =>
      app.get<Model<Record<string, unknown>>>(getModelToken(name));
    const users = model('User');
    const categories = model('Category');
    const products = model('Product');
    const variants = model('ProductVariant');
    const orders = model('Order');
    const payments = model('Payment');

    await users.updateMany(
      { permissions: { $exists: false } },
      { $set: { permissions: [], mustChangePassword: false } },
    );
    for (const category of await categories.find())
      await categories.updateOne(
        { _id: category._id },
        {
          $set: {
            slug: category.slug || slug(String(category.name)),
            isActive: category.isActive ?? true,
            sortOrder: category.sortOrder ?? 0,
          },
        },
      );
    await products.updateMany(
      { status: { $exists: false } },
      {
        $set: { status: 'active', featured: false, tags: [], collections: [] },
      },
    );
    const sizeModel = model('Size');
    const sizeNames = new Map(
      (await sizeModel.find()).map((item) => [
        String(item._id),
        String(item.name),
      ]),
    );
    for (const variant of await variants.find()) {
      await variants.updateOne(
        { _id: variant._id },
        {
          $set: {
            sku:
              variant.sku ||
              `SLX-${String(variant.product).slice(-6).toUpperCase()}-${(sizeNames.get(String(variant.size)) || 'OS').toUpperCase()}`,
            colourName: variant.colourName || 'Default',
            colourHex: variant.colourHex || '#626d4d',
            lowStockThreshold: variant.lowStockThreshold ?? 5,
          },
        },
      );
    }
    await orders.updateMany({ subtotalAmount: { $exists: false } }, [
      {
        $set: {
          subtotalAmount: '$totalAmount',
          discountAmount: 0,
          timeline: [
            {
              status: '$orderStatus',
              note: 'Imported order',
              at: '$createdAt',
            },
          ],
        },
      },
    ]);
    await orders.updateMany(
      { paymentStatus: 'paid' },
      { $set: { paymentStatus: 'verified' } },
    );
    await orders.updateMany(
      { paymentStatus: 'failed' },
      { $set: { paymentStatus: 'rejected' } },
    );
    await payments.updateMany(
      { status: 'paid' },
      { $set: { status: 'verified' } },
    );
    await payments.updateMany(
      { status: 'failed' },
      { $set: { status: 'rejected' } },
    );

    await model('StoreSettings').updateOne(
      { key: 'store' },
      {
        $set: {
          brandTagline:
            'Elevate Your Style with the Timeless Luxury of Royal Elegance.',
          address: 'Baharpur Bazar, beside Ramdia Road, Rajbari, Bangladesh',
          phone: '01969-259503',
          whatsapp: '+8801969259503',
          mapUrl:
            'https://www.google.com/maps/place/Solix/@23.6848093,89.5657056,18.48z/data=!4m6!3m5!1s0x39fe4300553e0f83:0xb818e742a6ee3efd!8m2!3d23.6848205!4d89.5658677!16s%2Fg%2F11xs5x5tb5?entry=ttu',
          mapPlusCode: 'MHM8+W8H',
          latitude: 23.6848205,
          longitude: 89.5658677,
          socialLinks: {
            facebook: 'https://www.facebook.com/profile.php?id=61579012483848',
            tiktok: 'https://www.tiktok.com/@solixbd',
          },
        },
        $setOnInsert: {
          key: 'store',
          freeShipping: true,
          shippingZones: [{ name: 'Bangladesh', cities: [], amount: 0 }],
        },
      },
      { upsert: true },
    );
    const pages = {
      about: [
        'About Solix',
        'Solix makes considered clothing for everyday life in Bangladesh.',
      ],
      faq: [
        'Frequently asked questions',
        'Find quick answers about ordering, sizing, delivery and care.',
      ],
      'size-guide': [
        'Size guide',
        'Use the measurements on each product page and choose the size that gives you the fit you prefer.',
      ],
      delivery: [
        'Delivery',
        'Delivery is complimentary across Bangladesh during the introductory period.',
      ],
      returns: [
        'Returns & exchanges',
        'Request a return or size exchange from your order page after delivery.',
      ],
      privacy: [
        'Privacy',
        'We use your information only to run your account, fulfil orders and provide support.',
      ],
      terms: [
        'Terms',
        'By placing an order you agree that product availability and manual payment verification may affect fulfilment.',
      ],
    };
    for (const [key, [title, body]] of Object.entries(pages))
      await model('SiteContent').updateOne(
        { key },
        { $setOnInsert: { key, title, body, isPublished: true } },
        { upsert: true },
      );

    for (const name of [
      'User',
      'Category',
      'Size',
      'Product',
      'ProductVariant',
      'Cart',
      'Order',
      'Payment',
      'Address',
      'Collection',
      'Wishlist',
      'Coupon',
      'Review',
      'ReturnRequest',
      'SupportTicket',
      'Notification',
      'InventoryMovement',
      'SiteContent',
      'StoreSettings',
      'Session',
      'AuditLog',
    ])
      await model(name).syncIndexes();
    console.log(
      'Solix data migration complete. Existing IDs and order history were preserved.',
    );
  } finally {
    await app.close();
  }
}

void migrate().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : 'Migration failed');
  process.exitCode = 1;
});
