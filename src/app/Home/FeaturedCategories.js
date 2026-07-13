"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
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

// ─── Shimmer block (used in skeleton + image loading) ────────────────────────
function Shimmer() {
    return (
        <motion.div
            className="absolute inset-0"
            style={{ background: "linear-gradient(90deg,transparent,rgba(255,255,255,0.15),transparent)" }}
            animate={{ x: ["-100%", "100%"] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: "linear" }}
        />
    );
}

// ─── Skeleton card ────────────────────────────────────────────────────────────
function SkeletonCard() {
    return (
        <div className="flex flex-col items-center gap-2 flex-shrink-0" style={{ width: 120 }}>
            <div className="relative overflow-hidden rounded-2xl bg-[var(--accent-opacity)]" style={{ width: 120, height: 120 }}>
                <Shimmer />
            </div>
            <div className="relative overflow-hidden rounded-lg bg-[var(--accent-opacity)] w-20 h-3.5">
                <Shimmer />
            </div>
            <div className="relative overflow-hidden rounded-lg bg-[var(--accent-opacity)] w-12 h-3">
                <Shimmer />
            </div>
        </div>
    );
}

// ─── Single category card ────────────────────────────────────────────────────
const cardVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: (i) => ({
        opacity: 1,
        y: 0,
        transition: { delay: Math.min(i * 0.05, 0.4), duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] },
    }),
};

