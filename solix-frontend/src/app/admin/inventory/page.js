"use client";

import { useEffect, useState } from "react";
import api, { errorMessage } from "../../lib/api";

export default function InventoryLedgerPage() {
  const [movements, setMovements] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [drafts, setDrafts] = useState({});
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const load = () => Promise.all([api.get("/admin/inventory/movements"), api.get("/admin/inventory/low-stock")]).then(([ledger, low]) => { setMovements(ledger.data.data || []); setLowStock(low.data.data || []); }).catch((requestError) => setError(errorMessage(requestError)));
  useEffect(() => { load(); }, []);

  async function adjust(variant) {
    const entry = drafts[variant.id] || {};
    const quantity = Number(entry.quantity);
    if (!Number.isInteger(quantity) || quantity === 0) { setError("Enter a whole-number stock change, such as 10 or -2."); return; }
    try { await api.post(`/admin/inventory/${variant.id}/adjust`, { quantity, note: entry.note || "Manual stock count" }); setDrafts((current) => ({ ...current, [variant.id]: {} })); setMessage(`${variant.product?.name} stock was adjusted.`); setError(""); load(); }
    catch (requestError) { setError(errorMessage(requestError)); }
  }

  return <main className="studio-page">
    <div className="studio-heading"><div><span className="eyebrow">STOCK CONTROL</span><h1>Inventory ledger.</h1></div><span>{lowStock.length} low-stock variants</span></div>
    {error && <p className="status-note error-note" role="alert">{error}</p>}
    {message && <p className="status-note" role="status">{message}</p>}
    <section><div className="section-heading compact"><div><span className="eyebrow">NEEDS ATTENTION</span><h2>Low-stock queue.</h2></div></div>
      {!lowStock.length && <div className="empty-state">Every active variant is above its low-stock threshold.</div>}
      <div className="admin-card-list">{lowStock.map((variant) => <article className="admin-record" key={variant.id}>
        <div className="admin-record-head"><div><span className="eyebrow">{variant.sku || "NO SKU"} · {variant.size?.name}</span><h2>{variant.product?.name}</h2></div><span className="status-pill rejected">{variant.stockQuantity} left</span></div>
        <div className="inventory-adjust"><label>Change<input type="number" step="1" placeholder="+10" value={drafts[variant.id]?.quantity || ""} onChange={(event) => setDrafts({ ...drafts, [variant.id]: { ...(drafts[variant.id] || {}), quantity: event.target.value } })}/></label><label>Reason<input placeholder="Restock / count correction" value={drafts[variant.id]?.note || ""} onChange={(event) => setDrafts({ ...drafts, [variant.id]: { ...(drafts[variant.id] || {}), note: event.target.value } })}/></label><button onClick={() => adjust(variant)}>Adjust stock</button></div>
      </article>)}</div>
    </section>
    <section className="ledger-section"><div className="section-heading compact"><div><span className="eyebrow">IMMUTABLE HISTORY</span><h2>Recent movements.</h2></div></div>
      <div className="table-wrap"><table><thead><tr><th>Date</th><th>Product</th><th>Size</th><th>Type</th><th>Change</th><th>Stock</th><th>Note</th></tr></thead><tbody>{movements.map((movement) => <tr key={movement.id}><td>{new Date(movement.createdAt).toLocaleString()}</td><td>{movement.variant?.product?.name || "Archived product"}</td><td>{movement.variant?.size?.name || "—"}</td><td>{movement.type}</td><td className={movement.quantity < 0 ? "danger" : "discount"}>{movement.quantity > 0 ? "+" : ""}{movement.quantity}</td><td>{movement.previousStock} → {movement.newStock}</td><td>{movement.note || movement.referenceType || "—"}</td></tr>)}</tbody></table></div>
    </section>
  </main>;
}
