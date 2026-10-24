import { NestFactory } from '@nestjs/core';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { INestApplicationContext } from '@nestjs/common';
import {
  UserRecord,
  CategoryRecord,
  ProductRecord,
  SizeRecord,
  VariantRecord,
} from './types';
import { UserRole } from '../common/enums/user-role.enum';
type SeedModels = {
  User: UserRecord;
  Category: CategoryRecord;
  Product: ProductRecord;
  Size: SizeRecord;
  ProductVariant: VariantRecord;
  Collection: import('./types').CollectionRecord;
  Coupon: import('./types').CouponRecord;
  SiteContent: import('./types').SiteContentRecord;
  StoreSettings: import('./types').StoreSettingsRecord;
};
import * as bcrypt from 'bcrypt';
import { AppModule } from '../app.module';
export async function seed(app: INestApplicationContext) {
  const model = <K extends keyof SeedModels>(name: K): Model<SeedModels[K]> =>
    app.get<Model<SeedModels[K]>>(getModelToken(name));
  const categories: Record<string, CategoryRecord | null> = {};
  for (const [name, description] of [
    ['Essentials', 'The foundation of an effortless wardrobe.'],
    ['Layers', 'Texture, warmth and a little more character.'],
    ['Denim', 'Easy shapes for wherever the day takes you.'],
    ['Knitwear', 'Soft textures. Slow mornings.'],
    ['Panjabi', 'Timeless Bengali occasion wear with a royal point of view.'],
    ['T-Shirts', 'Premium everyday jersey in considered colours.'],
    ['Shirts', 'Polished cotton shirts for work and weekends.'],
    [
      'Polo Shirts',
      'Textured polos made for effortless smart-casual dressing.',
    ],
    ['Jackets', 'Structured outerwear for city days and evening plans.'],
    ['Trousers', 'Clean tailoring with room to move.'],
    ['Hoodies', 'Elevated comfort in substantial cotton fleece.'],
    ["Women's Wear", 'Graceful silhouettes with modest, modern lines.'],
    ['Watches', 'Refined finishing pieces for every wrist.'],
  ])
    categories[name] = await model('Category').findOneAndUpdate(
      { name },
      { $setOnInsert: { name, description } },
      { upsert: true, new: true },
    );
  const sizes: Array<SizeRecord | null> = [];
  for (const name of ['XS', 'S', 'M', 'L', 'XL'])
    sizes.push(
      await model('Size').findOneAndUpdate(
        { name },
        { $setOnInsert: { name } },
        { upsert: true, new: true },
      ),
    );
  const oneSize = await model('Size').findOneAndUpdate(
    { name: 'One Size' },
    { $setOnInsert: { name: 'One Size' } },
    { upsert: true, new: true },
  );
  if (!oneSize) throw new Error('Could not create the One Size option');
  const catalog = [
    {
      name: 'The Everyday Tee',
      category: 'Essentials',
      price: 890,
      images: ['catalog/everyday-tee-v2.png', 'tee.jpg'],
      colour: 'Soft Ivory',
      hex: '#eee7d5',
      material: '240 GSM combed cotton jersey',
      fit: 'Relaxed boxy fit',
      care: 'Machine wash cold inside out. Do not bleach. Dry in shade and use a cool iron.',
      description:
        'A substantial ivory tee with a clean crew neck, relaxed shoulder and soft hand feel. It is cut to sit neatly on its own or under an overshirt.',
      sizeGuide:
        'Relaxed boxy fit. S: chest 40 in · M: 42 in · L: 44 in · XL: 46 in. Size down for a closer fit.',
      tags: ['everyday', 'heavyweight-tee', 'ivory'],
    },
    {
      name: 'The Sunday Knit',
      category: 'Knitwear',
      price: 2490,
      images: ['catalog/sunday-knit-v2.png', 'knit.jpg'],
      colour: 'Oatmeal',
      hex: '#cdbda4',
      material: 'Breathable cotton acrylic cable knit',
      fit: 'Regular fit with an easy shoulder',
      care: 'Gentle hand wash in cool water. Reshape and dry flat away from direct sunlight.',
      description:
        'An oatmeal cable-knit layer with a soft ribbed neck and cuffs. Warm without feeling heavy, it is made for cooler mornings and unhurried weekends.',
      sizeGuide:
        'Regular knit fit. S: chest 38 in · M: 40 in · L: 42 in · XL: 44 in. Choose your usual size.',
      tags: ['sunday', 'cable-knit', 'oatmeal'],
    },
    {
      name: 'Relaxed Denim',
      category: 'Denim',
      price: 2190,
      images: ['catalog/relaxed-denim-v2.png', 'denim.jpg'],
      colour: 'Mid Blue',
      hex: '#55708e',
      material: '12.5 oz cotton denim with 1% elastane',
      fit: 'Relaxed straight leg',
      care: 'Wash inside out with dark colours. Use cold water and line dry to preserve the wash.',
      description:
        'Mid-blue denim with an easy rise and room through the thigh. A touch of stretch keeps the straight silhouette comfortable from the first wear.',
      sizeGuide:
        'Relaxed straight fit. S: waist 30 in · M: 32 in · L: 34 in · XL: 36 in. Inseam: 30 in.',
      tags: ['denim', 'straight-leg', 'mid-blue'],
    },
    {
      name: 'The City Layer',
      category: 'Layers',
      price: 3490,
      images: ['catalog/city-layer-v2.png', 'jacket.jpg'],
      colour: 'Deep Navy',
      hex: '#18223d',
      material: 'Water-resistant cotton nylon shell with soft lining',
      fit: 'Relaxed layering fit',
      care: 'Close all fastenings and machine wash cold on a gentle cycle. Hang dry.',
      description:
        'A clean navy city jacket with discreet pockets, a light protective shell and enough room for knitwear. Built for commutes, evening plans and changing weather.',
      sizeGuide:
        'Designed for layering. S: chest 42 in · M: 44 in · L: 46 in · XL: 48 in.',
      tags: ['city', 'light-jacket', 'navy'],
    },
    {
      name: 'Essential Cotton Tee',
      category: 'Essentials',
      price: 990,
      images: ['catalog/essential-cotton-tee-v2.png', 'essentials.jpg'],
      colour: 'Muted Olive',
      hex: '#697254',
      material: '220 GSM compact cotton jersey',
      fit: 'Clean regular fit',
      care: 'Machine wash at 30°C with similar colours. Turn inside out before washing.',
      description:
        'A muted-olive crew-neck tee in dense compact cotton. The regular cut and reinforced neckline make it a reliable part of a weekly rotation.',
      sizeGuide:
        'Regular fit. S: chest 38 in · M: 40 in · L: 42 in · XL: 44 in.',
      tags: ['essential', 'cotton-tee', 'olive'],
    },
    {
      name: 'Soft Structure Knit',
      category: 'Knitwear',
      price: 2690,
      images: ['catalog/soft-structure-knit-v2.png', 'knit.jpg'],
      colour: 'Stone Beige',
      hex: '#b9aa92',
      material: 'Fine-gauge cotton viscose knit',
      fit: 'Semi-fitted structured silhouette',
      care: 'Hand wash cool or use a delicate bag. Dry flat and steam lightly if needed.',
      description:
        'A fine stone-beige knit with a softly structured shoulder and smooth finish. It brings polish to denim while remaining comfortable all day.',
      sizeGuide:
        'Semi-fitted knit. S: chest 37 in · M: 39 in · L: 41 in · XL: 43 in. Size up for ease.',
      tags: ['fine-knit', 'structured', 'stone'],
    },
    {
      name: 'Weekend Straight Jeans',
      category: 'Denim',
      price: 2390,
      images: ['denim.jpg', 'catalog/relaxed-denim-v2.png'],
      colour: 'Washed Blue',
      hex: '#6f88a2',
      material: '13 oz washed rigid cotton denim',
      fit: 'High-rise straight leg',
      care: 'Wash sparingly inside out in cold water. Line dry and avoid tumble drying.',
      description:
        'A softly washed straight jean with a comfortable high rise and full-length leg. The authentic denim develops more character with every wear.',
      sizeGuide:
        'High-rise straight fit. S: waist 28 in · M: 30 in · L: 32 in · XL: 34 in. Inseam: 31 in.',
      tags: ['weekend', 'rigid-denim', 'washed-blue'],
    },
    {
      name: 'The Off Duty Jacket',
      category: 'Layers',
      price: 3890,
      images: [
        'catalog/off-duty-jacket-v2.png',
        'layers.jpg',
        'catalog/city-layer-v2.png',
      ],
      colour: 'Warm Sand',
      hex: '#b49d79',
      material: 'Midweight cotton canvas with tonal lining',
      fit: 'Relaxed utility fit',
      care: 'Gentle machine wash cold. Hang dry and press on the reverse.',
      description:
        'A warm-sand utility jacket with roomy patch pockets and a relaxed shape. The sturdy canvas is softened for immediate, off-duty comfort.',
      sizeGuide:
        'Relaxed outerwear fit. S: chest 43 in · M: 45 in · L: 47 in · XL: 49 in.',
      tags: ['off-duty', 'canvas-jacket', 'sand'],
    },
    {
      name: 'The Easy Crew',
      category: 'Essentials',
      price: 1190,
      images: [
        'catalog/easy-crew-v2.png',
        'essentials.jpg',
        'catalog/everyday-tee-v2.png',
      ],
      colour: 'Heather Grey',
      hex: '#a6a5a0',
      material: 'Loopback cotton French terry',
      fit: 'Relaxed crew-neck fit',
      care: 'Machine wash cold with similar colours. Reshape while damp and line dry.',
      description:
        'A lightweight heather-grey crew made from breathable loopback cotton. Finished with soft ribbing for an easy layer across seasons.',
      sizeGuide:
        'Relaxed crew fit. S: chest 41 in · M: 43 in · L: 45 in · XL: 47 in.',
      tags: ['crewneck', 'french-terry', 'heather-grey'],
    },
    {
      name: 'A Little Texture',
      category: 'Knitwear',
      price: 2290,
      images: ['knit.jpg', 'catalog/soft-structure-knit-v2.png'],
      colour: 'Natural Cream',
      hex: '#ded5c3',
      material: 'Textured waffle-knit cotton',
      fit: 'Easy straight fit',
      care: 'Wash on a delicate cold cycle. Dry flat to maintain the textured surface.',
      description:
        'A natural-cream waffle knit that adds quiet texture without extra weight. The straight cut works neatly with both relaxed denim and tailored trousers.',
      sizeGuide:
        'Easy straight fit. S: chest 39 in · M: 41 in · L: 43 in · XL: 45 in.',
      tags: ['waffle-knit', 'texture', 'cream'],
    },
    {
      name: 'Everyday Blue Denim',
      category: 'Denim',
      price: 2490,
      images: ['catalog/indigo-denim.png', 'denim.jpg'],
      colour: 'Indigo Blue',
      hex: '#344761',
      material: '11.5 oz comfort-stretch cotton denim',
      fit: 'Slim-straight leg',
      care: 'Wash inside out at 30°C. Do not bleach. Line dry to protect the indigo colour.',
      description:
        'A dependable indigo jean cut slim through the seat and straight below the knee. Comfort stretch gives movement while retaining a crisp profile.',
      sizeGuide:
        'Slim-straight fit. S: waist 30 in · M: 32 in · L: 34 in · XL: 36 in. Inseam: 30 in.',
      tags: ['everyday-denim', 'slim-straight', 'indigo'],
    },
    {
      name: 'The Evening Layer',
      category: 'Layers',
      price: 4190,
      images: ['jacket.jpg', 'catalog/bomber-jacket.png'],
      colour: 'Midnight Black',
      hex: '#252628',
      material: 'Brushed cotton twill with satin lining',
      fit: 'Longline relaxed fit',
      care: 'Professional dry clean recommended. Air between wears and store on a broad hanger.',
      description:
        'A midnight-black longline jacket with brushed texture and a smooth lining. Its restrained shape adds definition to evening looks without feeling formal.',
      sizeGuide:
        'Longline relaxed fit. S: chest 42 in · M: 44 in · L: 46 in · XL: 48 in.',
      tags: ['evening', 'longline-jacket', 'black'],
    },
    {
      name: 'Cotton Rotation Tee',
      category: 'Essentials',
      price: 790,
      images: ['tee.jpg', 'catalog/navy-tee.png'],
      colour: 'Charcoal',
      hex: '#3d4040',
      material: '180 GSM breathable cotton jersey',
      fit: 'Classic regular fit',
      care: 'Machine wash cold. Do not bleach. Tumble dry low or line dry.',
      description:
        'A breathable charcoal tee for daily rotation. The lighter jersey, classic length and resilient neck rib make it an effortless first layer.',
      sizeGuide:
        'Classic fit. S: chest 38 in · M: 40 in · L: 42 in · XL: 44 in.',
      tags: ['rotation', 'lightweight-tee', 'charcoal'],
    },
    {
      name: 'Slow Morning Knit',
      category: 'Knitwear',
      price: 2790,
      images: ['catalog/cream-hoodie.png', 'knit.jpg'],
      colour: 'Soft Sage',
      hex: '#8c9877',
      material: 'Soft cotton wool blend',
      fit: 'Oversized cocoon fit',
      care: 'Hand wash cool with mild detergent. Do not wring. Reshape and dry flat.',
      description:
        'A soft-sage knit with dropped shoulders and a generous cocoon shape. Warm, calm and tactile, it is designed for slow starts and cooler evenings.',
      sizeGuide:
        'Intentionally oversized. S/M: chest 44 in · L/XL: chest 48 in. Choose the smaller size for less volume.',
      tags: ['slow-morning', 'oversized-knit', 'sage'],
    },
    {
      name: 'The Daily Straight',
      category: 'Denim',
      price: 2590,
      images: ['catalog/relaxed-denim-v2.png', 'catalog/indigo-denim.png'],
      colour: 'Rinse Indigo',
      hex: '#26374f',
      material: '13 oz rigid ring-spun cotton denim',
      fit: 'Classic straight leg',
      care: 'Turn inside out and wash cold only when needed. Line dry and expect natural indigo fading.',
      description:
        'A dark rinse jean with a true straight leg and clean five-pocket construction. The rigid denim breaks in gradually for a fit that becomes your own.',
      sizeGuide:
        'Classic straight fit. S: waist 30 in · M: 32 in · L: 34 in · XL: 36 in. Inseam: 31 in.',
      tags: ['daily-straight', 'rigid-denim', 'rinse-indigo'],
    },
    {
      name: 'Lightweight Overshirt',
      category: 'Layers',
      price: 2890,
      images: ['catalog/oxford-shirt.png', 'layers.jpg'],
      colour: 'Warm Khaki',
      hex: '#a7946f',
      material: 'Breathable cotton linen twill',
      fit: 'Relaxed overshirt fit',
      care: 'Machine wash cold on a gentle cycle. Hang dry and steam to remove creases.',
      description:
        'A warm-khaki cotton-linen overshirt with a neat point collar and practical chest pockets. Light enough for sun, substantial enough for evening air.',
      sizeGuide:
        'Relaxed overshirt fit. S: chest 42 in · M: 44 in · L: 46 in · XL: 48 in.',
      tags: ['overshirt', 'cotton-linen', 'khaki'],
    },
  ];
  const everyday = await model('Collection').findOneAndUpdate(
    { slug: 'everyday-edit' },
    {
      $setOnInsert: {
        name: 'The Everyday Edit',
        slug: 'everyday-edit',
        description: 'Easy pieces for every part of the day.',
        sortOrder: 1,
        isActive: true,
      },
    },
    { upsert: true, new: true },
  );
  for (const [index, item] of catalog.entries()) {
    const slug = item.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const product = await model('Product').findOneAndUpdate(
      { slug },
      {
        $set: {
          name: item.name,
          slug,
          category: categories[item.category]!._id,
          collections: [everyday._id],
          basePrice: item.price,
          compareAtPrice: item.price > 2000 ? item.price + 400 : null,
          material: item.material,
          fit: item.fit,
          care: item.care,
          tags: item.tags,
          status: 'active',
          isActive: true,
          featured: index < 6,
          description: item.description,
          sizeGuide: item.sizeGuide,
          seoTitle: `${item.name} | Solix Bangladesh`,
          seoDescription: item.description,
          images: item.images.map((image, imageIndex) => ({
            imageUrl: `/images/${image}`,
            alt: `${item.name} in ${item.colour} by Solix Bangladesh${imageIndex ? `, view ${imageIndex + 1}` : ''}`,
            colour: item.colour,
            sortOrder: imageIndex,
            isPrimary: imageIndex === 0,
          })),
        },
      },
      { upsert: true, new: true },
    );
    for (const size of sizes)
      await model('ProductVariant').updateOne(
        { product: product._id, size: size!._id },
        {
          $set: {
            colourName: item.colour,
            colourHex: item.hex,
            lowStockThreshold: 5,
            isActive: true,
          },
          $setOnInsert: {
            product: product._id,
            size: size!._id,
            stockQuantity: 20,
            sku: `SLX-${String(product._id).slice(-6).toUpperCase()}-${size!.name}`,
          },
        },
        { upsert: true },
      );
  }
  const royalCatalog = [
    {
      name: 'Royal Ivory Panjabi',
      category: 'Panjabi',
      price: 2890,
      image: 'royal-panjabi',
      material: 'Premium breathable cotton with embroidered detailing',
      fit: 'Classic straight fit',
      colour: 'Ivory',
      hex: '#efe8d5',
      description:
        'A refined ivory Panjabi finished with restrained navy and antique-gold embroidery. Designed for Eid, weddings and evenings when quiet elegance matters.',
    },
    {
      name: 'Signature Navy Tee',
      category: 'T-Shirts',
      price: 1090,
      image: 'navy-tee',
      material: '240 GSM combed cotton jersey',
      fit: 'Relaxed fit',
      colour: 'Royal Navy',
      hex: '#111858',
      description:
        'A substantial everyday tee with a clean neckline, easy shoulder and rich royal-navy colour that holds its shape from morning to late plans.',
    },
    {
      name: 'Sand Oxford Shirt',
      category: 'Shirts',
      price: 1990,
      image: 'oxford-shirt',
      material: 'Breathable Oxford cotton',
      fit: 'Modern relaxed fit',
      colour: 'Sand',
      hex: '#d4c3a4',
      description:
        'A softly structured Oxford shirt in warm sand. The balanced weight, neat collar and relaxed cut make it equally at home at work or over a tee.',
    },
    {
      name: 'Olive Texture Polo',
      category: 'Polo Shirts',
      price: 1690,
      image: 'knit-polo',
      material: 'Textured cotton knit',
      fit: 'Regular fit',
      colour: 'Muted Olive',
      hex: '#66704f',
      description:
        'A breathable knit polo with a tactile surface and open, comfortable collar. Smart enough for dinner and relaxed enough for every day.',
    },
    {
      name: 'Midnight Straight Denim',
      category: 'Denim',
      price: 2490,
      image: 'indigo-denim',
      material: '13 oz rigid cotton denim',
      fit: 'Straight leg',
      colour: 'Dark Indigo',
      hex: '#202c48',
      description:
        'Dark indigo denim cut straight through the leg with durable seams and a clean finish. Built to soften beautifully while keeping its shape.',
    },
    {
      name: 'City Bomber Jacket',
      category: 'Jackets',
      price: 4290,
      image: 'bomber-jacket',
      material: 'Matte cotton twill with soft lining',
      fit: 'Structured relaxed fit',
      colour: 'Charcoal',
      hex: '#343536',
      description:
        'A sharp charcoal bomber with a matte finish, premium zip and substantial ribbing. An easy final layer for city evenings and cooler days.',
    },
    {
      name: 'Stone Tailored Chino',
      category: 'Trousers',
      price: 2290,
      image: 'chino-trouser',
      material: 'Brushed cotton twill',
      fit: 'Tapered tailored fit',
      colour: 'Stone',
      hex: '#c7bca6',
      description:
        'Clean stone chinos with precise tailoring and comfortable movement. A versatile foundation for polos, shirts and laid-back knitwear.',
    },
    {
      name: 'Cloudweight Hoodie',
      category: 'Hoodies',
      price: 2790,
      image: 'cream-hoodie',
      material: 'Heavyweight brushed cotton fleece',
      fit: 'Relaxed unisex fit',
      colour: 'Heather Cream',
      hex: '#e9e3d6',
      description:
        'Soft inside, substantial outside. This cream hoodie uses heavyweight fleece, deep ribbing and a generous hood for elevated everyday comfort.',
    },
    {
      name: 'Noor Navy Dress',
      category: "Women's Wear",
      price: 3590,
      image: 'navy-dress',
      material: 'Fluid premium crepe',
      fit: 'Modest flowing fit',
      colour: 'Deep Navy',
      hex: '#10174f',
      description:
        'A graceful deep-navy dress with subtle antique-gold piping and a fluid full-length silhouette. Designed for understated celebration.',
    },
    {
      name: 'Crown Dial Watch',
      category: 'Watches',
      price: 3890,
      image: 'royal-watch',
      material: 'Stainless steel case and genuine leather strap',
      fit: 'Adjustable unisex strap',
      colour: 'Navy & Gold',
      hex: '#c39839',
      description:
        'A refined unisex watch pairing a royal-navy dial with an antique-gold case and dark leather strap—the finishing touch to the Solix point of view.',
    },
  ];
  for (const item of royalCatalog) {
    const slug = item.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const product = await model('Product').findOneAndUpdate(
      { slug },
      {
        $set: {
          name: item.name,
          slug,
          category: categories[item.category]!._id,
          collections: [everyday._id],
          basePrice: item.price,
          compareAtPrice:
            item.price >= 3000 ? item.price + 600 : item.price + 300,
          material: item.material,
          fit: item.fit,
          care:
            item.category === 'Watches'
              ? 'Keep dry. Wipe with a soft cloth after wear.'
              : 'Gentle wash with similar colours. Follow the garment care label.',
          tags: [
            'royal-edit',
            item.category.toLowerCase(),
            item.colour.toLowerCase(),
          ],
          status: 'active',
          featured: true,
          isActive: true,
          description: item.description,
          sizeGuide:
            item.category === 'Watches'
              ? 'Adjustable strap fits wrists from 15–21 cm.'
              : 'Choose your usual Solix size. See the measurement guide before ordering.',
          seoTitle: `${item.name} | Solix Bangladesh`,
          seoDescription: item.description,
          images: [
            {
              imageUrl: `/images/catalog/${item.image}.png`,
              alt: item.name,
              colour: item.colour,
              sortOrder: 0,
              isPrimary: true,
            },
          ],
        },
      },
      { upsert: true, new: true },
    );
    const productSizes = item.category === 'Watches' ? [oneSize] : sizes;
    if (item.category === 'Watches')
      await model('ProductVariant').updateMany(
        { product: product._id, size: { $ne: oneSize._id } },
        { $set: { isActive: false } },
      );
    for (const size of productSizes)
      await model('ProductVariant').updateOne(
        { product: product._id, size: size!._id, colourName: item.colour },
        {
          $setOnInsert: {
            product: product._id,
            size: size!._id,
            stockQuantity: 12,
            sku: `SLX-${String(product._id).slice(-6).toUpperCase()}-${size!.name.replace(/\s+/g, '-')}-${item.colour
              .replace(/[^A-Z]/gi, '')
              .slice(0, 3)
              .toUpperCase()}`,
            colourName: item.colour,
            colourHex: item.hex,
            lowStockThreshold: 4,
            isActive: true,
          },
        },
        { upsert: true },
      );
  }
  await model('Coupon').updateOne(
    { code: 'WELCOME10' },
    {
      $setOnInsert: {
        code: 'WELCOME10',
        type: 'percentage',
        value: 10,
        minSpend: 1500,
        maxDiscount: 500,
        perCustomerLimit: 1,
        usedCount: 0,
        usedBy: [],
        eligibleProducts: [],
        eligibleCategories: [],
        isActive: true,
      },
    },
    { upsert: true },
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
  await model('SiteContent').updateOne(
    { key: 'about' },
    {
      $set: {
        title: 'Royal elegance, made wearable.',
        body: 'Solix is an apparel and clothing brand from Baharpur, Baliakandi, Rajbari. Our point of view is simple: “Elevate Your Style with the Timeless Luxury of Royal Elegance.”\n\nOur public collections include premium Panjabi, watches for men and women, winter clothing, baggy trousers and modern everyday essentials.\n\nVisit Solix at Baharpur Bazar beside Ramdia Road, Rajbari, Bangladesh. Google Maps plus code: MHM8+W8H. Call 01969-259503 or follow @solixbd on TikTok and Solix on Facebook.',
        metadata: {
          source: 'Solix public Facebook page',
          facebook: 'https://www.facebook.com/profile.php?id=61579012483848',
          googleMaps:
            'https://www.google.com/maps/place/Solix/@23.6848093,89.5657056,18.48z/data=!4m6!3m5!1s0x39fe4300553e0f83:0xb818e742a6ee3efd!8m2!3d23.6848205!4d89.5658677!16s%2Fg%2F11xs5x5tb5?entry=ttu',
        },
        isPublished: true,
      },
    },
    { upsert: true },
  );
  if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
    if (process.env.ADMIN_PASSWORD.length < 8)
      throw new Error('ADMIN_PASSWORD must contain at least 8 characters');
    const email = process.env.ADMIN_EMAIL.trim().toLowerCase();
    const existing = await model('User').findOne({ email });
    if (existing && existing.role !== UserRole.ADMIN)
      throw new Error(
        'Admin email belongs to a customer. Choose another email.',
      );
    if (!existing)
      await model('User').create({
        email,
        fullName: 'Solix Studio',
        phone: '',
        address: '',
        passwordHash: await bcrypt.hash(process.env.ADMIN_PASSWORD, 12),
        role: 'admin',
      });
  }
  console.log(
    'Demo catalog ready. Existing catalog, stock and accounts were preserved.',
  );
}
async function main() {
  const app = await NestFactory.createApplicationContext(AppModule);
  try {
    await seed(app);
  } finally {
    await app.close();
  }
}
if (require.main === module)
  void main().catch((error: unknown) => {
    const message =
      error instanceof Error ? error.message : 'Unknown database error';
    console.error(`Seed failed: ${message}`);
    process.exitCode = 1;
  });
