"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import api, { errorMessage } from "../lib/api";
import ProductCard from "../components/ProductCard";
export default function WishlistPage(){const [items,setItems]=useState(null);const [error,setError]=useState("");useEffect(()=>{api.get("/wishlist").then(r=>setItems(r.data.data?.products||r.data.data||[])).catch(e=>setError(errorMessage(e)));},[]);return <main className="section"><span className="eyebrow">SAVED FOR LATER</span><h1 className="page-title">Your wishlist.</h1>{error&&<p className="status-note error-note">{error}</p>}{items===null&&<div className="skeleton detail-loading"/>}{items?.length?<div className="product-grid">{items.map(p=><ProductCard product={p} key={p.id}/>)}</div>:items&&<div className="empty-state"><h2>Nothing saved yet.</h2><Link href="/shop" className="button dark">Find a favourite ↗</Link></div>}</main>}
