"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "../../lib/api";
import { getAuthConfig, getToken, removeToken } from "../../lib/auth";

export default function AdminMailPage() {
  const [formData, setFormData] = useState({
    to: "",
    subject: "Test Mail from Solix",
    text: "This is a test email from Solix backend.",
    html: "",
  });
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const router = useRouter();

  useEffect(() => {
    const token = getToken();

    if (!token) {
      router.push("/login");
      return;
    }

    const checkAdmin = async () => {
      try {
        const profileResponse = await api.get("/users/profile", getAuthConfig());

        if (profileResponse.data.data.role !== "admin") {
          setError("Admin access only.");
        }
      } catch (err) {
        const status = err.response?.status;
        const responseMessage = err.response?.data?.message;

        if (status === 401) {
          removeToken();
          router.push("/login");
          return;
        }

        setError(Array.isArray(responseMessage) ? responseMessage[0] : responseMessage || "Failed to verify admin.");
      } finally {
        setLoading(false);
      }
    };

    checkAdmin();
  }, [router]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSendMail = async (event) => {
    event.preventDefault();
    setSending(true);
    setError("");
    setMessage("");

    try {
      await api.post(
        "/mail/send",
        {
          to: formData.to,
          subject: formData.subject,
          text: formData.text,
          html: formData.html || undefined,
        },
        getAuthConfig()
      );

      setMessage("Email sent successfully.");
    } catch (err) {
      const responseMessage = err.response?.data?.message;
      setError(Array.isArray(responseMessage) ? responseMessage[0] : responseMessage || "Failed to send email.");
    } finally {
      setSending(false);
    }
  };

  return (
    <main className="w-full max-w-3xl mx-auto px-4 py-6">
      <button type="button" onClick={() => router.push("/admin")} className="rounded-md border bg-white px-3 py-2 text-sm mb-6">
        Back To Admin
      </button>

      <h1 className="text-2xl font-semibold mb-6">Send Test Mail</h1>

      {loading && <p>Checking admin access...</p>}
      {error && <p className="text-red-600 mb-4">{error}</p>}
      {message && <p className="mb-4 text-sm">{message}</p>}

      {!loading && !error && (
        <form onSubmit={handleSendMail} className="border rounded-lg bg-white p-4 space-y-4">
          <div>
            <label className="block text-sm mb-1">To</label>
            <input type="email" name="to" value={formData.to} onChange={handleChange} className="w-full rounded-md border px-3 py-2 text-sm" />
          </div>

          <div>
            <label className="block text-sm mb-1">Subject</label>
            <input type="text" name="subject" value={formData.subject} onChange={handleChange} className="w-full rounded-md border px-3 py-2 text-sm" />
          </div>

          <div>
            <label className="block text-sm mb-1">Text</label>
            <textarea name="text" value={formData.text} onChange={handleChange} rows={4} className="w-full rounded-md border px-3 py-2 text-sm" />
          </div>

          <div>
            <label className="block text-sm mb-1">HTML Optional</label>
            <textarea name="html" value={formData.html} onChange={handleChange} rows={4} className="w-full rounded-md border px-3 py-2 text-sm" />
          </div>

          <button type="submit" disabled={sending} className="rounded-md border bg-white px-3 py-2 text-sm">
            {sending ? "Sending..." : "Send Mail"}
          </button>
        </form>
      )}
    </main>
  );
}
