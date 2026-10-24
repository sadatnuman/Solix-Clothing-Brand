import { Suspense } from 'react';
import Shop from '../components/Shop';
export const metadata={title:'Shop Premium Clothing, Panjabi & Watches',description:'Shop the Solix Bangladesh collection with search and filters for category, size, colour, price, availability and offers.',alternates:{canonical:'/shop'},openGraph:{title:'Shop Solix Bangladesh',description:'Discover premium Panjabi, clothing, women’s wear and watches from Solix Bangladesh.',url:'/shop',images:[{url:'/images/solix-royal-logo.jpg',width:960,height:960,alt:'Solix Bangladesh logo'}]}};
export default function ShopPage(){return <Suspense fallback={<main className="section">Loading collection…</main>}><Shop/></Suspense>}
