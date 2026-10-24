import ProductClient from './ProductClient';

const apiBase = process.env.SERVER_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
const siteBase = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001';

function productImageUrl(image) {
  if (!image) return undefined;
  if (image.startsWith('http')) return image;
  if (image.startsWith('/images/')) return `${siteBase}${image}`;
  return `${apiBase}/${image.replace(/^\//, '')}`;
}

async function productByRoute(id) {
  const objectId = /^[a-f\d]{24}$/i.test(String(id));
  try {
    const response = await fetch(
      `${apiBase}${objectId ? `/products/${id}` : `/products/slug/${id}`}`,
      { cache: 'no-store' },
    );
    if (!response.ok) return null;
    return (await response.json()).data || null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }) {
  const { id } = await params;
  const product = await productByRoute(id);
  if (!product) return { title: 'Product' };
  const image = product.images?.[0]?.imageUrl;
  const imageUrl = productImageUrl(image);
  return {
    title: { absolute: product.seoTitle || `${product.name} | Solix Bangladesh` },
    description: product.seoDescription || product.description,
    alternates: { canonical: `${siteBase}/products/${product.slug || product.id}` },
    openGraph: {
      title: product.name,
      description: product.seoDescription || product.description,
      type: 'website',
      url: `${siteBase}/products/${product.slug || product.id}`,
      images: imageUrl ? [{ url: imageUrl, alt: product.name }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: product.name,
      description: product.seoDescription || product.description,
      images: imageUrl ? [imageUrl] : [],
    },
  };
}

export default async function ProductPage({ params }) {
  const { id } = await params;
  const product = await productByRoute(id);
  const available = (product?.variants || []).some(
    (variant) => variant.isActive !== false && variant.stockQuantity > 0,
  );
  const productSchema = product
    ? {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: product.name,
        description: product.seoDescription || product.description,
        image: (product.images || []).map((item) => productImageUrl(item.imageUrl)),
        sku: product.variants?.[0]?.sku,
        brand: { '@type': 'Brand', name: 'Solix' },
        offers: {
          '@type': 'Offer',
          priceCurrency: 'BDT',
          price: product.basePrice,
          availability: available
            ? 'https://schema.org/InStock'
            : 'https://schema.org/OutOfStock',
          url: `${siteBase}/products/${product.slug || product.id}`,
        },
      }
    : null;
  const breadcrumbSchema = product
    ? {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Shop', item: `${siteBase}/shop` },
          {
            '@type': 'ListItem',
            position: 2,
            name: product.category?.name || 'Collection',
            item: `${siteBase}/shop?category=${encodeURIComponent(product.category?.name || '')}`,
          },
          {
            '@type': 'ListItem',
            position: 3,
            name: product.name,
            item: `${siteBase}/products/${product.slug || product.id}`,
          },
        ],
      }
    : null;

  return (
    <>
      {productSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(productSchema).replace(/</g, '\\u003c'),
          }}
        />
      )}
      {breadcrumbSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(breadcrumbSchema).replace(/</g, '\\u003c'),
          }}
        />
      )}
      <ProductClient />
    </>
  );
}
