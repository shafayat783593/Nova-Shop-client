"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
    Zap, Tag, Truck, Gift, ShoppingCart, Clock, ChevronRight,
    Flame, Sparkles, Timer, Package, Star, ArrowRight, Plus,
    Percent, BadgePercent, TrendingUp, AlertCircle, Loader2,
    ChevronLeft, Check
} from "lucide-react";
import api from "@/app/lib/api";
import { useCart } from "@/app/context/Cartcontext";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n) => Number(n || 0).toLocaleString("en-BD");

function useCountdown(endDate) {
    const calc = () => {
        if (!endDate) return null;
        const diff = new Date(endDate) - Date.now();
        if (diff <= 0) return { h: "00", m: "00", s: "00", expired: true };
        const h = Math.floor(diff / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        const s = Math.floor((diff % 60000) / 1000);
        return {
            h: String(h).padStart(2, "0"),
            m: String(m).padStart(2, "0"),
            s: String(s).padStart(2, "0"),
            expired: false,
        };
    };
    const [time, setTime] = useState(calc);
    useEffect(() => {
        if (!endDate) return;
        const t = setInterval(() => setTime(calc()), 1000);
        return () => clearInterval(t);
    }, [endDate]);
    return time;
}

function getDiscountLabel(promo) {
    if (promo.type === "free_shipping") return "Free Delivery";
    if (promo.discountType === "percent") return `${promo.value}% OFF`;
    if (promo.discountType === "fixed") return `৳${fmt(promo.value)} OFF`;
    if (promo.discountType === "free") return "FREE";
    return "Deal";
}

function getTypeConfig(type) {
    const map = {
        product: { label: "Product Deal", icon: Tag, color: "#2d6a4f", bg: "rgba(45,106,79,0.12)" },
        cart: { label: "Cart Offer", icon: ShoppingCart, color: "#b5451b", bg: "rgba(181,69,27,0.10)" },
        bxgy: { label: "Buy X Get Y", icon: Gift, color: "#7c3aed", bg: "rgba(124,58,237,0.10)" },
        free_shipping: { label: "Free Shipping", icon: Truck, color: "#0369a1", bg: "rgba(3,105,161,0.10)" },
    };
    return map[type] || map.product;
}

// ─── Shimmer ──────────────────────────────────────────────────────────────────
function Shimmer({ className = "" }) {
    return (
        <div className={`relative overflow-hidden rounded-2xl bg-[var(--accent-opacity)] ${className}`}>
            <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite]"
                style={{ background: "linear-gradient(90deg,transparent,rgba(255,255,255,0.08),transparent)" }} />
        </div>
    );
}

// ─── Countdown Block ──────────────────────────────────────────────────────────
function CountdownBlock({ endDate, size = "md" }) {
    const t = useCountdown(endDate);
    if (!t || t.expired) return null;

    const isSmall = size === "sm";
    return (
        <div className={`flex items-center gap-${isSmall ? "1" : "1.5"}`}>
            {[t.h, t.m, t.s].map((val, i) => (
                <span key={i} className="flex items-center gap-0.5">
                    <span className={` tabular-nums bg-[var(--text-main)] text-[var(--card-bg)] rounded ${isSmall ? "text-[10px] px-1 py-0.5" : "text-xs px-1.5 py-1"}`}>
                        {val}
                    </span>
                    {i < 2 && <span className={`text-body font-bold ${isSmall ? "text-[9px]" : "text-[10px]"}`}>:</span>}
                </span>
            ))}
        </div>
    );
}

// ─── Hero Banner Countdown ─────────────────────────────────────────────────────
function HeroCountdown({ endDate }) {
    const t = useCountdown(endDate);
    if (!t || t.expired) return null;

    const units = [
        { val: t.h, label: "Hrs" },
        { val: t.m, label: "Min" },
        { val: t.s, label: "Sec" },
    ];

    return (
        <div className="flex items-end gap-3">
            {units.map(({ val, label }, i) => (
                <div key={i} className="flex flex-col items-center">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center text-2xl sm:text-3xl tabular-nums"
                        style={{ background: "rgba(255,255,255,0.18)", color: "#fff", backdropFilter: "blur(4px)", border: "1px solid rgba(255,255,255,0.25)" }}>
                        {val}
                    </div>
                    <span className="text-white/70 text-[10px] font-semibold mt-1 tracking-widest uppercase">{label}</span>
                </div>
            ))}
        </div>
    );
}

