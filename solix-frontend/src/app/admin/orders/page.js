"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import api, { errorMessage, money } from "../../lib/api";
import { getAuthConfig, removeToken } from "../../lib/auth";

const transitions = {
  pending: ["pending", "confirmed", "cancelled"],
  payment_review: ["payment_review", "confirmed", "cancelled"],
  confirmed: ["confirmed", "processing", "cancelled"],
  processing: ["processing", "packed", "cancelled"],
  packed: ["packed", "shipped", "cancelled"],
  shipped: ["shipped", "delivered"],
  delivered: ["delivered"],
  return_requested: ["return_requested", "returned"],
  returned: ["returned"],
  cancelled: ["cancelled"],
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [statusInputs, setStatusInputs] = useState({});
  const [trackingInputs, setTrackingInputs] = useState({});
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const router = useRouter();

  const fetchOrders = async () => {
    const response = await api.get("/orders", getAuthConfig());
    const data = response.data.data || [];
    setOrders(data);
    setStatusInputs(Object.fromEntries(data.map((order) => [order.id, order.orderStatus])));
    setTrackingInputs(Object.fromEntries(data.map((order) => [order.id, order.tracking || { carrier: "", trackingNumber: "", trackingUrl: "" }])));
  };

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const response = await api.get("/orders", getAuthConfig());
        const data = response.data.data || [];
        if (active) {
          setOrders(data);
          setStatusInputs(Object.fromEntries(data.map((order) => [order.id, order.orderStatus])));
          setTrackingInputs(Object.fromEntries(data.map((order) => [order.id, order.tracking || { carrier: "", trackingNumber: "", trackingUrl: "" }])));
        }
      } catch (requestError) {
        if (requestError.response?.status === 401) {
          removeToken();
          router.replace("/login?next=/admin/orders");
        } else if (active) setError(errorMessage(requestError));
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [router]);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return orders.filter((order) =>
      (filter === "all" || order.orderStatus === filter) &&
      (!needle || `${order.orderNumber} ${order.user?.fullName || ""} ${order.contactPhone}`.toLowerCase().includes(needle)),
    );
  }, [orders, filter, query]);

  const update = async (order) => {
    const next = statusInputs[order.id];
    if (next === order.orderStatus) return;
    setSavingId(order.id);
    setError("");
    setMessage("");
    try {
      await api.patch(`/orders/${order.id}/status`, { orderStatus: next }, getAuthConfig());
      setMessage(`${order.orderNumber} is now ${next}.`);
      await fetchOrders();
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setSavingId(null);
    }
  };

  const updateTracking = async (order) => {
    const tracking = trackingInputs[order.id] || {};
    if (!tracking.carrier?.trim() || !tracking.trackingNumber?.trim()) { setError("Carrier and tracking number are required."); return; }
    setSavingId(order.id); setError("");
    try { await api.patch(`/orders/${order.id}/tracking`, tracking, getAuthConfig()); setMessage(`Tracking saved for ${order.orderNumber}.`); await fetchOrders(); }
    catch (requestError) { setError(errorMessage(requestError)); }
    finally { setSavingId(null); }
  };

  return (
    <main className="studio-page">
      <div className="studio-heading"><div><span className="eyebrow">FULFILMENT DESK</span><h1>Orders.</h1></div><span>{orders.length} total</span></div>
      <div className="admin-filters">
        <label><span>Search</span><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Order, customer or phone" /></label>
        <label><span>Status</span><select value={filter} onChange={(event) => setFilter(event.target.value)}><option value="all">All orders</option>{Object.keys(transitions).map((status) => <option value={status} key={status}>{status.replaceAll("_", " ")}</option>)}</select></label>
      </div>
      {loading && <p role="status">Loading orders…</p>}
      {error && <p className="status-note error-note" role="alert">{error}</p>}
      {message && <p className="status-note" role="status">{message}</p>}
      {!loading && !visible.length && <div className="empty-state"><p>No orders match this view.</p></div>}
      <div className="admin-card-list">
        {visible.map((order) => (
          <article className="admin-record" key={order.id}>
            <div className="admin-record-head"><div><span className="eyebrow">{new Date(order.createdAt).toLocaleDateString("en-GB")}</span><h2>{order.orderNumber}</h2></div><span className={`status-pill ${order.orderStatus}`}>{order.orderStatus}</span></div>
            <div className="admin-record-grid"><p><small>Customer</small>{order.user?.fullName || "Unavailable"}</p><p><small>Payment</small>{order.paymentMethod.replaceAll("_", " ")} · <span className={`status-pill ${order.paymentStatus}`}>{order.paymentStatus}</span></p><p><small>Total</small>{money(order.totalAmount)}</p><p><small>Contact</small>{order.contactPhone}</p></div>
            <div className="admin-record-actions">
              <select aria-label={`Status for ${order.orderNumber}`} value={statusInputs[order.id] || order.orderStatus} onChange={(event) => setStatusInputs((current) => ({ ...current, [order.id]: event.target.value }))}>{transitions[order.orderStatus].map((status) => <option key={status} value={status}>{status}</option>)}</select>
              <button type="button" disabled={savingId === order.id || statusInputs[order.id] === order.orderStatus} onClick={() => update(order)}>{savingId === order.id ? "Updating…" : "Save status"}</button>
              <Link className="text-link" href={`/orders/${order.id}`}>View details ↗</Link>
              {order.orderStatus === "confirmed" && order.paymentMethod !== "cash_on_delivery" && order.paymentStatus !== "verified" && <span className="action-hint">Verify the Send Money transfer before delivery.</span>}
            </div>
            {["confirmed", "processing", "packed", "shipped"].includes(order.orderStatus) && <div className="tracking-editor"><input aria-label="Courier" placeholder="Courier" value={trackingInputs[order.id]?.carrier || ""} onChange={(event) => setTrackingInputs((current) => ({ ...current, [order.id]: { ...(current[order.id] || {}), carrier: event.target.value } }))}/><input aria-label="Tracking number" placeholder="Tracking number" value={trackingInputs[order.id]?.trackingNumber || ""} onChange={(event) => setTrackingInputs((current) => ({ ...current, [order.id]: { ...(current[order.id] || {}), trackingNumber: event.target.value } }))}/><input aria-label="Tracking URL" type="url" placeholder="Tracking URL (optional)" value={trackingInputs[order.id]?.trackingUrl || ""} onChange={(event) => setTrackingInputs((current) => ({ ...current, [order.id]: { ...(current[order.id] || {}), trackingUrl: event.target.value } }))}/><button onClick={() => updateTracking(order)} disabled={savingId === order.id}>Save tracking</button></div>}
          </article>
        ))}
      </div>
    </main>
  );
}
