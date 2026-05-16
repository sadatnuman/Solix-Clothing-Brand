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
      } catch {
        setError("Failed to load products.");
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  return (
    <main className="w-full max-w-7xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-semibold mb-2">All Products</h1>
        <p className="text-sm text-slate-600">
          Browse products from your NestJS backend.
        </p>
      </div>

      {loading && <p>Loading products...</p>}
      {error && <p className="text-red-600">{error}</p>}
      {!loading && !error && products.length === 0 && <p>No products found.</p>}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => (
          <div key={product.id} className="border rounded-lg bg-white p-4">
            <h2 className="text-lg font-medium mb-2">{product.name}</h2>
            <p className="text-sm mb-1">Category: {product.category?.name || "N/A"}</p>
            <p className="text-sm mb-1">Price: Tk {product.basePrice}</p>
            <p className="text-sm mb-3">
              Sizes:{" "}
              {product.variants?.length
                ? product.variants.map((variant) => variant.size?.name).join(", ")
                : "No variants"}
            </p>
            <p className="text-sm text-slate-600 mb-4">
              {product.description || "No description available."}
            </p>

            <button
              type="button"
              onClick={() => router.push(`/products/${product.id}`)}
              className="rounded-md border bg-white px-3 py-2 text-sm"
            >
              View Details
            </button>
          </div>
        ))}
      </div>
    </main>
  );
}
