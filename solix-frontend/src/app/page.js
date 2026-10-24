import Link from 'next/link';
import Image from 'next/image';
import Featured from './components/Featured';
import Tilt from './components/Tilt';
import DepthScene from './components/DepthScene';
import RecentlyViewed from './components/RecentlyViewed';

const socialPreview = '/images/solix-linkedin-preview-v2.png';

export const metadata = {
  title: { absolute: 'Solix Bangladesh | Premium Clothing, Panjabi & Watches' },
  description: 'Shop Solix Bangladesh for premium Panjabi, modern clothing, women’s wear and watches with complimentary delivery, Cash on Delivery and manual Send Money.',
  alternates: { canonical: '/' },
  openGraph: {
    title: 'Solix Bangladesh | Royal elegance, made wearable',
    description: 'Premium Panjabi, modern essentials, women’s wear and watches from Rajbari, Bangladesh.',
    url: '/',
    images: [{ url: socialPreview, type: 'image/png', width: 1200, height: 627, alt: 'Solix Bangladesh royal fashion collection' }],
  },
  twitter: { card: 'summary_large_image', images: [socialPreview] },
};

const categories = [
  { href: '/shop?category=Panjabi', image: '/images/catalog/royal-panjabi.png', index: '01', name: 'Panjabi', copy: 'Ceremony, redefined.' },
  { href: '/shop?category=Shirts', image: '/images/catalog/oxford-shirt.png', index: '02', name: 'Shirts', copy: 'Clean lines for every day.' },
  { href: '/shop?category=Jackets', image: '/images/catalog/bomber-jacket.png', index: '03', name: 'Layers', copy: 'Ready when the weather turns.' },
  { href: '/shop?category=Watches', image: '/images/catalog/royal-watch.png', index: '04', name: 'Watches', copy: 'A considered finishing touch.' },
];

