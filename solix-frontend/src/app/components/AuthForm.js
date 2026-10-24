"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import api, { errorMessage } from "../lib/api";
import { saveToken } from "../lib/auth";

export default function AuthForm({ register = false }) {
  const router = useRouter();
  const params = useSearchParams();
  const [form, setForm] = useState({ fullName: "", email: "", password: "", phone: "", address: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      if (register) await api.post("/auth/register", form);
      const response = await api.post("/auth/login", { email: form.email, password: form.password });
      saveToken();
      const guest = JSON.parse(localStorage.getItem("solix_guest_cart") || "[]");
      if (guest.length) {
        await api.post("/cart/merge", { items: guest });
        localStorage.removeItem("solix_guest_cart");
      }
      const next = params.get("next");
      const safeNext = next && next.startsWith("/") && !next.startsWith("//") && !next.includes(String.fromCharCode(92));
      router.push(response.data.user.mustChangePassword ? "/profile/edit" : safeNext ? next : ["admin", "staff"].includes(response.data.user.role) ? "/admin" : "/shop");
      router.refresh();
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setBusy(false);
    }
  }

  const fields = register
    ? [["fullName", "Full name", "text"], ["email", "Email address", "email"], ["phone", "Phone number", "tel"], ["address", "Delivery address", "text"], ["password", "Password", "password"]]
    : [["email", "Email address", "email"], ["password", "Password", "password"]];

  return <div className="auth-grid">
    <div className="auth-art">
      <Image src="/images/campaign.jpg" alt="The Solix everyday collection" fill unoptimized sizes="50vw"/>
      <div><span className="eyebrow">GOOD TO HAVE YOU HERE</span><h2>Your everyday.<br/>Your way.</h2></div>
    </div>
    <main className="auth-panel">
      <span className="eyebrow">YOUR SOLIX STARTS HERE</span>
      <h1>{register ? "Make yourself at home." : "Welcome back."}</h1>
      <p>{register ? "A few details, and you’re one of us." : "Your favourites are waiting for you."}</p>
      {error && <p role="alert" className="status-note error-note">{error}</p>}
      <form onSubmit={submit} className="form-stack">
        {fields.map(([name, label, type]) => <label key={name} htmlFor={name}>
          {label}
          {name === "password" ? <span className="password-field">
            <input
              id={name}
              type={showPassword ? "text" : "password"}
              required
              minLength={8}
              autoComplete={register ? "new-password" : "current-password"}
              value={form[name]}
              onChange={(event) => setForm({ ...form, [name]: event.target.value })}
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword((visible) => !visible)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              aria-pressed={showPassword}
              title={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 3l18 18M10.6 10.7a2 2 0 0 0 2.7 2.7M9.9 4.3A10.7 10.7 0 0 1 12 4c5.5 0 9 5.5 9 8a12.5 12.5 0 0 1-2.2 3.5M6.6 6.6C4.3 8.1 3 10.5 3 12c0 2.5 3.5 8 9 8 1.3 0 2.5-.3 3.6-.8"/></svg> : <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12c0-2.5 3.5-8 9-8s9 5.5 9 8-3.5 8-9 8-9-5.5-9-8Z"/><circle cx="12" cy="12" r="3"/></svg>}
            </button>
          </span> : <input
            id={name}
            type={type}
            required
            autoComplete={name === "fullName" ? "name" : name === "address" ? "street-address" : name === "phone" ? "tel" : "email"}
            value={form[name]}
            onChange={(event) => setForm({ ...form, [name]: event.target.value })}
          />}
        </label>)}
        <button className="button dark" disabled={busy}>{busy ? "One moment…" : register ? "Create account ↗" : "Sign in ↗"}</button>
      </form>
      <p className="auth-note">No email codes or marketing messages. Your email is used only to sign in.</p>
      <p style={{ marginTop: 25 }}>{register ? "Already part of the family?" : "New around here?"} <Link className="text-link" href={register ? "/login" : "/register"}>{register ? "Sign in" : "Create an account"}</Link></p>
    </main>
  </div>;
}
