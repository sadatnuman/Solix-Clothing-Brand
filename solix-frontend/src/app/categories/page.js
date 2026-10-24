"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import api, { errorMessage, imageUrl } from '../lib/api';

const categoryImages = {
  Panjabi: '/images/catalog/royal-panjabi.png',
  'T-Shirts': '/images/catalog/navy-tee.png',
  Shirts: '/images/catalog/oxford-shirt.png',
  'Polo Shirts': '/images/catalog/knit-polo.png',
  Denim: '/images/catalog/indigo-denim.png',
  Jackets: '/images/catalog/bomber-jacket.png',
  Trousers: '/images/catalog/chino-trouser.png',
  Hoodies: '/images/catalog/cream-hoodie.png',
  "Women's Wear": '/images/catalog/navy-dress.png',
  Watches: '/images/catalog/royal-watch.png',
  Essentials: '/images/essentials.jpg',
  Layers: '/images/layers.jpg',
  Knitwear: '/images/knit.jpg',
};

export default function Categories() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    api
      .get('/categories')
      .then((response) => setData(response.data.data))
      .catch((requestError) => setError(errorMessage(requestError)));
  }, []);
  return (
    <main className="section">
      <span className="eyebrow">FIND YOUR EVERYDAY</span>
      <h1 style={{ fontSize: 48, margin: '15px 0 35px' }}>A little of everything.</h1>
      {error && <p className="status-note error-note" role="alert">{error}</p>}
      {!data && !error && <p role="status">Loading collections…</p>}
      <div className="collection-grid category-collection-grid" style={{ padding: 0 }}>
        {data?.map((category) => (
          <Link key={category.id} href={`/categories/${category.id}`} className="collection-card">
            <Image
              src={category.imageUrl ? imageUrl(category.imageUrl) : categoryImages[category.name] || '/images/essentials.jpg'}
              alt={category.name}
              fill
              sizes="(max-width: 760px) 100vw, 50vw"
              unoptimized={Boolean(category.imageUrl)}
            />
            <div>
              <span className="eyebrow">SOLIX COLLECTION</span>
              <h2>{category.name}</h2>
              <span>Explore the edit ↗</span>
            </div>
          </Link>
        ))}
      </div>
      {data?.length === 0 && <p className="empty-state">New collections are coming soon.</p>}
    </main>
  );
}
