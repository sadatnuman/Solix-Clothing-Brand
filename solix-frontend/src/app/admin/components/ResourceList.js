"use client";
import { useCallback, useEffect, useState } from "react";
import api, { errorMessage } from "../../lib/api";

export default function ResourceList({ eyebrow, title, endpoint, render, actions }) {
  const [items, setItems] = useState(null); const [error, setError] = useState(""); const [message, setMessage] = useState("");
  const load = useCallback(() => { setError(""); api.get(endpoint).then((r) => setItems(r.data.data || [])).catch((e) => setError(errorMessage(e))); }, [endpoint]);
  useEffect(() => { load(); }, [load]); // eslint-disable-line react-hooks/set-state-in-effect
  async function run(item, action) { setError(""); try { await actions[action].request(item); setMessage(actions[action].success || "Updated."); await load(); } catch (e) { setError(errorMessage(e)); } }
  return <main className="studio-page"><div className="studio-heading"><div><span className="eyebrow">{eyebrow}</span><h1>{title}</h1></div><span>{items?.length ?? "—"} records</span></div>{message&&<p className="status-note">{message}</p>}{error&&<p className="status-note error-note">{error}</p>}{items===null&&!error&&<div className="skeleton detail-loading"/>}{items?.length?<div className="admin-card-list">{items.map(item=><article className="admin-record" key={item.id}>{render(item)}{actions&&<div className="admin-record-actions">{Object.entries(actions).filter(([,a])=>!a.when||a.when(item)).map(([key,a])=><button key={key} onClick={()=>run(item,key)}>{a.label}</button>)}</div>}</article>)}</div>:items&&<div className="empty-state">Nothing needs attention here.</div>}</main>;
}
