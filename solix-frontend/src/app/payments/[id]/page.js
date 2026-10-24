"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api, { errorMessage } from "../../lib/api";
import { getAuthConfig, getToken, removeToken } from "../../lib/auth";

export default function PaymentDetailsPage() {
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const params = useParams();
  const router = useRouter();

  useEffect(() => {
    if (!getToken()) {
      router.push("/login");
      return;
    }
    api.get(`/payments/${params.id}`, getAuthConfig())
      .then((response) => setPayment(response.data.data))
      .catch((requestError) => {
        if (requestError.response?.status === 401) {
          removeToken();
          router.push("/login");
          return;
        }
        setError(errorMessage(requestError));
      })
      .finally(() => setLoading(false));
  }, [params.id, router]);

  return (
    <main className="section account-subpage" style={{ maxWidth: 760 }}>
      <div className="account-page-actions">
        <button type="button" onClick={() => router.push("/orders")} className="text-link">← My orders</button>
        {payment?.order?.id && <button type="button" onClick={() => router.push(`/orders/${payment.order.id}`)} className="text-link">View order</button>}
      </div>
      <span className="eyebrow">MANUAL PAYMENT</span>
      <h1 className="page-title">Payment details.</h1>
      {loading && <p role="status">Loading payment…</p>}
      {error && <p className="status-note error-note" role="alert">{error}</p>}
      {!loading && !error && payment && <div className="summary-box payment-detail-card">
        <div className="admin-record-head"><h2>{payment.order?.orderNumber || "Payment record"}</h2><span className={`status-pill ${payment.status}`}>{payment.status}</span></div>
        <div className="summary-row"><span>Method</span><strong>{String(payment.method).replaceAll("_", " ")}</strong></div>
        <div className="summary-row"><span>Transaction ID</span><strong>{payment.transactionRef || "Not required"}</strong></div>
        <div className="summary-row"><span>Submitted</span><strong>{payment.submittedAt ? new Date(payment.submittedAt).toLocaleString() : "Pending"}</strong></div>
        <div className="summary-row"><span>Verified</span><strong>{payment.paidAt ? new Date(payment.paidAt).toLocaleString() : "Waiting for review"}</strong></div>
        {payment.rejectionReason && <p className="status-note error-note">{payment.rejectionReason}</p>}
      </div>}
    </main>
  );
}
