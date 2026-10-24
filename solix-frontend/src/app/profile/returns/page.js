"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api, { errorMessage } from "../../lib/api";

export default function MyReturnsPage() {
  const [items, setItems] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => { api.get("/returns/mine").then((response) => setItems(response.data.data || [])).catch((requestError) => setError(errorMessage(requestError))); }, []);
  return <main className="section account-subpage">
    <Link href="/profile" className="text-link">← Account</Link>
    <div className="section-heading"><div><span className="eyebrow">AFTERCARE</span><h1>Returns & exchanges.</h1></div></div>
    {error && <p className="status-note error-note" role="alert">{error}</p>}
    {!items && !error && <p role="status">Loading your requests…</p>}
    {items?.length === 0 && <div className="empty-state"><h2>No requests yet.</h2><p>Eligible delivered orders can be returned or exchanged from their order page.</p><Link className="button dark" href="/orders">View orders ↗</Link></div>}
    <div className="admin-card-list">{items?.map((request) => <article className="order-card" key={request.id}>
      <div className="order-card-head"><div><span className="eyebrow">{request.type.toUpperCase()} · {new Date(request.createdAt).toLocaleDateString("en-GB")}</span><h2>{request.order?.orderNumber || "Order request"}</h2></div><span className={`status-pill ${request.status}`}>{request.status}</span></div>
      <p>{request.reason}</p>{request.adminNote && <p className="status-note">Solix team: {request.adminNote}</p>}
      {request.order?.id && <Link className="text-link" href={`/orders/${request.order.id}`}>View order ↗</Link>}
    </article>)}</div>
  </main>;
}
