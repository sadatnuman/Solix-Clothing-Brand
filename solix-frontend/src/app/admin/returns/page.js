"use client";
import api from "../../lib/api";
import ResourceList from "../components/ResourceList";

export default function ReturnsAdmin(){
  const update=(status)=>(item)=>api.patch(`/admin/returns/${item.id}`,{status});
  const actions={
    approve:{label:"Approve",when:(item)=>item.status==="requested",request:update("approved")},
    reject:{label:"Reject",when:(item)=>item.status==="requested",request:update("rejected")},
    received:{label:"Mark received",when:(item)=>item.status==="approved",request:update("received")},
    complete:{label:"Complete",when:(item)=>item.status==="received",request:update("completed")},
  };
  return <ResourceList eyebrow="AFTERCARE" title="Returns & exchanges." endpoint="/admin/returns" actions={actions} render={(item)=><><div className="admin-record-head"><div><span className="eyebrow">{item.type} · {item.order?.orderNumber}</span><h2>{item.reason}</h2></div><span className={`status-pill ${item.status}`}>{item.status}</span></div><p>{item.notes||"No additional notes."}</p></>}/>;
}
