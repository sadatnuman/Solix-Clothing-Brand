"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "../../lib/api";
import { getAuthConfig, getToken, removeToken } from "../../lib/auth";

export default function AdminProductsPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    categoryId: "",
    name: "",
    description: "",
    basePrice: "",
    sizeGuide: "",
  });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const router = useRouter();

  const fetchProducts = async () => {
    const response = await api.get("/products");
    setProducts(response.data.data || []);
  };

  const fetchCategories = async () => {
    const response = await api.get("/categories");
    setCategories(response.data.data || []);
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

        await Promise.all([fetchProducts(), fetchCategories()]);
      } catch (err) {
        const status = err.response?.status;
        const responseMessage = err.response?.data?.message;

        if (status === 401) {
          removeToken();
          router.push("/login");
          return;
        }

        if (status === 403) {
          setError("Admin access only.");
        } else if (Array.isArray(responseMessage)) {
          setError(responseMessage[0]);
        } else {
          setError(responseMessage || "Failed to load products.");
        }
      } finally {
        setLoading(false);
      }
    };

    loadPage();
  }, [router]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const resetForm = () => {
    setFormData({
      categoryId: "",
      name: "",
      description: "",
      basePrice: "",
      sizeGuide: "",
    });
    setEditingId(null);
  };

  const handleEdit = (product) => {
    setFormData({
      categoryId: String(product.category?.id || ""),
      name: product.name || "",
      description: product.description || "",
      basePrice: String(product.basePrice || ""),
      sizeGuide: product.sizeGuide || "",
    });
    setEditingId(product.id);
    setMessage("");
    setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    try {
      const payload = {
        categoryId: Number(formData.categoryId),
        name: formData.name,
        description: formData.description || undefined,
        basePrice: Number(formData.basePrice),
        sizeGuide: formData.sizeGuide || undefined,
      };

      if (editingId) {
        await api.patch(`/products/${editingId}`, payload, getAuthConfig());
        setMessage("Product updated successfully.");
      } else {
        await api.post("/products", payload, getAuthConfig());
        setMessage("Product created successfully.");
      }

      resetForm();
      await fetchProducts();
    } catch (err) {
      const responseMessage = err.response?.data?.message;

      if (Array.isArray(responseMessage)) {
        setError(responseMessage[0]);
      } else {
        setError(responseMessage || "Failed to save product.");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    setError("");
    setMessage("");

    try {
      await api.delete(`/products/${id}`, getAuthConfig());
      setMessage("Product deleted successfully.");

      if (editingId === id) {
        resetForm();
      }

      await fetchProducts();
    } catch (err) {
      const responseMessage = err.response?.data?.message;

      if (Array.isArray(responseMessage)) {
        setError(responseMessage[0]);
      } else {
        setError(responseMessage || "Failed to delete product.");
      }
    }
  };

  return (
    <main className="w-full max-w-7xl mx-auto px-4 py-6">
      <div className="flex flex-wrap gap-3 mb-6">
        <button
          type="button"
          onClick={() => router.push("/admin")}
          className="rounded-md border bg-white px-3 py-2 text-sm"
        >
          Back To Admin
        </button>
      </div>

      <h1 className="text-2xl font-semibold mb-6">Manage Products</h1>

      {loading && <p>Loading products...</p>}
      {error && <p className="text-red-600 mb-4">{error}</p>}
      {message && <p className="mb-4 text-sm">{message}</p>}

      {!loading && (
        <>
          <form
            onSubmit={handleSubmit}
            className="border rounded-lg bg-white p-4 space-y-4 mb-6"
          >
            <h2 className="text-lg font-medium">
              {editingId ? "Edit Product" : "Create Product"}
            </h2>

            <div>
              <label className="block text-sm mb-1">Category</label>
              <select
                name="categoryId"
                value={formData.categoryId}
                onChange={handleChange}
                className="w-full rounded-md border px-3 py-2 text-sm"
              >
                <option value="">Select category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm mb-1">Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full rounded-md border px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm mb-1">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="w-full rounded-md border px-3 py-2 text-sm"
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm mb-1">Base Price</label>
              <input
                type="number"
                name="basePrice"
                value={formData.basePrice}
                onChange={handleChange}
                className="w-full rounded-md border px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm mb-1">Size Guide</label>
              <textarea
                name="sizeGuide"
                value={formData.sizeGuide}
                onChange={handleChange}
                className="w-full rounded-md border px-3 py-2 text-sm"
                rows={3}
              />
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={saving}
                className="rounded-md border bg-white px-3 py-2 text-sm"
              >
                {saving
                  ? "Saving..."
                  : editingId
                    ? "Update Product"
                    : "Create Product"}
              </button>

              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-md border bg-white px-3 py-2 text-sm"
                >
                  Cancel Edit
                </button>
              )}
            </div>
          </form>

          <div className="grid gap-4 md:grid-cols-2">
            {products.map((product) => (
              <div key={product.id} className="border rounded-lg bg-white p-4">
                <h2 className="text-lg font-medium mb-2">{product.name}</h2>

                <p className="text-sm mb-1">
                  <span className="font-medium">Category:</span>{" "}
                  {product.category?.name || "N/A"}
                </p>

                <p className="text-sm mb-1">
                  <span className="font-medium">Price:</span> Tk {product.basePrice}
                </p>

                <p className="text-sm mb-1">
                  <span className="font-medium">Slug:</span> {product.slug}
                </p>

                <p className="text-sm text-slate-600 mb-4">
                  {product.description || "No description available."}
                </p>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => handleEdit(product)}
                    className="rounded-md border bg-white px-3 py-2 text-sm"
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(product.id)}
                    className="rounded-md border bg-white px-3 py-2 text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </main>
  );
}
