"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import api, { errorMessage } from "../lib/api";
import { getToken } from "../lib/auth";
import ProductCard from "../components/ProductCard";
export default function WishlistPage(){const router=useRouter();const [items,setItems]=useState(null);const [error,setError]=useState("");useEffect(()=>{if(!getToken()){router.replace("/login?next=/wishlist");return;}api.get("/wishlist").then(r=>setItems(r.data.data?.products||r.data.data||[])).catch(e=>{if(e.response?.status===401)router.replace("/login?next=/wishlist");else setError(errorMessage(e));});},[router]);return <main className="section"><span className="eyebrow">SAVED FOR LATER</span><h1 className="page-title">Your wishlist.</h1><p className="page-intro">Keep your favourite Solix pieces together and return when you are ready.</p>{error&&<p className="status-note error-note">{error}</p>}{items===null&&!error&&<div className="skeleton detail-loading"/>}{items?.length?<div className="product-grid">{items.map(p=><ProductCard product={p} key={p.id}/>)}</div>:items&&<div className="empty-state"><h2>Nothing saved yet.</h2><p>Tap the heart on any product to keep it here.</p><Link href="/shop" className="button dark">Find a favourite ↗</Link></div>}</main>}
