"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "../lib/api";

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const router = useRouter();

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await api.get("/categories");
        setCategories(response.data.data || []);
      } catch (err) {
        setError("Failed to load categories.");
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  return (
    <main className="max-w-4xl mx-auto p-6">
      <button
        type="button"
        onClick={() => router.push("/")}
        className="border rounded px-3 py-2 text-sm mb-6"
      >
        Back
      </button>

      <h1 className="text-2xl font-semibold mb-2">Categories</h1>
      <p className="text-sm text-gray-600 mb-6">
        These categories are coming from the backend.
      </p>

      {loading && <p>Loading categories...</p>}
      {error && <p className="text-red-600">{error}</p>}
      {!loading && !error && categories.length === 0 && (
        <p>No categories found.</p>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {categories.map((category) => (
          <div key={category.id} className="border rounded p-4">
            <h2 className="text-lg font-medium mb-2">{category.name}</h2>

            <p className="text-sm text-gray-700 mb-4">
              {category.description || "No description available."}
            </p>

            <button
              type="button"
              onClick={() => router.push(`/categories/${category.id}`)}
              className="border rounded px-3 py-2 text-sm"
            >
              View Products
            </button>
          </div>
        ))}
      </div>
    </main>
  );
}
