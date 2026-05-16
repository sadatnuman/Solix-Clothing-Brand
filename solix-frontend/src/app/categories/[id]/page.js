"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "../../lib/api";

export default function CategoryDetailsPage() {
  const [category, setCategory] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const params = useParams();
  const router = useRouter();

  useEffect(() => {
    const fetchCategoryData = async () => {
      try {
        const [categoryResponse, productsResponse] = await Promise.all([
          api.get(`/categories/${params.id}`),
          api.get("/products"),
        ]);

        const currentCategory = categoryResponse.data.data;
        const allProducts = productsResponse.data.data || [];

        const filteredProducts = allProducts.filter(
          (product) => product.category?.id === Number(params.id)
        );

        setCategory(currentCategory);
        setProducts(filteredProducts);
      } catch (err) {
        setError("Failed to load category products.");
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchCategoryData();
    }
  }, [params.id]);

  return (
    <main className="max-w-5xl mx-auto p-6">
      <button
        type="button"
        onClick={() => router.push("/categories")}
        className="border rounded px-3 py-2 text-sm mb-6"
      >
        Back
      </button>

      {loading && <p>Loading category data...</p>}
      {error && <p className="text-red-600">{error}</p>}

      {!loading && !error && category && (
        <>
          <h1 className="text-2xl font-semibold mb-2">{category.name}</h1>
          <p className="text-sm text-gray-700 mb-6">
            {category.description || "No description available."}
          </p>

          {products.length === 0 ? (
            <p>No products found in this category.</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {products.map((product) => (
                <div key={product.id} className="border rounded p-4">
                  <h2 className="text-lg font-medium mb-2">{product.name}</h2>

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
          )}
        </>
      )}
    </main>
  );
}
