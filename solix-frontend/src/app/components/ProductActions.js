"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '../lib/api';
import { getToken } from '../lib/auth';
import { addGuestItem } from '../lib/guest-cart';

export default function ProductActions({ product }) {
  const router = useRouter();
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const variant = product.variants?.find((item) => item.stockQuantity > 0);
  async function wishlist() {
    if (!getToken()) { router.push(`/login?next=${encodeURIComponent('/products/' + product.id)}`); return; }
    setBusy(true);
    try { await api.post(`/wishlist/${product.id}`); setSaved(true); } finally { setBusy(false); }
  }
  async function quickAdd() {
    if (!variant) return;
    setBusy(true);
    try {
      if (getToken()) await api.post('/cart/items', { productVariantId: variant.id, quantity: 1 });
      else addGuestItem(variant.id, 1);
      router.push('/cart');
    } finally { setBusy(false); }
  }
  return <div className="product-actions">
    <button type="button" className={saved ? 'saved' : ''} aria-label={saved ? `${product.name} saved` : `Save ${product.name}`} onClick={wishlist} disabled={busy}>{saved ? '♥' : '♡'}</button>
    <button type="button" aria-label={`Quick add ${product.name}`} onClick={quickAdd} disabled={busy || !variant}>{variant ? 'Quick add' : 'Sold out'}</button>
  </div>;
}