// ─── Deal Card ────────────────────────────────────────────────────────────────
function DealCard({ promo, index }) {
    const router = useRouter();
    const { addToCart, adding } = useCart();
    const [added, setAdded] = useState(false);
    const cfg = getTypeConfig(promo.type);
    const TypeIcon = cfg.icon;
    const label = getDiscountLabel(promo);
    const hasTimer = !!promo.endDate;
    const usagePct = promo.usageLimit ? Math.min(100, Math.round((promo.usedCount / promo.usageLimit) * 100)) : 0;
    const usageLeft = promo.usageLimit ? promo.usageLimit - promo.usedCount : null;
    const isHot = usageLeft !== null && usageLeft < 20;
    const isFeatured = promo.priority >= 5;
    const firstProduct = promo.scope?.products?.[0] || promo.bxgy?.productIds?.[0];

    const handleShop = () => {
        if (promo.type === "product" && promo.scope?.products?.length > 0) {
            router.push(`/products?promo=${promo._id}`);
        } else if (promo.type === "cart") {
            router.push("/products");
        } else if (promo.type === "bxgy") {
            router.push(`/products?promo=${promo._id}`);
        } else {
            router.push("/products");
        }
    };

    async function handleAddProduct() {
        if (!firstProduct?._id) return handleShop();
        const res = await addToCart({
            productId: firstProduct._id,
            quantity: 1,
            product: firstProduct,
        });
        if (res?.success) {
            setAdded(true);
            setTimeout(() => setAdded(false), 2200);
        }
    }

    return (
        <div
            className="group relative bg-card rounded-3xl border border-accent-10 overflow-hidden flex flex-col transition-all duration-300 hover:-translate-y-1"
            style={{
                animationDelay: `${index * 60}ms`,
                boxShadow: isFeatured ? "0 0 0 2px var(--color-primary)" : undefined,
            }}
        >
            {/* Featured ribbon */}
            {isFeatured && (
                <div className="absolute top-3 left-0 z-10 flex items-center gap-1 bg-[var(--color-primary)] text-white text-[10px] font-bold px-3 py-1 rounded-r-full shadow-sm">
                    <Star size={9} fill="white" /> Featured
                </div>
            )}

            {/* Hot badge */}
            {isHot && (
                <div className="absolute top-3 right-3 z-10 flex items-center gap-1 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-full">
                    <Flame size={9} fill="white" /> Hot
                </div>
            )}

            {/* Image / Visual area */}
            <div className="relative h-44 overflow-hidden" style={{ background: cfg.bg }}>
                {firstProduct?.images?.[0] ? (
                    <img
                        src={firstProduct.images[0]}
                        alt={firstProduct.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <TypeIcon size={52} style={{ color: cfg.color, opacity: 0.35 }} />
                    </div>
                )}
                {/* Gradient overlay */}
                <div className="absolute inset-0"
                    style={{ background: "linear-gradient(to top, rgba(0,0,0,0.45) 0%, transparent 55%)" }} />

                {/* Discount badge — bottom left */}
                <div className="absolute bottom-3 left-3 rounded-xl px-3 py-1.5 text-sm text-white shadow"
                    style={{ background: cfg.color }}>
                    {label}
                </div>

                {/* Type chip — top right (if not hot) */}
                {!isHot && (
                    <div className="absolute top-3 right-3 flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold backdrop-blur-sm border border-white/20"
                        style={{ background: "rgba(255,255,255,0.15)", color: "#fff" }}>
                        <TypeIcon size={9} /> {cfg.label}
                    </div>
                )}
            </div>

            {/* Body */}
            <div className="p-4 flex flex-col flex-1 gap-3">
                <div>
                    <h3 className="text-heading font-bold text-sm leading-snug line-clamp-2">{promo.name}</h3>
                    {promo.description && (
                        <p className="text-body text-xs mt-1 line-clamp-2 leading-relaxed">{promo.description}</p>
                    )}
                </div>

                {/* Conditions */}
                <div className="flex flex-wrap gap-1.5">
                    {promo.conditions?.minCartValue && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[var(--accent-opacity)] text-body">
                            Min ৳{fmt(promo.conditions.minCartValue)}
                        </span>
                    )}
                    {promo.conditions?.paymentMethod && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[var(--accent-opacity)] text-body capitalize">
                            {promo.conditions.paymentMethod}
                        </span>
                    )}
                    {promo.stackable && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
                            Stackable
                        </span>
                    )}
                    {promo.type === "bxgy" && promo.bxgy && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600">
                            Buy {promo.bxgy.buy} Get {promo.bxgy.get}
                        </span>
                    )}
                </div>

                {/* Usage bar */}
                {promo.usageLimit && (
                    <div className="space-y-1">
                        <div className="flex justify-between text-[10px] text-body">
                            <span>{usageLeft > 0 ? `${usageLeft} left` : "Sold out"}</span>
                            <span>{usagePct}% claimed</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-[var(--accent-opacity)] overflow-hidden">
                            <div className="h-full rounded-full transition-all duration-700"
                                style={{ width: `${usagePct}%`, background: usagePct >= 80 ? "#ef4444" : "var(--color-primary)" }} />
                        </div>
                    </div>
                )}

                {/* Timer */}
                {hasTimer && (
                    <div className="flex items-center gap-2">
                        <Timer size={12} className="text-body flex-shrink-0" />
                        <CountdownBlock endDate={promo.endDate} size="sm" />
                    </div>
                )}

                {/* Scope products preview */}
                {promo.scope?.products?.length > 1 && (
                    <div className="flex items-center gap-1.5">
                        <div className="flex -space-x-1.5">
                            {promo.scope.products.slice(0, 4).map((p, i) => (
                                <div key={i} className="w-7 h-7 rounded-full border-2 border-card overflow-hidden bg-[var(--accent-opacity)] flex items-center justify-center">
                                    {p.images?.[0]
                                        ? <img src={p.images[0]} alt="" className="w-full h-full object-cover" />
                                        : <Package size={10} className="text-body" />
                                    }
                                </div>
                            ))}
                        </div>
                        <span className="text-body text-xs">{promo.scope.products.length} products</span>
                    </div>
                )}

                {/* CTA */}
                <div className="mt-auto flex gap-2">
                    <button
                        onClick={handleShop}
                        className="flex-1 py-2.5 rounded-xl text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95"
                        style={{ background: cfg.color }}
                    >
                        Shop Now <ArrowRight size={12} />
                    </button>
                    {firstProduct && (
                        <button
                            onClick={handleAddProduct}
                            disabled={adding}
                            className="w-9 h-9 rounded-xl border border-accent-10 flex items-center justify-center text-heading hover:bg-[var(--accent-opacity)] transition-all active:scale-95 flex-shrink-0"
                        >
                            {added
                                ? <Check size={14} className="text-[var(--color-success)]" />
                                : adding
                                    ? <Loader2 size={14} className="animate-spin text-body" />
                                    : <Plus size={14} />
                            }
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

// ─── Flash Sale Card (horizontal, featured) ───────────────────────────────────
function FlashSaleCard({ promo }) {
    const router = useRouter();
    const cfg = getTypeConfig(promo.type);
    const TypeIcon = cfg.icon;
    const label = getDiscountLabel(promo);
    const firstProduct = promo.scope?.products?.[0] || promo.bxgy?.productIds?.[0];
    const usagePct = promo.usageLimit ? Math.min(100, Math.round((promo.usedCount / promo.usageLimit) * 100)) : 0;

    return (
        <div
            onClick={() => router.push(`/products?promo=${promo._id}`)}
            className="group relative rounded-3xl overflow-hidden cursor-pointer transition-transform duration-300 hover:-translate-y-1"
            style={{
                background: `linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%)`,
                minHeight: 200,
            }}
        >
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-10"
                style={{
                    backgroundImage: "radial-gradient(circle at 20% 50%, rgba(255,255,255,0.4) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.3) 0%, transparent 40%)"
                }} />

            {/* Product image right side */}
            {firstProduct?.images?.[0] && (
                <div className="absolute right-0 top-0 h-full w-2/5 overflow-hidden">
                    <img src={firstProduct.images[0]} alt=""
                        className="h-full w-full object-cover opacity-30 group-hover:opacity-40 transition-opacity duration-300 object-center" />
                    <div className="absolute inset-0"
                        style={{ background: "linear-gradient(to right, var(--color-primary) 0%, transparent 60%)" }} />
                </div>
            )}

            <div className="relative z-10 p-5 sm:p-6 flex flex-col justify-between h-full" style={{ minHeight: 200 }}>
                {/* Top */}
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2 bg-white/20 rounded-full px-3 py-1">
                        <Flame size={12} fill="white" color="white" />
                        <span className="text-white text-xs font-bold">Flash Sale</span>
                    </div>
                    {promo.endDate && (
                        <div className="flex items-center gap-1.5">
                            <Clock size={11} color="rgba(255,255,255,0.7)" />
                            <CountdownBlock endDate={promo.endDate} size="sm" />
                        </div>
                    )}
                </div>

                {/* Middle */}
                <div>
                    <div className="text-white/80 text-xs font-semibold uppercase tracking-widest mb-1">{cfg.label}</div>
                    <h2 className="text-white text-xl sm:text-2xl leading-tight mb-1">{promo.name}</h2>
                    {promo.description && (
                        <p className="text-white/70 text-xs leading-relaxed line-clamp-2 mb-3">{promo.description}</p>
                    )}
                    <div className="inline-flex items-center gap-2 bg-white/15 rounded-2xl px-4 py-2 border border-white/20">
                        <BadgePercent size={16} color="white" />
                        <span className="text-white text-lg">{label}</span>
                    </div>
                </div>

                {/* Usage */}
                {promo.usageLimit && (
                    <div className="space-y-1.5">
                        <div className="flex justify-between text-xs text-white/70">
                            <span>Claimed</span>
                            <span>{usagePct}%</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-white/20 overflow-hidden">
                            <div className="h-full rounded-full bg-white/80 transition-all duration-700"
                                style={{ width: `${usagePct}%` }} />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── Category Filter Pill ─────────────────────────────────────────────────────
function FilterPill({ label, active, onClick, icon: Icon, count }) {
    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all duration-200 border
                ${active
                    ? "bg-[var(--color-primary)] text-white border-transparent shadow-sm"
                    : "border-accent-10 text-body hover:text-heading hover:border-[var(--color-primary)]/30 bg-card"
                }`}
        >
            {Icon && <Icon size={13} />}
            {label}
            {count !== undefined && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ml-0.5 ${active ? "bg-white/25 text-white" : "bg-[var(--accent-opacity)] text-body"}`}>
                    {count}
                </span>
            )}
        </button>
    );
}

// ─── Main Deals Page ──────────────────────────────────────────────────────────
export default function DealsPage() {
    const [promotions, setPromotions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState("all");
    const [error, setError] = useState(null);
    const scrollRef = useRef(null);

    useEffect(() => {
        fetchDeals();
    }, []);

    async function fetchDeals() {
        setLoading(true);
        try {
            const { data } = await api.get("/api/promotions/active");
            setPromotions(data.data || []);
        } catch (err) {
            setError("Failed to load deals");
        } finally {
            setLoading(false);
        }
    }

    // Categorize
    const flashSales = promotions.filter(p => p.priority >= 5 && p.endDate);
    const allFiltered = activeFilter === "all"
        ? promotions
        : promotions.filter(p => p.type === activeFilter);

    // Filter counts
    const counts = {
        all: promotions.length,
        product: promotions.filter(p => p.type === "product").length,
        cart: promotions.filter(p => p.type === "cart").length,
        bxgy: promotions.filter(p => p.type === "bxgy").length,
        free_shipping: promotions.filter(p => p.type === "free_shipping").length,
    };

    const filters = [
        { id: "all", label: "All Deals", icon: Zap },
        { id: "product", label: "Products", icon: Tag },
        { id: "cart", label: "Cart Offers", icon: ShoppingCart },
        { id: "bxgy", label: "Buy X Get Y", icon: Gift },
        { id: "free_shipping", label: "Free Shipping", icon: Truck },
    ];

    const scrollFilters = (dir) => {
        if (scrollRef.current) {
            scrollRef.current.scrollBy({ left: dir * 200, behavior: "smooth" });
        }
    };

    return (
        <div className="min-h-screen bg-bg">
            <style>{`
                @keyframes shimmer{0%{transform:translateX(-100%)}100%{transform:translateX(100%)}}
                @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
                @keyframes pulse-ring{0%{transform:scale(1);opacity:0.6}70%{transform:scale(1.4);opacity:0}100%{transform:scale(1.4);opacity:0}}
                @keyframes ticker{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
                .fade-up{animation:fadeUp 0.4s ease both}
                .deal-card{animation:fadeUp 0.4s ease both}
            `}</style>

            {/* ── Ticker Banner ── */}
            <div className="overflow-hidden py-2.5 border-b border-accent-10"
                style={{ background: "var(--color-primary)" }}>
                <div className="flex gap-8 whitespace-nowrap"
                    style={{ animation: "ticker 30s linear infinite" }}>
                    {[...Array(2)].map((_, ri) => (
                        <span key={ri} className="flex items-center gap-8 text-white text-xs font-semibold">
                            {[
                                "🔥 Flash Sales Live Now",
                                "⚡ Up to 70% OFF selected items",
                                "🚚 Free shipping on orders over ৳500",
                                "🎁 Buy X Get Y — Limited Stocks",
                                "✨ New deals added daily",
                                "🔥 Flash Sales Live Now",
                                "⚡ Up to 70% OFF selected items",
                            ].map((t, i) => (
                                <span key={i} className="flex items-center gap-2">
                                    {t}
                                    <span className="opacity-40 text-white">•</span>
                                </span>
                            ))}
                        </span>
                    ))}
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 lg:px-8">

                {/* ── Hero Header ── */}
                <div className="relative overflow-hidden rounded-3xl my-6 fade-up"
                    style={{ background: "linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 60%, #40916c 100%)", minHeight: 260 }}>

                    {/* Decorative circles */}
                    <div className="absolute -top-8 -right-8 w-48 h-48 rounded-full opacity-10"
                        style={{ background: "radial-gradient(circle, white 0%, transparent 70%)" }} />
                    <div className="absolute -bottom-12 -left-12 w-64 h-64 rounded-full opacity-8"
                        style={{ background: "radial-gradient(circle, white 0%, transparent 70%)" }} />

                    <div className="relative z-10 p-6 sm:p-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                        <div>
                            {/* Live indicator */}
                            <div className="flex items-center gap-2 mb-4">
                                <div className="relative w-3 h-3">
                                    <div className="absolute inset-0 rounded-full bg-red-400"
                                        style={{ animation: "pulse-ring 1.5s ease-out infinite" }} />
                                    <div className="relative w-3 h-3 rounded-full bg-red-400" />
                                </div>
                                <span className="text-white/80 text-xs font-bold uppercase tracking-widest">Live Deals</span>
                            </div>

                            <h1 className="text-white  text-4xl sm:text-5xl leading-none mb-2"
                                style={{ fontFamily: "'Syne', sans-serif", letterSpacing: "-0.02em" }}>
                                Today's<br />
                                <span style={{ WebkitTextStroke: "2px rgba(255,255,255,0.5)", color: "transparent" }}>
                                    Best Deals
                                </span>
                            </h1>
                            <p className="text-white/70 text-sm mt-3 max-w-xs leading-relaxed">
                                Exclusive discounts, flash sales &amp; special offers — updated daily for you.
                            </p>

                            <div className="flex items-center gap-3 mt-5">
                                <div className="flex items-center gap-1.5 bg-white/15 rounded-full px-4 py-2">
                                    <Sparkles size={14} color="white" />
                                    <span className="text-white text-xs font-bold">{promotions.length} Active Deals</span>
                                </div>
                                {flashSales.length > 0 && (
                                    <div className="flex items-center gap-1.5 bg-red-500/30 border border-red-400/30 rounded-full px-4 py-2">
                                        <Flame size={14} color="#fca5a5" />
                                        <span className="text-red-200 text-xs font-bold">{flashSales.length} Flash Sales</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Countdown for first flash sale */}
                        {flashSales[0]?.endDate && (
                            <div className="flex-shrink-0">
                                <p className="text-white/60 text-xs font-semibold uppercase tracking-widest mb-3 text-center">
                                    Sale Ends In
                                </p>
                                <HeroCountdown endDate={flashSales[0].endDate} />
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Flash Sales Row ── */}
                {!loading && flashSales.length > 0 && (
                    <section className="mb-8 fade-up" style={{ animationDelay: "80ms" }}>
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <div className="w-1 h-6 rounded-full" style={{ background: "var(--color-primary)" }} />
                                <h2 className="text-heading  text-lg" style={{ fontFamily: "'Syne', sans-serif" }}>
                                    Flash Sales
                                </h2>
                                <div className="flex items-center gap-1 bg-red-500/10 rounded-full px-2.5 py-0.5">
                                    <Flame size={11} className="text-red-500" />
                                    <span className="text-red-500 text-[10px] font-bold">Ending Soon</span>
                                </div>
                            </div>
                            <button className="text-[var(--color-primary)] text-sm font-bold flex items-center gap-1 hover:underline">
                                See all <ChevronRight size={14} />
                            </button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {flashSales.slice(0, 3).map((p, i) => (
                                <div key={p._id} className="deal-card" style={{ animationDelay: `${i * 60}ms` }}>
                                    <FlashSaleCard promo={p} />
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* ── Filter Row ── */}
                <div className="relative mb-6 fade-up" style={{ animationDelay: "120ms" }}>
                    <button onClick={() => scrollFilters(-1)}
                        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-card border border-accent-10 flex items-center justify-center shadow-sm sm:hidden">
                        <ChevronLeft size={14} className="text-body" />
                    </button>
                    <div ref={scrollRef}
                        className="flex gap-2 overflow-x-auto scrollbar-none px-9 sm:px-0"
                        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
                        {filters.map(f => (
                            <FilterPill
                                key={f.id}
                                label={f.label}
                                active={activeFilter === f.id}
                                onClick={() => setActiveFilter(f.id)}
                                icon={f.icon}
                                count={counts[f.id]}
                            />
                        ))}
                    </div>
                    <button onClick={() => scrollFilters(1)}
                        className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-card border border-accent-10 flex items-center justify-center shadow-sm sm:hidden">
                        <ChevronRight size={14} className="text-body" />
                    </button>
                </div>

                {/* ── Deal Stats Strip ── */}
                {!loading && promotions.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8 fade-up" style={{ animationDelay: "140ms" }}>
                        {[
                            { icon: Zap, label: "Active Deals", value: promotions.length, color: "var(--color-primary)" },
                            { icon: Flame, label: "Flash Sales", value: flashSales.length, color: "#ef4444" },
                            { icon: Truck, label: "Free Shipping", value: counts.free_shipping, color: "#0369a1" },
                            { icon: Gift, label: "Buy X Get Y", value: counts.bxgy, color: "#7c3aed" },
                        ].map(({ icon: Icon, label, value, color }, i) => (
                            <div key={i} className="bg-card rounded-2xl border border-accent-10 px-4 py-3 flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                                    style={{ background: `${color}18` }}>
                                    <Icon size={16} style={{ color }} />
                                </div>
                                <div>
                                    <p className="text-body text-xs">{label}</p>
                                    <p className="text-heading  text-lg leading-none">{value}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* ── Loading ── */}
                {loading && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-10">
                        {[...Array(8)].map((_, i) => (
                            <div key={i} className="rounded-3xl overflow-hidden" style={{ animationDelay: `${i * 40}ms` }}>
                                <Shimmer className="h-44" style={{ borderRadius: 0 }} />
                                <div className="p-4 space-y-2 bg-card">
                                    <Shimmer className="h-4 w-3/4" />
                                    <Shimmer className="h-3 w-1/2" />
                                    <Shimmer className="h-3 w-1/3 mt-3" />
                                    <Shimmer className="h-9 w-full mt-3" />
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* ── Error ── */}
                {error && !loading && (
                    <div className="flex flex-col items-center gap-4 py-20">
                        <div className="w-16 h-16 rounded-full bg-[var(--color-danger)]/10 flex items-center justify-center">
                            <AlertCircle size={28} className="text-[var(--color-danger)]" />
                        </div>
                        <p className="text-heading font-bold">{error}</p>
                        <button onClick={fetchDeals}
                            className="px-6 py-2.5 rounded-xl bg-[var(--color-primary)] text-white font-bold text-sm">
                            Try Again
                        </button>
                    </div>
                )}

                {/* ── Deals Grid ── */}
                {!loading && !error && (
                    <>
                        {allFiltered.length > 0 ? (
                            <>
                                {/* Section Header */}
                                <div className="flex items-center justify-between mb-5">
                                    <div className="flex items-center gap-2">
                                        <div className="w-1 h-6 rounded-full" style={{ background: "var(--color-primary)" }} />
                                        <h2 className="text-heading  text-lg" style={{ fontFamily: "'Syne', sans-serif" }}>
                                            {activeFilter === "all" ? "All Deals" : filters.find(f => f.id === activeFilter)?.label}
                                        </h2>
                                        <span className="text-body text-sm">({allFiltered.length})</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-body text-xs">
                                        <TrendingUp size={12} />
                                        Sorted by priority
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-10">
                                    {allFiltered
                                        .slice()
                                        .sort((a, b) => (b.priority || 0) - (a.priority || 0))
                                        .map((promo, i) => (
                                            <div key={promo._id} className="deal-card" style={{ animationDelay: `${i * 50}ms` }}>
                                                <DealCard promo={promo} index={i} />
                                            </div>
                                        ))}
                                </div>
                            </>
                        ) : (
                            <div className="flex flex-col items-center gap-4 py-20 text-center">
                                <div className="w-20 h-20 rounded-full flex items-center justify-center"
                                    style={{ background: "var(--accent-opacity)" }}>
                                    <Tag size={32} style={{ color: "var(--color-primary)", opacity: 0.5 }} />
                                </div>
                                <div>
                                    <h3 className="text-heading font-bold text-lg mb-1">No deals in this category</h3>
                                    <p className="text-body text-sm">Check back soon — new deals are added daily!</p>
                                </div>
                                <button
                                    onClick={() => setActiveFilter("all")}
                                    className="px-6 py-2.5 rounded-xl border border-accent-10 text-heading text-sm font-bold hover:bg-[var(--accent-opacity)] transition-colors"
                                >
                                    View All Deals
                                </button>
                            </div>
                        )}
                    </>
                )}

                {/* ── Bottom CTA ── */}
                {!loading && promotions.length > 0 && (
                    <div className="relative rounded-3xl overflow-hidden mb-8 fade-up"
                        style={{ background: "linear-gradient(90deg, var(--color-primary), var(--color-secondary))" }}>
                        <div className="absolute inset-0 opacity-10"
                            style={{ backgroundImage: "radial-gradient(circle at 80% 50%, white 0%, transparent 50%)" }} />
                        <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-4 p-6 sm:p-8">
                            <div>
                                <p className="text-white/70 text-xs font-semibold uppercase tracking-widest mb-1">Don't miss out</p>
                                <h3 className="text-white  text-xl sm:text-2xl leading-tight"
                                    style={{ fontFamily: "'Syne', sans-serif" }}>
                                    Explore all products with deals applied
                                </h3>
                            </div>
                            <a href="/products"
                                className="flex-shrink-0 flex items-center gap-2 px-6 py-3 rounded-2xl bg-white font-bold text-sm transition-all hover:scale-105 active:scale-95"
                                style={{ color: "var(--color-primary)" }}>
                                <ShoppingCart size={16} /> Shop All Products
                            </a>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}