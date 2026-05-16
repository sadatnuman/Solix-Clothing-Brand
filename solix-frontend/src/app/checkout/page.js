"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "../lib/api";
import { getAuthConfig, getToken, removeToken } from "../lib/auth";

export default function CheckoutPage() {
  const [cart, setCart] = useState(null);
  const [formData, setFormData] = useState({
    deliveryAddress: "",
    contactPhone: "",
    paymentMethod: "cash_on_delivery",
  });
  const [loading, setLoading] = useState(true);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [error, setError] = useState("");

  const router = useRouter();

  useEffect(() => {
    const token = getToken();

    if (!token) {
      router.push("/login");
      return;
    }

    const fetchCheckoutData = async () => {
      try {
        const [profileResponse, cartResponse] = await Promise.all([
          api.get("/users/profile", getAuthConfig()),
          api.get("/cart", getAuthConfig()),
        ]);

        const profile = profileResponse.data.data;
        const cartData = cartResponse.data.data;

        setCart(cartData);
        setFormData({
          deliveryAddress: profile.address || "",
          contactPhone: profile.phone || "",
          paymentMethod: "cash_on_delivery",
        });
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
          setError(message || "Failed to load checkout data.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchCheckoutData();
  }, [router]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePlaceOrder = async (event) => {
    event.preventDefault();
    setPlacingOrder(true);
    setError("");

    try {
      const response = await api.post("/orders", formData, getAuthConfig());
      router.push(`/orders/${response.data.data.id}`);
    } catch (err) {
      const message = err.response?.data?.message;

      if (Array.isArray(message)) {
        setError(message[0]);
      } else {
        setError(message || "Failed to place order.");
      }
    } finally {
      setPlacingOrder(false);
    }
  };

  return (
    <main className="max-w-3xl mx-auto p-6">
      <div className="flex gap-3 mb-6">
        <button
          type="button"
          onClick={() => router.push("/cart")}
          className="border rounded px-3 py-2 text-sm"
        >
          Back To Cart
        </button>

        <button
          type="button"
          onClick={() => router.push("/orders")}
          className="border rounded px-3 py-2 text-sm"
        >
          My Orders
        </button>
      </div>

      <h1 className="text-2xl font-semibold mb-6">Checkout</h1>

      {loading && <p>Loading checkout data...</p>}
      {error && <p className="text-red-600 mb-4">{error}</p>}

      {!loading && cart && (
        <>
          <div className="border rounded p-4 mb-6">
            <p className="text-sm mb-2">
              <span className="font-medium">Total Items:</span> {cart.totalItems}
            </p>

            <p className="text-sm">
              <span className="font-medium">Total Amount:</span> Tk {cart.totalAmount}
            </p>
          </div>

          {cart.items.length === 0 ? (
            <p>Your cart is empty.</p>
          ) : (
            <form onSubmit={handlePlaceOrder} className="border rounded p-4 space-y-4">
              <div>
                <label className="block text-sm mb-1">Delivery Address</label>
                <input
                  type="text"
                  name="deliveryAddress"
                  value={formData.deliveryAddress}
                  onChange={handleChange}
                  className="w-full border rounded px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm mb-1">Contact Phone</label>
                <input
                  type="text"
                  name="contactPhone"
                  value={formData.contactPhone}
                  onChange={handleChange}
                  className="w-full border rounded px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm mb-1">Payment Method</label>
                <select
                  name="paymentMethod"
                  value={formData.paymentMethod}
                  onChange={handleChange}
                  className="w-full border rounded px-3 py-2 text-sm"
                >
                  <option value="cash_on_delivery">Cash On Delivery</option>
                  <option value="bkash">Bkash</option>
                  <option value="nagad">Nagad</option>
                  <option value="card">Card</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={placingOrder}
                className="border rounded px-3 py-2 text-sm"
              >
                {placingOrder ? "Placing Order..." : "Place Order"}
              </button>
            </form>
          )}
        </>
      )}
    </main>
  );
}
