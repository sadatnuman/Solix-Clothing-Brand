"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "../../lib/api";
import { getAuthConfig, getToken } from "../../lib/auth";

export default function ProductDetailsPage() {
  const [product, setProduct] = useState(null);
  const [selectedVariantId, setSelectedVariantId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState(false);
  const [error, setError] = useState("");
  const [cartError, setCartError] = useState("");

  const params = useParams();
  const router = useRouter();

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await api.get(`/products/${params.id}`);
        const productData = response.data.data;

        setProduct(productData);

        if (productData.variants?.length) {
          setSelectedVariantId(String(productData.variants[0].id));
        }
      } catch (err) {
        setError("Failed to load product details.");
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchProduct();
    }
  }, [params.id]);

  const handleAddToCart = async () => {
    if (!getToken()) {
      router.push("/login");
      return;
    }

    if (!selectedVariantId) {
      setCartError("Please select a size.");
      return;
    }

    if (Number(quantity) < 1) {
      setCartError("Quantity must be at least 1.");
      return;
    }

    setAddingToCart(true);
    setCartError("");

    try {
      await api.post(
        "/cart/items",
        {
          productVariantId: Number(selectedVariantId),
          quantity: Number(quantity),
        },
        getAuthConfig()
      );

      router.push("/cart");
    } catch (err) {
      const message = err.response?.data?.message;

      if (Array.isArray(message)) {
        setCartError(message[0]);
      } else {
        setCartError(message || "Failed to add item to cart.");
      }
    } finally {
      setAddingToCart(false);
    }
  };

  return (
    <main className="max-w-3xl mx-auto p-6">
      <div className="flex gap-3 mb-6">
        <button
          type="button"
          onClick={() => router.push("/")}
          className="border rounded px-3 py-2 text-sm"
        >
          Back
        </button>

        <button
          type="button"
          onClick={() => router.push("/cart")}
          className="border rounded px-3 py-2 text-sm"
        >
          My Cart
        </button>
      </div>

      {loading && <p>Loading product details...</p>}
      {error && <p className="text-red-600">{error}</p>}

      {!loading && !error && product && (
        <div className="border rounded p-5">
          <h1 className="text-2xl font-semibold mb-4">{product.name}</h1>

          <p className="text-sm mb-2">
            <span className="font-medium">Category:</span>{" "}
            {product.category?.name || "N/A"}
          </p>

          <p className="text-sm mb-2">
            <span className="font-medium">Base Price:</span> Tk {product.basePrice}
          </p>

          <p className="text-sm mb-2">
            <span className="font-medium">Slug:</span> {product.slug}
          </p>

          <p className="text-sm mb-4">
            <span className="font-medium">Description:</span>{" "}
            {product.description || "No description available."}
          </p>

          <div className="mb-4">
            <label className="block text-sm mb-1">Select Size</label>

            {product.variants?.length ? (
              <select
                value={selectedVariantId}
                onChange={(event) => setSelectedVariantId(event.target.value)}
                className="w-full border rounded px-3 py-2 text-sm"
              >
                {product.variants.map((variant) => (
                  <option key={variant.id} value={variant.id}>
                    {variant.size?.name} | Stock: {variant.stockQuantity} | Price: Tk{" "}
                    {variant.variantPrice ?? product.basePrice}
                  </option>
                ))}
              </select>
            ) : (
              <p className="text-sm">No variants available.</p>
            )}
          </div>

          <div className="mb-4">
            <label className="block text-sm mb-1">Quantity</label>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(event) => setQuantity(event.target.value)}
              className="w-full border rounded px-3 py-2 text-sm"
            />
          </div>

          {cartError && <p className="text-red-600 text-sm mb-4">{cartError}</p>}

          <div className="flex gap-3 mb-4">
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={addingToCart || !product.variants?.length}
              className="border rounded px-3 py-2 text-sm"
            >
              {addingToCart ? "Adding..." : "Add To Cart"}
            </button>

            <button
              type="button"
              onClick={() => router.push("/cart")}
              className="border rounded px-3 py-2 text-sm"
            >
              Go To Cart
            </button>
          </div>

          <div>
            <h2 className="text-lg font-medium mb-2">Size Guide</h2>
            <p className="text-sm">
              {product.sizeGuide || "No size guide available."}
            </p>
          </div>
        </div>
      )}
    </main>
  );
}
