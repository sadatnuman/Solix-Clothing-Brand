"use client";

import { useEffect, useState } from "react";
import api, { errorMessage } from "../../lib/api";

const keys = ["about", "faq", "size-guide", "delivery", "returns", "privacy", "terms"];

export default function ContentAdmin() {
  const [selected, setSelected] = useState("about");
  const [form, setForm] = useState({ title: "", body: "", isPublished: true });
  const [settings, setSettings] = useState({ brandTagline: "", address: "", phone: "", whatsapp: "", mapUrl: "", mapPlusCode: "", latitude: 23.6848205, longitude: 89.5658677, socialLinks: {}, freeShipping: true });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  useEffect(() => { Promise.all([api.get(`/content/${selected}`).catch(() => ({ data: { data: { title: "", body: "", isPublished: true } } })), api.get("/store/settings")]).then(([page, store]) => { setForm((current) => ({ ...current, ...page.data.data })); setSettings((current) => ({ ...current, ...store.data.data })); }); }, [selected]);

  async function savePage(event) { event.preventDefault(); setError(""); try { await api.put(`/admin/content/${selected}`, form); setMessage("Page published."); } catch (requestError) { setError(errorMessage(requestError)); } }
  async function saveSettings(event) { event.preventDefault(); setError(""); try { await api.patch("/admin/settings", settings); setMessage("Store identity and contact settings saved."); } catch (requestError) { setError(errorMessage(requestError)); } }

  return <main className="studio-page">
    <div className="studio-heading"><div><span className="eyebrow">CMS & CONFIGURATION</span><h1>Content & settings.</h1></div></div>
    {message && <p className="status-note">{message}</p>}{error && <p className="status-note error-note">{error}</p>}
    <div className="studio-grid">
      <form className="admin-editor form-stack" onSubmit={savePage}><label>Page<select value={selected} onChange={(event) => setSelected(event.target.value)}>{keys.map((key) => <option key={key}>{key}</option>)}</select></label><label>Title<input value={form.title || ""} onChange={(event) => setForm({ ...form, title: event.target.value })}/></label><label>Body<textarea rows={12} value={form.body || ""} onChange={(event) => setForm({ ...form, body: event.target.value })}/></label><label className="check-row"><input type="checkbox" checked={form.isPublished !== false} onChange={(event) => setForm({ ...form, isPublished: event.target.checked })}/> Published</label><button>Save page</button></form>
      <form className="admin-editor form-stack" onSubmit={saveSettings}><h2>Store identity</h2><label>Brand tagline<textarea rows={3} value={settings.brandTagline || ""} onChange={(event) => setSettings({ ...settings, brandTagline: event.target.value })}/></label><label>Store address<textarea rows={3} value={settings.address || ""} onChange={(event) => setSettings({ ...settings, address: event.target.value })}/></label><div className="form-pair"><label>Support phone<input value={settings.phone || ""} onChange={(event) => setSettings({ ...settings, phone: event.target.value })}/></label><label>WhatsApp<input value={settings.whatsapp || ""} onChange={(event) => setSettings({ ...settings, whatsapp: event.target.value })}/></label></div><label>Google Maps URL<input type="url" value={settings.mapUrl || ""} onChange={(event) => setSettings({ ...settings, mapUrl: event.target.value })}/></label><div className="form-pair"><label>Maps plus code<input value={settings.mapPlusCode || ""} onChange={(event) => setSettings({ ...settings, mapPlusCode: event.target.value })}/></label><label>Coordinates<input readOnly value={`${settings.latitude || ""}, ${settings.longitude || ""}`}/></label></div><label>Facebook URL<input type="url" value={settings.socialLinks?.facebook || ""} onChange={(event) => setSettings({ ...settings, socialLinks: { ...(settings.socialLinks || {}), facebook: event.target.value } })}/></label><label>TikTok URL<input type="url" value={settings.socialLinks?.tiktok || ""} onChange={(event) => setSettings({ ...settings, socialLinks: { ...(settings.socialLinks || {}), tiktok: event.target.value } })}/></label><label className="check-row"><input type="checkbox" checked={settings.freeShipping !== false} onChange={(event) => setSettings({ ...settings, freeShipping: event.target.checked })}/> Complimentary delivery</label><button>Save settings</button></form>
    </div>
  </main>;
}
