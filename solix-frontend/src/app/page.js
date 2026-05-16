"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "./lib/api";

export default function Home() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const router = useRouter();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await api.get("/products");
        setProducts(response.data.data || []);
      } catch (err) {
        setError("Failed to load products.");
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  return (
    <main className="max-w-5xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-2">Solix Products</h1>
      <p className="text-sm text-gray-600 mb-4">
        Product data is coming from the NestJS backend.
      </p>

      <div className="flex flex-wrap gap-3 mb-6">
        <button
          type="button"
          onClick={() => router.push("/categories")}
          className="border rounded px-3 py-2 text-sm"
        >
          Browse Categories
        </button>

        <button
          type="button"
          onClick={() => router.push("/register")}
          className="border rounded px-3 py-2 text-sm"
        >
          Register
        </button>

        <button
          type="button"
          onClick={() => router.push("/login")}
          className="border rounded px-3 py-2 text-sm"
        >
          Login
        </button>

        <button
          type="button"
          onClick={() => router.push("/profile")}
          className="border rounded px-3 py-2 text-sm"
        >
          My Profile
        </button>
      </div>

      {loading && <p>Loading products...</p>}
      {error && <p className="text-red-600">{error}</p>}
      {!loading && !error && products.length === 0 && (
        <p>No products found.</p>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {products.map((product) => (
          <div key={product.id} className="border rounded p-4">
            <h2 className="text-lg font-medium mb-2">{product.name}</h2>

            <p className="text-sm mb-1">
              <span className="font-medium">Category:</span>{" "}
              {product.category?.name || "N/A"}
            </p>

            <p className="text-sm mb-1">
              <span className="font-medium">Price:</span> Tk {product.basePrice}
            </p>

            <p className="text-sm mb-3">
              <span className="font-medium">Sizes:</span>{" "}
              {product.variants?.length
                ? product.variants.map((variant) => variant.size?.name).join(", ")
                : "No variants"}
            </p>

            <p className="text-sm text-gray-700 mb-4">
              {product.description || "No description available."}
            </p>

            <button
              type="button"
              onClick={() => router.push(`/products/${product.id}`)}
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
