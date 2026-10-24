"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api, { errorMessage } from "../lib/api";
import { getAuthConfig, getToken, removeToken, signOut } from "../lib/auth";

export default function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    if (!getToken()) {
      router.replace("/login?next=/profile");
      return;
    }
    let active = true;
    api.get("/users/profile", getAuthConfig())
      .then((response) => active && setProfile(response.data.data))
      .catch((requestError) => {
        if (requestError.response?.status === 401) {
          removeToken();
          router.replace("/login?next=/profile");
        } else if (active) setError(errorMessage(requestError));
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [router]);

  const handleSignOut = async () => {
    await signOut(api);
    sessionStorage.removeItem("solix_checkout_key");
    router.push("/");
    router.refresh();
  };

  return (
    <main className="section account-page">
      <span className="eyebrow">YOUR SOLIX SPACE</span>
      <div className="account-heading">
        <div><h1>{profile ? `Hello, ${profile.fullName.split(" ")[0]}.` : "Your account."}</h1><p>Your details, orders and studio tools live here.</p></div>
        <button type="button" className="text-link" onClick={handleSignOut}>Sign out ↗</button>
      </div>
      {loading && <div className="skeleton account-skeleton" role="status" aria-label="Loading account" />}
      {error && <p className="status-note error-note" role="alert">{error}</p>}
      {profile && (
        <div className="account-grid">
          <section className="account-card account-details">
            <span className="eyebrow">01 / YOUR DETAILS</span>
            <dl>
              <div><dt>Full name</dt><dd>{profile.fullName}</dd></div>
              <div><dt>Email</dt><dd>{profile.email}</dd></div>
              <div><dt>Phone</dt><dd>{profile.phone || "Add your phone"}</dd></div>
              <div><dt>Delivery address</dt><dd>{profile.address || "Add an address"}</dd></div>
            </dl>
            <Link className="button dark" href="/profile/edit">Edit your details <span>↗</span></Link>
          </section>
          <div className="account-actions">
            <Link href="/orders"><span className="eyebrow">02 / ORDER HISTORY</span><h2>Follow your favourites.</h2><p>View current orders, delivery status and payment details.</p><b>Open your orders ↗</b></Link>
            <Link href="/profile/addresses"><span className="eyebrow">03 / DELIVERY BOOK</span><h2>Your saved addresses.</h2><p>Add home, work and gift delivery addresses.</p><b>Manage addresses ↗</b></Link>
            <Link href="/wishlist"><span className="eyebrow">04 / WISHLIST</span><h2>Pieces to remember.</h2><p>Return to the products you saved.</p><b>Open wishlist ↗</b></Link>
            <Link href="/notifications"><span className="eyebrow">05 / NOTIFICATIONS</span><h2>Order updates, together.</h2><p>Payment, delivery, return and support updates appear here.</p><b>View updates ↗</b></Link>
            <Link href="/support"><span className="eyebrow">06 / SUPPORT INBOX</span><h2>Talk to the Solix team.</h2><p>Create a request and read every reply on the website.</p><b>Open support ↗</b></Link>
            <Link href="/profile/returns"><span className="eyebrow">07 / AFTERCARE</span><h2>Returns & exchanges.</h2><p>Follow every request and read the studio decision.</p><b>View requests ↗</b></Link>
            {['admin','staff'].includes(profile.role) && <Link href="/admin"><span className="eyebrow">STUDIO ACCESS</span><h2>Behind the scenes.</h2><p>Manage catalog, stock, orders and payments.</p><b>Open studio ↗</b></Link>}
          </div>
        </div>
      )}
    </main>
  );
}
