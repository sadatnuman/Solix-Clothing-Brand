import { Suspense } from 'react';
import AuthForm from '../components/AuthForm';
export default function Page(){return <Suspense fallback={<main className="section">Loading…</main>}><AuthForm register={false}/></Suspense>}
