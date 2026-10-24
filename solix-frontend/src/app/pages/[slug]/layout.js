const pages = {
  about: ['About Solix Bangladesh', 'Learn about Solix, a clothing and lifestyle brand from Baharpur, Rajbari, Bangladesh.'],
  faq: ['Frequently Asked Questions', 'Answers about Solix products, sizing, delivery, Send Money payments, returns and customer accounts.'],
  'size-guide': ['Solix Clothing Size Guide', 'Use the Solix measurement guide to choose the right Panjabi, shirt, T-shirt, trouser and outerwear size.'],
  delivery: ['Delivery Information', 'Read Solix Bangladesh delivery areas, charges, processing and order tracking information.'],
  returns: ['Returns & Size Exchanges', 'Read the Solix return and size exchange process for eligible clothing orders.'],
  privacy: ['Privacy Policy', 'Read how Solix Bangladesh handles account, order and support information.'],
  terms: ['Terms & Conditions', 'Read the terms for using and ordering from the Solix Bangladesh website.'],
};

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const [title, description] = pages[slug] || ['Solix Information', 'Information from Solix Bangladesh.'];
  return { title, description, alternates: { canonical: `/pages/${slug}` }, openGraph: { title: `${title} | Solix Bangladesh`, description, url: `/pages/${slug}`, images: [{ url: '/images/solix-social-preview.png', width: 1200, height: 630, alt: 'Solix Bangladesh royal fashion collection' }] }, twitter: { card: 'summary_large_image', images: ['/images/solix-social-preview.png'] } };
}

export default function InformationLayout({ children }) { return children; }
