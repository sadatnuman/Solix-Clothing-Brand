"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "../../../lib/api";
import { getAuthConfig, getToken, removeToken } from "../../../lib/auth";

export default function SizeDetailsPage() {
  const [size, setSize] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const params = useParams();
  const router = useRouter();

  useEffect(() => {
    const token = getToken();

    if (!token) {
      router.push("/login");
      return;
    }

    const fetchSize = async () => {
      try {
        const profileResponse = await api.get("/users/profile", getAuthConfig());

        if (profileResponse.data.data.role !== "admin") {
          setError("Admin access only.");
          setLoading(false);
          return;
        }

        const response = await api.get(`/sizes/${params.id}`);
        setSize(response.data.data);
      } catch (err) {
        const status = err.response?.status;
        const message = err.response?.data?.message;

        if (status === 401) {
          removeToken();
          router.push("/login");
          return;
        }

        setError(Array.isArray(message) ? message[0] : message || "Failed to load size.");
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchSize();
    }
  }, [params.id, router]);

  return (
    <main className="max-w-3xl mx-auto p-6">
      <button type="button" onClick={() => router.push("/admin/sizes")} className="border rounded px-3 py-2 text-sm mb-6">
        Back To Sizes
      </button>

      <h1 className="text-2xl font-semibold mb-6">Size Details</h1>

      {loading && <p>Loading size...</p>}
      {error && <p className="text-red-600">{error}</p>}

      {!loading && !error && size && (
        <div className="border rounded p-4 space-y-3">
          <p className="text-sm"><span className="font-medium">Size ID:</span> {size.id}</p>
          <p className="text-sm"><span className="font-medium">Name:</span> {size.name}</p>
          <p className="text-sm"><span className="font-medium">Created At:</span> {size.createdAt}</p>
          <p className="text-sm"><span className="font-medium">Updated At:</span> {size.updatedAt}</p>
        </div>
      )}
    </main>
  );
}
