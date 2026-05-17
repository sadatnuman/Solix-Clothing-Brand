"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "../../../lib/api";
import { getToken } from "../../../lib/auth";

export default function VariantDetailsPage() {
  const [variant, setVariant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const params = useParams();
  const router = useRouter();

  useEffect(() => {
    if (!getToken()) {
      router.push("/login");
      return;
    }

    const fetchVariant = async () => {
      try {
        const response = await api.get(`/product-variants/${params.id}`);
        setVariant(response.data.data);
      } catch (err) {
        const message = err.response?.data?.message;
        setError(Array.isArray(message) ? message[0] : message || "Failed to load variant.");
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchVariant();
    }
  }, [params.id, router]);

  return (
    <main className="max-w-3xl mx-auto p-6">
      <button type="button" onClick={() => router.push("/admin/variants")} className="border rounded px-3 py-2 text-sm mb-6">
        Back To Variants
      </button>

      <h1 className="text-2xl font-semibold mb-6">Variant Details</h1>

      {loading && <p>Loading variant...</p>}
      {error && <p className="text-red-600">{error}</p>}

      {!loading && !error && variant && (
        <div className="border rounded p-4 space-y-3">
          <p className="text-sm"><span className="font-medium">Variant ID:</span> {variant.id}</p>
          <p className="text-sm"><span className="font-medium">Product:</span> {variant.product?.name || "N/A"}</p>
          <p className="text-sm"><span className="font-medium">Category:</span> {variant.product?.category?.name || "N/A"}</p>
          <p className="text-sm"><span className="font-medium">Size:</span> {variant.size?.name || "N/A"}</p>
          <p className="text-sm"><span className="font-medium">Stock:</span> {variant.stockQuantity}</p>
          <p className="text-sm"><span className="font-medium">Price:</span> Tk {variant.variantPrice || variant.product?.basePrice || "N/A"}</p>
        </div>
      )}
    </main>
  );
}
