"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "../lib/api";
import { getAuthConfig, getToken, removeToken } from "../lib/auth";

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const router = useRouter();

  useEffect(() => {
    const token = getToken();

    if (!token) {
      router.push("/login");
      return;
    }

    const fetchOrders = async () => {
      try {
        const response = await api.get("/orders/my-orders", getAuthConfig());
        setOrders(response.data.data || []);
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
          setError(message || "Failed to load orders.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [router]);

  return (
    <main className="max-w-4xl mx-auto p-6">
      <div className="flex gap-3 mb-6">
        <button
          type="button"
          onClick={() => router.push("/")}
          className="border rounded px-3 py-2 text-sm"
        >
          Home
        </button>

        <button
          type="button"
          onClick={() => router.push("/cart")}
          className="border rounded px-3 py-2 text-sm"
        >
          My Cart
        </button>
      </div>

      <h1 className="text-2xl font-semibold mb-6">My Orders</h1>

      {loading && <p>Loading orders...</p>}
      {error && <p className="text-red-600">{error}</p>}
      {!loading && !error && orders.length === 0 && <p>No orders found.</p>}

      <div className="space-y-4">
        {orders.map((order) => (
          <div key={order.id} className="border rounded p-4">
            <p className="text-sm mb-1">
              <span className="font-medium">Order Number:</span> {order.orderNumber}
            </p>

            <p className="text-sm mb-1">
              <span className="font-medium">Order Status:</span> {order.orderStatus}
            </p>

            <p className="text-sm mb-1">
              <span className="font-medium">Payment Status:</span> {order.paymentStatus}
            </p>

            <p className="text-sm mb-1">
              <span className="font-medium">Payment Method:</span> {order.paymentMethod}
            </p>

            <p className="text-sm mb-3">
              <span className="font-medium">Total Amount:</span> Tk {order.totalAmount}
            </p>

            <button
              type="button"
              onClick={() => router.push(`/orders/${order.id}`)}
              className="border rounded px-3 py-2 text-sm"
            >
              View Details
            </button>
          </div>
        ))}
      </div>
    </main>
  );
}
