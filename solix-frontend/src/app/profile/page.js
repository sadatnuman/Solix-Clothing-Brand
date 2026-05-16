"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "../lib/api";
import { getAuthConfig, getToken, removeToken } from "../lib/auth";

export default function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const router = useRouter();

  useEffect(() => {
    const token = getToken();

    if (!token) {
      router.push("/login");
      return;
    }

    const fetchProfile = async () => {
      try {
        const response = await api.get("/users/profile", getAuthConfig());
        setProfile(response.data.data);
      } catch (err) {
        const status = err.response?.status;
        const message = err.response?.data?.message;

        if (status === 401) {
          removeToken();
          router.push("/login");
          return;
        }

        if (Array.isArray(message)) {
          setError(message[0]);
        } else {
          setError(message || "Failed to load profile.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [router]);

  return (
    <main className="w-full max-w-3xl mx-auto px-4 py-6">
      <div className="flex flex-wrap gap-3 mb-6">
        <button
          type="button"
          onClick={() => router.push("/profile/edit")}
          className="rounded-md border bg-white px-3 py-2 text-sm"
        >
          Edit Profile
        </button>

        <button
          type="button"
          onClick={() => router.push("/orders")}
          className="rounded-md border bg-white px-3 py-2 text-sm"
        >
          My Orders
        </button>

        {profile?.role === "admin" && (
          <button
            type="button"
            onClick={() => router.push("/admin")}
            className="rounded-md border bg-white px-3 py-2 text-sm"
          >
            Admin Dashboard
          </button>
        )}
      </div>

      <h1 className="text-2xl font-semibold mb-6">My Profile</h1>

      {loading && <p>Loading profile...</p>}
      {error && <p className="text-red-600">{error}</p>}

      {!loading && !error && profile && (
        <div className="border rounded-lg bg-white p-4 space-y-3">
          <p className="text-sm"><span className="font-medium">Full Name:</span> {profile.fullName}</p>
          <p className="text-sm"><span className="font-medium">Email:</span> {profile.email}</p>
          <p className="text-sm"><span className="font-medium">Phone:</span> {profile.phone}</p>
          <p className="text-sm"><span className="font-medium">Address:</span> {profile.address}</p>
          <p className="text-sm"><span className="font-medium">Role:</span> {profile.role}</p>
          <p className="text-sm"><span className="font-medium">Active:</span> {profile.isActive ? "Yes" : "No"}</p>
        </div>
      )}
    </main>
  );
}
