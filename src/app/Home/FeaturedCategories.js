

"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, ArrowRight, Package } from "lucide-react";
import api from "@/app/lib/api";

// ─── Emoji fallback map ───────────────────────────────────────────────────────
const EMOJI_MAP = {
    men: "👔", women: "👗", electronics: "💻", accessories: "👜",
    footwear: "👟", shoes: "👟", kids: "🧒", sports: "⚽",
    beauty: "💄", home: "🏠", furniture: "🪑", food: "🍔",
    books: "📚", toys: "🧸", jewelry: "💍", bags: "👜",
    watches: "⌚", kitchen: "🍳", fashion: "👗", clothing: "👕",
    groceries: "🛒", health: "💊", gaming: "🎮", outdoor: "🏕️",
    "kitchen fittings": "🍳", "bedding sets": "🛏️", pools: "🏊",
    "bathroom lighting": "💡", "digital downloads": "💾",
};

const getEmoji = (name = "") => {
    const key = name.toLowerCase();
    if (EMOJI_MAP[key]) return EMOJI_MAP[key];
    const firstWord = key.split(/[\s&,]/)[0].trim();
    return EMOJI_MAP[firstWord] || "🛍️";
};

// ─── Skeleton card ────────────────────────────────────────────────────────────
function SkeletonCard() {
    return (
        <div className="flex flex-col items-center gap-2 flex-shrink-0" style={{ width: 120 }}>
            <div className="relative overflow-hidden rounded-2xl bg-[var(--accent-opacity)]"
                style={{ width: 120, height: 120 }}>
                <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.4s_infinite]"
                    style={{ background: "linear-gradient(90deg,transparent,rgba(255,255,255,0.1),transparent)" }} />
            </div>
            <div className="relative overflow-hidden rounded-lg bg-[var(--accent-opacity)] w-20 h-3.5">
                <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.4s_infinite]"
                    style={{ background: "linear-gradient(90deg,transparent,rgba(255,255,255,0.1),transparent)" }} />
            </div>
            <div className="relative overflow-hidden rounded-lg bg-[var(--accent-opacity)] w-12 h-3">
                <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.4s_infinite]"
                    style={{ background: "linear-gradient(90deg,transparent,rgba(255,255,255,0.1),transparent)" }} />
            </div>
        </div>
    );
}

