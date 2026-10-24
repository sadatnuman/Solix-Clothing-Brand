const SESSION_KEY = "solix_signed_in";

export function saveToken() {
  if (typeof window !== "undefined") localStorage.setItem(SESSION_KEY, "1");
}

export function getToken() {
  return typeof window !== "undefined" && localStorage.getItem(SESSION_KEY) === "1";
}

export function removeToken() {
  if (typeof window !== "undefined") localStorage.removeItem(SESSION_KEY);
}

export function getAuthConfig() { return {}; }

export async function signOut(api) {
  try { await api.post("/auth/logout"); } finally { removeToken(); }
}
