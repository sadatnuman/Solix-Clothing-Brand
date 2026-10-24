export const metadata = {
  title: 'Shop Clothing Categories',
  description: 'Explore Solix Bangladesh clothing categories including premium Panjabi, T-shirts, shirts, polos, denim, jackets, women’s wear and watches.',
  alternates: { canonical: '/categories' },
  openGraph: { title: 'Shop Clothing Categories | Solix Bangladesh', description: 'Browse premium clothing, Panjabi and watches by category at Solix Bangladesh.', url: '/categories', images: [{ url: '/images/solix-social-preview.png', width: 1200, height: 630, alt: 'Solix Bangladesh premium clothing collection' }] },
  twitter: { card: 'summary_large_image', images: ['/images/solix-social-preview.png'] },
};

export default function CategoriesLayout({ children }) { return children; }
