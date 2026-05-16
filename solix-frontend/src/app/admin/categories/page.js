"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "../../lib/api";
import { getAuthConfig, getToken, removeToken } from "../../lib/auth";

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const router = useRouter();

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

        await fetchCategories();
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
          setError(responseMessage || "Failed to load categories.");
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
      name: "",
      description: "",
    });
    setEditingId(null);
  };

  const handleEdit = (category) => {
    setFormData({
      name: category.name || "",
      description: category.description || "",
    });
    setEditingId(category.id);
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
        name: formData.name,
        description: formData.description || undefined,
      };

      if (editingId) {
        await api.patch(`/categories/${editingId}`, payload, getAuthConfig());
        setMessage("Category updated successfully.");
      } else {
        await api.post("/categories", payload, getAuthConfig());
        setMessage("Category created successfully.");
      }

      resetForm();
      await fetchCategories();
    } catch (err) {
      const responseMessage = err.response?.data?.message;

      if (Array.isArray(responseMessage)) {
        setError(responseMessage[0]);
      } else {
        setError(responseMessage || "Failed to save category.");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    setError("");
    setMessage("");

    try {
      await api.delete(`/categories/${id}`, getAuthConfig());
      setMessage("Category deleted successfully.");

      if (editingId === id) {
        resetForm();
      }

      await fetchCategories();
    } catch (err) {
      const responseMessage = err.response?.data?.message;

      if (Array.isArray(responseMessage)) {
        setError(responseMessage[0]);
      } else {
        setError(responseMessage || "Failed to delete category.");
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

      <h1 className="text-2xl font-semibold mb-6">Manage Categories</h1>

      {loading && <p>Loading categories...</p>}
      {error && <p className="text-red-600 mb-4">{error}</p>}
      {message && <p className="mb-4 text-sm">{message}</p>}

      {!loading && (
        <>
          <form
            onSubmit={handleSubmit}
            className="border rounded-lg bg-white p-4 space-y-4 mb-6"
          >
            <h2 className="text-lg font-medium">
              {editingId ? "Edit Category" : "Create Category"}
            </h2>

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

            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={saving}
                className="rounded-md border bg-white px-3 py-2 text-sm"
              >
                {saving
                  ? "Saving..."
                  : editingId
                    ? "Update Category"
                    : "Create Category"}
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
            {categories.map((category) => (
              <div key={category.id} className="border rounded-lg bg-white p-4">
                <h2 className="text-lg font-medium mb-2">{category.name}</h2>

                <p className="text-sm text-slate-600 mb-4">
                  {category.description || "No description available."}
                </p>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => handleEdit(category)}
                    className="rounded-md border bg-white px-3 py-2 text-sm"
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(category.id)}
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
