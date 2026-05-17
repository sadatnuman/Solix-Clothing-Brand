"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "../../lib/api";
import { getAuthConfig, getToken, removeToken } from "../../lib/auth";

export default function AdminSizesPage() {
  const [sizes, setSizes] = useState([]);
  const [name, setName] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const router = useRouter();

  const fetchSizes = async () => {
    const response = await api.get("/sizes");
    setSizes(response.data.data || []);
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

        await fetchSizes();
      } catch (err) {
        const status = err.response?.status;
        const responseMessage = err.response?.data?.message;

        if (status === 401) {
          removeToken();
          router.push("/login");
          return;
        }

        setError(Array.isArray(responseMessage) ? responseMessage[0] : responseMessage || "Failed to load sizes.");
      } finally {
        setLoading(false);
      }
    };

    loadPage();
  }, [router]);

  const resetForm = () => {
    setName("");
    setEditingId(null);
  };

  const handleEdit = (size) => {
    setName(size.name || "");
    setEditingId(size.id);
    setError("");
    setMessage("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    try {
      if (editingId) {
        await api.patch(`/sizes/${editingId}`, { name }, getAuthConfig());
        setMessage("Size updated successfully.");
      } else {
        await api.post("/sizes", { name }, getAuthConfig());
        setMessage("Size created successfully.");
      }

      resetForm();
      await fetchSizes();
    } catch (err) {
      const responseMessage = err.response?.data?.message;
      setError(Array.isArray(responseMessage) ? responseMessage[0] : responseMessage || "Failed to save size.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    setError("");
    setMessage("");

    try {
      await api.delete(`/sizes/${id}`, getAuthConfig());
      setMessage("Size deleted successfully.");

      if (editingId === id) {
        resetForm();
      }

      await fetchSizes();
    } catch (err) {
      const responseMessage = err.response?.data?.message;
      setError(Array.isArray(responseMessage) ? responseMessage[0] : responseMessage || "Failed to delete size.");
    }
  };

  return (
    <main className="w-full max-w-7xl mx-auto px-4 py-6">
      <button type="button" onClick={() => router.push("/admin")} className="rounded-md border bg-white px-3 py-2 text-sm mb-6">
        Back To Admin
      </button>

      <h1 className="text-2xl font-semibold mb-6">Manage Sizes</h1>

      {loading && <p>Loading sizes...</p>}
      {error && <p className="text-red-600 mb-4">{error}</p>}
      {message && <p className="mb-4 text-sm">{message}</p>}

      {!loading && (
        <>
          <form onSubmit={handleSubmit} className="border rounded-lg bg-white p-4 space-y-4 mb-6">
            <h2 className="text-lg font-medium">{editingId ? "Edit Size" : "Create Size"}</h2>

            <div>
              <label className="block text-sm mb-1">Size Name</label>
              <input type="text" value={name} onChange={(event) => setName(event.target.value)} className="w-full rounded-md border px-3 py-2 text-sm" />
            </div>

            <div className="flex flex-wrap gap-3">
              <button type="submit" disabled={saving} className="rounded-md border bg-white px-3 py-2 text-sm">
                {saving ? "Saving..." : editingId ? "Update Size" : "Create Size"}
              </button>

              {editingId && (
                <button type="button" onClick={resetForm} className="rounded-md border bg-white px-3 py-2 text-sm">
                  Cancel
                </button>
              )}
            </div>
          </form>

          <div className="grid gap-4 md:grid-cols-3">
            {sizes.map((size) => (
              <div key={size.id} className="border rounded-lg bg-white p-4">
                <h2 className="text-lg font-medium mb-4">{size.name}</h2>

                <div className="flex flex-wrap gap-3">
                  <button type="button" onClick={() => router.push(`/admin/sizes/${size.id}`)} className="rounded-md border bg-white px-3 py-2 text-sm">View Details</button>
                  <button type="button" onClick={() => handleEdit(size)} className="rounded-md border bg-white px-3 py-2 text-sm">Edit</button>
                  <button type="button" onClick={() => handleDelete(size.id)} className="rounded-md border bg-white px-3 py-2 text-sm">Delete</button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </main>
  );
}
