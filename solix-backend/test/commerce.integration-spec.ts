/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-return */
// HTTP assertions intentionally inspect untyped JSON and isolated test fixtures.
import { Test } from '@nestjs/testing';
import { ValidationPipe } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import request from 'supertest';
import { randomUUID } from 'crypto';
import { unlink } from 'fs/promises';
import { join } from 'path';
import { DatabaseFilter } from '../src/common/database.filter';

describe('Solix commerce with a real MongoDB replica set', () => {
  let repl: MongoMemoryReplSet;
  let app: any;
  let server: any;
  const model = (name: string) => app.get(getModelToken(name));
  const token = (value: string) => `Bearer ${value}`;
  let admin: string, alice: string, bob: string, variant: string;
  beforeAll(async () => {
    repl = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
    process.env.MONGODB_URI = repl.getUri('solix_test');
    process.env.JWT_SECRET = randomUUID();
    process.env.BKASH_NUMBER = '01700000000';
    process.env.NAGAD_NUMBER = '';
    const { AppModule } = await import('../src/app.module');
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = module.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.useGlobalFilters(new DatabaseFilter());
    await app.init();
    server = app.getHttpServer();
    for (const name of [
      'User',
      'Category',
      'Size',
      'Product',
      'ProductVariant',
      'Cart',
      'Order',
      'Payment',
    ])
      await model(name).syncIndexes();
  });
  afterAll(async () => {
    if (app) await app.close();
    if (repl) await repl.stop();
  });
  beforeEach(async () => {
    for (const name of [
      'Payment',
      'Order',
      'Cart',
      'ProductVariant',
      'Product',
      'Category',
      'Size',
      'User',
    ])
      await model(name).deleteMany({});
    for (const name of ['admin', 'alice', 'bob']) {
      await request(server)
        .post('/auth/register')
        .send({
          fullName: name,
          email: `${name}@example.test`,
          phone: '01700000000',
          address: 'Dhaka, Bangladesh',
          password: 'TestPassword123!',
        })
        .expect(201);
      if (name === 'admin')
        await model('User').updateOne(
          { email: 'admin@example.test' },
          { $set: { role: 'admin' } },
        );
      const r = await request(server)
        .post('/auth/login')
        .send({ email: `${name}@example.test`, password: 'TestPassword123!' })
        .expect(201);
      const cookie = (r.headers['set-cookie'] as unknown as string[])
        .find((value) => value.startsWith('solix_access_token='))!
        .split(';')[0]
        .split('=')[1];
      if (name === 'admin') admin = cookie;
      if (name === 'alice') alice = cookie;
      if (name === 'bob') bob = cookie;
    }
    const c = await model('Category').create({ name: 'Essentials' });
    const s = await model('Size').create({ name: 'M' });
    const p = await model('Product').create({
      name: 'Everyday tee',
      slug: 'everyday-tee',
      category: c._id,
      basePrice: 890,
    });
    const v = await model('ProductVariant').create({
      product: p._id,
      size: s._id,
      stockQuantity: 5,
    });
    variant = v.id;
  });
  async function add(who = alice, quantity = 1, id = variant) {
    return request(server)
      .post('/cart/items')
      .set('Authorization', token(who))
      .send({ productVariantId: id, quantity });
  }
  async function order(
    who = alice,
    key = randomUUID(),
    method = 'cash_on_delivery',
  ) {
    return request(server)
      .post('/orders')
      .set('Authorization', token(who))
      .send({
        deliveryAddress: 'Dhaka, Bangladesh',
        contactPhone: '01700000000',
        paymentMethod: method,
        checkoutKey: key,
        acceptTerms: true,
      });
  }
  it('rejects unauthorized access, role injection, malformed IDs and invalid quantities', async () => {
    await request(server).get('/cart').expect(401);
    await request(server)
      .get('/users/customers')
      .set('Authorization', token(alice))
      .expect(403);
    await request(server)
      .post('/auth/register')
      .send({
        fullName: 'Mallory',
        email: 'x@example.test',
        phone: '1',
        address: 'Dhaka',
        password: 'TestPassword123!',
        role: 'admin',
      })
      .expect(400);
    await request(server).get('/products/not-an-id').expect(400);
    expect((await add(alice, 0)).status).toBe(400);
    expect((await add(alice, 1.5)).status).toBe(400);
    const r = await request(server)
      .get('/users/customers')
      .set('Authorization', token(admin))
      .expect(200);
    expect(JSON.stringify(r.body)).not.toContain('passwordHash');
  });
  it('rejects duplicate email and incorrect passwords', async () => {
    await request(server)
      .post('/auth/login')
      .send({ email: 'alice@example.test', password: 'WrongPassword' })
      .expect(401);
    const r = await request(server).post('/auth/register').send({
      fullName: 'Duplicate',
      email: 'ALICE@example.test',
      phone: '1',
      address: 'Dhaka',
      password: 'TestPassword123!',
    });
    expect([400, 409]).toContain(r.status);
  });
  it('enforces customer, scoped staff and admin access across role endpoints', async () => {
    await model('User').updateOne(
      { email: 'bob@example.test' },
      { $set: { role: 'staff', permissions: ['catalog'] } },
    );
    const staffLogin = await request(server)
      .post('/auth/login')
      .send({ email: 'bob@example.test', password: 'TestPassword123!' })
      .expect(201);
    const staff = (staffLogin.headers['set-cookie'] as unknown as string[])
      .find((value) => value.startsWith('solix_access_token='))!
      .split(';')[0]
      .split('=')[1];
    await request(server)
      .post('/categories')
      .set('Authorization', token(staff))
      .send({ name: 'Staff catalog category' })
      .expect(201);
    await request(server)
      .get('/orders')
      .set('Authorization', token(staff))
      .expect(403);
    await request(server)
      .get('/users/customers')
      .set('Authorization', token(staff))
      .expect(403);
    await request(server)
      .get('/admin/audit')
      .set('Authorization', token(staff))
      .expect(403);
    await model('User').updateOne(
      { email: 'bob@example.test' },
      { $set: { permissions: ['catalog', 'fulfilment', 'support'] } },
    );
    await request(server)
      .get('/orders')
      .set('Authorization', token(staff))
      .expect(200);
    await request(server)
      .get('/users/customers')
      .set('Authorization', token(staff))
      .expect(200);

    const created = await request(server)
      .post('/admin/staff')
      .set('Authorization', token(admin))
      .send({
        fullName: 'Catalog Assistant',
        email: 'assistant@example.test',
        password: 'Temporary123!',
        permissions: ['catalog'],
      })
      .expect(201);
    const listed = await request(server)
      .get('/admin/staff')
      .set('Authorization', token(admin))
      .expect(200);
    expect(listed.body.data.length).toBeGreaterThanOrEqual(2);
    await request(server)
      .patch(`/admin/staff/${created.body.data.id}`)
      .set('Authorization', token(admin))
      .send({ permissions: ['support'], isActive: false })
      .expect(200);
    await request(server)
      .post('/admin/staff')
      .set('Authorization', token(alice))
      .send({
        fullName: 'Forbidden',
        email: 'forbidden@example.test',
        password: 'Temporary123!',
        permissions: ['catalog'],
      })
      .expect(403);
  });
  it('covers health, store configuration, profiles and catalog administration', async () => {
    await request(server).get('/').expect(200, {
      status: 'ok',
      service: 'Solix API',
    });
    const config = await request(server).get('/store/config').expect(200);
    expect(config.body.data.currency).toBe('BDT');
    expect(config.body.data.shippingAmount).toBe(0);
    expect(
      config.body.data.paymentMethods.find(
        (item: { id: string; enabled: boolean }) => item.id === 'bkash',
      ).enabled,
    ).toBe(true);
    expect(
      config.body.data.paymentMethods.find(
        (item: { id: string; enabled: boolean }) => item.id === 'nagad',
      ).enabled,
    ).toBe(false);

    const profile = await request(server)
      .patch('/users/profile')
      .set('Authorization', token(alice))
      .send({ fullName: 'Alice Updated', address: 'Banani, Dhaka' })
      .expect(200);
    expect(profile.body.data.fullName).toBe('Alice Updated');
    await request(server)
      .get('/auth/me')
      .set('Authorization', token(alice))
      .expect(200);

    await request(server)
      .post('/categories')
      .set('Authorization', token(alice))
      .send({ name: 'Forbidden' })
      .expect(403);
    const category = await request(server)
      .post('/categories')
      .set('Authorization', token(admin))
      .send({ name: 'Outerwear', description: 'Light layers' })
      .expect(201);
    await request(server)
      .get(`/categories/${category.body.data.id}`)
      .expect(200);
    await request(server).get('/categories').expect(200);
    await request(server)
      .patch(`/categories/${category.body.data.id}`)
      .set('Authorization', token(admin))
      .send({ description: 'Structured light layers' })
      .expect(200);

    const size = await request(server)
      .post('/sizes')
      .set('Authorization', token(admin))
      .send({ name: 'XXL' })
      .expect(201);
    await request(server).get(`/sizes/${size.body.data.id}`).expect(200);
    await request(server).get('/sizes').expect(200);
    await request(server)
      .patch(`/sizes/${size.body.data.id}`)
      .set('Authorization', token(admin))
      .send({ name: '2XL' })
      .expect(200);

    const product = await request(server)
      .post('/products')
      .set('Authorization', token(admin))
      .send({
        categoryId: category.body.data.id,
        name: 'Field Vest',
        description: 'A light everyday layer.',
        basePrice: 3200,
      })
      .expect(201);
    await request(server)
      .patch(`/products/${product.body.data.id}`)
      .set('Authorization', token(admin))
      .send({ name: 'Field Vest Updated', basePrice: 3300 })
      .expect(200);
    await request(server).get('/products').expect(200);
    await request(server).get(`/products/${product.body.data.id}`).expect(200);

    const upload = await request(server)
      .post(`/products/${product.body.data.id}/images`)
      .set('Authorization', token(admin))
      .attach(
        'file',
        Buffer.from([137, 80, 78, 71, 13, 10, 26, 10, 0]),
        'catalog.png',
      )
      .expect(201);
    await unlink(join(process.cwd(), upload.body.data.imageUrl));
    await request(server)
      .post(`/products/${product.body.data.id}/images`)
      .set('Authorization', token(admin))
      .attach('file', Buffer.from('not an image'), 'catalog.txt')
      .expect(400);

    const createdVariant = await request(server)
      .post('/product-variants')
      .set('Authorization', token(admin))
      .send({
        productId: product.body.data.id,
        sizeId: size.body.data.id,
        stockQuantity: 7,
        variantPrice: 3100,
      })
      .expect(201);
    await request(server)
      .get(`/product-variants/${createdVariant.body.data.id}`)
      .expect(200);
    await request(server).get('/product-variants').expect(200);
    await request(server)
      .get(`/product-variants/product/${product.body.data.id}`)
      .expect(200);
    await request(server)
      .patch(`/product-variants/${createdVariant.body.data.id}`)
      .set('Authorization', token(admin))
      .send({ stockQuantity: 4 })
      .expect(200);
    await request(server)
      .delete(`/product-variants/${createdVariant.body.data.id}`)
      .set('Authorization', token(admin))
      .expect(200);
    await request(server)
      .get(`/product-variants/${createdVariant.body.data.id}`)
      .expect(404);
    await request(server)
      .delete(`/products/${product.body.data.id}`)
      .set('Authorization', token(admin))
      .expect(200);
    await request(server).get(`/products/${product.body.data.id}`).expect(404);

    const unusedCategory = await model('Category').create({ name: 'Unused' });
    const unusedSize = await model('Size').create({ name: 'Unused' });
    await request(server)
      .delete(`/categories/${unusedCategory.id}`)
      .set('Authorization', token(admin))
      .expect(200);
    await request(server)
      .delete(`/sizes/${unusedSize.id}`)
      .set('Authorization', token(admin))
      .expect(200);

    await request(server)
      .get('/admin/dashboard/revenue')
      .set('Authorization', token(admin))
      .expect(200);
    await request(server)
      .get('/admin/dashboard/sold-products')
      .set('Authorization', token(admin))
      .expect(200);
    await request(server).post('/mail/send').expect(404);
  });
  it('updates, removes and clears cart items through their public contracts', async () => {
    await add(alice, 2);
    const first = await request(server)
      .get('/cart')
      .set('Authorization', token(alice))
      .expect(200);
    const itemId = first.body.data.items[0].id;
    const updated = await request(server)
      .patch(`/cart/items/${itemId}`)
      .set('Authorization', token(alice))
      .send({ quantity: 3 })
      .expect(200);
    expect(updated.body.data.items[0].quantity).toBe(3);
    await request(server)
      .delete(`/cart/items/${itemId}`)
      .set('Authorization', token(alice))
      .expect(200);
    await add(alice, 1);
    await request(server)
      .delete('/cart/clear')
      .set('Authorization', token(alice))
      .expect(200);
    const empty = await request(server)
      .get('/cart')
      .set('Authorization', token(alice))
      .expect(200);
    expect(empty.body.data.items).toHaveLength(0);
  });
  it('enforces ownership for carts, orders and payments', async () => {
    await add();
    const cart = await request(server)
      .get('/cart')
      .set('Authorization', token(alice));
    await request(server)
      .patch(`/cart/items/${cart.body.data.items[0].id}`)
      .set('Authorization', token(bob))
      .send({ quantity: 2 })
      .expect(404);
    const o = await order();
    expect(o.status).toBe(201);
    await request(server)
      .get(`/orders/${o.body.data.id}`)
      .set('Authorization', token(bob))
      .expect(403);
    await request(server)
      .get(`/payments/order/${o.body.data.id}`)
      .set('Authorization', token(bob))
      .expect(403);
  });
  it('prices on the server and makes concurrent checkout retries idempotent', async () => {
    await add(alice, 2);
    const key = randomUUID();
    const results = await Promise.all([order(alice, key), order(alice, key)]);
    expect(results.map((r) => r.status)).toEqual([201, 201]);
    expect(results[0].body.data.id).toBe(results[1].body.data.id);
    expect(results[0].body.data.totalAmount).toBe(1780);
    expect(await model('Order').countDocuments()).toBe(1);
    expect(await model('Payment').countDocuments()).toBe(1);
    expect(
      (await model('ProductVariant').findById(variant)).stockQuantity,
    ).toBe(3);
    expect(
      (await request(server).get('/cart').set('Authorization', token(alice)))
        .body.data.items,
    ).toHaveLength(0);
  });
  it('does not oversell the last item under concurrent checkouts', async () => {
    await model('ProductVariant').findByIdAndUpdate(variant, {
      stockQuantity: 1,
    });
    await add(alice);
    await add(bob);
    const results = await Promise.all([order(alice), order(bob)]);
    expect(results.map((r) => r.status).sort()).toEqual([201, 400]);
    expect(
      (await model('ProductVariant').findById(variant)).stockQuantity,
    ).toBe(0);
    expect(await model('Order').countDocuments()).toBe(1);
  });
  it('rolls back earlier stock changes when a later item is unavailable', async () => {
    const v = await model('ProductVariant').findById(variant);
    const size = await model('Size').create({ name: 'L' });
    const second = await model('ProductVariant').create({
      product: v.product,
      size: size._id,
      stockQuantity: 1,
    });
    await add();
    await add(alice, 1, second.id);
    await model('ProductVariant').findByIdAndUpdate(second.id, {
      stockQuantity: 0,
    });
    expect((await order()).status).toBe(400);
    expect(
      (await model('ProductVariant').findById(variant)).stockQuantity,
    ).toBe(5);
    expect(await model('Order').countDocuments()).toBe(0);
    const c = await request(server)
      .get('/cart')
      .set('Authorization', token(alice));
    expect(c.body.data.items).toHaveLength(2);
  });
  it('restores stock once on cancellation and rejects reopening', async () => {
    await add(alice, 2);
    const o = await order();
    const url = `/orders/${o.body.data.id}/status`;
    await request(server)
      .patch(url)
      .set('Authorization', token(admin))
      .send({ orderStatus: 'cancelled' })
      .expect(200);
    await request(server)
      .patch(url)
      .set('Authorization', token(admin))
      .send({ orderStatus: 'cancelled' })
      .expect(400);
    expect(
      (await model('ProductVariant').findById(variant)).stockQuantity,
    ).toBe(5);
    await request(server)
      .patch(url)
      .set('Authorization', token(admin))
      .send({ orderStatus: 'confirmed' })
      .expect(400);
    expect((await model('Payment').findOne()).status).toBe('rejected');
  });
  it('requires Send Money reference and admin verification and synchronizes status', async () => {
    await add();
    const o = await order(alice, randomUUID(), 'bkash');
    expect(o.status).toBe(201);
    await request(server)
      .post('/payments')
      .set('Authorization', token(alice))
      .send({ orderId: o.body.data.id, method: 'bkash' })
      .expect(400);
    const p = await request(server)
      .post('/payments')
      .set('Authorization', token(alice))
      .send({
        orderId: o.body.data.id,
        method: 'bkash',
        transactionRef: 'TX123456',
      })
      .expect(201);
    expect(p.body.data.status).toBe('submitted');
    await request(server)
      .get(`/payments/${p.body.data.id}`)
      .set('Authorization', token(alice))
      .expect(200);
    await request(server)
      .get(`/payments/order/${o.body.data.id}`)
      .set('Authorization', token(alice))
      .expect(200);
    await request(server)
      .get('/payments')
      .set('Authorization', token(admin))
      .expect(200);
    await request(server)
      .get('/orders/my-orders')
      .set('Authorization', token(alice))
      .expect(200);
    await request(server)
      .get('/orders')
      .set('Authorization', token(admin))
      .expect(200);
    await request(server)
      .patch(`/payments/${p.body.data.id}/status`)
      .set('Authorization', token(alice))
      .send({ status: 'verified' })
      .expect(403);
    await request(server)
      .patch(`/payments/${p.body.data.id}/status`)
      .set('Authorization', token(admin))
      .send({ status: 'verified' })
      .expect(200);
    await request(server)
      .delete(`/payments/${p.body.data.id}`)
      .set('Authorization', token(admin))
      .expect(400);
    expect((await model('Order').findById(o.body.data.id)).paymentStatus).toBe(
      'verified',
    );
    await request(server)
      .patch(`/orders/${o.body.data.id}/status`)
      .set('Authorization', token(admin))
      .send({ orderStatus: 'cancelled' })
      .expect(400);
  });
  it('rejects unconfigured Send Money and hides archived products without losing history', async () => {
    await add();
    expect((await order(alice, randomUUID(), 'nagad')).status).toBe(400);
    const o = await order();
    const v = await model('ProductVariant').findById(variant);
    await request(server)
      .delete(`/products/${v.product}`)
      .set('Authorization', token(admin))
      .expect(200);
    await request(server).get(`/products/${v.product}`).expect(404);
    expect((await add()).status).toBe(404);
    const history = await request(server)
      .get(`/orders/${o.body.data.id}`)
      .set('Authorization', token(alice))
      .expect(200);
    expect(history.body.data.items[0].productName).toBe('Everyday tee');
  });
});
