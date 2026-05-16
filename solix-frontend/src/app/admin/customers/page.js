"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "../../lib/api";
import { getAuthConfig, getToken, removeToken } from "../../lib/auth";

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const router = useRouter();

  useEffect(() => {
    const token = getToken();

    if (!token) {
      router.push("/login");
      return;
    }

    const fetchCustomers = async () => {
      try {
        const response = await api.get("/users/customers", getAuthConfig());
        setCustomers(response.data.data || []);
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
          setError(message || "Failed to load customers.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchCustomers();
  }, [router]);

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

        <button
          type="button"
          onClick={() => router.push("/profile")}
          className="rounded-md border bg-white px-3 py-2 text-sm"
        >
          My Profile
        </button>
      </div>

      <h1 className="text-2xl font-semibold mb-6">Customers</h1>

      {loading && <p>Loading customers...</p>}
      {error && <p className="text-red-600">{error}</p>}
      {!loading && !error && customers.length === 0 && <p>No customers found.</p>}

      <div className="grid gap-4 md:grid-cols-2">
        {customers.map((customer) => (
          <div key={customer.id} className="border rounded-lg bg-white p-4">
            <p className="text-sm"><span className="font-medium">Name:</span> {customer.fullName}</p>
            <p className="text-sm"><span className="font-medium">Email:</span> {customer.email}</p>
            <p className="text-sm"><span className="font-medium">Phone:</span> {customer.phone}</p>
            <p className="text-sm"><span className="font-medium">Address:</span> {customer.address}</p>
            <p className="text-sm"><span className="font-medium">Active:</span> {customer.isActive ? "Yes" : "No"}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
