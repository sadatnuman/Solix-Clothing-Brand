"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "../../lib/api";
import { getAuthConfig, getToken, removeToken } from "../../lib/auth";

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [statusInputs, setStatusInputs] = useState({});
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const router = useRouter();

  const fetchOrders = async () => {
    const response = await api.get("/orders", getAuthConfig());
    const orderData = response.data.data || [];

    setOrders(orderData);

    const initialStatuses = {};
    orderData.forEach((order) => {
      initialStatuses[order.id] = order.orderStatus;
    });
    setStatusInputs(initialStatuses);
  };

  useEffect(() => {
    const token = getToken();

    if (!token) {
      router.push("/login");
      return;
    }

    const loadPage = async () => {
      try {
        await fetchOrders();
      } catch (err) {
        const status = err.response?.status;
        const responseMessage = err.response?.data?.message;

        if (status === 401) {
          removeToken();
          router.push("/login");
          return;
        }

        setError(Array.isArray(responseMessage) ? responseMessage[0] : responseMessage || "Failed to load orders.");
      } finally {
        setLoading(false);
      }
    };

    loadPage();
  }, [router]);

  const handleStatusChange = (orderId, value) => {
    setStatusInputs((prev) => ({ ...prev, [orderId]: value }));
  };

  const handleUpdateStatus = async (orderId) => {
    setSavingId(orderId);
    setError("");
    setMessage("");

    try {
      await api.patch(
        `/orders/${orderId}/status`,
        { orderStatus: statusInputs[orderId] },
        getAuthConfig()
      );

      setMessage("Order status updated successfully.");
      await fetchOrders();
    } catch (err) {
      const responseMessage = err.response?.data?.message;
      setError(Array.isArray(responseMessage) ? responseMessage[0] : responseMessage || "Failed to update order.");
    } finally {
      setSavingId(null);
    }
  };

  return (
    <main className="w-full max-w-7xl mx-auto px-4 py-6">
      <button type="button" onClick={() => router.push("/admin")} className="rounded-md border bg-white px-3 py-2 text-sm mb-6">
        Back To Admin
      </button>

      <h1 className="text-2xl font-semibold mb-6">Manage Orders</h1>

      {loading && <p>Loading orders...</p>}
      {error && <p className="text-red-600 mb-4">{error}</p>}
      {message && <p className="mb-4 text-sm">{message}</p>}
      {!loading && !error && orders.length === 0 && <p>No orders found.</p>}

      <div className="space-y-4">
        {orders.map((order) => (
          <div key={order.id} className="border rounded-lg bg-white p-4">
            <p className="text-sm mb-1"><span className="font-medium">Order:</span> {order.orderNumber}</p>
            <p className="text-sm mb-1"><span className="font-medium">Customer:</span> {order.user?.fullName || "N/A"}</p>
            <p className="text-sm mb-1"><span className="font-medium">Payment:</span> {order.paymentMethod} / {order.paymentStatus}</p>
            <p className="text-sm mb-1"><span className="font-medium">Total:</span> Tk {order.totalAmount}</p>
            <p className="text-sm mb-3"><span className="font-medium">Phone:</span> {order.contactPhone}</p>

            <div className="flex flex-wrap gap-3">
              <select value={statusInputs[order.id] || order.orderStatus} onChange={(event) => handleStatusChange(order.id, event.target.value)} className="rounded-md border px-3 py-2 text-sm">
                <option value="pending">pending</option>
                <option value="confirmed">confirmed</option>
                <option value="cancelled">cancelled</option>
                <option value="delivered">delivered</option>
              </select>

              <button type="button" onClick={() => handleUpdateStatus(order.id)} disabled={savingId === order.id} className="rounded-md border bg-white px-3 py-2 text-sm">
                {savingId === order.id ? "Updating..." : "Update Status"}
              </button>

              <button type="button" onClick={() => router.push(`/orders/${order.id}`)} className="rounded-md border bg-white px-3 py-2 text-sm">
                View Details
              </button>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
