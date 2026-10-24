"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import api, { errorMessage } from "../../lib/api";

const blank = { label: "Home", recipientName: "", phone: "", line1: "", line2: "", area: "", city: "", postalCode: "", isDefault: false };

export default function AddressesPage() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(blank);
  const [editing, setEditing] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const load = () => api.get("/addresses").then((r) => setItems(r.data.data || [])).catch((e) => setError(errorMessage(e)));
  useEffect(() => { load(); }, []);
  async function save(event) { event.preventDefault(); setError(""); try { if (editing) await api.patch(`/addresses/${editing}`, form); else await api.post("/addresses", form); setForm(blank); setEditing(""); setMessage("Address saved."); await load(); } catch (e) { setError(errorMessage(e)); } }
  async function remove(id) { if (!window.confirm("Remove this saved address?")) return; await api.delete(`/addresses/${id}`); await load(); }
  function edit(item) { setEditing(item.id); setForm({ ...blank, ...item }); window.scrollTo({ top: 0, behavior: "smooth" }); }
  return <main className="section account-subpage"><Link href="/profile" className="text-link">← Account</Link><div className="section-heading"><div><span className="eyebrow">DELIVERY BOOK</span><h1>Saved addresses.</h1></div></div>{message && <p className="status-note">{message}</p>}{error && <p className="status-note error-note" role="alert">{error}</p>}<div className="commerce-grid"><form className="form-stack account-form" onSubmit={save}><h2>{editing ? "Edit address" : "Add an address"}</h2><div className="form-pair"><label>Label<input required value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} /></label><label>Recipient<input required value={form.recipientName} onChange={(e) => setForm({ ...form, recipientName: e.target.value })} /></label></div><label>Phone<input required type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></label><label>Address line<input required value={form.line1} onChange={(e) => setForm({ ...form, line1: e.target.value })} /></label><label>Apartment / landmark<input value={form.line2} onChange={(e) => setForm({ ...form, line2: e.target.value })} /></label><div className="form-pair"><label>Area<input value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })} /></label><label>City<input required value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></label></div><label>Postal code<input value={form.postalCode} onChange={(e) => setForm({ ...form, postalCode: e.target.value })} /></label><label className="check-row"><input type="checkbox" checked={form.isDefault} onChange={(e) => setForm({ ...form, isDefault: e.target.checked })} /> Use as default address</label><div className="button-row"><button className="button dark">{editing ? "Update" : "Save address"} ↗</button>{editing && <button type="button" className="text-link" onClick={() => { setEditing(""); setForm(blank); }}>Cancel</button>}</div></form><div className="address-list">{items.length ? items.map((item) => <article className="address-card" key={item.id}><div><span className="eyebrow">{item.label}{item.isDefault ? " · DEFAULT" : ""}</span><h2>{item.recipientName}</h2><p>{item.phone}<br/>{[item.line1,item.line2,item.area,item.city,item.postalCode].filter(Boolean).join(", ")}</p></div><div className="button-row"><button className="text-link" onClick={() => edit(item)}>Edit</button><button className="text-link danger" onClick={() => remove(item.id)}>Remove</button></div></article>) : <div className="empty-state">No saved addresses yet.</div>}</div></div></main>;
}
