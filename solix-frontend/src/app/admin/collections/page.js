"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import api, { errorMessage, imageUrl } from "../../lib/api";
import AdminImagePicker, { uploadCatalogImage } from "../../components/AdminImagePicker";

const blank = { name: "", description: "", imageUrl: "", sortOrder: 0, isActive: true };

export default function CollectionsAdmin() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(blank);
  const [imageFile, setImageFile] = useState(null);
  const [editing, setEditing] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const load = () => api.get("/collections").then((response) => setItems(response.data.data || []));
  useEffect(() => { load(); }, []);

  const reset = () => {
    setForm(blank);
    setImageFile(null);
    setEditing("");
  };

  async function save(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const uploadedImage = imageFile ? await uploadCatalogImage(api, imageFile) : "";
      const payload = {
        ...form,
        imageUrl: uploadedImage || form.imageUrl || undefined,
        sortOrder: Number(form.sortOrder),
      };
      if (editing) await api.patch(`/admin/collections/${editing}`, payload);
      else await api.post("/admin/collections", payload);
      setMessage(editing ? "Collection updated." : "Collection created.");
      reset();
      await load();
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setSaving(false);
    }
  }

  return <main className="studio-page">
    <div className="studio-heading"><div><span className="eyebrow">MERCHANDISING</span><h1>Collections.</h1></div></div>
    {message && <p className="status-note">{message}</p>}
    {error && <p className="status-note error-note">{error}</p>}
    <form className="admin-editor form-stack" onSubmit={save}>
      <h2>{editing ? "Edit collection" : "Create collection"}</h2>
      <div className="form-pair">
        <label>Name<input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })}/></label>
        <label>Order<input type="number" value={form.sortOrder} onChange={(event) => setForm({ ...form, sortOrder: event.target.value })}/></label>
      </div>
      <label>Description<textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })}/></label>
      <AdminImagePicker label="Collection cover image" file={imageFile} currentUrl={form.imageUrl} onChange={setImageFile} />
      <label className="check-row"><input type="checkbox" checked={form.isActive} onChange={(event) => setForm({ ...form, isActive: event.target.checked })}/> Published</label>
      <div className="admin-form-actions"><button disabled={saving}>{saving ? "Uploading & saving…" : "Save collection"}</button>{editing && <button type="button" onClick={reset}>Cancel</button>}</div>
    </form>
    <div className="admin-card-list">{items.map((item) => <article className="admin-record" key={item.id}>
      {item.imageUrl && <div className="admin-record-image"><Image src={imageUrl(item.imageUrl)} alt={`${item.name} collection`} fill sizes="420px" unoptimized /></div>}
      <div className="admin-record-head"><div><span className="eyebrow">/{item.slug}</span><h2>{item.name}</h2><p>{item.description}</p></div><span className={`status-pill ${item.isActive ? "verified" : "cancelled"}`}>{item.isActive ? "Published" : "Hidden"}</span></div>
      <button className="text-link" onClick={() => { setEditing(item.id); setForm({ ...blank, ...item }); setImageFile(null); window.scrollTo({ top: 0, behavior: "smooth" }); }}>Edit</button>
    </article>)}</div>
  </main>;
}
