"use client";
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import api, { money, imageUrl, errorMessage } from '../lib/api';
import { getAuthConfig, getToken } from '../lib/auth';
import { clearGuestCart, getGuestCart, updateGuestItem } from '../lib/guest-cart';

export default function Cart() {
  const router = useRouter();
  const [cart, setCart] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const signedIn = getToken();

  const load = useCallback(async () => {
    setError('');
    try {
      if (signedIn) {
        const response = await api.get('/cart', getAuthConfig());
        setCart(response.data.data);
      } else {
        const saved = getGuestCart();
        const records = await Promise.all(saved.map(async (item) => {
          try {
            const response = await api.get(`/product-variants/${item.productVariantId}`);
            const variant = response.data.data;
            const unitPrice = Number(variant.variantPrice ?? variant.product?.basePrice ?? 0);
            return { id: variant.id, quantity: item.quantity, unitPrice, subtotal: unitPrice * item.quantity, productVariant: variant, unavailable: !variant.isActive || item.quantity > variant.stockQuantity };
          } catch { return null; }
        }));
        const items = records.filter(Boolean);
        setCart({ items, totalItems: items.reduce((sum, item) => sum + item.quantity, 0), totalAmount: items.reduce((sum, item) => sum + item.subtotal, 0) });
      }
    } catch (requestError) { setError(errorMessage(requestError)); }
  }, [signedIn]);

  useEffect(() => {
    // Loading is an external API/local-storage synchronization.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);
  async function update(item, quantity) {
    setBusy(true);
    try {
      if (signedIn) {
        if (quantity === 0) await api.delete(`/cart/items/${item.id}`, getAuthConfig());
        else await api.patch(`/cart/items/${item.id}`, { quantity }, getAuthConfig());
      } else updateGuestItem(item.productVariant.id, quantity);
      sessionStorage.removeItem('solix_checkout_key');
      await load();
    } catch (requestError) { setError(errorMessage(requestError)); }
    finally { setBusy(false); }
  }
  async function clearBag() {
    if (!window.confirm('Remove every item from your bag?')) return;
    setBusy(true);
    try { if (signedIn) await api.delete('/cart/clear', getAuthConfig()); else clearGuestCart(); await load(); }
    catch (requestError) { setError(errorMessage(requestError)); }
    finally { setBusy(false); }
  }
  async function saveForLater(item) {
    if (!signedIn) { router.push('/login?next=/cart'); return; }
    setBusy(true);
    try { await api.post(`/wishlist/${item.productVariant.product.id}`); await api.delete(`/cart/items/${item.id}`, getAuthConfig()); await load(); }
    catch (requestError) { setError(errorMessage(requestError)); }
    finally { setBusy(false); }
  }

  return <main className="section">
    <span className="eyebrow">GOOD CHOICES, ALL TOGETHER</span>
    <h1 className="page-title">Your shopping bag.</h1>
    {!signedIn && cart?.items?.length > 0 && <div className="status-note">Your bag is saved on this device. Sign in at checkout and it will move into your account.</div>}
    {error && <div role="alert" className="status-note error-note">{error} <button onClick={load}>Retry</button></div>}
    {!cart && !error && <p role="status">Opening your bag…</p>}
    {cart?.items.length === 0 && <div className="empty-state"><h2>A little room for something good.</h2><p>Your bag is empty. Find your next everyday favourite.</p><Link href="/shop" className="button dark">Explore the collection ↗</Link></div>}
    {cart?.items.length > 0 && <div className="commerce-grid"><div><div className="bag-tools"><span>{cart.totalItems} pieces</span><button className="text-link danger" disabled={busy} onClick={clearBag}>Clear bag</button></div>{cart.items.map(item => <article className="cart-row" key={item.id}><div className="cart-thumb"><Image src={imageUrl(item.productVariant?.product?.images?.[0]?.imageUrl)} alt={item.productVariant?.product?.name || 'Unavailable item'} fill unoptimized sizes="95px" /></div><div><h2>{item.productVariant?.product?.name || 'Unavailable item'}</h2><p>{item.productVariant?.colourName && item.productVariant.colourName !== 'Default' ? `${item.productVariant.colourName} · ` : ''}Size {item.productVariant?.size?.name || '—'}</p>{item.unavailable ? <p role="alert">This quantity is no longer available.</p> : <div className="quantity-control"><button disabled={busy || item.quantity <= 1} aria-label="Decrease quantity" onClick={() => update(item, item.quantity - 1)}>−</button><span>{item.quantity}</span><button disabled={busy || item.quantity >= item.productVariant?.stockQuantity} aria-label="Increase quantity" onClick={() => update(item, item.quantity + 1)}>+</button></div>}{signedIn && <button className="save-later" disabled={busy} onClick={() => saveForLater(item)}>Save for later</button>}</div><div className="cart-price">{money(item.subtotal)}<button disabled={busy} onClick={() => update(item, 0)}>Remove</button></div></article>)}<Link href="/shop" className="text-link cart-continue">← Continue browsing</Link></div><aside className="summary-box"><h2>Order summary</h2><div className="summary-row"><span>Subtotal ({cart.totalItems} items)</span><span>{money(cart.totalAmount)}</span></div><div className="summary-row"><span>Delivery</span><span>Complimentary</span></div><div className="summary-row total"><span>Total</span><span>{money(cart.totalAmount)}</span></div><button className="button dark" disabled={busy || cart.items.some(item => item.unavailable)} onClick={() => router.push(signedIn ? '/checkout' : '/login?next=/checkout')}>{signedIn ? 'Continue to checkout' : 'Sign in to checkout'} <span>↗</span></button></aside></div>}
  </main>;
}
