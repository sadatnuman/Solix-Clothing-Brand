"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import api from "../lib/api";
import { getToken, getAuthConfig, removeToken } from "../lib/auth";

export default function AppHeader() {
  const path = usePathname();
  const [user, setUser] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let active = true;
    async function load() {
      if (!getToken()) {
        if (active) {
          setUser(null);
          setUnreadCount(0);
        }
        return;
      }
      try {
        const [response, notifications] = await Promise.all([
          api.get("/auth/me", getAuthConfig()),
          api.get("/notifications", getAuthConfig()).catch(() => ({ data: { data: [] } })),
        ]);
        if (active) {
          setUser(response.data.data);
          setUnreadCount((notifications.data.data || []).filter((item) => !item.readAt).length);
        }
      } catch (error) {
        if (error.response?.status === 401) {
          removeToken();
          if (active) setUser(null);
        }
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [path]);

  useEffect(() => {
    if (!open) return;
    const close = (event) => event.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [open]);

  const active = (href) => path === href || path.startsWith(`${href}/`);

  return (
    <>
      <div className="announcement">
        <span>EVERYDAY, EXTRAORDINARY.</span>
        <span>Complimentary delivery on every order <span aria-hidden="true">↗</span></span>
        <span>DESIGNED TO BE LIVED IN</span>
      </div>
      <header className="site-header">
        <Link href="/" className="brand-logo" aria-label="Solix clothing brand home">
          <span className="brand-logo-frame">
            <Image
              src="/images/solix-royal-logo.jpg"
              alt=""
              fill
              priority
              sizes="76px"
              className="brand-logo-art"
            />
          </span>
          <span className="sr-only">Solix</span>
        </Link>
        <nav className="desktop-nav" aria-label="Main navigation">
          <Link className={active("/shop") ? "active" : ""} href="/shop">The collection</Link>
          <Link href="/shop?sort=newest">New arrivals <span className="nav-dot" /></Link>
          <Link className={active("/categories") ? "active" : ""} href="/categories">Collections</Link>
          <Link href="/#story">Our story</Link>
        </nav>
        <div className="header-actions">
          <Link className="search-link" href="/shop?focus=search" aria-label="Search collection">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/></svg>
          </Link>
          <Link href={user ? "/profile" : "/login"}>{user ? "Account" : "Sign in"}</Link>
          {user && <Link className="notification-link" href="/notifications" aria-label={unreadCount ? `${unreadCount} unread notifications` : "Notifications"}>
            <svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/></svg>
            {unreadCount > 0 && <span className="notification-badge">{unreadCount > 9 ? "9+" : unreadCount}</span>}
          </Link>}
          <Link className="bag-link" href="/cart">Bag <span aria-hidden="true">↗</span></Link>
          <button className="menu-toggle" type="button" aria-label={open ? "Close navigation" : "Open navigation"} aria-controls="mobile-menu" aria-expanded={open} onClick={() => setOpen(!open)}>{open ? "×" : "☰"}</button>
        </div>
      </header>
      {open && (
        <nav id="mobile-menu" className="mobile-nav" aria-label="Mobile navigation" onClick={() => setOpen(false)}>
          <Link href="/shop">The collection <span>↗</span></Link>
          <Link href="/categories">Collections <span>↗</span></Link>
          <Link href="/#story">Our story <span>↗</span></Link>
          <Link href={user ? "/orders" : "/login?next=/orders"}>My orders <span>↗</span></Link>
          {user && <Link href="/wishlist">Wishlist <span>↗</span></Link>}
          {user && <Link href="/notifications">Notifications <span>↗</span></Link>}
          <Link href={user ? "/support" : "/contact"}>Support <span>↗</span></Link>
          {['admin','staff'].includes(user?.role) && <Link href="/admin">Studio dashboard <span>↗</span></Link>}
          <Link href={user ? "/profile" : "/login"}>{user ? "Account" : "Sign in"} <span>↗</span></Link>
        </nav>
      )}
    </>
  );
}
