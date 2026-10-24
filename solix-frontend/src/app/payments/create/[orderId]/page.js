"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import api, { errorMessage, money } from "../../../lib/api";
import { getAuthConfig } from "../../../lib/auth";

export default function SendMoney() {
  const { orderId } = useParams();
  const router = useRouter();
  const [order, setOrder] = useState(null);
  const [methods, setMethods] = useState([]);
  const [transactionRef, setTransactionRef] = useState("");
  const [lastFour, setLastFour] = useState("");
  const [proof, setProof] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    Promise.all([
      api.get(`/orders/${orderId}`, getAuthConfig()),
      api.get("/store/config"),
    ])
      .then(([orderResponse, configResponse]) => {
        if (active) {
          setOrder(orderResponse.data.data);
          setMethods(configResponse.data.data.paymentMethods);
        }
      })
      .catch((requestError) => {
        if (requestError.response?.status === 401) router.replace("/login");
        else if (active) setError(errorMessage(requestError));
      });
    return () => {
      active = false;
    };
  }, [orderId, router]);

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await api.post(
        "/payments",
        {
          orderId,
          method: order.paymentMethod,
          transactionRef: transactionRef.trim(),
          senderLastFour: lastFour,
        },
        getAuthConfig(),
      );
      if (proof) {
        const body = new FormData();
        body.append("file", proof);
        await api.post(
          `/payments/${response.data.data.id}/proof`,
          body,
          getAuthConfig(),
        );
      }
      router.push(`/payments/order/${orderId}`);
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setBusy(false);
    }
  }

  const method = methods.find((entry) => entry.id === order?.paymentMethod);

  return (
    <main className="section" style={{ maxWidth: 750 }}>
      <Link href={`/orders/${orderId}`} className="text-link">
        ← Back to order
      </Link>
      <h1 className="page-title">Send Money details.</h1>
      {error && <p className="status-note error-note" role="alert">{error}</p>}
      {!order && !error && <p role="status">Loading your order…</p>}
      {order && (order.paymentMethod === "cash_on_delivery" ? (
        <div className="status-note">Your order uses cash on delivery. Pay when it arrives.</div>
      ) : order.paymentStatus === "verified" ? (
        <div className="status-note">Your payment is already verified.</div>
      ) : order.orderStatus === "cancelled" ? (
        <div className="status-note">This order was cancelled.</div>
      ) : <>
        <div className="summary-box send-money-card">
          <span className="eyebrow">{order.orderNumber}</span>
          <h2>Send {money(order.grandTotal ?? order.totalAmount)} via {method?.label || order.paymentMethod}</h2>
          {method?.enabled ? <ol className="payment-steps">
            <li>Open your {method.label} app.</li>
            <li>Choose <strong>Send Money</strong>.</li>
            <li>Send the exact order total to <strong>{method.number}</strong>.</li>
            <li>Copy the transaction ID and submit it below.</li>
          </ol> : <p>The recipient number is currently unavailable. Please do not send money yet.</p>}
        </div>
        <form className="form-stack account-form" onSubmit={submit}>
          <label>Transaction ID<input required minLength={4} maxLength={100} value={transactionRef} onChange={(event) => setTransactionRef(event.target.value)} placeholder="Example: 9AB12CD34" /></label>
          <label>Sender number last 4 digits<input required pattern="[0-9]{4}" maxLength={4} inputMode="numeric" value={lastFour} onChange={(event) => setLastFour(event.target.value.replace(/\D/g, "").slice(0, 4))} placeholder="1234" /></label>
          <label>Payment screenshot<span className="optional-copy">Optional · JPEG, PNG or WebP · max 3 MB</span><input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => setProof(event.target.files?.[0] || null)} /></label>
          <button className="button dark" disabled={busy || !method?.enabled}>{busy ? "Submitting…" : "Submit for verification ↗"}</button>
        </form>
      </>)}
    </main>
  );
}