function CategoryCard({ cat, index }) {
    const router = useRouter();
    const [imgLoaded, setImgLoaded] = useState(false);
    const [imgError, setImgError] = useState(false);
    const hasImg = cat.image && !imgError;

    return (
        <motion.button
            custom={index}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-40px" }}
            variants={cardVariants}
            onClick={() => router.push(`/products?category=${encodeURIComponent(cat.name)}`)}
            className="flex flex-col items-center gap-2.5 flex-shrink-0 group focus:outline-none"
            style={{ width: 110 }}
        >
            {/* Image box */}
            <motion.div
                className="relative overflow-hidden"
                style={{
                    width: 110, height: 110,
                    borderRadius: 24,
                    background: "var(--accent-opacity)",
                    border: "1.5px solid rgba(127,119,221,0.12)",
                }}
                whileHover={{
                    y: -6,
                    boxShadow: "0 16px 36px rgba(127,119,221,0.18)",
                    borderColor: "rgba(127,119,221,0.35)",
                }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
                {/* Image */}
                {hasImg && (
                    <motion.img
                        src={cat.image}
                        alt={cat.name}
                        loading="lazy"
                        onLoad={() => setImgLoaded(true)}
                        onError={() => setImgError(true)}
                        className="absolute inset-0 w-full h-full object-cover"
                        initial={false}
                        animate={{ opacity: imgLoaded ? 1 : 0 }}
                        whileHover={{ scale: 1.08 }}
                        transition={{ opacity: { duration: 0.3 }, scale: { type: "spring", stiffness: 250, damping: 20 } }}
                    />
                )}

                {/* Shimmer while image loads */}
                <AnimatePresence>
                    {hasImg && !imgLoaded && (
                        <motion.div
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-[var(--accent-opacity)]"
                        >
                            <Shimmer />
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Emoji fallback */}
                <AnimatePresence>
                    {(!hasImg || !imgLoaded) && (
                        <motion.div
                            initial={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 flex items-center justify-center text-4xl"
                        >
                            {getEmoji(cat.name)}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Dark gradient overlay on hover */}
                <motion.div
                    className="absolute inset-0 pointer-events-none"
                    style={{ background: "linear-gradient(to top, rgba(60,52,137,0.55) 0%, transparent 55%)" }}
                    initial={{ opacity: 0 }}
                    whileHover={{ opacity: 1 }}
                    transition={{ duration: 0.25 }}
                />

                {/* Item count pill — slides up on hover */}
                {cat.productCount > 0 && (
                    <motion.div
                        className="absolute bottom-0 left-0 right-0 flex justify-center pb-2 pointer-events-none"
                        initial={{ opacity: 0, y: 4 }}
                        whileHover={{ opacity: 1, y: 0 }}
                        transition={{ type: "spring", stiffness: 300, damping: 22 }}
                    >
                        <span className="text-white text-[9px] font-bold tracking-widest uppercase bg-white/15 backdrop-blur-sm px-2.5 py-0.5 rounded-full border border-white/20">
                            {cat.productCount} items
                        </span>
                    </motion.div>
                )}
            </motion.div>

            {/* Label */}
            <div className="text-center px-1 w-full">
                <motion.p
                    className="text-heading text-[12px] font-bold leading-tight line-clamp-2"
                    whileHover={{ color: "var(--color-primary)" }}
                    transition={{ duration: 0.2 }}
                >
                    {cat.name}
                </motion.p>
                {cat.productCount > 0 && (
                    <p className="text-body text-[10px] mt-0.5 font-medium opacity-60">
                        {cat.productCount > 999
                            ? `${(cat.productCount / 1000).toFixed(1)}k`
                            : cat.productCount}+ products
                    </p>
                )}
            </div>
        </motion.button>
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
                .cat-track::-webkit-scrollbar { display: none; }
            `}</style>

            <div className="max-w-7xl mx-auto px-4 lg:px-8">

                {/* ── Header ── */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-1 h-6 rounded-full" style={{ background: "var(--color-primary)" }} />
                        <h2 className="text-heading text-xl sm:text-2xl">Categories</h2>
                    </div>

                    <div className="flex items-center gap-2">
                        <motion.button
                            onClick={() => slide(-1)}
                            disabled={!canLeft}
                            whileHover={canLeft ? { scale: 1.08 } : {}}
                            whileTap={canLeft ? { scale: 0.92 } : {}}
                            className="w-8 h-8 rounded-full border border-accent-10 bg-card flex items-center justify-center text-heading disabled:opacity-25"
                        >
                            <ChevronLeft size={15} />
                        </motion.button>
                        <motion.button
                            onClick={() => slide(1)}
                            disabled={!canRight}
                            whileHover={canRight ? { scale: 1.08 } : {}}
                            whileTap={canRight ? { scale: 0.92 } : {}}
                            className="w-8 h-8 rounded-full border border-accent-10 bg-card flex items-center justify-center text-heading disabled:opacity-25"
                        >
                            <ChevronRight size={15} />
                        </motion.button>

                        <motion.button
                            onClick={() => router.push("/products")}
                            whileHover="hover"
                            className="ml-1 flex items-center gap-1 text-sm font-bold"
                            style={{ color: "var(--color-primary)" }}
                        >
                            See all
                            <motion.span
                                variants={{ hover: { x: 3 } }}
                                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                className="inline-flex"
                            >
                                <ArrowRight size={13} />
                            </motion.span>
                        </motion.button>
                    </div>
                </div>

                {/* ── Scrollable track ── */}
                <div className="relative">
                    <AnimatePresence>
                        {canLeft && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute left-0 top-0 bottom-0 w-14 z-10 pointer-events-none"
                                style={{ background: "linear-gradient(to right, var(--bg), transparent)" }}
                            />
                        )}
                        {canRight && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute right-0 top-0 bottom-0 w-14 z-10 pointer-events-none"
                                style={{ background: "linear-gradient(to left, var(--bg), transparent)" }}
                            />
                        )}
                    </AnimatePresence>

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

                {/* ── Row 2: overflow categories as pills ── */}
                {!loading && categories.length > 8 && (
                    <div className="mt-5 flex flex-wrap gap-2">
                        {categories.slice(8).map((cat, i) => (
                            <motion.button
                                key={cat.name}
                                initial={{ opacity: 0, y: 8 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: Math.min(i * 0.03, 0.3), duration: 0.3 }}
                                whileHover={{ scale: 1.04 }}
                                whileTap={{ scale: 0.96 }}
                                onClick={() => router.push(`/products?category=${encodeURIComponent(cat.name)}`)}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-accent-10 bg-card text-xs font-semibold text-body"
                            >
                                <span className="text-sm">{getEmoji(cat.name)}</span>
                                {cat.name}
                                {cat.productCount > 0 && (
                                    <span className="text-[9px] opacity-50 ml-0.5">
                                        ({cat.productCount})
                                    </span>
                                )}
                            </motion.button>
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
}