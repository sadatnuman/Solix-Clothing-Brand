"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "../../lib/api";
import { getAuthConfig, getToken, removeToken } from "../../lib/auth";

export default function EditProfilePage() {
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    address: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
        const profile = response.data.data;

        setFormData({
          fullName: profile.fullName || "",
          phone: profile.phone || "",
          address: profile.address || "",
        });
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

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      await api.patch("/users/profile", formData, getAuthConfig());
      router.push("/profile");
    } catch (err) {
      const message = err.response?.data?.message;

      if (Array.isArray(message)) {
        setError(message[0]);
      } else {
        setError(message || "Failed to update profile.");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="w-full max-w-2xl mx-auto px-4 py-6">
      <button
        type="button"
        onClick={() => router.push("/profile")}
        className="rounded-md border bg-white px-3 py-2 text-sm mb-6"
      >
        Back To Profile
      </button>

      <h1 className="text-2xl font-semibold mb-6">Edit Profile</h1>

      {loading && <p>Loading profile...</p>}
      {error && <p className="text-red-600 mb-4">{error}</p>}

      {!loading && (
        <form onSubmit={handleSubmit} className="border rounded-lg bg-white p-4 space-y-4">
          <div>
            <label className="block text-sm mb-1">Full Name</label>
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              className="w-full rounded-md border px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm mb-1">Phone</label>
            <input
              type="text"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full rounded-md border px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm mb-1">Address</label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              className="w-full rounded-md border px-3 py-2 text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="rounded-md border bg-white px-3 py-2 text-sm"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </form>
      )}
    </main>
  );
}
