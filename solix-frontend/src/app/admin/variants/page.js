"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "../../lib/api";
import { getAuthConfig, getToken, removeToken } from "../../lib/auth";

export default function AdminVariantsPage() {
  const [variants, setVariants] = useState([]);
  const [products, setProducts] = useState([]);
  const [sizes, setSizes] = useState([]);
  const [formData, setFormData] = useState({
    productId: "",
    sizeId: "",
    stockQuantity: "",
    variantPrice: "",
  });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const router = useRouter();

  const fetchVariants = async () => {
    const response = await api.get("/product-variants");
    setVariants(response.data.data || []);
  };

  const fetchOptions = async () => {
    const [productsResponse, sizesResponse] = await Promise.all([
      api.get("/products"),
      api.get("/sizes"),
    ]);

    setProducts(productsResponse.data.data || []);
    setSizes(sizesResponse.data.data || []);
  };

  useEffect(() => {
    const token = getToken();

    if (!token) {
      router.push("/login");
      return;
    }

    const loadPage = async () => {
      try {
        const profileResponse = await api.get("/users/profile", getAuthConfig());

        if (profileResponse.data.data.role !== "admin") {
          setError("Admin access only.");
          setLoading(false);
          return;
        }

        await Promise.all([fetchVariants(), fetchOptions()]);
      } catch (err) {
        const status = err.response?.status;
        const responseMessage = err.response?.data?.message;

        if (status === 401) {
          removeToken();
          router.push("/login");
          return;
        }

        setError(Array.isArray(responseMessage) ? responseMessage[0] : responseMessage || "Failed to load variants.");
      } finally {
        setLoading(false);
      }
    };

    loadPage();
  }, [router]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData({
      productId: "",
      sizeId: "",
      stockQuantity: "",
      variantPrice: "",
    });
    setEditingId(null);
  };

  const handleEdit = (variant) => {
    setFormData({
      productId: String(variant.product?.id || ""),
      sizeId: String(variant.size?.id || ""),
      stockQuantity: String(variant.stockQuantity ?? ""),
      variantPrice: String(variant.variantPrice ?? ""),
    });
    setEditingId(variant.id);
    setError("");
    setMessage("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    try {
      const payload = {
        productId: Number(formData.productId),
        sizeId: Number(formData.sizeId),
        stockQuantity: Number(formData.stockQuantity),
        variantPrice: formData.variantPrice ? Number(formData.variantPrice) : undefined,
      };

      if (editingId) {
        await api.patch(`/product-variants/${editingId}`, payload, getAuthConfig());
        setMessage("Variant updated successfully.");
      } else {
        await api.post("/product-variants", payload, getAuthConfig());
        setMessage("Variant created successfully.");
      }

      resetForm();
      await fetchVariants();
    } catch (err) {
      const responseMessage = err.response?.data?.message;
      setError(Array.isArray(responseMessage) ? responseMessage[0] : responseMessage || "Failed to save variant.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    setError("");
    setMessage("");

    try {
      await api.delete(`/product-variants/${id}`, getAuthConfig());
      setMessage("Variant deleted successfully.");

      if (editingId === id) {
        resetForm();
      }

      await fetchVariants();
    } catch (err) {
      const responseMessage = err.response?.data?.message;
      setError(Array.isArray(responseMessage) ? responseMessage[0] : responseMessage || "Failed to delete variant.");
    }
  };

  return (
    <main className="w-full max-w-7xl mx-auto px-4 py-6">
      <button type="button" onClick={() => router.push("/admin")} className="rounded-md border bg-white px-3 py-2 text-sm mb-6">
        Back To Admin
      </button>

      <h1 className="text-2xl font-semibold mb-6">Manage Product Variants</h1>

      {loading && <p>Loading variants...</p>}
      {error && <p className="text-red-600 mb-4">{error}</p>}
      {message && <p className="mb-4 text-sm">{message}</p>}

      {!loading && (
        <>
          <form onSubmit={handleSubmit} className="border rounded-lg bg-white p-4 space-y-4 mb-6">
            <h2 className="text-lg font-medium">{editingId ? "Edit Variant" : "Create Variant"}</h2>

            <div>
              <label className="block text-sm mb-1">Product</label>
              <select name="productId" value={formData.productId} onChange={handleChange} className="w-full rounded-md border px-3 py-2 text-sm">
                <option value="">Select product</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>{product.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm mb-1">Size</label>
              <select name="sizeId" value={formData.sizeId} onChange={handleChange} className="w-full rounded-md border px-3 py-2 text-sm">
                <option value="">Select size</option>
                {sizes.map((size) => (
                  <option key={size.id} value={size.id}>{size.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm mb-1">Stock Quantity</label>
              <input type="number" name="stockQuantity" value={formData.stockQuantity} onChange={handleChange} className="w-full rounded-md border px-3 py-2 text-sm" />
            </div>

            <div>
              <label className="block text-sm mb-1">Variant Price</label>
              <input type="number" name="variantPrice" value={formData.variantPrice} onChange={handleChange} className="w-full rounded-md border px-3 py-2 text-sm" />
            </div>

            <div className="flex flex-wrap gap-3">
              <button type="submit" disabled={saving} className="rounded-md border bg-white px-3 py-2 text-sm">
                {saving ? "Saving..." : editingId ? "Update Variant" : "Create Variant"}
              </button>

              {editingId && (
                <button type="button" onClick={resetForm} className="rounded-md border bg-white px-3 py-2 text-sm">
                  Cancel
                </button>
              )}
            </div>
          </form>

          <div className="grid gap-4 md:grid-cols-2">
            {variants.map((variant) => (
              <div key={variant.id} className="border rounded-lg bg-white p-4">
                <h2 className="text-lg font-medium mb-2">{variant.product?.name || "Product N/A"}</h2>
                <p className="text-sm mb-1"><span className="font-medium">Size:</span> {variant.size?.name || "N/A"}</p>
                <p className="text-sm mb-1"><span className="font-medium">Stock:</span> {variant.stockQuantity}</p>
                <p className="text-sm mb-4"><span className="font-medium">Price:</span> Tk {variant.variantPrice || variant.product?.basePrice || "N/A"}</p>

                <div className="flex flex-wrap gap-3">
                  <button type="button" onClick={() => handleEdit(variant)} className="rounded-md border bg-white px-3 py-2 text-sm">Edit</button>
                  <button type="button" onClick={() => handleDelete(variant.id)} className="rounded-md border bg-white px-3 py-2 text-sm">Delete</button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </main>
  );
}
