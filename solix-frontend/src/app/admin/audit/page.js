"use client";
import ResourceList from "../components/ResourceList";
export default function AuditAdmin(){return <ResourceList eyebrow="SECURITY" title="Audit log." endpoint="/admin/audit" render={x=><><div className="admin-record-head"><div><span className="eyebrow">{x.targetType} · {x.targetId}</span><h2>{x.action}</h2></div><small>{new Date(x.createdAt).toLocaleString("en-BD")}</small></div><p>Actor: {x.actor?.fullName||x.actor||"System"}</p></>}/>}
