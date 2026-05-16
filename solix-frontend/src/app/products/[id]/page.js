"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "../../lib/api";

export default function ProductDetailsPage() {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const params = useParams();
  const router = useRouter();

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await api.get(`/products/${params.id}`);
        setProduct(response.data.data);
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

  return (
    <main className="max-w-3xl mx-auto p-6">
      <button
        type="button"
        onClick={() => router.push("/")}
        className="border rounded px-3 py-2 text-sm mb-6"
      >
        Back
      </button>

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
            <span className="font-medium">Price:</span> Tk {product.basePrice}
          </p>

          <p className="text-sm mb-2">
            <span className="font-medium">Slug:</span> {product.slug}
          </p>

          <p className="text-sm mb-4">
            <span className="font-medium">Description:</span>{" "}
            {product.description || "No description available."}
          </p>

          <div className="mb-4">
            <h2 className="text-lg font-medium mb-2">Available Sizes</h2>

            {product.variants?.length ? (
              <ul className="space-y-2">
                {product.variants.map((variant) => (
                  <li key={variant.id} className="border rounded p-3">
                    <p className="text-sm">
                      <span className="font-medium">Size:</span>{" "}
                      {variant.size?.name || "N/A"}
                    </p>

                    <p className="text-sm">
                      <span className="font-medium">Stock:</span>{" "}
                      {variant.stockQuantity}
                    </p>

                    <p className="text-sm">
                      <span className="font-medium">Variant Price:</span>{" "}
                      {variant.variantPrice ?? "Uses base price"}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm">No variants available.</p>
            )}
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
