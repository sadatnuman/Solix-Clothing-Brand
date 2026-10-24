"use client";
import {useEffect,useState} from 'react';
import {useParams} from 'next/navigation';
import Link from 'next/link';
import api,{errorMessage} from '../../lib/api';
import ProductCard from '../../components/ProductCard';
export default function Category(){const {id}=useParams();const [category,setCategory]=useState(null);const [products,setProducts]=useState([]);const [error,setError]=useState('');useEffect(()=>{let active=true;Promise.all([api.get(`/categories/${id}`),api.get('/products',{params:{category:id,limit:48}})]).then(([c,p])=>{if(active){setCategory(c.data.data);setProducts(p.data.data||[]);}}).catch(e=>{if(active)setError(errorMessage(e));});return()=>{active=false;};},[id]);return <main className="section"><Link className="text-link" href="/categories">← Collections</Link>{error&&<p className="status-note error-note" role="alert">{error}</p>}{!category&&!error&&<p role="status">Loading collection…</p>}{category&&<><h1 style={{fontSize:48,margin:'30px 0 15px'}}>{category.name}</h1><p>{category.description}</p><div className="product-grid" style={{marginTop:35}}>{products.map(p=><ProductCard product={p} key={p.id}/>)}</div>{!products.length&&<p className="empty-state">New pieces are coming to this collection soon.</p>}</>}</main>}
