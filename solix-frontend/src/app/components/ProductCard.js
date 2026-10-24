import Link from 'next/link';
import Image from 'next/image';
import Tilt from './Tilt';
import ProductActions from './ProductActions';
import { imageUrl, money } from '../lib/api';

export default function ProductCard({ product }) {
  const onSale = Number(product.compareAtPrice) > Number(product.basePrice);
  const thumbnail = imageUrl(product.images?.[0]?.imageUrl);
  const description = product.seoDescription || product.description || '';
  return <Tilt className="product-card">
    <Link href={`/products/${product.slug || product.id}`} className="product-card-link">
      <div className="product-photo">
        <Image src={thumbnail} alt={product.images?.[0]?.alt || `${product.name} by Solix Bangladesh`} title={product.name} fill sizes="(max-width: 600px) 50vw, (max-width: 1000px) 33vw, 25vw" quality={85} unoptimized={!thumbnail.startsWith('/images/')} />
        <span className="product-badge">{product.variants?.some((variant) => variant.stockQuantity > 0) ? onSale ? 'SPECIAL PRICE' : 'SOLIX / EDIT 01' : 'SOLD OUT'}</span>
        <span className="product-arrow" aria-hidden="true">↗</span>
      </div>
      <div className="product-meta"><h3>{product.name}</h3><span>{money(product.basePrice)}</span></div>
      <p className="product-sub">{product.category?.name} <span>·</span> {[...new Set(product.variants?.map((variant) => variant.size?.name).filter(Boolean))].join(' / ')}</p>
      {description && <p className="product-excerpt">{description}</p>}
    </Link>
    <ProductActions product={product} />
  </Tilt>;
}
