"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "../lib/api";
import { getAuthConfig, getToken, removeToken } from "../lib/auth";

export default function CartPage() {
  const [cart, setCart] = useState(null);
  const [quantityInputs, setQuantityInputs] = useState({});
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const router = useRouter();

  const fetchCart = async () => {
    try {
      const response = await api.get("/cart", getAuthConfig());
      const cartData = response.data.data;

      setCart(cartData);

      const initialQuantities = {};
      cartData.items.forEach((item) => {
        initialQuantities[item.id] = item.quantity;
      });

      setQuantityInputs(initialQuantities);
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
        setError(message || "Failed to load cart.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = getToken();

    if (!token) {
      router.push("/login");
      return;
    }

    fetchCart();
  }, [router]);

  const handleQuantityChange = (itemId, value) => {
    setQuantityInputs((prev) => ({
      ...prev,
      [itemId]: value,
    }));
  };

  const handleUpdateItem = async (itemId) => {
    if (Number(quantityInputs[itemId]) < 1) {
      setError("Quantity must be at least 1.");
      return;
    }

    setActionLoading(true);
    setError("");
    setMessage("");

    try {
      await api.patch(
        `/cart/items/${itemId}`,
        {
          quantity: Number(quantityInputs[itemId]),
        },
        getAuthConfig()
      );

      await fetchCart();
      setMessage("Cart updated successfully.");
    } catch (err) {
      const message = err.response?.data?.message;

      if (Array.isArray(message)) {
        setError(message[0]);
      } else {
        setError(message || "Failed to update cart item.");
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveItem = async (itemId) => {
    setActionLoading(true);
    setError("");
    setMessage("");

    try {
      await api.delete(`/cart/items/${itemId}`, getAuthConfig());
      await fetchCart();
      setMessage("Item removed successfully.");
    } catch (err) {
      const message = err.response?.data?.message;

      if (Array.isArray(message)) {
        setError(message[0]);
      } else {
        setError(message || "Failed to remove cart item.");
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleClearCart = async () => {
    setActionLoading(true);
    setError("");
    setMessage("");

    try {
      await api.delete("/cart/clear", getAuthConfig());
      await fetchCart();
      setMessage("Cart cleared successfully.");
    } catch (err) {
      const message = err.response?.data?.message;

      if (Array.isArray(message)) {
        setError(message[0]);
      } else {
        setError(message || "Failed to clear cart.");
      }
    } finally {
      setActionLoading(false);
    }
  };

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
          onClick={() => router.push("/profile")}
          className="border rounded px-3 py-2 text-sm"
        >
          My Profile
        </button>

        <button
          type="button"
          onClick={() => router.push("/orders")}
          className="border rounded px-3 py-2 text-sm"
        >
          My Orders
        </button>
      </div>

      <h1 className="text-2xl font-semibold mb-6">My Cart</h1>

      {loading && <p>Loading cart...</p>}
      {error && <p className="text-red-600 mb-4">{error}</p>}
      {message && <p className="text-sm mb-4">{message}</p>}

      {!loading && cart && (
        <>
          <div className="border rounded p-4 mb-6">
            <p className="text-sm mb-2">
              <span className="font-medium">Total Items:</span> {cart.totalItems}
            </p>

            <p className="text-sm mb-4">
              <span className="font-medium">Total Amount:</span> Tk {cart.totalAmount}
            </p>

            {cart.items.length > 0 && (
              <button
                type="button"
                onClick={() => router.push("/checkout")}
                className="border rounded px-3 py-2 text-sm"
              >
                Proceed To Checkout
              </button>
            )}
          </div>

          {cart.items.length === 0 ? (
            <p>Your cart is empty.</p>
          ) : (
            <div className="space-y-4">
              {cart.items.map((item) => (
                <div key={item.id} className="border rounded p-4">
                  <h2 className="text-lg font-medium mb-2">
                    {item.productVariant.product?.name}
                  </h2>

                  <p className="text-sm mb-1">
                    <span className="font-medium">Size:</span>{" "}
                    {item.productVariant.size?.name || "N/A"}
                  </p>

                  <p className="text-sm mb-1">
                    <span className="font-medium">Unit Price:</span> Tk {item.unitPrice}
                  </p>

                  <p className="text-sm mb-3">
                    <span className="font-medium">Subtotal:</span> Tk {item.subtotal}
                  </p>

                  <div className="mb-3">
                    <label className="block text-sm mb-1">Quantity</label>
                    <input
                      type="number"
                      min="1"
                      value={quantityInputs[item.id] ?? item.quantity}
                      onChange={(event) =>
                        handleQuantityChange(item.id, event.target.value)
                      }
                      className="w-full border rounded px-3 py-2 text-sm"
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => handleUpdateItem(item.id)}
                      disabled={actionLoading}
                      className="border rounded px-3 py-2 text-sm"
                    >
                      Update
                    </button>

                    <button
                      type="button"
                      onClick={() => handleRemoveItem(item.id)}
                      disabled={actionLoading}
                      className="border rounded px-3 py-2 text-sm"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={handleClearCart}
                disabled={actionLoading}
                className="border rounded px-3 py-2 text-sm"
              >
                Clear Cart
              </button>
            </div>
          )}
        </>
      )}
    </main>
  );
}
