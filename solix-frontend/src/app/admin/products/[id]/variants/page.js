"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "../../../../lib/api";
import { getToken } from "../../../../lib/auth";

export default function ProductVariantsPage() {
  const [product, setProduct] = useState(null);
  const [variants, setVariants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const params = useParams();
  const router = useRouter();

  useEffect(() => {
    if (!getToken()) {
      router.push("/login");
      return;
    }

    const fetchData = async () => {
      try {
        const [productResponse, variantsResponse] = await Promise.all([
          api.get(`/products/${params.id}`),
          api.get(`/product-variants/product/${params.id}`),
        ]);

        setProduct(productResponse.data.data);
        setVariants(variantsResponse.data.data || []);
      } catch (err) {
        const message = err.response?.data?.message;
        setError(Array.isArray(message) ? message[0] : message || "Failed to load product variants.");
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchData();
    }
  }, [params.id, router]);

  return (
    <main className="max-w-5xl mx-auto p-6">
      <button type="button" onClick={() => router.push("/admin/products")} className="border rounded px-3 py-2 text-sm mb-6">
        Back To Products
      </button>

      <h1 className="text-2xl font-semibold mb-2">
        {product ? `${product.name} Variants` : "Product Variants"}
      </h1>

      {loading && <p>Loading variants...</p>}
      {error && <p className="text-red-600">{error}</p>}
      {!loading && !error && variants.length === 0 && <p>No variants found for this product.</p>}

      <div className="grid gap-4 md:grid-cols-2">
        {variants.map((variant) => (
          <div key={variant.id} className="border rounded p-4">
            <p className="text-sm mb-1"><span className="font-medium">Variant ID:</span> {variant.id}</p>
            <p className="text-sm mb-1"><span className="font-medium">Size:</span> {variant.size?.name || "N/A"}</p>
            <p className="text-sm mb-1"><span className="font-medium">Stock:</span> {variant.stockQuantity}</p>
            <p className="text-sm mb-4"><span className="font-medium">Price:</span> Tk {variant.variantPrice || product?.basePrice || "N/A"}</p>

            <button type="button" onClick={() => router.push(`/admin/variants/${variant.id}`)} className="border rounded px-3 py-2 text-sm">
              View Variant
            </button>
          </div>
        ))}
      </div>
    </main>
  );
}
