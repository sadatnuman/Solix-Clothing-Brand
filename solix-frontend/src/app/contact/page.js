"use client";

import { useEffect, useState } from "react";
import api, { errorMessage } from "../lib/api";
import { STORE_INFO } from "../lib/store";

const empty = { name: "", phone: "", email: "", subject: "", message: "" };

export default function ContactPage() {
  const [form, setForm] = useState(empty);
  const [store, setStore] = useState({
    brandTagline: STORE_INFO.tagline,
    address: STORE_INFO.address,
    phone: STORE_INFO.phone,
    mapUrl: STORE_INFO.mapUrl,
    mapPlusCode: STORE_INFO.mapPlusCode,
    latitude: STORE_INFO.latitude,
    longitude: STORE_INFO.longitude,
    socialLinks: { facebook: STORE_INFO.facebook, tiktok: STORE_INFO.tiktok },
  });
  const [status, setStatus] = useState("");
  useEffect(() => { api.get("/store/settings").then((response) => setStore((current) => ({ ...current, ...response.data.data, socialLinks: { ...current.socialLinks, ...response.data.data.socialLinks } }))).catch(() => {}); }, []);
  async function submit(event) { event.preventDefault(); try { await api.post("/support-tickets", form); setForm(empty); setStatus("Thank you. Your support reference has been created."); } catch (requestError) { setStatus(errorMessage(requestError)); } }
  return <main className="section content-page">
    <span className="eyebrow">TALK TO SOLIX</span><h1>Contact us.</h1><p>Questions about fit, delivery or an order? Send a message to our website support inbox or reach our Rajbari store directly.</p>
    <div className="contact-strip"><div><small>VISIT</small><strong>{store.address}</strong></div><div><small>CALL</small><a href={`tel:${store.phone?.replace(/[^+\d]/g, "")}`}>{store.phone}</a></div><div><small>MAP</small><a href={store.mapUrl || STORE_INFO.mapUrl} target="_blank" rel="noreferrer">{store.mapPlusCode || STORE_INFO.mapPlusCode} · Directions ↗</a></div><div><small>FOLLOW</small><span><a href={store.socialLinks?.facebook} target="_blank" rel="noreferrer">Facebook ↗</a> · <a href={store.socialLinks?.tiktok} target="_blank" rel="noreferrer">TikTok ↗</a></span></div></div>
    <section className="store-location" aria-labelledby="store-location-title">
      <div className="store-location-copy"><span className="eyebrow">SOLIX · BAHARPUR</span><h2 id="store-location-title">Visit our clothing store.</h2><p>{store.brandTagline || STORE_INFO.tagline}</p><address>{store.address}<br/>{store.mapPlusCode || STORE_INFO.mapPlusCode}, Baharpur</address><a className="button dark" href={store.mapUrl || STORE_INFO.mapUrl} target="_blank" rel="noreferrer">Open in Google Maps <span>↗</span></a></div>
      <div className="store-map"><iframe title="Google Maps location of Solix clothing store in Baharpur, Rajbari" src={STORE_INFO.mapEmbedUrl} loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen /></div>
    </section>
    {status && <p className="status-note" role="status">{status}</p>}
    <form className="form-stack account-form" onSubmit={submit}><div className="form-pair"><label>Name<input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })}/></label><label>Phone<input required value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })}/></label></div><label>Email <span className="optional">Optional</span><input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })}/></label><label>Subject<input required value={form.subject} onChange={(event) => setForm({ ...form, subject: event.target.value })}/></label><label>Message<textarea required minLength={10} rows={6} value={form.message} onChange={(event) => setForm({ ...form, message: event.target.value })}/></label><button className="button dark">Create support request ↗</button></form>
  </main>;
}
