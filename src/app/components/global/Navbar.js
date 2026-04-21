"use client";

import { useState, useEffect, useRef } from "react";
import { useTheme } from "next-themes";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Sun, Moon, Search, Heart, ShoppingCart, Menu, X,
  ChevronDown, ChevronRight, LogOut, User, Package,
  MapPin, CreditCard, Settings, Loader2, LayoutDashboard,
} from "lucide-react";
import { useAuth } from "@/app/context/AuthContext";
import api from "@/app/lib/api";
import Link from "next/link";
import Image from "next/image";
import { PromoTicker } from "./PromoTicker";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Static Config
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const NAV_LINKS = [
  {
    label: "Shop", href: "/shop",
    sub: [
      { icon: "🌿", name: "Organic", href: "/shop/organic", desc: "Natural products" },
      { icon: "🌸", name: "Skincare", href: "/shop/skincare", desc: "Pure & gentle" },
      { icon: "🍃", name: "Wellness", href: "/shop/wellness", desc: "Mind & body" },
      { icon: "🪴", name: "Home & Garden", href: "/shop/home", desc: "Living spaces" },
    ],
  },
  { label: "Products", href: "/product" },
  { label: "Deals", href: "/deals" },
  { label: "About", href: "/about" },
];

const ACCOUNT_LINKS = [
  { icon: User, label: "My Profile", href: "/account/profile", badge: null },
  { icon: Package, label: "My Orders", href: "/account/orders", badge: "orders" },
  { icon: Heart, label: "Wishlist", href: "/account/wishlist", badge: "wishlist" },
  { icon: MapPin, label: "Addresses", href: "/account/address", badge: null },
  { icon: CreditCard, label: "Payment Methods", href: "/account/payment", badge: null },
  // { icon: Settings, label: "Settings", href: "/account/settings", badge: null },
];

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Role → dashboard redirect
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const ROLE_REDIRECT = {
  admin: "/admin",
  vendor: "/vendor",  // vendor → info page
  deliveryboy: "/deliveryboy",
  customer: "/customer",
};

