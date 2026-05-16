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
        const response = await api.get("/auth/me", getAuthConfig());
        setProfile(response.data.data);
      } catch (err) {
        removeToken();

        const message = err.response?.data?.message;

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

  const handleLogout = () => {
    removeToken();
    router.push("/login");
  };

  return (
    <main className="max-w-3xl mx-auto p-6">
      <div className="flex gap-3 mb-6">
        <button
          type="button"
          onClick={() => router.push("/")}
          className="border rounded px-3 py-2 text-sm"
        >
          Home
        </button>

        <button
          type="button"
          onClick={handleLogout}
          className="border rounded px-3 py-2 text-sm"
        >
          Logout
        </button>
      </div>

      <h1 className="text-2xl font-semibold mb-6">My Profile</h1>

      {loading && <p>Loading profile...</p>}
      {error && <p className="text-red-600">{error}</p>}

      {!loading && !error && profile && (
        <div className="border rounded p-4 space-y-3">
          <p className="text-sm">
            <span className="font-medium">Full Name:</span> {profile.fullName}
          </p>

          <p className="text-sm">
            <span className="font-medium">Email:</span> {profile.email}
          </p>

          <p className="text-sm">
            <span className="font-medium">Phone:</span> {profile.phone}
          </p>

          <p className="text-sm">
            <span className="font-medium">Address:</span> {profile.address}
          </p>

          <p className="text-sm">
            <span className="font-medium">Role:</span> {profile.role}
          </p>

          <p className="text-sm">
            <span className="font-medium">Active:</span>{" "}
            {profile.isActive ? "Yes" : "No"}
          </p>
        </div>
      )}
    </main>
  );
}
