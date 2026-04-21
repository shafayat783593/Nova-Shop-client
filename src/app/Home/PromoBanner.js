"use client";

// ─── PromoBanner ─────────────────────────────────────────────────────────────
// Shows active promotions on the homepage as a scrollable banner strip
// Usage: <PromoBanner />

import { useEffect, useState } from "react";
import api from "@/app/lib/api";
import { Tag, ShoppingCart, Gift, Truck, ChevronRight, Zap } from "lucide-react";

const TYPE_ICON = {
    product: Tag,
    cart: ShoppingCart,
    bxgy: Gift,
    free_shipping: Truck,
};

const TYPE_STYLE = {
    product: { bg: "bg-blue-500/10", border: "border-blue-500/20", text: "text-blue-600 dark:text-blue-400" },
    cart: { bg: "bg-purple-500/10", border: "border-purple-500/20", text: "text-purple-600 dark:text-purple-400" },
    bxgy: { bg: "bg-amber-500/10", border: "border-amber-500/20", text: "text-amber-600 dark:text-amber-400" },
    free_shipping: { bg: "bg-green-500/10", border: "border-green-500/20", text: "text-green-600 dark:text-green-400" },
};

function getDiscountLabel(p) {
    if (p.type === "free_shipping") return "Free Shipping";
    if (p.type === "bxgy" && p.bxgy?.buy && p.bxgy?.get)
        return `Buy ${p.bxgy.buy} Get ${p.bxgy.get} Free`;
    if (!p.discountType || p.value === undefined) return null;
    if (p.discountType === "percent") return `${p.value}% OFF`;
    if (p.discountType === "fixed") return `৳${p.value} OFF`;
    if (p.discountType === "free") return "FREE";
    return null;
}

export function PromoBanner() {
    const [promos, setPromos] = useState([]);
    const [loading, setLoading] = useState(true);
    console.log("Rendering PromoBanner with promos:", promos);
    useEffect(() => {
        api.get("/api/promotions/active")
            .then(({ data }) => setPromos(data.data || []))
            .catch(() => { })
            .finally(() => setLoading(false));
    }, []);

    if (loading || promos.length === 0) return null;

    return (
        <div className="w-full overflow-x-auto scrollbar-hide py-1">
            <div className="flex gap-3 px-4 min-w-max">
                {promos.map((p) => {
                    const Icon = TYPE_ICON[p.type] || Zap;
                    const style = TYPE_STYLE[p.type] || TYPE_STYLE.product;
                    const label = getDiscountLabel(p);

                    return (
                        <div
                            key={p._id}
                            className={`flex items-center gap-3 px-4 py-2.5 rounded-full border ${style.bg} ${style.border} whitespace-nowrap`}
                        >
                            <Icon size={14} className={style.text} />
                            <span className="text-heading text-sm font-semibold">{p.name}</span>
                            {label && (
                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full bg-white/20 ${style.text}`}>
                                    {label}
                                </span>
                            )}
                            {p.conditions?.minCartValue && (
                                <span className="text-body text-xs">on ৳{p.conditions.minCartValue}+</span>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}


// ─── PromoCards ──────────────────────────────────────────────────────────────
// Shows active promotions as cards in a grid section on homepage
// Usage: <PromoCards />

export function PromoCards() {
    const [promos, setPromos] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get("/api/promotions/active")
            .then(({ data }) => setPromos(data.data?.slice(0, 4) || []))
            .catch(() => { })
            .finally(() => setLoading(false));
    }, []);

    if (loading) return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
                <div key={i} className="h-36 rounded-2xl bg-card border border-accent-10 animate-pulse" />
            ))}
        </div>
    );

    if (promos.length === 0) return null;

    return (
        <section className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-heading text-xl font-bold font-display flex items-center gap-2">
                    <Zap size={20} className="text-[var(--color-primary)]" />
                    Active Offers
                </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {promos.map((p) => {
                    const Icon = TYPE_ICON[p.type] || Zap;
                    const style = TYPE_STYLE[p.type] || TYPE_STYLE.product;
                    const label = getDiscountLabel(p);

                    return (
                        <div
                            key={p._id}
                            className={`relative overflow-hidden rounded-2xl border p-5 flex flex-col justify-between gap-3 ${style.bg} ${style.border} transition-transform hover:-translate-y-0.5`}
                        >
                            {/* Icon top-right decoration */}
                            <Icon size={48} className={`absolute -top-3 -right-3 opacity-10 ${style.text}`} />

                            <div>
                                <span className={`inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider ${style.text}`}>
                                    <Icon size={12} />
                                    {p.type.replace("_", " ")}
                                </span>
                                <p className="text-heading font-bold text-base mt-1.5 leading-tight">{p.name}</p>
                                {p.description && (
                                    <p className="text-body text-xs mt-1 line-clamp-2">{p.description}</p>
                                )}
                            </div>

                            <div className="flex items-center justify-between">
                                {label ? (
                                    <span className={`text-lg font-black ${style.text}`}>{label}</span>
                                ) : <span />}

                                {p.conditions?.minCartValue && (
                                    <span className="text-body text-xs">min ৳{p.conditions.minCartValue}</span>
                                )}
                            </div>

                            {p.endDate && (
                                <p className="text-body text-xs border-t border-[var(--accent-opacity)] pt-2">
                                    Ends {new Date(p.endDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}
                                </p>
                            )}
                        </div>
                    );
                })}
            </div>
        </section>
    );
}


// ─── PromoTicker ─────────────────────────────────────────────────────────────
// Auto-scrolling marquee ticker strip (for top of homepage)
// Usage: <PromoTicker />

export function PromoTicker() {
    const [promos, setPromos] = useState([]);

    useEffect(() => {
        api.get("/promotions/active")
            .then(({ data }) => setPromos(data.data || []))
            .catch(() => { });
    }, []);

    if (promos.length === 0) return null;

    const items = [...promos, ...promos]; // duplicate for seamless loop

    return (
        <div className="w-full overflow-hidden bg-[var(--color-primary)] py-2">
            <div
                className="flex gap-8 whitespace-nowrap"
                style={{
                    animation: "ticker 20s linear infinite",
                }}
            >
                {items.map((p, i) => {
                    const label = getDiscountLabel(p);
                    return (
                        <span key={`${p._id}-${i}`} className="text-white text-sm font-semibold flex items-center gap-2">
                            <Zap size={13} className="text-[var(--color-accent)]" />
                            {p.name}
                            {label && <span className="text-[var(--color-accent)] font-black">{label}</span>}
                        </span>
                    );
                })}
            </div>

            <style>{`
                @keyframes ticker {
                    0%   { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                }
            `}</style>
        </div>
    );
}