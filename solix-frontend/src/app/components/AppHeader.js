"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import api from "../lib/api";
import { getAuthConfig, getToken, removeToken } from "../lib/auth";

function isActive(pathname, path) {
  if (path === "/") {
    return pathname === "/";
  }

  return pathname === path || pathname.startsWith(`${path}/`);
}

export default function AppHeader() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const token = getToken();

    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    const fetchCurrentUser = async () => {
      try {
        const response = await api.get("/auth/me", getAuthConfig());
        setUser(response.data.data);
      } catch {
        removeToken();
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchCurrentUser();
  }, [pathname]);

  const goTo = (path) => {
    router.push(path);
  };

  const handleLogout = () => {
    removeToken();
    setUser(null);
    router.push("/login");
  };

  const buttonClass = (path) =>
    `rounded-md border px-3 py-2 text-sm ${
      isActive(pathname, path)
        ? "border-slate-900 bg-slate-900 text-white"
        : "bg-white text-slate-900"
    }`;

  return (
    <header className="border-b bg-white">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <button
              type="button"
              onClick={() => goTo("/")}
              className="text-xl font-semibold"
            >
              Solix
            </button>

            <p className="text-sm text-slate-600">
              Simple clothing store frontend
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => goTo("/")}
              className={buttonClass("/")}
            >
              Home
            </button>

            <button
              type="button"
              onClick={() => goTo("/categories")}
              className={buttonClass("/categories")}
            >
              Categories
            </button>

            <button
              type="button"
              onClick={() => goTo("/cart")}
              className={buttonClass("/cart")}
            >
              Cart
            </button>

            <button
              type="button"
              onClick={() => goTo("/orders")}
              className={buttonClass("/orders")}
            >
              Orders
            </button>

            {!loading && user ? (
              <>
                {user.role === "admin" && (
                  <button
                    type="button"
                    onClick={() => goTo("/admin")}
                    className={buttonClass("/admin")}
                  >
                    Admin
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => goTo("/profile")}
                  className={buttonClass("/profile")}
                >
                  {user.fullName}
                </button>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="rounded-md border bg-white px-3 py-2 text-sm"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => goTo("/login")}
                  className={buttonClass("/login")}
                >
                  Login
                </button>

                <button
                  type="button"
                  onClick={() => goTo("/register")}
                  className={buttonClass("/register")}
                >
                  Register
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
