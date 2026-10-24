"use client";

import { useEffect, useState } from "react";
import api from "../lib/api";
import ProductCard from "./ProductCard";

export default function RecentlyViewed() {
  const [products, setProducts] = useState([]);
  useEffect(() => {
    let active = true;
    const ids = JSON.parse(localStorage.getItem("solix_recent_products") || "[]").slice(0, 4);
    Promise.all(ids.map((id) => api.get(`/products/${id}`).then((response) => response.data.data).catch(() => null))).then((items) => active && setProducts(items.filter(Boolean)));
    return () => { active = false; };
  }, []);
  if (!products.length) return null;
  return <section className="section recently-viewed"><div className="section-heading"><div><span className="eyebrow">PICK UP WHERE YOU LEFT OFF</span><h2>Recently viewed.</h2></div><button className="text-link" onClick={() => { localStorage.removeItem("solix_recent_products"); setProducts([]); }}>Clear history</button></div><div className="product-grid">{products.map((product) => <ProductCard product={product} key={product.id}/>)}</div></section>;
}
