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

    useEffect(() => {
        api.get("/api/promotions/active")
            .then(({ data }) => setPromos(data.data?.slice(0, 4) || []))
            .catch(() => { })
            .finally(() => setLoading(false));
    }, []);

    if (loading) return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
                <div key={i} className="h-36 rounded-2xl bg-card border border-accent/10 animate-pulse" />
            ))}
        </div>
    );

    if (promos.length === 0) return null;

    return (
        <section className="max-w-7xl mx-auto">
            <h2 className="text-heading text-xl font-bold flex items-center gap-2">
                <Zap size={20} className="text-primary" />
                Active Offers
            </h2>

            {/* ✅ Responsive Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {promos.map((p) => {
                    const Icon = TYPE_ICON[p.type] || Zap;
                    const label = getDiscountLabel(p);

                    return (
                        <div
                            key={p._id}
                            className="relative overflow-hidden rounded-2xl border border-accent/10
                                       bg-card p-5 flex flex-col justify-between gap-3
                                       transition hover:shadow-md"
                        >
                            {/* Light decoration */}
                            <Icon size={50} className="absolute -top-3 -right-3 opacity-5 text-primary" />

                            {/* Top */}
                            <div>
                                <span className="text-xs font-bold uppercase text-primary flex items-center gap-1">
                                    <Icon size={12} />
                                    {p.type.replace("_", " ")}
                                </span>

                                <p className="text-heading font-bold text-base mt-1.5">
                                    {p.name}
                                </p>

                                {p.description && (
                                    <p className="text-body text-xs mt-1 line-clamp-2">
                                        {p.description}
                                    </p>
                                )}
                            </div>

                            {/* Bottom */}
                            <div className="flex items-center justify-between">
                                {label ? (
                                    <span className="text-lg font-black text-primary">
                                        {label}
                                    </span>
                                ) : <span />}

                                {p.conditions?.minCartValue && (
                                    <span className="text-body text-xs">
                                        min ৳{p.conditions.minCartValue}
                                    </span>
                                )}
                            </div>

                            {/* Footer */}
                            {p.endDate && (
                                <p className="text-body text-xs border-t border-accent/10 pt-2">
                                    Ends {new Date(p.endDate).toLocaleDateString("en-GB", {
                                        day: "2-digit",
                                        month: "short"
                                    })}
                                </p>
                            )}
                        </div>
                    );
                })}
            </div>
        </section>
    );
}
