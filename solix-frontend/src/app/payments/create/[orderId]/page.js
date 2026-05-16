"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "../../../lib/api";
import { getAuthConfig, getToken, removeToken } from "../../../lib/auth";

export default function CreatePaymentPage() {
  const [order, setOrder] = useState(null);
  const [formData, setFormData] = useState({
    transactionRef: "",
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const params = useParams();
  const router = useRouter();

  useEffect(() => {
    const token = getToken();

    if (!token) {
      router.push("/login");
      return;
    }

    const fetchOrder = async () => {
      try {
        const response = await api.get(`/orders/${params.orderId}`, getAuthConfig());
        setOrder(response.data.data);
      } catch (err) {
        const status = err.response?.status;
        const message = err.response?.data?.message;

        if (status === 401) {
          removeToken();
          router.push("/login");
          return;
        }

        if (Array.isArray(message)) {
          setError(message[0]);
        } else {
          setError(message || "Failed to load order.");
        }
      } finally {
        setLoading(false);
      }
    };

    if (params.orderId) {
      fetchOrder();
    }
  }, [params.orderId, router]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!order) {
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      await api.post(
        "/payments",
        {
          orderId: Number(params.orderId),
          method: order.paymentMethod,
          transactionRef: formData.transactionRef || undefined,
        },
        getAuthConfig()
      );

      router.push(`/payments/order/${params.orderId}`);
    } catch (err) {
      const message = err.response?.data?.message;

      if (Array.isArray(message)) {
        setError(message[0]);
      } else {
        setError(message || "Failed to create payment record.");
      }
    } finally {
      setSubmitting(false);
    }
  };

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
          onClick={() => router.push(`/payments/order/${params.orderId}`)}
          className="border rounded px-3 py-2 text-sm"
        >
          Payment Details
        </button>
      </div>

      <h1 className="text-2xl font-semibold mb-6">Create Payment Record</h1>

      {loading && <p>Loading order...</p>}
      {error && <p className="text-red-600 mb-4">{error}</p>}

      {!loading && !error && order && (
        <>
          <div className="border rounded p-4 mb-6 space-y-2">
            <p className="text-sm">
              <span className="font-medium">Order Number:</span> {order.orderNumber}
            </p>

            <p className="text-sm">
              <span className="font-medium">Total Amount:</span> Tk {order.totalAmount}
            </p>

            <p className="text-sm">
              <span className="font-medium">Payment Method:</span> {order.paymentMethod}
            </p>

            <p className="text-sm">
              <span className="font-medium">Current Payment Status:</span>{" "}
              {order.paymentStatus}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="border rounded p-4 space-y-4">
            <div>
              <label className="block text-sm mb-1">Transaction Reference</label>
              <input
                type="text"
                name="transactionRef"
                value={formData.transactionRef}
                onChange={handleChange}
                className="w-full border rounded px-3 py-2 text-sm"
              />
              <p className="text-xs mt-1">
                You can leave this empty for cash on delivery.
              </p>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="border rounded px-3 py-2 text-sm"
            >
              {submitting ? "Creating..." : "Create Payment Record"}
            </button>
          </form>
        </>
      )}
    </main>
  );
}
