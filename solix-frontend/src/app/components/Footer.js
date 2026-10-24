"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import api from "../lib/api";
import { STORE_INFO } from "../lib/store";

const fallback = {
  brandTagline: STORE_INFO.tagline,
  address: STORE_INFO.address,
  phone: STORE_INFO.phone,
  whatsapp: STORE_INFO.whatsapp,
  mapUrl: STORE_INFO.mapUrl,
  mapPlusCode: STORE_INFO.mapPlusCode,
  socialLinks: {
    facebook: STORE_INFO.facebook,
    tiktok: STORE_INFO.tiktok,
  },
};

export default function Footer() {
  const [store, setStore] = useState(fallback);
  useEffect(() => { api.get("/store/settings").then((response) => setStore((current) => ({ ...current, ...response.data.data, socialLinks: { ...current.socialLinks, ...response.data.data.socialLinks } }))).catch(() => {}); }, []);
  return <footer className="site-footer">
    <div className="footer-top">
      <div><Link href="/" className="footer-brand" aria-label="Solix clothing brand home"><span className="footer-logo-frame"><Image src="/images/solix-royal-logo.jpg" fill sizes="112px" alt="Solix crowned S royal logo" className="brand-logo-art"/></span></Link><p>{store.brandTagline}</p></div>
      <div><h3>Explore</h3><Link href="/shop">The collection</Link><Link href="/categories">Categories</Link><Link href="/pages/about">About Solix</Link><Link href="/contact">Contact</Link></div>
      <div><h3>Help</h3><Link href="/pages/faq">FAQ</Link><Link href="/pages/size-guide">Size guide</Link><Link href="/pages/delivery">Delivery</Link><Link href="/pages/returns">Returns</Link></div>
      <div><h3>Your Solix</h3><Link href="/profile">My account</Link><Link href="/orders">Track orders</Link><Link href="/wishlist">Wishlist</Link><Link href="/support">Support inbox</Link></div>
      <div className="footer-note"><span className="eyebrow">VISIT OR CALL</span><p>Royal elegance,<br/>close to home.</p><address>{store.address}<br/><span>{store.mapPlusCode}</span> · <a href={`tel:${store.phone?.replace(/[^+\d]/g, "")}`}>{store.phone}</a></address><div className="social-links"><a href={store.mapUrl || STORE_INFO.mapUrl} target="_blank" rel="noreferrer">Map & directions ↗</a><a href={store.socialLinks?.facebook} target="_blank" rel="noreferrer">Facebook ↗</a><a href={store.socialLinks?.tiktok} target="_blank" rel="noreferrer">TikTok ↗</a></div></div>
    </div>
    <div className="footer-bottom"><span>© {new Date().getFullYear()} Solix.</span><span><Link href="/pages/privacy">Privacy</Link> · <Link href="/pages/terms">Terms</Link></span><a href="#content">Back to top ↑</a></div>
  </footer>;
}