export default function Home() {
  return (
    <main className="home">
      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow"><span className="tiny-cross">✳</span> THE ROYAL EDIT — BANGLADESH</div>
          <h1>Not just worn.<br /><em>Lived in.</em></h1>
          <p>Elevate your style with the timeless luxury of royal elegance.<br />Meet considered pieces made for every part of your life.</p>
          <Link href="/shop" className="button dark">Find your Solix <span>↗</span></Link>
          <div className="hero-bottom"><span className="hero-index">01 / 03</span><span className="hero-line" /><span>ROYAL ELEGANCE. EVERYDAY EASE.</span></div>
        </div>
        <div className="hero-visual">
          <Image src="/images/campaign.jpg" alt="Friends in effortless everyday outfits on a city street" fill priority sizes="(max-width: 760px) 100vw, 55vw" className="hero-image" />
          <div className="image-grain" />
          <span className="hero-photo-label">OFF DUTY. ON YOUR TERMS.</span>
          <div className="orbit-stamp" aria-hidden="true"><span>THE ROYAL</span><b>S</b><span>SOLIX · RAJBARI</span></div>
          <Tilt className="floating-note"><span>THE NEW PERSPECTIVE</span><strong>Made for<br />your everyday.</strong><Link href="/shop">Explore the edit ↗</Link></Tilt>
          <div className="image-caption"><span>THE ART OF KEEPING IT SIMPLE</span><span>SOLIX BANGLADESH</span></div>
        </div>
      </section>

      <div className="brand-strip"><span>ROYAL BY DESIGN</span><b>✳</b><span>PREMIUM PANJABI</span><b>✳</b><span>WATCHES FOR HIM &amp; HER</span><b>✳</b><span>WINTER COLLECTION</span><b>✳</b><span>BAGGY TROUSERS</span></div>

      <section className="section">
        <div className="section-heading"><div><span className="eyebrow">THE PIECES YOU COME BACK TO</span><h2>New in. Already you.</h2></div><Link className="text-link" href="/shop">Shop the collection ↗</Link></div>
        <Featured />
      </section>

      <section className="atelier-section section">
        <div className="atelier-copy">
          <span className="eyebrow">THE SOLIX STANDARD</span>
          <h2>Details that reward<br />a closer look.</h2>
          <p>Rich texture, thoughtful proportions and confident colour come together in pieces designed to be seen from every angle.</p>
          <div className="atelier-points"><span><b>01</b> Premium fabric</span><span><b>02</b> Purposeful fit</span><span><b>03</b> Lasting finish</span></div>
          <Link href="/shop" className="button dark">Explore every detail <span>↗</span></Link>
        </div>
        <DepthScene className="atelier-stage">
          <div className="atelier-glow" aria-hidden="true" />
          <div className="atelier-card atelier-back"><Image src="/images/catalog/royal-watch.png" alt="Solix Crown Dial Watch" fill sizes="(max-width: 760px) 48vw, 22vw" /></div>
          <div className="atelier-card atelier-main"><Image src="/images/catalog/royal-panjabi.png" alt="Solix Royal Ivory Panjabi" fill sizes="(max-width: 760px) 65vw, 28vw" /></div>
          <div className="atelier-card atelier-front"><Image src="/images/catalog/bomber-jacket.png" alt="Solix City Bomber Jacket" fill sizes="(max-width: 760px) 38vw, 17vw" /></div>
          <span className="atelier-seal">SOLIX<br /><b>S</b><br />RAJBARI</span>
        </DepthScene>
      </section>

      <section className="collection-grid section">
        <Link href="/shop?category=Panjabi" className="collection-card"><Image src="/images/catalog/royal-panjabi.png" alt="Solix Royal Ivory Panjabi" fill sizes="50vw" /><div><span className="eyebrow">01 — ROYAL ELEGANCE</span><h2>Premium Panjabi.</h2><span>Discover occasion wear ↗</span></div></Link>
        <Link href="/shop?category=Watches" className="collection-card"><Image src="/images/catalog/royal-watch.png" alt="Solix Crown Dial Watch" fill sizes="50vw" /><div><span className="eyebrow">02 — THE FINISHING TOUCH</span><h2>Watches for everyone.</h2><span>Explore the collection ↗</span></div></Link>
      </section>

      <section className="category-runway section">
        <div className="section-heading"><div><span className="eyebrow">CHOOSE YOUR RHYTHM</span><h2>One wardrobe. Many lives.</h2></div><p>Move from ceremony to the everyday without losing your point of view.</p></div>
        <div className="runway-grid">
          {categories.map((category) => (
            <Tilt key={category.name} className="runway-tilt">
              <Link href={category.href} className="runway-card">
                <Image src={category.image} alt={`Shop Solix ${category.name}`} fill sizes="(max-width: 760px) 80vw, 24vw" />
                <span className="runway-number">{category.index}</span>
                <div><h3>{category.name}</h3><p>{category.copy}</p><span>Explore ↗</span></div>
              </Link>
            </Tilt>
          ))}
        </div>
      </section>

      <section className="wardrobe-spectrum section">
        <div className="spectrum-heading">
          <span className="eyebrow">THE COMPLETE WARDROBE</span>
          <h2>More ways to<br />make it yours.</h2>
          <p>From a first layer to a final detail, explore every part of the Solix collection through a clear path.</p>
        </div>
        <div className="spectrum-layout">
          <DepthScene className="spectrum-stage">
            <span className="spectrum-word" aria-hidden="true">SOLIX</span>
            <Link href="/shop?category=Polo%20Shirts" className="spectrum-photo spectrum-photo-one"><Image src="/images/catalog/knit-polo.png" alt="Solix knit polo" fill sizes="(max-width: 760px) 44vw, 20vw" /></Link>
            <Link href="/shop?category=Denim" className="spectrum-photo spectrum-photo-two"><Image src="/images/catalog/indigo-denim.png" alt="Solix indigo denim" fill sizes="(max-width: 760px) 38vw, 18vw" /></Link>
            <Link href="/shop?category=Women%27s%20Wear" className="spectrum-photo spectrum-photo-three"><Image src="/images/catalog/navy-dress.png" alt="Solix navy dress" fill sizes="(max-width: 760px) 38vw, 18vw" /></Link>
            <span className="spectrum-orbit" aria-hidden="true" />
          </DepthScene>
          <nav className="spectrum-categories" aria-label="Shop the full Solix wardrobe">
            {[
              ['Panjabi', '01'], ['Shirts', '02'], ['T-Shirts', '03'], ['Polo Shirts', '04'], ['Hoodies', '05'],
              ['Jackets', '06'], ['Denim', '07'], ['Trousers', '08'], ["Women's Wear", '09'], ['Watches', '10'],
            ].map(([name, index]) => <Link key={name} href={`/shop?category=${encodeURIComponent(name)}`}><span>{index}</span><strong>{name}</strong><b>↗</b></Link>)}
          </nav>
        </div>
      </section>

      <section className="lookbook-section">
        <div className="lookbook-image"><Image src="/images/catalog/soft-structure-knit-v2.png" alt="Solix soft structure knit styled for everyday wear" fill sizes="(max-width: 760px) 100vw, 55vw" /></div>
        <div className="lookbook-copy">
          <span className="eyebrow">THE EVERYDAY FORMULA</span>
          <span className="lookbook-count">03 / 03</span>
          <h2>Soft structure.<br />Strong point<br />of view.</h2>
          <p>Build a look around clean texture, relaxed proportions and one precise finishing detail.</p>
          <div className="lookbook-links"><Link href="/shop?category=Layers">Shop soft layers ↗</Link><Link href="/shop?category=Trousers">Add the foundation ↗</Link><Link href="/shop?category=Watches">Finish with a watch ↗</Link></div>
        </div>
      </section>

      <RecentlyViewed />

      <section id="story" className="story section">
        <div className="story-art royal-story-mark"><Image src="/images/solix-royal-logo-transparent.png" alt="Solix royal crowned S" width={300} height={323} /><span>BAHARPUR · RAJBARI<br />BANGLADESH</span></div>
        <div><span className="eyebrow">THE SOLIX POINT OF VIEW</span><h2>Royal elegance,<br />made wearable.</h2><p>Solix brings premium Panjabi, modern essentials and considered accessories together for life in Bangladesh.</p><p>From Baharpur, Rajbari, we design for celebrations, everyday confidence and everything in between.</p><div className="story-links"><Link href="/pages/about" className="text-link">Meet Solix ↗</Link><Link href="/contact" className="text-link">Visit the Baharpur store ↗</Link></div></div>
      </section>

      <section className="manifesto section">
        <div className="manifesto-intro"><span className="eyebrow">WHY SOLIX</span><h2>Made with intent.<br />Worn on repeat.</h2></div>
        <div className="manifesto-grid">
          <article><span>01</span><h3>Quiet detail</h3><p>Texture, stitching and proportion do the talking, without asking for attention.</p></article>
          <article><span>02</span><h3>Built for Bangladesh</h3><p>Clothing chosen for local seasons, celebrations and the pace of everyday life.</p></article>
          <article><span>03</span><h3>Clarity at every step</h3><p>Visible stock, useful sizing and support from browsing through delivery.</p></article>
        </div>
      </section>

      <section className="journey-section section">
        <div className="journey-editorial">
          <div className="journey-title"><span className="eyebrow">YOUR SOLIX JOURNEY</span><h2>Find it.<br />Make it yours.</h2><p>Four clear steps take you from discovering a piece to following it all the way home.</p></div>
          <DepthScene className="journey-art">
            <div className="journey-photo journey-photo-main"><Image src="/images/catalog/oxford-shirt.png" alt="Solix Oxford shirt" fill sizes="(max-width: 760px) 58vw, 26vw" /></div>
            <div className="journey-photo journey-photo-detail"><Image src="/images/catalog/royal-watch.png" alt="Solix Crown Dial Watch" fill sizes="(max-width: 760px) 34vw, 15vw" /></div>
            <span className="journey-stamp">04<br /><b>STEPS</b><br />ONE SOLIX</span>
          </DepthScene>
        </div>
        <div className="journey-track">
          <article><span>01</span><h3>Discover</h3><p>Search and filter the full collection.</p><Link href="/shop">Browse pieces ↗</Link></article>
          <article><span>02</span><h3>Choose</h3><p>Check measurements, sizes and live stock.</p><Link href="/pages/size-guide">Size guide ↗</Link></article>
          <article><span>03</span><h3>Order</h3><p>Use COD, bKash or Nagad Send Money.</p><Link href="/pages/delivery">Delivery details ↗</Link></article>
          <article><span>04</span><h3>Follow</h3><p>Track orders and support in your account.</p><Link href="/profile">Your account ↗</Link></article>
        </div>
      </section>

      <section className="guide-section section">
        <div className="section-heading"><div><span className="eyebrow">BEFORE YOU CHOOSE</span><h2>Useful details, beautifully clear.</h2></div><p>Everything needed to shop with confidence, collected in one place.</p></div>
        <div className="guide-grid">
          <Link href="/pages/size-guide" className="guide-card guide-card-dark"><span>01 — FIT</span><h3>Measure once.<br />Choose well.</h3><p>Find garment measurements and a simple guide to selecting your Solix size.</p><b>Read the size guide ↗</b><i aria-hidden="true">↔</i></Link>
          <Link href="/pages/delivery" className="guide-card guide-card-gold"><span>02 — DELIVERY</span><h3>From Rajbari<br />to your door.</h3><p>See delivery expectations, order handling and the complimentary shipping offer.</p><b>Delivery details ↗</b><i aria-hidden="true">→</i></Link>
          <Link href="/pages/returns" className="guide-card guide-card-light"><span>03 — AFTERCARE</span><h3>Keep every piece<br />at its best.</h3><p>Review care guidance, returns and size-exchange options before you order.</p><b>Care and returns ↗</b><i aria-hidden="true">◇</i></Link>
        </div>
      </section>

      <section className="visit-banner section">
        <div><span className="eyebrow">SOLIX IN RAJBARI</span><h2>See the collection<br />in person.</h2><p>Visit us at Baharpur Bazar, beside Ramdia Road. Discover the fabric, fit and finish up close.</p><div className="visit-actions"><a className="button dark" href="https://www.google.com/maps/place/Solix/@23.6848205,89.5658677,18z" target="_blank" rel="noreferrer">Open directions <span>↗</span></a><Link className="text-link" href="/contact">Store details ↗</Link></div></div>
        <DepthScene className="visit-emblem"><Image src="/images/solix-royal-logo-transparent.png" alt="Solix crowned S emblem" width={260} height={280} /></DepthScene>
      </section>

      <section className="service-strip"><div><span>01</span><h3>Considered choice</h3><p>Clear sizing, honest stock and detailed materials.</p></div><div><span>02</span><h3>A simpler checkout</h3><p>Cash on delivery or verified Send Money.</p></div><div><span>03</span><h3>Local support</h3><p>Website inbox plus our Rajbari store contact.</p></div></section>
    </main>
  );
}
