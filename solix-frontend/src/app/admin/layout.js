"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import api from "../lib/api";
import { getAuthConfig } from "../lib/auth";

const links = [
  ["", "Overview", null],
  ["products", "Products", "catalog"],
  ["collections", "Collections", "catalog"],
  ["categories", "Categories", "catalog"],
  ["sizes", "Sizes", "catalog"],
  ["variants", "Variants", "catalog"],
  ["coupons", "Coupons", "catalog"],
  ["inventory", "Inventory ledger", "fulfilment"],
  ["orders", "Orders", "fulfilment"],
  ["payments", "Payments", "fulfilment"],
  ["returns", "Returns", "fulfilment"],
  ["reviews", "Reviews", "support"],
  ["customers", "Customers", "support"],
  ["support", "Support", "support"],
  ["content", "Content & settings", "admin"],
  ["staff", "Staff & access", "admin"],
  ["audit", "Audit log", "admin"],
];

export default function AdminLayout({ children }) {
  const path = usePathname();
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    api.get("/auth/me", getAuthConfig()).then((response) => {
      if (!active) return;
      const user = response.data.data;
      if (["admin", "staff"].includes(user.role)) setProfile(user);
      else setError("This space is for the Solix studio team.");
    }).catch((requestError) => {
      if (requestError.response?.status === 401) router.replace("/login");
      else if (active) setError("Unable to verify access. Please reload.");
    });
    return () => { active = false; };
  }, [router]);

  const visibleLinks = useMemo(() => !profile ? [] : links.filter(([, , scope]) =>
    profile.role === "admin" || !scope || profile.permissions?.includes(scope)
  ), [profile]);

  if (!profile) return <main className="section"><p role="status">{error || "Opening your studio…"}</p></main>;

  return <div className="admin-shell">
    <aside className="admin-sidebar">
      <span className="eyebrow">SOLIX STUDIO · {profile.role.toUpperCase()}</span>
      <h2>A little<br/>behind the scenes.</h2>
      <nav aria-label="Administration">{visibleLinks.map(([url, label], index) => {
        const href = `/admin${url ? `/${url}` : ""}`;
        return <Link className={path === href ? "active" : ""} href={href} key={label}><span>{String(index + 1).padStart(2, "0")}</span>{label}<b>↗</b></Link>;
      })}</nav>
      <Link className="text-link" href="/shop">View storefront ↗</Link>
    </aside>
    <div className="admin-content">{children}</div>
  </div>;
}
