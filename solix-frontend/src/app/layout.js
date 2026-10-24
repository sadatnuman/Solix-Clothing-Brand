import './globals.css';
import { Inter } from 'next/font/google';
import AppHeader from './components/AppHeader';
import Footer from './components/Footer';
import { STORE_INFO } from './lib/store';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001';
const logoUrl = '/images/solix-royal-logo.jpg';
const socialPreviewUrl = '/images/solix-social-preview.png';
const description = 'Shop Solix Bangladesh for premium Panjabi, clothing, watches and modern everyday essentials. Complimentary delivery with Cash on Delivery and bKash or Nagad Send Money.';

export const metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Solix Bangladesh | Premium Clothing, Panjabi & Watches',
    template: '%s | Solix Bangladesh',
  },
  description,
  applicationName: 'Solix Bangladesh',
  keywords: [
    'Solix Bangladesh',
    'Solix clothing',
    'premium Panjabi Bangladesh',
    'clothing store Rajbari',
    'Bangladesh fashion',
    'men clothing Bangladesh',
    'women clothing Bangladesh',
    'watches Bangladesh',
  ],
  creator: 'Solix',
  publisher: 'Solix',
  category: 'Apparel & Clothing',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: [{ url: logoUrl, type: 'image/jpeg', sizes: '960x960' }],
    apple: [{ url: logoUrl, type: 'image/jpeg', sizes: '960x960' }],
  },
  openGraph: {
    type: 'website',
    locale: 'en_BD',
    url: siteUrl,
    siteName: 'Solix Bangladesh',
    title: 'Solix Bangladesh | Premium Clothing, Panjabi & Watches',
    description,
    images: [{ url: socialPreviewUrl, width: 1200, height: 630, alt: 'Solix Bangladesh royal fashion collection' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Solix Bangladesh | Premium Clothing, Panjabi & Watches',
    description,
    images: [socialPreviewUrl],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
};

const storeSchema = {
  '@context': 'https://schema.org',
  '@type': 'ClothingStore',
  '@id': `${siteUrl}/#store`,
  name: 'Solix',
  alternateName: 'Solix Bangladesh',
  url: siteUrl,
  logo: `${siteUrl}${logoUrl}`,
  image: `${siteUrl}${socialPreviewUrl}`,
  description,
  slogan: STORE_INFO.tagline,
  telephone: STORE_INFO.internationalPhone,
  priceRange: '৳৳',
  currenciesAccepted: 'BDT',
  paymentAccepted: 'Cash on Delivery, bKash Send Money, Nagad Send Money',
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'Baharpur Bazar, beside Ramdia Road',
    addressLocality: 'Rajbari',
    addressRegion: 'Dhaka Division',
    addressCountry: 'BD',
  },
  geo: {
    '@type': 'GeoCoordinates',
    latitude: STORE_INFO.latitude,
    longitude: STORE_INFO.longitude,
  },
  hasMap: STORE_INFO.mapUrl,
  knowsAbout: STORE_INFO.productFocus,
  sameAs: [
    STORE_INFO.facebook,
    STORE_INFO.tiktok,
  ],
};

const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  '@id': `${siteUrl}/#website`,
  url: siteUrl,
  name: 'Solix Bangladesh',
  publisher: { '@id': `${siteUrl}/#store` },
  potentialAction: {
    '@type': 'SearchAction',
    target: `${siteUrl}/shop?q={search_term_string}`,
    'query-input': 'required name=search_term_string',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en-BD" className={inter.variable}>
      <body className={inter.className}>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(storeSchema).replace(/</g, '\\u003c') }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema).replace(/</g, '\\u003c') }} />
        <a className="skip-link" href="#content">Skip to content</a>
        <AppHeader />
        <div id="content">{children}</div>
        <Footer />
      </body>
    </html>
  );
}
