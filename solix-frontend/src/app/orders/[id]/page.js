"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "../../lib/api";
import { getAuthConfig, getToken, removeToken } from "../../lib/auth";

export default function OrderDetailsPage() {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
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
        const response = await api.get(`/orders/${params.id}`, getAuthConfig());
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
          setError(message || "Failed to load order details.");
        }
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchOrder();
    }
  }, [params.id, router]);

  return (
    <main className="max-w-4xl mx-auto p-6">
      <div className="flex gap-3 mb-6">
        <button
          type="button"
          onClick={() => router.push("/orders")}
          className="border rounded px-3 py-2 text-sm"
        >
          Back To Orders
        </button>

        <button
          type="button"
          onClick={() => router.push("/cart")}
          className="border rounded px-3 py-2 text-sm"
        >
          My Cart
        </button>

        {order && (
          <button
            type="button"
            onClick={() => router.push(`/payments/order/${order.id}`)}
            className="border rounded px-3 py-2 text-sm"
          >
            Payment Details
          </button>
        )}
      </div>

      {loading && <p>Loading order details...</p>}
      {error && <p className="text-red-600">{error}</p>}

      {!loading && !error && order && (
        <div className="space-y-6">
          <div className="border rounded p-4">
            <h1 className="text-2xl font-semibold mb-4">Order Details</h1>

            <p className="text-sm mb-1">
              <span className="font-medium">Order Number:</span> {order.orderNumber}
            </p>

            <p className="text-sm mb-1">
              <span className="font-medium">Delivery Address:</span> {order.deliveryAddress}
            </p>

            <p className="text-sm mb-1">
              <span className="font-medium">Contact Phone:</span> {order.contactPhone}
            </p>

            <p className="text-sm mb-1">
              <span className="font-medium">Payment Method:</span> {order.paymentMethod}
            </p>

            <p className="text-sm mb-1">
              <span className="font-medium">Payment Status:</span> {order.paymentStatus}
            </p>

            <p className="text-sm mb-1">
              <span className="font-medium">Order Status:</span> {order.orderStatus}
            </p>

            <p className="text-sm">
              <span className="font-medium">Total Amount:</span> Tk {order.totalAmount}
            </p>
          </div>

          <div className="border rounded p-4">
            <h2 className="text-lg font-medium mb-4">Order Items</h2>

            {order.items?.length ? (
              <div className="space-y-3">
                {order.items.map((item) => (
                  <div key={item.id} className="border rounded p-3">
                    <p className="text-sm mb-1">
                      <span className="font-medium">Product:</span> {item.productName}
                    </p>

                    <p className="text-sm mb-1">
                      <span className="font-medium">Size:</span> {item.sizeName}
                    </p>

                    <p className="text-sm mb-1">
                      <span className="font-medium">Quantity:</span> {item.quantity}
                    </p>

                    <p className="text-sm mb-1">
                      <span className="font-medium">Unit Price:</span> Tk {item.unitPrice}
                    </p>

                    <p className="text-sm">
                      <span className="font-medium">Subtotal:</span> Tk {item.subtotal}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p>No items found.</p>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
