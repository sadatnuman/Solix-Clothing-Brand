"use client";

import { useEffect, useMemo, useState } from "react";
import api, { errorMessage } from "../../lib/api";

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [role, setRole] = useState("staff");
  const [query, setQuery] = useState("");
  const [passwords, setPasswords] = useState({});
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const load = () => Promise.all([api.get("/users/customers"), api.get("/auth/me")]).then(([users, me]) => { setCustomers(users.data.data || []); setRole(me.data.data.role); }).catch((requestError) => setError(errorMessage(requestError)));
  useEffect(() => { load(); }, []);
  const visible = useMemo(() => customers.filter((customer) => `${customer.fullName} ${customer.email} ${customer.phone || ""}`.toLowerCase().includes(query.toLowerCase())), [customers, query]);

  async function setStatus(customer) {
    try { await api.patch(`/users/${customer.id}/status`, { isActive: !customer.isActive }); setMessage(`${customer.fullName} is now ${customer.isActive ? "paused" : "active"}.`); load(); }
    catch (requestError) { setError(errorMessage(requestError)); }
  }
  async function reset(customer) {
    const temporaryPassword = passwords[customer.id] || "";
    if (temporaryPassword.length < 8) { setError("Temporary password must contain at least 8 characters."); return; }
    try { await api.patch(`/users/${customer.id}/reset-password`, { temporaryPassword, mustChangePassword: true }); setPasswords({ ...passwords, [customer.id]: "" }); setMessage(`${customer.fullName} must change the temporary password at next login.`); }
    catch (requestError) { setError(errorMessage(requestError)); }
  }

  return <main className="studio-page">
    <div className="studio-heading"><div><span className="eyebrow">CUSTOMER DIRECTORY</span><h1>Customers.</h1></div><span>{customers.length} accounts</span></div>
    <div className="admin-filters"><label><span>Search</span><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Name, email or phone"/></label></div>
    {error && <p className="status-note error-note" role="alert">{error}</p>}{message && <p className="status-note" role="status">{message}</p>}
    {!visible.length && !error && <div className="empty-state">No customers match this view.</div>}
    <div className="admin-card-list">{visible.map((customer) => <article className="admin-record" key={customer.id}>
      <div className="admin-record-head"><div><span className="eyebrow">CUSTOMER</span><h2>{customer.fullName}</h2><p>{customer.email}</p></div><span className={`status-pill ${customer.isActive ? "verified" : "cancelled"}`}>{customer.isActive ? "Active" : "Paused"}</span></div>
      <div className="admin-record-grid"><p><small>Phone</small>{customer.phone || "Not added"}</p><p><small>Address</small>{customer.address || "Not added"}</p><p><small>Joined</small>{new Date(customer.createdAt).toLocaleDateString("en-GB")}</p></div>
      {role === "admin" && <div className="admin-record-actions"><button onClick={() => setStatus(customer)}>{customer.isActive ? "Pause account" : "Restore account"}</button><input type="password" minLength={8} aria-label={`Temporary password for ${customer.fullName}`} placeholder="Temporary password" value={passwords[customer.id] || ""} onChange={(event) => setPasswords({ ...passwords, [customer.id]: event.target.value })}/><button onClick={() => reset(customer)}>Set temporary password</button></div>}
    </article>)}</div>
  </main>;
}
