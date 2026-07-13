"use client";

import { useState, useEffect } from "react";
import {
  Send, ShieldCheck, Truck, RotateCcw, CheckCircle2,
  Clock, Facebook, Instagram, Youtube, X as XIcon,
} from "lucide-react";
import api from "@/app/lib/api";
import Link from "next/link";
import { useAuth } from "@/app/context/AuthContext";

export default function Footer() {
  const { user } = useAuth(); // Angalia kama user yupo kwenye session
  const [email, setEmail] = useState("");
  const [subState, setSubState] = useState("idle"); // idle | loading | done | error
  const [pendingCount, setPendingCount] = useState(0);

  // ── Fetch pending orders count ─────────────────────────────────────────
  useEffect(() => {
    if (user) {
      api.get("/api/orders/my?status=pending&limit=1")
        .then(({ data }) => setPendingCount(data.pagination?.total || 0))
        .catch(() => { });
    }
  }, [user]);

  // ── Subscribe handler ──────────────────────────────────────────────────
  const handleSubscribe = async () => {
    if (!email || !email.includes("@")) return;
    setSubState("loading");
    try {
      await api.post("/api/newsletter/subscribe", { email });
      setSubState("done");
    } catch {
      setSubState("error");
      setTimeout(() => setSubState("idle"), 3000);
    }
  };

  // Mfumo wa object ili kila link iende kwenye url yake sahihi
  const shopLinks = [
    { name: "All products", url: "/shop" },
    { name: "New arrivals", url: "/shop?sort=newest" },
    { name: "Best sellers", url: "/shop?sort=trending" },
    { name: "Deals & offers", url: "/deals" },
    { name: "Gift cards", url: "/gift-cards" }
  ];

  // Tunatengeneza list ya Help links kulingana na kama user ame-login
  const helpLinks = [];
  
  if (user) {
    helpLinks.push(
      { name: "My orders", url: "/orders" },
      { name: "Track delivery", url: "/track-delivery" }
    );
  } else {
    // Ukipenda unaweza kuweka link ya login hapa user akiwa hajaingia
    helpLinks.push({ name: "Login / Register", url: "/login" });
  }

  // Zilizobaki zinaonekana kwa wote
  helpLinks.push(
    { name: "Returns", url: "/returns" },
    { name: "FAQ", url: "/faq" },
    { name: "Contact", url: "/contact" }
  );

  return (
    <footer className="w-full">

      {/* ── Pending Orders Banner ──────────────────────────────────────── */}
      {user && pendingCount > 0 && (
        <div className="flex items-center gap-3 px-6 py-5  bg-yellow-400/10 border-b border-yellow-400/30">
          <Clock size={14} className="text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
          <p className="text-yellow-800 dark:text-yellow-300 text-sm flex-1">
            You have <strong>{pendingCount}</strong> pending{" "}
            {pendingCount === 1 ? "order" : "orders"} awaiting confirmation.
          </p>
          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-yellow-500 text-white flex-shrink-0">
            Pending
          </span>
        </div>
      )}

      {/* ── Main Footer ────────────────────────────────────────────────── */}
      <div className="bg-card border-t border-accent-10 pt-12 ">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 pb-10 py-7">

            {/* Brand */}
            <div>
              <h2 className="text-2xl font-display font-medium text-[var(--color-primary)] mb-1.5">
                Nova Shop
              </h2>
              <p className="text-body text-sm leading-relaxed mb-5 max-w-[210px]">
                Fresh finds, fast delivery. Your one-stop shop for everything you love.
              </p>
              <div className="flex gap-2">
                {[
                  { icon: Facebook, label: "Facebook" },
                  { icon: Instagram, label: "Instagram" },
                  { icon: XIcon, label: "X" },
                  { icon: Youtube, label: "YouTube" },
                ].map(({ icon: Icon, label }) => (
                  <a key={label} href="#" aria-label={label}
                    className="w-9 h-9 rounded-xl border border-accent-10 bg-bg flex items-center justify-center text-body hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-colors">
                    <Icon size={15} />
                  </a>
                ))}
              </div>
            </div>

            {/* Shop */}
            <div>
              <p className="text-[17px] font-semibold uppercase tracking-widest text-body mb-4 ">Shop</p>
              <ul className="space-y-2.5">
                {shopLinks.map(link => (
                  <li key={link.name}>
                    <Link href={link.url}
                      className="text-heading text-sm opacity-75 hover:opacity-100 hover:text-[var(--color-primary)] transition-colors">
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Help */}
            <div>
              <p className="text-[17px] font-semibold uppercase tracking-widest text-body mb-4">Help</p>
              <ul className="space-y-2.5">
                {helpLinks.map(link => (
                  <li key={link.name}>
                    <Link href={link.url}
                      className="text-heading text-sm opacity-75 hover:opacity-100 hover:text-[var(--color-primary)] transition-colors">
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Newsletter */}
            <div>
              <p className="text-[17px] font-semibold uppercase tracking-widest text-body mb-4">
                Stay in the loop
              </p>
              <p className="text-body text-sm leading-relaxed mb-3">
                Get the best deals delivered straight to your inbox.
              </p>

              {subState === "done" ? (
                <div className="flex items-center gap-2 text-[var(--color-success)] text-sm font-semibold py-2">
                  <CheckCircle2 size={15} />
                  You're subscribed!
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleSubscribe()}
                    placeholder="your@email.com"
                    className="px-3 py-2 text-sm rounded-xl border border-accent-10 bg-bg text-heading placeholder:text-body outline-none focus:border-[var(--color-primary)] transition-all"
                  />
                  <button
                    onClick={handleSubscribe}
                    disabled={subState === "loading"}
                    className="py-2 text-sm font-semibold rounded-xl bg-[var(--color-primary)] hover:bg-[var(--color-secondary)] text-white transition-colors disabled:opacity-70 flex items-center justify-center gap-2"
                  >
                    <Send size={13} />
                    {subState === "loading" ? "Subscribing..." : "Subscribe"}
                  </button>
                  {subState === "error" && (
                    <p className="text-[var(--color-danger)] text-xs">Something went wrong. Try again.</p>
                  )}
                </div>
              )}

              <div className="flex flex-wrap gap-2 mt-3">
                {[
                  { icon: ShieldCheck, text: "Secure" },
                  { icon: Truck, text: "Fast delivery" },
                  { icon: RotateCcw, text: "Easy returns" },
                ].map(({ icon: Icon, text }) => (
                  <span key={text}
                    className="flex items-center gap-1.5 text-[11px] text-body border border-accent-10 rounded-full px-2.5 py-1 bg-bg">
                    <Icon size={11} className="text-[var(--color-primary)]" />
                    {text}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <hr className="border-accent-10" />

          {/* Bottom bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 py-4">
            <p className="text-body text-[12.5px]">
              © 2026{" "}
              <span className="text-[var(--color-primary)] font-medium">Nova Shop</span>.
              {" "}All rights reserved.
            </p>
            <ul className="flex gap-5 list-none m-0 p-0">
              {[
                { name: "Privacy policy", url: "/privacy" },
                { name: "Terms of use", url: "/terms" },
                { name: "Sitemap", url: "/sitemap" }
              ].map(l => (
                <li key={l.name}>
                  <Link href={l.url} className="text-body text-[12.5px] hover:text-[var(--color-primary)] transition-colors">
                    {l.name}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="flex gap-1.5">
              {["bKash", "Nagad", "SSL", "COD"].map(p => (
                <span key={p}
                  className="text-[11px] font-medium px-2.5 py-1 rounded border border-accent-10 text-body bg-bg">
                  {p}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}