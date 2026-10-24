const apiBase = process.env.SERVER_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
const siteBase = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001';

async function safeJson(path) {
  try {
    const response = await fetch(`${apiBase}${path}`, { cache: 'no-store' });
    if (!response.ok) return { data: [], meta: {} };
    return await response.json();
  } catch {
    return { data: [], meta: {} };
  }
}

async function allProducts() {
  const first = await safeJson('/products?limit=48&page=1');
  const pages = Number(first.meta?.pages || 1);
  if (pages <= 1) return first.data || [];
  const remaining = await Promise.all(
    Array.from({ length: pages - 1 }, (_, index) =>
      safeJson(`/products?limit=48&page=${index + 2}`),
    ),
  );
  return [first, ...remaining].flatMap((response) => response.data || []);
}

function absoluteImage(path) {
  if (!path) return undefined;
  if (path.startsWith('http')) return path;
  if (path.startsWith('/images/')) return `${siteBase}${path}`;
  return `${apiBase}/${path.replace(/^\//, '')}`;
}

export default async function sitemap() {
  const routes = ['', '/shop', '/categories', '/pages/about', '/pages/faq', '/pages/size-guide', '/pages/delivery', '/pages/returns', '/pages/privacy', '/pages/terms', '/contact'];
  const [products, categories] = await Promise.all([
    allProducts(),
    safeJson('/categories').then((response) => response.data || []),
  ]);
  const updated = new Date();
  return [
    ...routes.map((route) => ({
      url: `${siteBase}${route}`,
      lastModified: updated,
      changeFrequency: route === '/shop' ? 'daily' : 'monthly',
      priority: route === '' ? 1 : route === '/shop' ? 0.9 : 0.6,
    })),
    ...products.map((product) => ({
      url: `${siteBase}/products/${product.slug || product.id}`,
      lastModified: product.updatedAt ? new Date(product.updatedAt) : updated,
      changeFrequency: 'weekly',
      priority: 0.8,
      images: product.images?.[0]?.imageUrl
        ? [absoluteImage(product.images[0].imageUrl)]
        : undefined,
    })),
    ...categories.map((category) => ({
      url: `${siteBase}/categories/${category.id}`,
      lastModified: category.updatedAt ? new Date(category.updatedAt) : updated,
      changeFrequency: 'weekly',
      priority: 0.7,
    })),
  ];
}
