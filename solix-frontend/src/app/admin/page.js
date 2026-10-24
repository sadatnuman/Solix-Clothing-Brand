"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api, { errorMessage, money } from "../lib/api";
import { getAuthConfig, removeToken } from "../lib/auth";

const destinations = [
  ["/admin/products", "Products", "Build and photograph the collection."],
  ["/admin/variants", "Inventory", "Set size, price and stock."],
  ["/admin/orders", "Orders", "Confirm, fulfil or cancel orders."],
  ["/admin/payments", "Payments", "Verify Send Money references."],
];

export default function AdminPage() {
  const [summary, setSummary] = useState(null);
  const [soldProducts, setSoldProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    let active = true;
    Promise.all([
      api.get("/admin/dashboard/revenue", getAuthConfig()),
      api.get("/admin/dashboard/sold-products", getAuthConfig()),
    ])
      .then(([revenue, sold]) => {
        if (active) {
          setSummary(revenue.data.data);
          setSoldProducts(sold.data.data || []);
        }
      })
      .catch((requestError) => {
        if (requestError.response?.status === 401) {
          removeToken();
          router.replace("/login?next=/admin");
        } else if (active) setError(errorMessage(requestError));
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [router]);

  const metrics = summary ? [
    ["Revenue", money(summary.totalRevenue)],
    ["Delivered", summary.totalDeliveredOrders],
    ["Pending", summary.pendingOrders],
    ["Confirmed", summary.confirmedOrders],
    ["Cancelled", summary.cancelledOrders],
  ] : [];

  return (
    <main className="studio-page">
      <div className="studio-heading"><div><span className="eyebrow">TODAY IN THE STUDIO</span><h1>The whole picture.</h1></div><Link href="/shop" className="text-link">View live store ↗</Link></div>
      {loading && <p role="status">Preparing your dashboard…</p>}
      {error && <p className="status-note error-note" role="alert">{error}</p>}
      {summary && (
        <>
          <section className="metric-grid" aria-label="Store summary">
            {metrics.map(([label, value], index) => <div className={index === 0 ? "metric-card featured" : "metric-card"} key={label}><span>{String(index + 1).padStart(2, "0")} / {label}</span><strong>{value}</strong></div>)}
          </section>
          <section className="studio-grid">
            <div>
              <div className="section-heading compact"><div><span className="eyebrow">QUICK MOVES</span><h2>Keep things moving.</h2></div></div>
              <div className="studio-actions">{destinations.map(([href, title, text], index) => <Link key={href} href={href}><span>{String(index + 1).padStart(2, "0")}</span><div><h3>{title}</h3><p>{text}</p></div><b>↗</b></Link>)}</div>
            </div>
            <div>
              <div className="section-heading compact"><div><span className="eyebrow">WHAT MOVED</span><h2>Sold pieces.</h2></div></div>
              <div className="sold-list">
                {soldProducts.length ? soldProducts.slice(0, 8).map((item, index) => <div key={`${item.productName}-${index}`}><span>{item.productName}</span><b>{item.totalQuantitySold} sold</b><strong>{money(item.totalRevenue)}</strong></div>) : <div className="empty-state"><p>Delivered orders will appear here.</p></div>}
              </div>
            </div>
          </section>
        </>
      )}
    </main>
  );
}
