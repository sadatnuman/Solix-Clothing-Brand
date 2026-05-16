"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "../lib/api";
import { getAuthConfig, getToken, removeToken } from "../lib/auth";

export default function AdminPage() {
  const [summary, setSummary] = useState(null);
  const [soldProducts, setSoldProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const router = useRouter();

  useEffect(() => {
    const token = getToken();

    if (!token) {
      router.push("/login");
      return;
    }

    const fetchDashboard = async () => {
      try {
        const profileResponse = await api.get("/users/profile", getAuthConfig());

        if (profileResponse.data.data.role !== "admin") {
          setError("Admin access only.");
          setLoading(false);
          return;
        }

        const [revenueResponse, soldProductsResponse] = await Promise.all([
          api.get("/admin/dashboard/revenue", getAuthConfig()),
          api.get("/admin/dashboard/sold-products", getAuthConfig()),
        ]);

        setSummary(revenueResponse.data.data);
        setSoldProducts(soldProductsResponse.data.data || []);
      } catch (err) {
        const status = err.response?.status;
        const message = err.response?.data?.message;

        if (status === 401) {
          removeToken();
          router.push("/login");
          return;
        }

        if (status === 403) {
          setError("Admin access only.");
        } else if (Array.isArray(message)) {
          setError(message[0]);
        } else {
          setError(message || "Failed to load admin dashboard.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [router]);

  return (
    <main className="w-full max-w-7xl mx-auto px-4 py-6">
      <div className="flex flex-wrap gap-3 mb-6">
        <button
          type="button"
          onClick={() => router.push("/profile")}
          className="rounded-md border bg-white px-3 py-2 text-sm"
        >
          Back To Profile
        </button>

        <button
          type="button"
          onClick={() => router.push("/admin/customers")}
          className="rounded-md border bg-white px-3 py-2 text-sm"
        >
          View Customers
        </button>
      </div>

      <h1 className="text-2xl font-semibold mb-6">Admin Dashboard</h1>

      {loading && <p>Loading dashboard...</p>}
      {error && <p className="text-red-600 mb-4">{error}</p>}

      {!loading && !error && summary && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 mb-6">
            <div className="border rounded-lg bg-white p-4"><p className="text-sm text-slate-600">Total Revenue</p><p className="text-xl font-semibold">Tk {summary.totalRevenue}</p></div>
            <div className="border rounded-lg bg-white p-4"><p className="text-sm text-slate-600">Delivered</p><p className="text-xl font-semibold">{summary.totalDeliveredOrders}</p></div>
            <div className="border rounded-lg bg-white p-4"><p className="text-sm text-slate-600">Pending</p><p className="text-xl font-semibold">{summary.pendingOrders}</p></div>
            <div className="border rounded-lg bg-white p-4"><p className="text-sm text-slate-600">Confirmed</p><p className="text-xl font-semibold">{summary.confirmedOrders}</p></div>
            <div className="border rounded-lg bg-white p-4"><p className="text-sm text-slate-600">Cancelled</p><p className="text-xl font-semibold">{summary.cancelledOrders}</p></div>
          </div>

          <div className="border rounded-lg bg-white p-4">
            <h2 className="text-lg font-medium mb-4">Sold Products</h2>

            {soldProducts.length === 0 ? (
              <p>No delivered product data found.</p>
            ) : (
              <div className="space-y-3">
                {soldProducts.map((item, index) => (
                  <div key={index} className="border rounded-lg bg-slate-50 p-3">
                    <p className="text-sm"><span className="font-medium">Product:</span> {item.productName}</p>
                    <p className="text-sm"><span className="font-medium">Quantity Sold:</span> {item.totalQuantitySold}</p>
                    <p className="text-sm"><span className="font-medium">Revenue:</span> Tk {item.totalRevenue}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </main>
  );
}