// ─── Single category card — Daraz style ──────────────────────────────────────
function CategoryCard({ cat, index }) {
    const router = useRouter();
    const [imgLoaded, setImgLoaded] = useState(false);
    const [imgError, setImgError] = useState(false);
    const hasImg = cat.image && !imgError;

    return (
        <button
            onClick={() => router.push(`/products?category=${encodeURIComponent(cat.name)}`)}
            className="flex flex-col items-center gap-2.5 flex-shrink-0 group focus:outline-none"
            style={{
                width: 120,
                animation: "catFadeUp 0.4s ease both",
                animationDelay: `${Math.min(index * 50, 400)}ms`,
            }}
        >
            {/* Image box */}
            <div
                className="relative rounded-2xl overflow-hidden border border-accent-10 transition-all duration-300 group-hover:-translate-y-1.5 group-hover:shadow-lg group-hover:border-[var(--color-primary)]/25"
                style={{ width: 120, height: 120, background: "var(--card-bg)" }}
            >
                {/* Actual image */}
                {hasImg && (
                    <img
                        src={cat.image}
                        alt={cat.name}
                        loading="lazy"
                        onLoad={() => setImgLoaded(true)}
                        onError={() => setImgError(true)}
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-108"
                        style={{
                            opacity: imgLoaded ? 1 : 0,
                            transition: "opacity 0.3s ease, transform 0.5s ease",
                        }}
                    />
                )}

                {/* Shimmer while loading */}
                {hasImg && !imgLoaded && (
                    <div className="absolute inset-0 bg-[var(--accent-opacity)]">
                        <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.4s_infinite]"
                            style={{ background: "linear-gradient(90deg,transparent,rgba(255,255,255,0.1),transparent)" }} />
                    </div>
                )}

                {/* Emoji fallback */}
                {(!hasImg || !imgLoaded) && (
                    <div className={`absolute inset-0 flex items-center justify-center text-4xl transition-opacity duration-300 ${imgLoaded ? "opacity-0" : "opacity-100"}`}>
                        {getEmoji(cat.name)}
                    </div>
                )}

                {/* Bottom gradient overlay on hover */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                    style={{ background: "linear-gradient(to top, rgba(0,0,0,0.35) 0%, transparent 55%)" }} />

                {/* Product count — appears on hover */}
                {cat.productCount > 0 && (
                    <div className="absolute bottom-0 left-0 right-0 flex justify-center pb-2 opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all duration-300 pointer-events-none">
                        <span className="text-white text-[9px] font-bold tracking-wide">
                            {cat.productCount} items
                        </span>
                    </div>
                )}
            </div>

            {/* Name */}
            <div className="text-center px-1 w-full">
                <p className="text-heading text-xs font-bold leading-tight line-clamp-2 group-hover:text-[var(--color-primary)] transition-colors duration-200"
                    style={{ fontFamily: "'Nunito', sans-serif" }}>
                    {cat.name}
                </p>
                {cat.productCount > 0 && (
                    <p className="text-body text-[10px] mt-0.5 font-medium opacity-70">
                        {cat.productCount > 999
                            ? `${(cat.productCount / 1000).toFixed(1)}k`
                            : cat.productCount}+ products
                    </p>
                )}
            </div>
        </button>
    );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function FeaturedCategories() {
    const router = useRouter();
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [canLeft, setCanLeft] = useState(false);
    const [canRight, setCanRight] = useState(true);
    const trackRef = useRef(null);

    useEffect(() => {
        api.get("/api/products/categories-with-images")
            .then(res => setCategories(res.data.data || []))
            .catch(() => setCategories([]))
            .finally(() => setLoading(false));
    }, []);

    // Check scroll edges
    const checkEdges = useCallback(() => {
        const el = trackRef.current;
        if (!el) return;
        setCanLeft(el.scrollLeft > 4);
        setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
    }, []);

    useEffect(() => {
        const el = trackRef.current;
        if (!el) return;
        checkEdges();
        el.addEventListener("scroll", checkEdges, { passive: true });
        window.addEventListener("resize", checkEdges);
        return () => {
            el.removeEventListener("scroll", checkEdges);
            window.removeEventListener("resize", checkEdges);
        };
    }, [categories, checkEdges]);

    const slide = (dir) => {
        trackRef.current?.scrollBy({ left: dir * 360, behavior: "smooth" });
    };

    if (!loading && categories.length === 0) return null;

    return (
        <section className="py-10 sm:py-14 bg-bg">
            <style>{`
                @keyframes shimmer { 0%{transform:translateX(-100%)} 100%{transform:translateX(100%)} }
                @keyframes catFadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
                .cat-track::-webkit-scrollbar { display: none; }
                .scale-108 { transform: scale(1.08); }
            `}</style>

            <div className="max-w-7xl mx-auto px-4 lg:px-8">

                {/* ── Header ── */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        {/* Accent bar */}
                        <div className="w-1 h-6 rounded-full" style={{ background: "var(--color-primary)" }} />
                        <h2 className="text-heading  text-xl sm:text-2xl"
                            style={{ fontFamily: "'Syne', sans-serif", letterSpacing: "-0.02em" }}>
                            Categories
                        </h2>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Arrow buttons */}
                        <button
                            onClick={() => slide(-1)}
                            disabled={!canLeft}
                            className="w-8 h-8 rounded-full border border-accent-10 bg-card flex items-center justify-center text-heading disabled:opacity-25 hover:border-[var(--color-primary)]/40 hover:bg-[var(--accent-opacity)] transition-all duration-200"
                        >
                            <ChevronLeft size={15} />
                        </button>
                        <button
                            onClick={() => slide(1)}
                            disabled={!canRight}
                            className="w-8 h-8 rounded-full border border-accent-10 bg-card flex items-center justify-center text-heading disabled:opacity-25 hover:border-[var(--color-primary)]/40 hover:bg-[var(--accent-opacity)] transition-all duration-200"
                        >
                            <ChevronRight size={15} />
                        </button>

                        <button
                            onClick={() => router.push("/products")}
                            className="ml-1 flex items-center gap-1 text-sm font-bold group transition-colors"
                            style={{ color: "var(--color-primary)" }}
                        >
                            See all
                            <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform duration-200" />
                        </button>
                    </div>
                </div>

                {/* ── Scrollable track ── */}
                <div className="relative">
                    {/* Left fade mask */}
                    {canLeft && (
                        <div className="absolute left-0 top-0 bottom-0 w-14 z-10 pointer-events-none"
                            style={{ background: "linear-gradient(to right, var(--bg), transparent)" }} />
                    )}
                    {/* Right fade mask */}
                    {canRight && (
                        <div className="absolute right-0 top-0 bottom-0 w-14 z-10 pointer-events-none"
                            style={{ background: "linear-gradient(to left, var(--bg), transparent)" }} />
                    )}

                    <div
                        ref={trackRef}
                        className="cat-track flex gap-3 overflow-x-auto pb-3"
                        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                    >
                        {loading
                            ? Array(9).fill(null).map((_, i) => <SkeletonCard key={i} />)
                            : categories.map((cat, i) => (
                                <CategoryCard key={cat.name} cat={cat} index={i} />
                            ))
                        }
                    </div>
                </div>

                {/* ── Row 2: overflow categories as text pills (Daraz style) ── */}
                {!loading && categories.length > 8 && (
                    <div className="mt-5 flex flex-wrap gap-2">
                        {categories.slice(8).map((cat) => (
                            <button
                                key={cat.name}
                                onClick={() => router.push(`/products?category=${encodeURIComponent(cat.name)}`)}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-accent-10 bg-card text-xs font-semibold text-body hover:text-heading hover:border-[var(--color-primary)]/35 hover:bg-[var(--accent-opacity)] transition-all duration-200"
                            >
                                <span className="text-sm">{getEmoji(cat.name)}</span>
                                {cat.name}
                                {cat.productCount > 0 && (
                                    <span className="text-[9px] opacity-50 ml-0.5">
                                        ({cat.productCount})
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
}