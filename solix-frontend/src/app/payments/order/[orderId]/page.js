"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "../../../lib/api";
import { getAuthConfig, getToken, removeToken } from "../../../lib/auth";

export default function PaymentByOrderPage() {
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState("");

  const params = useParams();
  const router = useRouter();

  useEffect(() => {
    const token = getToken();

    if (!token) {
      router.push("/login");
      return;
    }

    const fetchPayment = async () => {
      try {
        const response = await api.get(
          `/payments/order/${params.orderId}`,
          getAuthConfig()
        );

        setPayment(response.data.data);
        setNotFound(false);
      } catch (err) {
        const status = err.response?.status;
        const message = err.response?.data?.message;

        if (status === 401) {
          removeToken();
          router.push("/login");
          return;
        }

        if (status === 404) {
          setNotFound(true);
        } else if (Array.isArray(message)) {
          setError(message[0]);
        } else {
          setError(message || "Failed to load payment details.");
        }
      } finally {
        setLoading(false);
      }
    };

    if (params.orderId) {
      fetchPayment();
    }
  }, [params.orderId, router]);

  return (
    <main className="max-w-3xl mx-auto p-6">
      <div className="flex gap-3 mb-6">
        <button
          type="button"
          onClick={() => router.push(`/orders/${params.orderId}`)}
          className="border rounded px-3 py-2 text-sm"
        >
          Back To Order
        </button>

        <button
          type="button"
          onClick={() => router.push("/orders")}
          className="border rounded px-3 py-2 text-sm"
        >
          My Orders
        </button>
      </div>

      <h1 className="text-2xl font-semibold mb-6">Payment Details</h1>

      {loading && <p>Loading payment details...</p>}
      {error && <p className="text-red-600 mb-4">{error}</p>}

      {!loading && notFound && (
        <div className="border rounded p-4">
          <p className="text-sm mb-4">No payment record found for this order.</p>

          <button
            type="button"
            onClick={() => router.push(`/payments/create/${params.orderId}`)}
            className="border rounded px-3 py-2 text-sm"
          >
            Create Payment Record
          </button>
        </div>
      )}

      {!loading && !error && payment && (
        <div className="border rounded p-4 space-y-3">
          <p className="text-sm">
            <span className="font-medium">Payment ID:</span> {payment.id}
          </p>

          <p className="text-sm">
            <span className="font-medium">Order ID:</span> {payment.order?.id}
          </p>

          <p className="text-sm">
            <span className="font-medium">Method:</span> {payment.method}
          </p>

          <p className="text-sm">
            <span className="font-medium">Status:</span> {payment.status}
          </p>

          <p className="text-sm">
            <span className="font-medium">Transaction Reference:</span>{" "}
            {payment.transactionRef || "N/A"}
          </p>

          <p className="text-sm">
            <span className="font-medium">Paid At:</span>{" "}
            {payment.paidAt || "Not paid yet"}
          </p>

          <button
            type="button"
            onClick={() => router.push(`/payments/${payment.id}`)}
            className="border rounded px-3 py-2 text-sm"
          >
            Open Payment By ID
          </button>
        </div>
      )}
    </main>
  );
}