function getDashboardHref(user) {
  const role = (user?.role || "customer").toLowerCase();
  return ROLE_REDIRECT[role] || "/customer";
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Helpers
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function getInitials(name) {
  if (!name) return "?";
  return name.trim().split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Avatar
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function Avatar({ src, name, size = 28, className = "", ring = false }) {
  const initials = getInitials(name);
  const ringClass = ring ? "ring-2 ring-accent ring-offset-2 ring-offset-card" : "";

  if (src) {
    return (
      <div
        style={{ width: size, height: size }}
        className={`relative rounded-lg overflow-hidden flex-shrink-0 ${ringClass} ${className}`}
      >
        <Image src={src} alt={name || "avatar"} fill sizes={`${size}px`} className="object-cover" />
      </div>
    );
  }

  return (
    <div
      style={{ width: size, height: size, fontSize: size * 0.35 }}
      className={`rounded-lg bg-primary flex items-center justify-center
                  text-accent font-black nb-font-display flex-shrink-0 ${ringClass} ${className}`}
    >
      {initials}
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TanStack Query fetch functions
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const fetchProfile = async () => { const { data } = await api.get("/api/user/profile"); return data; };

const fetchBadges = async () => {
  const [ordersRes, wishlistRes, cartRes] = await Promise.allSettled([
    api.get("/api/user/orders/count"),
    api.get("/api/user/wishlist/count"),
    api.get("/api/user/cart/count"),
  ]);
  return {
    orders: ordersRes.status === "fulfilled" ? (ordersRes.value.data?.count ?? 0) : 0,
    wishlist: wishlistRes.status === "fulfilled" ? (wishlistRes.value.data?.count ?? 0) : 0,
    cart: cartRes.status === "fulfilled" ? (cartRes.value.data?.count ?? 0) : 0,
  };
};

// const fetchPromo = async () => {
//   const { data } = await api.get("/api/promotion/active");
//   return data?.text || null;
// };

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MegaMenu
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function MegaMenu({ items, show }) {
  return (
    <div className={`absolute top-full left-1/2 -translate-x-1/2 mt-4 w-96 z-50
            transition-all duration-300
            ${show ? "opacity-100 translate-y-0 pointer-events-auto"
        : "opacity-0 -translate-y-2 pointer-events-none"}`}>
      <div className="flex justify-center -mb-px">
        <div className="w-3 h-3 bg-card border-l border-t border-accent/30 rotate-45 z-10" />
      </div>
      <div className="bg-card border border-accent/20 rounded-2xl shadow-2xl p-3 grid grid-cols-2 gap-1.5">
        {items.map((item) => (
          <Link key={item.name} href={item.href}
            className="flex items-center gap-3 p-3 rounded-xl
                       hover:bg-accent/20 transition-all duration-200 group no-underline">
            <span className="text-xl w-9 h-9 flex items-center justify-center
                             bg-accent/20 rounded-xl group-hover:bg-accent/35 transition-colors flex-shrink-0">
              {item.icon}
            </span>
            <div>
              <p className="text-sm font-bold text-heading m-0 leading-tight">{item.name}</p>
              <p className="text-xs text-body m-0">{item.desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ProfileDropdown  ← Dashboard link যোগ হয়েছে
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function ProfileDropdown({ show, onClose, user, profileData, badgeCounts, onLogout, isLoading }) {
  const displayName = profileData?.name || user?.name || user?.email || "User";
  const email = profileData?.email || user?.email || "";
  const avatarSrc = user?.avatar || profileData?.avatar || null;
  const dashHref = getDashboardHref(user);

  return (
    <div className={`absolute top-full right-0 mt-4 w-72 z-50
            transition-all duration-300
            ${show ? "opacity-100 translate-y-0 pointer-events-auto"
        : "opacity-0 -translate-y-2 pointer-events-none"}`}>
      <div className="flex justify-end pr-4 -mb-px">
        <div className="w-3 h-3 bg-card border-l border-t border-accent/30 rotate-45 z-10" />
      </div>

      <div className="bg-card border border-accent/20 rounded-2xl shadow-2xl overflow-hidden">

        {/* Profile Header */}
        <div className="bg-primary px-5 pt-5 pb-8 relative overflow-hidden">
          <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full bg-white/5" />
          <div className="absolute -bottom-8 -left-5 w-24 h-24 rounded-full bg-white/5" />
          <div className="relative flex items-center gap-3">
            <div className="relative flex-shrink-0">
              {isLoading ? (
                <div className="w-[52px] h-[52px] rounded-2xl bg-accent/30 flex items-center justify-center">
                  <Loader2 size={20} className="text-accent animate-spin" />
                </div>
              ) : (
                <Avatar src={avatarSrc} name={displayName} size={52} className="rounded-2xl shadow-lg" />
              )}
              <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-success rounded-full border-2 border-primary" />
            </div>

            <div className="min-w-0 flex-1">
              {isLoading ? (
                <div className="space-y-1.5">
                  <div className="h-4 w-28 bg-accent/20 rounded animate-pulse" />
                  <div className="h-3 w-36 bg-accent/15 rounded animate-pulse" />
                </div>
              ) : (
                <>
                  <p className="font-black text-[15px] text-accent m-0 truncate nb-font-display">{displayName}</p>
                  <p className="text-[11px] text-accent/60 mt-0.5 mb-1.5 m-0 truncate">{email}</p>
                  <span className="text-[10px] font-bold bg-accent/15 text-accent px-2.5 py-0.5 rounded-full">
                    {profileData?.membershipLevel || "✦ Member"}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* ✅ Dashboard Button — role অনুযায়ী redirect */}
        <div className="px-3 pt-3 pb-1">
          <Link href={dashHref} onClick={onClose}
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl
                       bg-primary hover:bg-secondary text-accent text-sm font-bold
                       transition-all no-underline nb-font">
            <LayoutDashboard size={15} />
            My Dashboard
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 border-b border-accent/10 mt-2">
          {[
            [badgeCounts?.orders ?? 0, "Orders"],
            [profileData?.reviews ?? 0, "Reviews"],
            [profileData?.points ?? 0, "Points"],
          ].map(([v, l], i) => (
            <div key={l}
              className={`text-center py-2.5 cursor-pointer hover:bg-accent/10 transition-colors
                          ${i < 2 ? "border-r border-accent/10" : ""}`}>
              <p className="text-sm font-black text-accent m-0">
                {isLoading
                  ? <span className="inline-block h-4 w-6 bg-accent/20 rounded animate-pulse" />
                  : v}
              </p>
              <p className="text-[10px] text-body font-semibold m-0">{l}</p>
            </div>
          ))}
        </div>

        {/* Links */}
        <nav className="p-2">
          {ACCOUNT_LINKS.map((item) => {
            const Icon = item.icon;
            const badgeVal = item.badge && badgeCounts?.[item.badge];
            return (
              <Link key={item.label} href={item.href} onClick={onClose}
                className="flex items-center justify-between px-3 py-2.5
                           rounded-xl hover:bg-accent/15 transition-all group no-underline">
                <div className="flex items-center gap-2.5">
                  <Icon size={15} className="text-body group-hover:text-primary transition-colors flex-shrink-0" />
                  <span className="text-sm font-semibold text-heading group-hover:text-primary transition-colors">
                    {item.label}
                  </span>
                </div>
                {badgeVal > 0 && (
                  <span className="text-[10px] font-black bg-accent text-primary px-2 py-0.5 rounded-full">
                    {badgeVal}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-2 pt-0 border-t border-accent/10">
          <button onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 py-2.5
                       rounded-xl bg-danger/10 text-danger text-sm font-bold
                       hover:bg-danger/20 transition-colors border-none cursor-pointer nb-font">
            <LogOut size={15} />
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}

function GuestDropdown({ show }) {
  return (
    <div className={`absolute top-full right-0 mt-4 w-56 z-50
            transition-all duration-300
            ${show ? "opacity-100 translate-y-0 pointer-events-auto"
        : "opacity-0 -translate-y-2 pointer-events-none"}`}>
      <div className="flex justify-end pr-4 -mb-px">
        <div className="w-3 h-3 bg-card border-l border-t border-accent/30 rotate-45 z-10" />
      </div>
      <div className="bg-card border border-accent/20 rounded-2xl shadow-2xl overflow-hidden p-3 space-y-2">
        <p className="text-xs text-body text-center pb-1">Sign in to access your account</p>
        <Link href="/login"
          className="flex items-center justify-center w-full py-2.5 rounded-xl
                     bg-primary text-accent text-sm font-bold hover:bg-secondary
                     transition-colors no-underline">
          Sign In
        </Link>
        <Link href="/register"
          className="flex items-center justify-center w-full py-2.5 rounded-xl
                     border border-accent/30 text-heading text-sm font-bold
                     hover:bg-accent/15 transition-colors no-underline">
          Create Account
        </Link>
      </div>
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Main Navbar
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export default function Navbar() {
  const [mounted, setMounted] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [megaOpen, setMegaOpen] = useState(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const { theme, setTheme } = useTheme();
  const { user, isAuth, logOutUser, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();

  const megaTimer = useRef(null);
  const profileRef = useRef(null);
  const searchRef = useRef(null);

  // TanStack Query
  const { data: profileData, isLoading: profileLoading } = useQuery({
    queryKey: ["navbar-profile"],
    queryFn: fetchProfile,
    enabled: !!isAuth,
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });

  const { data: badgeCounts = { orders: 0, wishlist: 0, cart: 0 } } = useQuery({
    queryKey: ["navbar-badges"],
    queryFn: fetchBadges,
    enabled: !!isAuth,
    staleTime: 1000 * 60 * 2,
    retry: 1,
  });


  // const promoText = promoRaw ? `${promoRaw} · ${promoRaw}` : "🌿 Free shipping on orders $50+";

  // Effects
  useEffect(() => setMounted(true), []);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);
  useEffect(() => {
    const fn = () => { if (window.innerWidth >= 1024) setDrawerOpen(false); };
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [drawerOpen]);
  useEffect(() => {
    const fn = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);
  useEffect(() => {
    if (searchOpen) setTimeout(() => searchRef.current?.focus(), 150);
  }, [searchOpen]);

  // Handlers
  const onMegaEnter = (label) => { clearTimeout(megaTimer.current); setMegaOpen(label); };
  const onMegaLeave = () => { megaTimer.current = setTimeout(() => setMegaOpen(null), 150); };
  const toggleTheme = () => setTheme(theme === "dark" ? "light" : "dark");
  const handleSearch = (e) => {
    if (e.key === "Enter" && searchQuery.trim())
      window.location.href = `/search?q=${encodeURIComponent(searchQuery.trim())}`;
  };
  const handleLogout = async () => {
    setProfileOpen(false);
    setDrawerOpen(false);
    queryClient.removeQueries({ queryKey: ["navbar-profile"] });
    queryClient.removeQueries({ queryKey: ["navbar-badges"] });
    try { await logOutUser(); } catch { }
  };

  const displayName = profileData?.name || user?.name || user?.email || "";
  const avatarSrc = user?.avatar || profileData?.avatar || null;
  const dashHref = getDashboardHref(user);

  return (
    <>




      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800;900&family=Nunito:wght@400;500;600;700;800&display=swap');
        .nb-link { position: relative; text-decoration: none; }
        .nb-link::after {
          content: ''; position: absolute; bottom: -2px; left: 50%;
          width: 0; height: 2.5px; border-radius: 2px;
          background: var(--accent);
          transition: width .25s ease, left .25s ease;
        }
        .nb-link:hover::after { width: 100%; left: 0; }
        @keyframes nb-tick { from { transform: translateX(110%); } to { transform: translateX(-110%); } }
        .nb-ticker { animation: nb-tick 26s linear infinite; white-space: nowrap; }
        @keyframes nb-pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.3;transform:scale(1.9)} }
        .nb-pulse  { animation: nb-pulse 2.2s ease infinite; }
        .nb-search { max-height: 0; overflow: hidden; transition: max-height .35s cubic-bezier(.4,0,.2,1); }
        .nb-search.open { max-height: 72px; }
        .nb-drawer  { transition: transform .35s cubic-bezier(.4,0,.2,1); }
        .nb-overlay { transition: opacity .3s ease; }

        .nb-ticker-container {
  display: flex;
  gap: 50px; 
  white-space: nowrap;
}


.nb-ticker-wrapper {
  display: flex;
  white-space: nowrap;
  animation: nb-tick 26s linear infinite;
  /* নিশ্চিত করুন এটি ডান দিক থেকে শুরু হচ্ছে */
  padding-left: 100%; 
}



@keyframes nb-tick {
  from { 
    /* ডান দিক থেকে শুরু হবে (স্ক্রিনের বাইরে) */
    transform: translateX(0%); 
  } 
  to { 
    /* বাম দিকে চলে যাবে (পুরো কন্টেইনারের দৈর্ঘ্যের সমান মাইনাস) */
    transform: translateX(-100%); 
  } 
}
              `}</style>


      {/* Promo Ticker */}
      <div className="bg-primary overflow-hidden h-8 flex items-center nb-font">

        <PromoTicker/>

      </div>

      {/* Header */}
      <header className={`sticky top-0 z-40 bg-card nb-font transition-all duration-300
                ${scrolled
          ? "shadow-[0_4px_32px_rgba(0,0,0,0.10)] border-b border-accent/30"
          : "border-b border-accent/10"}`}>

        <div className="max-w-7xl mx-auto px-4 sm:px-5 h-[68px] flex items-center gap-3">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 flex-shrink-0 mr-2 group no-underline">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center
                            text-xl shadow-lg group-hover:rotate-6 transition-transform duration-300">
              🌿
            </div>
            <span className="text-xl font-black tracking-tight hidden sm:block nb-font-display">
              <span className="text-heading">Nova</span>
              <span className="text-accent">Shop</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-0.5 flex-1">
            {NAV_LINKS.map((link) => (
              <div key={link.label} className="relative"
                onMouseEnter={() => link.sub && onMegaEnter(link.label)}
                onMouseLeave={() => link.sub && onMegaLeave()}>
                <Link href={link.href}
                  className="nb-link flex items-center gap-1 px-4 py-2
                             text-sm font-semibold text-body hover:text-heading
                             rounded-xl hover:bg-accent/15 transition-all duration-200">
                  {link.label}
                  {link.sub && (
                    <ChevronDown size={13}
                      className={`text-body transition-transform duration-200
                                  ${megaOpen === link.label ? "rotate-180" : ""}`} />
                  )}
                </Link>
                {link.sub && <MegaMenu items={link.sub} show={megaOpen === link.label} />}
              </div>
            ))}

            {/* ✅ Dashboard link — only when logged in */}
            {isAuth && (
              <Link href={dashHref}
                className="nb-link flex items-center gap-1.5 px-4 py-2
                           text-sm font-semibold text-body hover:text-heading
                           rounded-xl hover:bg-accent/15 transition-all duration-200">
                <LayoutDashboard size={14} className="text-body" />
                Dashboard
              </Link>
            )}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-1.5 ml-auto">

            {/* Search */}
            <button onClick={() => setSearchOpen(!searchOpen)} aria-label="Search"
              className={`w-[38px] h-[38px] rounded-xl flex items-center justify-center
                          transition-all hover:scale-105 active:scale-95 border-none cursor-pointer
                          ${searchOpen ? "bg-primary text-accent" : "bg-accent/20 text-heading hover:bg-accent/30"}`}>
              <Search size={17} />
            </button>

            {/* Theme Toggle */}
            {mounted && (
              <button onClick={toggleTheme} aria-label="Toggle theme"
                className="relative w-[38px] h-[38px] rounded-xl bg-accent/20 text-heading
                           flex items-center justify-center hover:bg-accent/30
                           transition-all hover:scale-105 active:scale-95 border-none cursor-pointer overflow-hidden">
                <span className={`absolute flex items-center justify-center transition-all duration-300
                                  ${theme === "dark" ? "opacity-100 rotate-0" : "opacity-0 -rotate-90"}`}>
                  <Sun size={17} />
                </span>
                <span className={`absolute flex items-center justify-center transition-all duration-300
                                  ${theme !== "dark" ? "opacity-100 rotate-0" : "opacity-0 rotate-90"}`}>
                  <Moon size={17} />
                </span>
              </button>
            )}

            {/* Wishlist */}
            {isAuth && (
              <div className="hidden sm:block relative">
                <Link href="/account/wishlist" aria-label="Wishlist"
                  className="w-[38px] h-[38px] rounded-xl bg-accent/20 text-heading
                             flex items-center justify-center hover:bg-accent/30
                             transition-all hover:scale-105 active:scale-95 no-underline">
                  <Heart size={17} />
                </Link>
                {badgeCounts.wishlist > 0 && (
                  <span className="nb-pulse absolute -top-1 -right-1 w-2.5 h-2.5
                                   bg-danger rounded-full border-2 border-card" />
                )}
              </div>
            )}

            {/* Cart */}
            <Link href="/cart" aria-label="Cart"
              className="hidden sm:flex items-center gap-2 bg-primary hover:bg-secondary
                         text-accent h-[38px] px-4 rounded-xl text-sm font-bold
                         transition-all hover:scale-105 active:scale-95
                         border-none cursor-pointer nb-font no-underline">
              <ShoppingCart size={17} />
              <span>Cart</span>
              <span className="bg-accent text-primary text-[10px] font-black
                               w-5 h-5 rounded-full flex items-center justify-center">
                {badgeCounts.cart || 0}
              </span>
            </Link>

            {/* Profile / Auth */}
            <div className="hidden sm:block relative" ref={profileRef}>
              {authLoading ? (
                <div className="w-[38px] h-[38px] rounded-xl bg-accent/15 flex items-center justify-center">
                  <Loader2 size={16} className="text-accent animate-spin" />
                </div>
              ) : isAuth ? (
                <>
                  <button
                    onClick={() => setProfileOpen(!profileOpen)}
                    aria-label="Profile"
                    className={`flex items-center gap-2 h-[38px] pl-1.5 pr-3
                                rounded-xl transition-all hover:scale-105 active:scale-95
                                border-none cursor-pointer nb-font
                                ${profileOpen ? "bg-accent/20" : "bg-transparent hover:bg-accent/12"}`}>
                    <Avatar src={avatarSrc} name={displayName} size={28} ring={profileOpen} />
                    <span className="text-sm font-semibold text-heading hidden lg:block max-w-[80px] truncate">
                      {displayName.split(" ")[0] || "Account"}
                    </span>
                    <ChevronDown size={13}
                      className={`text-body transition-transform duration-200 ${profileOpen ? "rotate-180" : ""}`} />
                  </button>

                  <ProfileDropdown
                    show={profileOpen}
                    onClose={() => setProfileOpen(false)}
                    user={user}
                    profileData={profileData}
                    badgeCounts={badgeCounts}
                    onLogout={handleLogout}
                    isLoading={profileLoading}
                  />
                </>
              ) : (
                <>
                  <button
                    onClick={() => setProfileOpen(!profileOpen)}
                    className={`flex items-center gap-2 h-[38px] px-3
                                rounded-xl transition-all hover:scale-105 active:scale-95
                                border-none cursor-pointer nb-font
                                ${profileOpen ? "bg-accent/20" : "bg-accent/15 hover:bg-accent/25"}`}>
                    <User size={16} className="text-heading" />
                    <span className="text-sm font-semibold text-heading hidden lg:block">Sign In</span>
                  </button>
                  <GuestDropdown show={profileOpen} />
                </>
              )}
            </div>

            {/* Hamburger */}
            <button onClick={() => setDrawerOpen(true)} aria-label="Open menu"
              className="lg:hidden w-[38px] h-[38px] rounded-xl bg-accent/20 text-heading
                         flex items-center justify-center hover:bg-accent/30
                         transition-all border-none cursor-pointer ml-0.5">
              <Menu size={20} />
            </button>
          </div>
        </div>

        {/* Search Slide-down */}
        <div className={`nb-search border-t border-accent/10 ${searchOpen ? "open" : ""}`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-5 py-2.5">
            <div className="relative">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-body" />
              <input
                ref={searchRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearch}
                placeholder="Search organic products, brands, categories... (Enter to search)"
                className="w-full bg-bg border border-accent/20 text-heading
                           placeholder:text-body text-sm pl-10 pr-10 py-2.5 rounded-xl
                           outline-none focus:border-accent transition-colors nb-font"
              />
              <button
                onClick={() => { setSearchOpen(false); setSearchQuery(""); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-body
                           hover:text-heading transition-colors text-xl leading-none
                           bg-transparent border-none cursor-pointer">
                ×
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Backdrop */}
      <div
        className="nb-overlay fixed inset-0 z-50 bg-primary/50 backdrop-blur-sm lg:hidden"
        style={{ opacity: drawerOpen ? 1 : 0, pointerEvents: drawerOpen ? "auto" : "none" }}
        onClick={() => setDrawerOpen(false)}
      />

      {/* Mobile Drawer */}
      <aside className={`nb-drawer fixed top-0 left-0 h-full w-[285px] z-[60]
                bg-card flex flex-col shadow-2xl nb-font lg:hidden
                ${drawerOpen ? "translate-x-0" : "-translate-x-full"}`}>

        {/* Drawer Header */}
        <div className="flex items-center justify-between px-4 h-[68px] border-b border-accent/15 flex-shrink-0">
          <Link href="/" className="flex items-center gap-2 no-underline">
            <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center text-lg">🌿</div>
            <span className="text-lg font-black nb-font-display">
              <span className="text-heading">Terra</span>
              <span className="text-accent">Shop</span>
            </span>
          </Link>
          <button onClick={() => setDrawerOpen(false)}
            className="w-9 h-9 rounded-xl bg-accent/15 text-heading
                       flex items-center justify-center hover:bg-accent/25
                       transition-all border-none cursor-pointer">
            <X size={20} />
          </button>
        </div>

        {/* Drawer Profile */}
        {authLoading ? (
          <div className="bg-primary/80 px-4 py-5 flex-shrink-0 flex items-center gap-3">
            <div className="w-12 h-12 rounded-[13px] bg-accent/20 animate-pulse" />
            <div className="space-y-2 flex-1">
              <div className="h-3.5 w-28 bg-accent/20 rounded animate-pulse" />
              <div className="h-3   w-36 bg-accent/15 rounded animate-pulse" />
            </div>
          </div>
        ) : isAuth ? (
          <div className="bg-primary px-4 py-4 flex-shrink-0 relative overflow-hidden">
            <div className="absolute -top-5 -right-5 w-[72px] h-[72px] rounded-full bg-white/5" />
            <div className="absolute -bottom-6 -left-4 w-[80px] h-[80px] rounded-full bg-white/5" />
            <div className="relative flex items-center gap-3">
              <div className="relative flex-shrink-0">
                <Avatar src={avatarSrc} name={displayName} size={48} className="rounded-[13px] shadow-lg" />
                <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-success rounded-full border-2 border-primary" />
              </div>
              <div className="min-w-0">
                <p className="font-black text-sm text-accent m-0 nb-font-display truncate">{displayName}</p>
                <p className="text-[11px] text-accent/55 mt-0.5 mb-1.5 m-0 truncate">
                  {profileData?.email || user?.email}
                </p>
                <span className="text-[10px] font-bold bg-accent/12 text-accent px-2 py-0.5 rounded-full">
                  {profileData?.membershipLevel || "✦ Member"}
                </span>
              </div>
            </div>

            {/* ✅ Dashboard button in drawer profile section */}
            <Link href={dashHref} onClick={() => setDrawerOpen(false)}
              className="flex items-center justify-center gap-2 mt-3.5 w-full py-2 rounded-xl
                         bg-accent/12 hover:bg-accent/20 text-accent text-xs font-bold
                         transition-colors no-underline nb-font">
              <LayoutDashboard size={13} />
              Go to Dashboard
            </Link>

            <div className="grid grid-cols-3 gap-2 mt-2.5">
              {[
                [badgeCounts.orders, "Orders"],
                [profileData?.reviews ?? 0, "Reviews"],
                [profileData?.points ?? 0, "Points"],
              ].map(([v, l]) => (
                <div key={l} className="text-center bg-accent/10 rounded-[10px] py-1.5">
                  <p className="text-sm font-black text-accent m-0">
                    {profileLoading
                      ? <span className="inline-block h-3.5 w-5 bg-accent/20 rounded animate-pulse" />
                      : v}
                  </p>
                  <p className="text-[10px] text-accent/50 font-semibold m-0">{l}</p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-primary px-4 py-4 flex-shrink-0">
            <p className="text-accent/70 text-sm mb-3">Welcome! Sign in to your account.</p>
            <div className="grid grid-cols-2 gap-2">
              <Link href="/login" onClick={() => setDrawerOpen(false)}
                className="flex items-center justify-center py-2 rounded-xl
                           bg-accent text-primary text-sm font-bold no-underline hover:bg-accent-hover transition-colors">
                Sign In
              </Link>
              <Link href="/register" onClick={() => setDrawerOpen(false)}
                className="flex items-center justify-center py-2 rounded-xl
                           border border-accent/40 text-accent text-sm font-bold no-underline hover:bg-accent/10 transition-colors">
                Register
              </Link>
            </div>
          </div>
        )}

        {/* Drawer Search */}
        <div className="px-3.5 py-3 border-b border-accent/10 flex-shrink-0">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-body" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && searchQuery.trim()) {
                  setDrawerOpen(false);
                  window.location.href = `/search?q=${encodeURIComponent(searchQuery.trim())}`;
                }
              }}
              className="w-full bg-bg border border-accent/18 text-heading
                         placeholder:text-body text-sm pl-9 pr-3.5 py-2.5 rounded-xl
                         outline-none focus:border-accent transition-colors nb-font"
            />
          </div>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 overflow-y-auto px-2.5 py-3">
          <p className="text-[10px] font-extrabold uppercase tracking-[.18em] text-body px-2.5 mb-2">
            Navigation
          </p>

          {NAV_LINKS.map((link) => (
            <div key={link.label}>
              <Link href={link.href}
                onClick={() => !link.sub && setDrawerOpen(false)}
                className="nb-font flex items-center justify-between px-3 py-2.5
                           rounded-xl text-sm font-semibold text-body hover:text-heading
                           hover:bg-accent/15 transition-all no-underline">
                <span>{link.label}</span>
                <ChevronRight size={14} className="text-body" />
              </Link>
              {link.sub && (
                <div className="ml-2.5 mt-0.5 mb-1.5 space-y-0.5">
                  {link.sub.map((s) => (
                    <Link key={s.name} href={s.href}
                      onClick={() => setDrawerOpen(false)}
                      className="nb-font flex items-center gap-2.5 px-3 py-2
                                 rounded-xl text-sm text-body hover:text-heading
                                 hover:bg-accent/10 transition-all no-underline">
                      <span>{s.icon}</span>
                      <span className="font-medium">{s.name}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* ✅ Dashboard link in mobile nav */}
          {isAuth && (
            <Link href={dashHref} onClick={() => setDrawerOpen(false)}
              className="nb-font flex items-center gap-2.5 px-3 py-2.5
                         rounded-xl text-sm font-semibold text-body hover:text-heading
                         hover:bg-accent/15 transition-all no-underline mt-0.5">
              <LayoutDashboard size={14} className="text-body flex-shrink-0" />
              Dashboard
            </Link>
          )}

          {isAuth && (
            <div className="border-t border-accent/10 mt-2 pt-3 space-y-0.5">
              <p className="text-[10px] font-extrabold uppercase tracking-[.18em] text-body px-2.5 mb-2">
                Account
              </p>
              {ACCOUNT_LINKS.map((item) => {
                const Icon = item.icon;
                const badgeVal = item.badge && badgeCounts?.[item.badge];
                return (
                  <Link key={item.label} href={item.href}
                    onClick={() => setDrawerOpen(false)}
                    className="nb-font flex items-center justify-between px-3 py-2.5
                               rounded-xl text-sm font-semibold text-body hover:text-heading
                               hover:bg-accent/15 transition-all no-underline">
                    <span className="flex items-center gap-2.5">
                      <Icon size={15} className="text-body flex-shrink-0" />
                      {item.label}
                    </span>
                    {badgeVal > 0 && (
                      <span className="text-[10px] font-black bg-accent text-primary px-2 py-0.5 rounded-full">
                        {badgeVal}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          )}
        </nav>

        {/* Drawer Footer */}
        <div className="flex-shrink-0 border-t border-accent/10 p-3 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            {mounted && (
              <button onClick={toggleTheme}
                className="flex items-center justify-center gap-1.5 py-2.5
                           rounded-xl bg-accent/15 text-heading text-xs font-bold
                           hover:bg-accent/25 transition-colors border-none cursor-pointer nb-font">
                {theme === "dark" ? <><Sun size={13} /> Light</> : <><Moon size={13} /> Dark</>}
              </button>
            )}
            <Link href="/cart" onClick={() => setDrawerOpen(false)}
              className="flex items-center justify-center gap-1.5 py-2.5
                         rounded-xl bg-primary text-accent text-xs font-bold
                         hover:bg-secondary transition-colors no-underline nb-font">
              <ShoppingCart size={13} />
              Cart ({badgeCounts.cart || 0})
            </Link>
          </div>
          {isAuth && (
            <button onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 py-2.5
                         rounded-xl bg-danger/10 text-danger text-sm font-bold
                         hover:bg-danger/20 transition-colors border-none cursor-pointer nb-font">
              <LogOut size={15} /> Sign Out
            </button>
          )}
        </div>
      </aside>
    </>
  );
}
