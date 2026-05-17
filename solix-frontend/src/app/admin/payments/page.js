"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "../../lib/api";
import { getAuthConfig, getToken, removeToken } from "../../lib/auth";

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [statusInputs, setStatusInputs] = useState({});
  const [transactionInputs, setTransactionInputs] = useState({});
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const router = useRouter();

  const fetchPayments = async () => {
    const response = await api.get("/payments", getAuthConfig());
    const paymentData = response.data.data || [];

    setPayments(paymentData);

    const statuses = {};
    const transactions = {};
    paymentData.forEach((payment) => {
      statuses[payment.id] = payment.status;
      transactions[payment.id] = payment.transactionRef || "";
    });

    setStatusInputs(statuses);
    setTransactionInputs(transactions);
  };

  useEffect(() => {
    const token = getToken();

    if (!token) {
      router.push("/login");
      return;
    }

    const loadPage = async () => {
      try {
        await fetchPayments();
      } catch (err) {
        const status = err.response?.status;
        const responseMessage = err.response?.data?.message;

        if (status === 401) {
          removeToken();
          router.push("/login");
          return;
        }

        setError(Array.isArray(responseMessage) ? responseMessage[0] : responseMessage || "Failed to load payments.");
      } finally {
        setLoading(false);
      }
    };

    loadPage();
  }, [router]);

  const handleUpdateStatus = async (paymentId) => {
    setSavingId(paymentId);
    setError("");
    setMessage("");

    try {
      await api.patch(
        `/payments/${paymentId}/status`,
        {
          status: statusInputs[paymentId],
          transactionRef: transactionInputs[paymentId] || undefined,
        },
        getAuthConfig()
      );

      setMessage("Payment status updated successfully.");
      await fetchPayments();
    } catch (err) {
      const responseMessage = err.response?.data?.message;
      setError(Array.isArray(responseMessage) ? responseMessage[0] : responseMessage || "Failed to update payment.");
    } finally {
      setSavingId(null);
    }
  };

  const handleDelete = async (paymentId) => {
    setSavingId(paymentId);
    setError("");
    setMessage("");

    try {
      await api.delete(`/payments/${paymentId}`, getAuthConfig());
      setMessage("Payment deleted successfully.");
      await fetchPayments();
    } catch (err) {
      const responseMessage = err.response?.data?.message;
      setError(Array.isArray(responseMessage) ? responseMessage[0] : responseMessage || "Failed to delete payment.");
    } finally {
      setSavingId(null);
    }
  };

  return (
    <main className="w-full max-w-7xl mx-auto px-4 py-6">
      <button type="button" onClick={() => router.push("/admin")} className="rounded-md border bg-white px-3 py-2 text-sm mb-6">
        Back To Admin
      </button>

      <h1 className="text-2xl font-semibold mb-6">Manage Payments</h1>

      {loading && <p>Loading payments...</p>}
      {error && <p className="text-red-600 mb-4">{error}</p>}
      {message && <p className="mb-4 text-sm">{message}</p>}
      {!loading && !error && payments.length === 0 && <p>No payments found.</p>}

      <div className="space-y-4">
        {payments.map((payment) => (
          <div key={payment.id} className="border rounded-lg bg-white p-4">
            <p className="text-sm mb-1"><span className="font-medium">Payment ID:</span> {payment.id}</p>
            <p className="text-sm mb-1"><span className="font-medium">Order ID:</span> {payment.order?.id || "N/A"}</p>
            <p className="text-sm mb-1"><span className="font-medium">Method:</span> {payment.method}</p>
            <p className="text-sm mb-3"><span className="font-medium">Paid At:</span> {payment.paidAt || "Not paid"}</p>

            <div className="grid gap-3 md:grid-cols-3">
              <select value={statusInputs[payment.id] || payment.status} onChange={(event) => setStatusInputs((prev) => ({ ...prev, [payment.id]: event.target.value }))} className="rounded-md border px-3 py-2 text-sm">
                <option value="pending">pending</option>
                <option value="paid">paid</option>
                <option value="failed">failed</option>
              </select>

              <input type="text" value={transactionInputs[payment.id] || ""} onChange={(event) => setTransactionInputs((prev) => ({ ...prev, [payment.id]: event.target.value }))} placeholder="Transaction reference" className="rounded-md border px-3 py-2 text-sm" />

              <div className="flex flex-wrap gap-3">
                <button type="button" onClick={() => handleUpdateStatus(payment.id)} disabled={savingId === payment.id} className="rounded-md border bg-white px-3 py-2 text-sm">
                  Update
                </button>

                <button type="button" onClick={() => handleDelete(payment.id)} disabled={savingId === payment.id} className="rounded-md border bg-white px-3 py-2 text-sm">
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
