"use client";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import api, { errorMessage, imageUrl, money } from "../../lib/api";
import { getAuthConfig, removeToken } from "../../lib/auth";

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [statusInputs, setStatusInputs] = useState({});
  const [transactionInputs, setTransactionInputs] = useState({});
  const [rejectionInputs, setRejectionInputs] = useState({});
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const router = useRouter();

  const fetchPayments = async () => {
    const response = await api.get("/payments", getAuthConfig());
    const data = response.data.data || [];
    setPayments(data);
    setStatusInputs(Object.fromEntries(data.map((payment) => [payment.id, payment.status])));
    setTransactionInputs(Object.fromEntries(data.map((payment) => [payment.id, payment.transactionRef || ""])));
  };

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const response = await api.get("/payments", getAuthConfig());
        const data = response.data.data || [];
        if (active) {
          setPayments(data);
          setStatusInputs(Object.fromEntries(data.map((payment) => [payment.id, payment.status])));
          setTransactionInputs(Object.fromEntries(data.map((payment) => [payment.id, payment.transactionRef || ""])));
        }
      } catch (requestError) {
        if (requestError.response?.status === 401) {
          removeToken();
          router.replace("/login?next=/admin/payments");
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
    return payments.filter((payment) =>
      (filter === "all" || payment.status === filter) &&
      (!needle || `${payment.order?.orderNumber || ""} ${payment.transactionRef || ""} ${payment.method}`.toLowerCase().includes(needle)),
    );
  }, [payments, filter, query]);

  const update = async (payment) => {
    setSavingId(payment.id);
    setError("");
    setMessage("");
    try {
      await api.patch(`/payments/${payment.id}/status`, {
        status: statusInputs[payment.id],
        transactionRef: transactionInputs[payment.id]?.trim() || undefined,
        rejectionReason: rejectionInputs[payment.id]?.trim() || undefined,
      }, getAuthConfig());
      setMessage(`Payment for ${payment.order?.orderNumber || payment.id} was updated.`);
      await fetchPayments();
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setSavingId(null);
    }
  };

  return (
    <main className="studio-page">
      <div className="studio-heading"><div><span className="eyebrow">VERIFICATION DESK</span><h1>Payments.</h1></div><span>{payments.filter((payment) => ["pending","submitted"].includes(payment.status)).length} waiting</span></div>
      <div className="admin-filters">
        <label><span>Search</span><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Order or transaction ID" /></label>
        <label><span>Status</span><select value={filter} onChange={(event) => setFilter(event.target.value)}><option value="all">All payments</option><option value="pending">Pending</option><option value="submitted">Submitted</option><option value="verified">Verified</option><option value="rejected">Rejected</option><option value="refunded">Refunded</option></select></label>
      </div>
      {loading && <p role="status">Loading payments…</p>}
      {error && <p className="status-note error-note" role="alert">{error}</p>}
      {message && <p className="status-note" role="status">{message}</p>}
      {!loading && !visible.length && <div className="empty-state"><p>No payments match this view.</p></div>}
      <div className="admin-card-list">
        {visible.map((payment) => (
          <article className="admin-record" key={payment.id}>
            <div className="admin-record-head"><div><span className="eyebrow">{payment.method === "cash_on_delivery" ? "CASH ON DELIVERY" : `${payment.method.toUpperCase()} SEND MONEY`}</span><h2>{payment.order?.orderNumber || "Order unavailable"}</h2></div><span className={`status-pill ${payment.status}`}>{payment.status}</span></div>
            <div className="admin-record-grid"><p><small>Amount</small>{money(payment.order?.totalAmount)}</p><p><small>Transaction ID</small>{payment.transactionRef || "Not submitted"}</p><p><small>Submitted</small>{new Date(payment.updatedAt || payment.createdAt).toLocaleString("en-GB")}</p><p><small>Verified at</small>{payment.paidAt ? new Date(payment.paidAt).toLocaleString("en-GB") : "Waiting"}</p></div>
            {payment.proofImageUrl && <a className="payment-proof" href={imageUrl(payment.proofImageUrl)} target="_blank" rel="noreferrer"><Image src={imageUrl(payment.proofImageUrl)} alt={`Payment proof for ${payment.order?.orderNumber || "order"}`} width={180} height={220} unoptimized/><span>Open payment proof ↗</span></a>}
            <div className="admin-record-actions payment-actions">
              <select aria-label="Payment status" value={statusInputs[payment.id] || payment.status} onChange={(event) => setStatusInputs((current) => ({ ...current, [payment.id]: event.target.value }))}>{["pending", "submitted", "verified", "rejected", "refunded"].map((status) => <option key={status}>{status}</option>)}</select>
              <input aria-label="Transaction reference" disabled={payment.method === "cash_on_delivery"} value={transactionInputs[payment.id] || ""} onChange={(event) => setTransactionInputs((current) => ({ ...current, [payment.id]: event.target.value }))} placeholder="Transaction ID" />
              {statusInputs[payment.id] === "rejected" && <input aria-label="Rejection reason" value={rejectionInputs[payment.id] || ""} onChange={(event) => setRejectionInputs((current) => ({ ...current, [payment.id]: event.target.value }))} placeholder="Reason shown to customer" />}
              <button type="button" disabled={savingId === payment.id} onClick={() => update(payment)}>{savingId === payment.id ? "Saving…" : "Verify / update"}</button>
              <Link className="text-link" href={`/payments/${payment.id}`}>Open record ↗</Link>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
