import CategoryClient from './CategoryClient';

const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
const siteBase = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001';

async function categoryById(id) {
  try {
    const response = await fetch(`${apiBase}/categories/${id}`, {
      cache: 'no-store',
    });
    if (!response.ok) return null;
    return (await response.json()).data || null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }) {
  const { id } = await params;
  const category = await categoryById(id);
  if (!category) return { title: 'Collection' };
  return {
    title: category.name,
    description: category.description,
    alternates: { canonical: `${siteBase}/categories/${category.id}` },
    openGraph: {
      title: `${category.name} | Solix`,
      description: category.description,
      url: `${siteBase}/categories/${category.id}`,
    },
  };
}

export default function CategoryPage() {
  return <CategoryClient />;
}
