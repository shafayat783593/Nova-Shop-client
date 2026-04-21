"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/app/lib/api";

const categoryMeta = {
    Men: {
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8">
                <circle cx="12" cy="7" r="4" /><path d="M12 11v10M9 14l3 3 3-3M8 21h8" />
            </svg>
        ),
        gradient: "from-[#2d6a4f] to-[#40916c]",
        bg: "bg-[#2d6a4f]",
        emoji: "👔",
    },
    Women: {
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8">
                <circle cx="12" cy="7" r="4" /><path d="M12 11v6M9 17h6M12 17v4M10 21h4" />
            </svg>
        ),
        gradient: "from-[#b7e4c7] to-[#52b788]",
        bg: "bg-[#52b788]",
        emoji: "👗",
    },
    Electronics: {
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8">
                <rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8M12 17v4" />
            </svg>
        ),
        gradient: "from-[#1b4332] to-[#2d6a4f]",
        bg: "bg-[#1b4332]",
        emoji: "💻",
    },
    Accessories: {
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8">
                <circle cx="12" cy="12" r="9" /><path d="M12 8v4l3 3" />
            </svg>
        ),
        gradient: "from-[#40916c] to-[#95d5b2]",
        bg: "bg-[#40916c]",
        emoji: "👜",
    },
    Footwear: {
        icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8">
                <path d="M3 14s0-4 4-4h10l3 4H3z" /><path d="M7 14v3h12v-3" />
            </svg>
        ),
        gradient: "from-[#95d5b2] to-[#52b788]",
        bg: "bg-[#95d5b2]",
        emoji: "👟",
    },
};

const defaultMeta = {
    gradient: "from-[#6b705c] to-[#2d6a4f]",
    bg: "bg-[#6b705c]",
    emoji: "🛍️",
};

export default function FeaturedCategories() {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        api.get("/products/categories")
            .then((res) => setCategories(res.data.data || []))
            .catch(() => setCategories(["Men", "Women", "Electronics", "Accessories", "Footwear"]))
            .finally(() => setLoading(false));
    }, []);

    const skeletons = Array(5).fill(null);

    return (
        <section className="py-16 px-4 bg-bg">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex items-end justify-between mb-10">
                    <div>
                        <span className="text-xs font-bold tracking-[0.25em] uppercase text-secondary mb-2 block">
                            Browse by
                        </span>
                        <h2
                            className="text-4xl font-bold text-heading"
                            style={{ fontFamily: "Syne, sans-serif" }}
                        >
                            Featured Categories
                        </h2>
                    </div>
                    <button
                        onClick={() => router.push("/products")}
                        className="text-sm font-semibold text-secondary hover:text-primary transition-colors flex items-center gap-1 group"
                    >
                        View All
                        <span className="inline-block group-hover:translate-x-1 transition-transform">→</span>
                    </button>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {loading
                        ? skeletons.map((_, i) => (
                            <div
                                key={i}
                                className="animate-pulse rounded-2xl bg-card h-40"
                                style={{ animationDelay: `${i * 80}ms` }}
                            />
                        ))
                        : categories.map((cat, i) => {
                            const meta = categoryMeta[cat] || defaultMeta;
                            return (
                                <button
                                    key={cat}
                                    onClick={() => router.push(`/products?category=${encodeURIComponent(cat)}`)}
                                    className="group relative bg-card rounded-2xl overflow-hidden border border-accent-10 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col items-center justify-center py-8 px-4 gap-3"
                                    style={{ animationDelay: `${i * 80}ms` }}
                                >
                                    {/* Gradient blob behind icon */}
                                    <div
                                        className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300 bg-gradient-to-br ${meta.gradient}`}
                                    />
                                    {/* Icon circle */}
                                    <div
                                        className={`w-14 h-14 rounded-xl ${meta.bg} bg-opacity-15 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform duration-300`}
                                    >
                                        <span>{meta.emoji}</span>
                                    </div>
                                    <span
                                        className="text-sm font-bold text-heading text-center leading-tight"
                                        style={{ fontFamily: "Syne, sans-serif" }}
                                    >
                                        {cat}
                                    </span>
                                    {/* Arrow */}
                                    <span className="text-xs text-body opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-1 group-hover:translate-y-0">
                                        Explore →
                                    </span>
                                </button>
                            );
                        })}
                </div>
            </div>
        </section>
    );
}