"use client";

import { useEffect, useState } from "react";
import api, { errorMessage } from "../../lib/api";

const scopes = [
  ["catalog", "Catalog", "Products, categories, sizes and offers"],
  ["fulfilment", "Fulfilment", "Inventory, orders, payments and returns"],
  ["support", "Support", "Customers, reviews and support inbox"],
];
const blank = { fullName: "", email: "", password: "", permissions: [] };

export default function StaffPage() {
  const [staff, setStaff] = useState([]);
  const [form, setForm] = useState(blank);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const load = () => api.get("/admin/staff").then((response) => setStaff(response.data.data || [])).catch((requestError) => setError(errorMessage(requestError)));
  useEffect(() => { load(); }, []);
  const toggle = (scope) => setForm((current) => ({ ...current, permissions: current.permissions.includes(scope) ? current.permissions.filter((item) => item !== scope) : [...current.permissions, scope] }));

  async function create(event) {
    event.preventDefault(); setError(""); setMessage("");
    try { await api.post("/admin/staff", form); setForm(blank); setMessage("Staff account created. They must change the temporary password after login."); load(); }
    catch (requestError) { setError(errorMessage(requestError)); }
  }

  async function update(person, changes) {
    setError("");
    try { await api.patch(`/admin/staff/${person.id}`, { permissions: changes.permissions ?? person.permissions ?? [], isActive: changes.isActive ?? person.isActive }); setMessage(`${person.fullName}'s access was updated.`); load(); }
    catch (requestError) { setError(errorMessage(requestError)); }
  }

  return <main className="studio-page">
    <div className="studio-heading"><div><span className="eyebrow">ROLE & ACCESS CONTROL</span><h1>Staff access.</h1></div><span>{staff.length} staff</span></div>
    {error && <p className="status-note error-note" role="alert">{error}</p>}
    {message && <p className="status-note" role="status">{message}</p>}
    <form className="admin-editor form-stack" onSubmit={create}>
      <h2>Create staff account</h2>
      <div className="form-pair"><label>Full name<input required value={form.fullName} onChange={(event) => setForm({ ...form, fullName: event.target.value })}/></label><label>Email<input type="email" required value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })}/></label></div>
      <label>Temporary password<input type="password" required minLength={8} autoComplete="new-password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })}/></label>
      <div className="permission-grid">{scopes.map(([key, label, description]) => <label className="permission-card" key={key}><input type="checkbox" checked={form.permissions.includes(key)} onChange={() => toggle(key)}/><span><strong>{label}</strong><small>{description}</small></span></label>)}</div>
      <button>Create staff account</button>
    </form>
    <div className="admin-card-list">{staff.map((person) => <article className="admin-record" key={person.id}>
      <div className="admin-record-head"><div><span className="eyebrow">STAFF ACCOUNT</span><h2>{person.fullName}</h2><p>{person.email}</p></div><span className={`status-pill ${person.isActive ? "verified" : "cancelled"}`}>{person.isActive ? "Active" : "Paused"}</span></div>
      <div className="permission-grid compact">{scopes.map(([key, label, description]) => <label className="permission-card" key={key}><input type="checkbox" checked={person.permissions?.includes(key)} onChange={() => update(person, { permissions: person.permissions?.includes(key) ? person.permissions.filter((item) => item !== key) : [...(person.permissions || []), key] })}/><span><strong>{label}</strong><small>{description}</small></span></label>)}</div>
      <button className={person.isActive ? "text-link danger" : "text-link"} onClick={() => update(person, { isActive: !person.isActive })}>{person.isActive ? "Pause access" : "Restore access"}</button>
    </article>)}</div>
  </main>;
}
