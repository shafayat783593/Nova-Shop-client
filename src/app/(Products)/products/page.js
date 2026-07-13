"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import api from "@/app/lib/api";
import {
    Search, SlidersHorizontal, X, ChevronDown, ChevronRight,
    Star, Heart, ShoppingCart, Package, LayoutGrid, List,
    ArrowUpDown, Tag, Zap, Check, Filter, ChevronLeft,
} from "lucide-react";
import WishlistButton from "../components/Wishlistbutton";
import AddToCartButton from "../components/AddToCartButton";
import { motion, AnimatePresence } from "framer-motion";


// ─────────────────────────────────────────────────────────────────────────────
// SKELETON
// ─────────────────────────────────────────────────────────────────────────────
function Shimmer({ className = "" }) {
    return (
        <div className={`relative overflow-hidden bg-[var(--accent-opacity)] rounded-xl ${className}`}>
            <motion.div
                className="absolute inset-0"
                style={{ background: "linear-gradient(90deg,transparent,rgba(255,255,255,0.07),transparent)" }}
                animate={{ x: ["-100%", "100%"] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            />
        </div>
    );
}
function CardSkeleton() {
    return (
        <div className="bg-card rounded-2xl overflow-hidden border border-accent-10">
            <Shimmer className="aspect-[4/3] w-full rounded-none" />
            <div className="p-4 space-y-2.5">
                <Shimmer className="h-3 w-16" />
                <Shimmer className="h-4 w-full" />
                <Shimmer className="h-4 w-4/5" />
                <Shimmer className="h-5 w-24 mt-1" />
                <Shimmer className="h-9 w-full rounded-xl mt-2" />
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// STAR RATING (mini)
// ─────────────────────────────────────────────────────────────────────────────
function Stars({ rating = 0 }) {
    return (
        <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((n) => (
                <Star
                    key={n}
                    size={11}
                    className={n <= Math.round(rating) ? "text-amber-400" : "text-[var(--accent-opacity)]"}
                    fill={n <= Math.round(rating) ? "currentColor" : "none"}
                    strokeWidth={1.5}
                />
            ))}
        </div>
    );
}
// ─────────────────────────────────────────────────────────────────────────────
// PRODUCT CARD
// ─────────────────────────────────────────────────────────────────────────────
// ─── ProductCard (Grid view only — key changes) ────────────────────────────


const gridCardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i) => ({
        opacity: 1,
        y: 0,
        transition: { delay: Math.min(i * 0.04, 0.4), duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] },
    }),
}
function ProductCard({ product, view = "grid", index = 0 }) {
    const router = useRouter();

    const price = product.discountedPrice ?? product.basePrice;
    const hasDiscount = product.discountedPrice && product.discountedPrice < product.basePrice;
    const discPct = hasDiscount
        ? Math.round(((product.basePrice - product.discountedPrice) / product.basePrice) * 100)
        : null;

    if (view === "list") {
        return (
            <motion.div
                custom={index}
                initial="hidden"
                animate="visible"
                variants={gridCardVariants}
                layout
                onClick={() => router.push(`/products/${product.slug}`)}
                whileHover={{ y: -3, boxShadow: "0 12px 28px rgba(0,0,0,0.08)", borderColor: "var(--color-primary)" }}
                transition={{ type: "spring", stiffness: 300, damping: 24 }}
                className="group bg-card rounded-2xl border border-accent-10 overflow-hidden flex gap-0 cursor-pointer"
            >
                <div className="w-44 flex-shrink-0 relative overflow-hidden bg-bg">
                    {product.images?.[0] ? (
                        <motion.img
                            src={product.images[0]}
                            alt={product.name}
                            className="w-full h-full object-cover"
                            whileHover={{ scale: 1.06 }}
                            transition={{ type: "spring", stiffness: 220, damping: 20 }}
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <Package size={32} className="text-body opacity-20" />
                        </div>
                    )}
                    {discPct && (
                        <span className="absolute top-2 left-2 px-2 py-0.5 rounded-lg bg-green-500 text-white text-xs font-bold tracking-wide">
                            -{discPct}%
                        </span>
                    )}
                </div>
                <div className="flex-1 p-5 flex flex-col justify-between min-w-0">
                    <div className="space-y-2">
                        <span className="inline-block text-[10px] text-[var(--color-primary)] font-bold uppercase tracking-widest bg-[var(--color-primary)]/10 px-2.5 py-1 rounded-full">
                            {product.category}
                        </span>
                        <h3 className="text-heading font-bold text-base leading-snug line-clamp-2 group-hover:text-[var(--color-primary)] transition-colors">
                            {product.name}
                        </h3>
                        <p className="text-body text-sm line-clamp-2">{product.description}</p>
                        <div className="flex items-center gap-2">
                            <Stars rating={product.averageRating} />
                            <span className="text-body text-xs">({product.totalReviews || 0})</span>
                        </div>
                    </div>
                    <div className="flex items-center justify-between mt-3 flex-wrap gap-3">
                        <div className="flex items-end gap-2">
                            <span className="text-heading text-xl font-black">৳{price?.toLocaleString()}</span>
                            {hasDiscount && <span className="text-body text-xs line-through">৳{product.basePrice?.toLocaleString()}</span>}
                        </div>
                        <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                            <WishlistButton productId={product._id} product={product} size="icon" />
                            <AddToCartButton productId={product._id} product={product} inStock={product.isActive} size="sm" />
                        </div>
                    </div>
                </div>
            </motion.div>
        );
    }

    // ── Grid view ──────────────────────────────────────────────────────────────
    return (
        <motion.div
            custom={index}
            initial="hidden"
            animate="visible"
            variants={gridCardVariants}
            layout
            onClick={() => router.push(`/products/${product.slug}`)}
            whileHover={{ y: -6, boxShadow: "0 20px 40px rgba(127,119,221,0.13)", borderColor: "rgba(127,119,221,0.3)" }}
            transition={{ type: "spring", stiffness: 300, damping: 24 }}
            className="group bg-card rounded-[20px] border border-accent-10 overflow-hidden cursor-pointer flex flex-col"
        >
            {/* Image */}
            <div className="relative aspect-[4/3] overflow-hidden bg-bg">
                {product.images?.[0] ? (
                    <motion.img
                        src={product.images[0]}
                        alt={product.name}
                        className="w-full h-full object-cover"
                        whileHover={{ scale: 1.06 }}
                        transition={{ type: "spring", stiffness: 220, damping: 20 }}
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <Package size={36} className="text-body opacity-20" />
                    </div>
                )}

                {/* Badges */}
                <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5">
                    {discPct && (
                        <span className="px-2 py-0.5 rounded-lg bg-green-500 text-white text-[11px] font-bold tracking-wide shadow-sm">
                            -{discPct}%
                        </span>
                    )}
                    {product.isFeatured && (
                        <span className="px-2 py-0.5 rounded-lg bg-amber-400 text-white text-[11px] font-bold shadow-sm">
                            ⭐ Featured
                        </span>
                    )}
                </div>

                {/* Wishlist — circular glass button */}
                <div className="absolute top-2.5 right-2.5" onClick={e => e.stopPropagation()}>
                    <motion.div
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.92 }}
                        transition={{ type: "spring", stiffness: 400, damping: 22 }}
                        className="w-8 h-8 rounded-full bg-white/85 backdrop-blur-sm flex items-center justify-center shadow-sm"
                    >
                        <WishlistButton productId={product._id} product={product} size="icon" />
                    </motion.div>
                </div>

                {/* Add to Cart — slides up on hover */}
                <motion.div
                    className="absolute bottom-0 left-0 right-0 p-2.5 bg-gradient-to-t from-black/20 to-transparent"
                    onClick={e => e.stopPropagation()}
                    initial={{ y: "100%" }}
                    whileHover={{ y: 0 }}
                    animate={{ y: "100%" }}
                    whileInView={{ y: "100%" }}
                    variants={{
                        rest: { y: "100%" },
                        hover: { y: 0 },
                    }}
                >
                    <AddToCartButton
                        productId={product._id}
                        product={product}
                        inStock={product.isActive}
                        size="default"
                        className="w-full justify-center text-[12px] font-bold tracking-wide py-2.5 rounded-xl"
                    />
                </motion.div>
            </div>

            {/* Info */}
            <div className="p-4 flex flex-col flex-1 gap-1.5">
                <span className="inline-block self-start text-[10px] text-[var(--color-primary)] font-bold uppercase tracking-widest bg-[var(--color-primary)]/10 px-2.5 py-1 rounded-full">
                    {product.category}
                </span>

                <h3 className="text-heading font-bold text-sm leading-snug line-clamp-2 flex-1 group-hover:text-[var(--color-primary)] transition-colors duration-200">
                    {product.name}
                </h3>

                <div className="flex items-center gap-1.5">
                    <Stars rating={product.averageRating} />
                    <span className="text-body text-[11px]">({product.totalReviews || 0})</span>
                </div>

                <div className="flex items-baseline gap-2 mt-0.5">
                    <span className="text-heading font-black text-base tracking-tight">
                        ৳{price?.toLocaleString()}
                    </span>
                    {hasDiscount && (
                        <span className="text-body text-[11px] line-through">
                            ৳{product.basePrice?.toLocaleString()}
                        </span>
                    )}
                </div>
            </div>
        </motion.div>
    );
}
// ─────────────────────────────────────────────────────────────────────────────
// FILTER SECTION (collapsible)
// ─────────────────────────────────────────────────────────────────────────────
function FilterSection({ title, children, defaultOpen = true }) {
    const [open, setOpen] = useState(defaultOpen);
    return (
        <div className="border-b border-accent-10 pb-4">
            <button
                onClick={() => setOpen(v => !v)}
                className="w-full flex items-center justify-between py-3 text-heading text-sm font-bold"
            >
                {title}
                <ChevronDown size={15} className={`text-body transition-transform ${open ? "rotate-180" : ""}`} />
            </button>
            {open && <div className="mt-1">{children}</div>}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// PRICE RANGE SLIDER
// ─────────────────────────────────────────────────────────────────────────────
function PriceRange({ min, max, value, onChange }) {
    const [local, setLocal] = useState(value);
    useEffect(() => setLocal(value), [value]);

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-body">
                <span>৳{local[0].toLocaleString()}</span>
                <span>৳{local[1].toLocaleString()}</span>
            </div>
            <div className="relative h-1.5 rounded-full bg-[var(--accent-opacity)]">
                <div
                    className="absolute h-full rounded-full bg-[var(--color-primary)]"
                    style={{
                        left: `${((local[0] - min) / (max - min)) * 100}%`,
                        right: `${100 - ((local[1] - min) / (max - min)) * 100}%`,
                    }}
                />
                {/* Min handle */}
                <input type="range" min={min} max={max} value={local[0]}
                    onChange={e => setLocal([Math.min(Number(e.target.value), local[1] - 50), local[1]])}
                    onMouseUp={() => onChange(local)}
                    onTouchEnd={() => onChange(local)}
                    className="absolute inset-0 w-full opacity-0 cursor-pointer h-full" />
                {/* Max handle */}
                <input type="range" min={min} max={max} value={local[1]}
                    onChange={e => setLocal([local[0], Math.max(Number(e.target.value), local[0] + 50)])}
                    onMouseUp={() => onChange(local)}
                    onTouchEnd={() => onChange(local)}
                    className="absolute inset-0 w-full opacity-0 cursor-pointer h-full" />
            </div>
            <div className="flex gap-2">
                <input
                    type="number" value={local[0]} min={min} max={local[1] - 50}
                    onChange={e => setLocal([Number(e.target.value), local[1]])}
                    onBlur={() => onChange(local)}
                    className="w-full px-2 py-1.5 text-xs bg-bg border border-accent-10 rounded-lg text-heading outline-none focus:border-[var(--color-primary)]"
                />
                <span className="text-body self-center">—</span>
                <input
                    type="number" value={local[1]} min={local[0] + 50} max={max}
                    onChange={e => setLocal([local[0], Number(e.target.value)])}
                    onBlur={() => onChange(local)}
                    className="w-full px-2 py-1.5 text-xs bg-bg border border-accent-10 rounded-lg text-heading outline-none focus:border-[var(--color-primary)]"
                />
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// SORT OPTIONS
// ─────────────────────────────────────────────────────────────────────────────
const SORT_OPTIONS = [
    { value: "-createdAt", label: "Newest First" },
    { value: "createdAt", label: "Oldest First" },
    { value: "basePrice", label: "Price: Low to High" },
    { value: "-basePrice", label: "Price: High to Low" },
    { value: "-totalReviews", label: "Most Reviewed" },
    { value: "-averageRating", label: "Top Rated" },
];

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────────────────
const PRICE_MIN = 0;
const PRICE_MAX = 10000;

export default function ProductsPage() {
    const router = useRouter();
    const searchParams = useSearchParams();

    // Filter state
    const [search, setSearch] = useState(searchParams.get("search") || "");
    const [category, setCategory] = useState(searchParams.get("category") || "");
    const [sort, setSort] = useState(searchParams.get("sort") || "-createdAt");
    const [priceRange, setPriceRange] = useState([PRICE_MIN, PRICE_MAX]);
    const [isFeatured, setIsFeatured] = useState(false);
    const [hasVariants, setHasVariants] = useState("");
    const [minRating, setMinRating] = useState(0);

    // UI state
    const [view, setView] = useState("grid"); // grid | list
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [sortOpen, setSortOpen] = useState(false);

    // Data state
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({});

    const debounceRef = useRef(null);
    const sortRef = useRef(null);

    // Close sort dropdown on outside click
    useEffect(() => {
        const handler = (e) => { if (sortRef.current && !sortRef.current.contains(e.target)) setSortOpen(false); };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    // Fetch categories once
    useEffect(() => {
        api.get("/api/products/categories")
            .then(({ data }) => setCategories(data.data || []))
            .catch(() => { });
    }, []);

    // Build query and fetch
    const fetchProducts = useCallback(async (p = 1) => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: p, limit: 12, sort,
            });
            if (search) params.set("search", search);
            if (category) params.set("category", category);
            if (isFeatured) params.set("isFeatured", "true");
            if (hasVariants !== "") params.set("hasVariants", hasVariants);
            if (priceRange[0] > PRICE_MIN) params.set("minPrice", priceRange[0]);
            if (priceRange[1] < PRICE_MAX) params.set("maxPrice", priceRange[1]);

            const { data } = await api.get(`/api/products?${params}`);
            let items = data.data || [];

            // Client-side rating filter (API doesn't have it yet)
            if (minRating > 0) items = items.filter(p => (p.averageRating || 0) >= minRating);

            setProducts(items);
            setPagination(data.pagination || {});
        } catch { }
        finally { setLoading(false); }
    }, [search, category, sort, priceRange, isFeatured, hasVariants, minRating]);

    // Debounce search, immediate for others
    useEffect(() => {
        clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => { setPage(1); fetchProducts(1); }, search ? 350 : 0);
        return () => clearTimeout(debounceRef.current);
    }, [fetchProducts]);

    useEffect(() => { fetchProducts(page); }, [page]);

    // Active filter count
    const activeFilters = [
        category, isFeatured, hasVariants !== "",
        priceRange[0] > PRICE_MIN || priceRange[1] < PRICE_MAX,
        minRating > 0,
    ].filter(Boolean).length;

    const clearAll = () => {
        setCategory(""); setIsFeatured(false); setHasVariants("");
        setPriceRange([PRICE_MIN, PRICE_MAX]); setMinRating(0); setPage(1);
    };

    const sortLabel = SORT_OPTIONS.find(o => o.value === sort)?.label || "Sort";

    // Sidebar content (shared between desktop and mobile drawer)
    const SidebarContent = () => (
        <div className="space-y-1">
            {/* Categories */}
            <FilterSection title="Category">
                <div className="space-y-1 mt-1">
                    <button
                        onClick={() => { setCategory(""); setPage(1); }}
                        className={`w-full text-left px-3 py-2 rounded-xl text-sm transition-colors ${!category ? "bg-[var(--color-primary)]/10 text-[var(--color-primary)] font-semibold" : "text-body hover:text-heading hover:bg-[var(--accent-opacity)]"}`}
                    >
                        All Categories
                    </button>
                    {categories.map((cat) => (
                        <button
                            key={cat}
                            onClick={() => { setCategory(cat); setPage(1); }}
                            className={`w-full text-left px-3 py-2 rounded-xl text-sm capitalize transition-colors flex items-center justify-between ${category === cat ? "bg-[var(--color-primary)]/10 text-[var(--color-primary)] font-semibold" : "text-body hover:text-heading hover:bg-[var(--accent-opacity)]"}`}
                        >
                            {cat}
                            {category === cat && <Check size={12} />}
                        </button>
                    ))}
                </div>
            </FilterSection>

            {/* Price */}
            <FilterSection title="Price Range">
                <PriceRange
                    min={PRICE_MIN} max={PRICE_MAX}
                    value={priceRange}
                    onChange={(v) => { setPriceRange(v); setPage(1); }}
                />
            </FilterSection>

            {/* Rating */}
            <FilterSection title="Minimum Rating">
                <div className="flex flex-col gap-1 mt-1">
                    {[0, 3, 3.5, 4, 4.5].map((r) => (
                        <button
                            key={r}
                            onClick={() => { setMinRating(r); setPage(1); }}
                            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-colors ${minRating === r ? "bg-[var(--color-primary)]/10 text-[var(--color-primary)] font-semibold" : "text-body hover:bg-[var(--accent-opacity)]"}`}
                        >
                            {r === 0 ? (
                                <span>All Ratings</span>
                            ) : (
                                <>
                                    <div className="flex gap-0.5">
                                        {[1, 2, 3, 4, 5].map(n => (
                                            <Star key={n} size={11} className={n <= r ? "text-amber-400" : "text-[var(--accent-opacity)]"} fill={n <= r ? "currentColor" : "none"} strokeWidth={1.5} />
                                        ))}
                                    </div>
                                    <span>{r}+ stars</span>
                                </>
                            )}
                        </button>
                    ))}
                </div>
            </FilterSection>

            {/* Toggles */}
            <FilterSection title="More Filters" defaultOpen={false}>
                <div className="space-y-2 mt-2">
                    <label className="flex items-center justify-between cursor-pointer px-1">
                        <span className="text-sm text-heading">Featured only</span>
                        <div
                            onClick={() => { setIsFeatured(v => !v); setPage(1); }}
                            className={`w-10 h-5 rounded-full transition-colors relative ${isFeatured ? "bg-[var(--color-primary)]" : "bg-[var(--accent-opacity)]"}`}
                        >
                            <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${isFeatured ? "translate-x-5" : "translate-x-0.5"}`} />
                        </div>
                    </label>
                    <div>
                        <p className="text-sm text-heading px-1 mb-1.5">Variants</p>
                        <div className="flex gap-2">
                            {[{ v: "", l: "All" }, { v: "true", l: "With" }, { v: "false", l: "Without" }].map(({ v, l }) => (
                                <button key={v}
                                    onClick={() => { setHasVariants(v); setPage(1); }}
                                    className={`flex-1 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${hasVariants === v ? "border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)]" : "border-accent-10 text-body hover:border-[var(--color-secondary)]"}`}
                                >
                                    {l}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </FilterSection>

            {activeFilters > 0 && (
                <button onClick={clearAll}
                    className="w-full mt-2 py-2.5 rounded-xl text-sm font-bold text-[var(--color-danger)] border border-[var(--color-danger)]/30 hover:bg-[var(--color-danger)]/5 transition-colors flex items-center justify-center gap-2">
                    <X size={14} /> Clear All Filters
                </button>
            )}
        </div>
    );

    return (
        <div className="min-h-screen bg-bg">
            {/* <style>{`
                @keyframes shimmer { 0%{transform:translateX(-100%)} 100%{transform:translateX(100%)} }
                @keyframes fadeIn  { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
                .card-enter { animation: fadeIn 0.35s ease both; }
                .scrollbar-hide::-webkit-scrollbar { display:none; }
            `}</style> */}

            <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8">

                {/* ── Page Header ── */}
                <div className="mb-8">
                    <h1 className="text-heading text-3xl font-black">All Products</h1>
                    <p className="text-body text-sm mt-1">
                        {loading ? "Loading…" : `${pagination.total || 0} products found`}
                        {category && <span> in <span className="text-[var(--color-primary)] font-semibold capitalize">{category}</span></span>}
                        {search && <span> for <span className="text-[var(--color-primary)] font-semibold">"{search}"</span></span>}
                    </p>
                </div>

                {/* ── Top Bar: Search + Sort + View ── */}
                <div className="flex flex-wrap items-center gap-3 mb-6">
                    {/* Search */}
                    <div className="relative flex-1 min-w-[200px]">
                        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-body" />
                        <input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search products, categories, tags…"
                            className="w-full pl-10 pr-4 py-2.5 text-sm bg-card border border-accent-10 rounded-xl text-heading placeholder:text-body outline-none focus:border-[var(--color-primary)] transition-colors"
                        />
                        {search && (
                            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-body hover:text-heading">
                                <X size={14} />
                            </button>
                        )}
                    </div>

                    {/* Mobile filter btn */}
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="lg:hidden flex items-center gap-2 px-4 py-2.5 bg-card border border-accent-10 rounded-xl text-heading text-sm font-semibold"
                    >
                        <Filter size={15} />
                        Filters
                        {activeFilters > 0 && (
                            <span className="w-5 h-5 rounded-full bg-[var(--color-primary)] text-white text-xs flex items-center justify-center font-bold">
                                {activeFilters}
                            </span>
                        )}
                    </button>

                    {/* Sort dropdown */}
                    <div className="relative" ref={sortRef}>
                        <button
                            onClick={() => setSortOpen(v => !v)}
                            className="flex items-center gap-2 px-4 py-2.5 bg-card border border-accent-10 rounded-xl text-sm text-heading font-semibold hover:border-[var(--color-primary)] transition-colors"
                        >
                            <ArrowUpDown size={14} className="text-body" />
                            {sortLabel}
                            <ChevronDown size={13} className={`text-body transition-transform ${sortOpen ? "rotate-180" : ""}`} />
                        </button>
                        {sortOpen && (
                            <div className="absolute right-0 top-full mt-2 w-52 bg-card border border-accent-10 rounded-2xl shadow-xl z-30 overflow-hidden">
                                {SORT_OPTIONS.map(opt => (
                                    <button
                                        key={opt.value}
                                        onClick={() => { setSort(opt.value); setSortOpen(false); setPage(1); }}
                                        className={`w-full text-left px-4 py-2.5 text-sm flex items-center justify-between transition-colors ${sort === opt.value ? "text-[var(--color-primary)] bg-[var(--color-primary)]/8 font-semibold" : "text-heading hover:bg-[var(--accent-opacity)]"}`}
                                    >
                                        {opt.label}
                                        {sort === opt.value && <Check size={13} />}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* View toggle */}
                    <div className="flex bg-card border border-accent-10 rounded-xl overflow-hidden">
                        <button onClick={() => setView("grid")}
                            className={`p-2.5 transition-colors ${view === "grid" ? "bg-[var(--color-primary)] text-white" : "text-body hover:text-heading"}`}>
                            <LayoutGrid size={16} />
                        </button>
                        <button onClick={() => setView("list")}
                            className={`p-2.5 transition-colors ${view === "list" ? "bg-[var(--color-primary)] text-white" : "text-body hover:text-heading"}`}>
                            <List size={16} />
                        </button>
                    </div>
                </div>

                {/* Active filter chips */}
                {activeFilters > 0 && (
                    <div className="flex flex-wrap items-center gap-2 mb-5">
                        <span className="text-body text-xs">Active:</span>
                        {category && (
                            <span className="flex items-center gap-1.5 pl-3 pr-2 py-1 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-xs font-semibold capitalize">
                                {category}
                                <button onClick={() => setCategory("")}><X size={11} /></button>
                            </span>
                        )}
                        {isFeatured && (
                            <span className="flex items-center gap-1.5 pl-3 pr-2 py-1 rounded-full bg-amber-400/15 text-amber-600 text-xs font-semibold">
                                Featured <button onClick={() => setIsFeatured(false)}><X size={11} /></button>
                            </span>
                        )}
                        {minRating > 0 && (
                            <span className="flex items-center gap-1.5 pl-3 pr-2 py-1 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-xs font-semibold">
                                {minRating}+ ★ <button onClick={() => setMinRating(0)}><X size={11} /></button>
                            </span>
                        )}
                        {(priceRange[0] > PRICE_MIN || priceRange[1] < PRICE_MAX) && (
                            <span className="flex items-center gap-1.5 pl-3 pr-2 py-1 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-xs font-semibold">
                                ৳{priceRange[0]}–৳{priceRange[1]} <button onClick={() => setPriceRange([PRICE_MIN, PRICE_MAX])}><X size={11} /></button>
                            </span>
                        )}
                        <button onClick={clearAll} className="text-[var(--color-danger)] text-xs hover:underline ml-1">Clear all</button>
                    </div>
                )}

                {/* ── Main Layout ── */}
                <div className="flex gap-7">

                    {/* ── Desktop Sidebar ── */}
                    <aside className="hidden lg:block w-60 flex-shrink-0">
                        <div className="sticky top-6 bg-card border border-accent-10 rounded-2xl p-5">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-heading font-bold text-sm flex items-center gap-2">
                                    <SlidersHorizontal size={15} className="text-[var(--color-primary)]" />
                                    Filters
                                </span>
                                {activeFilters > 0 && (
                                    <span className="text-xs bg-[var(--color-primary)] text-white px-2 py-0.5 rounded-full font-bold">{activeFilters}</span>
                                )}
                            </div>
                            <SidebarContent />
                        </div>
                    </aside>

                    {/* ── Products Grid ── */}
                    <div className="flex-1 min-w-0">
                        {loading ? (
                            <div className={view === "grid"
                                ? "grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4"
                                : "flex flex-col gap-4"
                            }>
                                {[...Array(12)].map((_, i) => <CardSkeleton key={i} />)}
                            </div>
                        ) : products.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
                                <div className="w-20 h-20 rounded-full bg-[var(--accent-opacity)] flex items-center justify-center">
                                    <Package size={36} className="text-body opacity-40" />
                                </div>
                                <p className="text-heading font-bold text-lg">No products found</p>
                                <p className="text-body text-sm">Try adjusting your filters or search term</p>
                                <button onClick={clearAll}
                                    className="px-5 py-2 rounded-xl bg-[var(--color-primary)] text-white text-sm font-semibold hover:bg-[var(--color-secondary)] transition-colors">
                                    Clear filters
                                </button>
                            </div>
                        ) : (
                            <>
                                <div className={view === "grid"
                                    ? "grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4"
                                    : "flex flex-col gap-4"
                                }>
                                    {products.map((p, i) => (
                                        <div key={p._id} className="card-enter" style={{ animationDelay: `${i * 30}ms` }}>
                                            <ProductCard product={p} view={view} />
                                        </div>
                                    ))}
                                </div>

                                {/* Pagination */}
                                {pagination.totalPages > 1 && (
                                    <div className="flex items-center justify-center gap-2 mt-10">
                                        <button
                                            onClick={() => setPage(p => Math.max(1, p - 1))}
                                            disabled={page === 1}
                                            className="p-2 rounded-xl border border-accent-10 disabled:opacity-30 hover:bg-[var(--accent-opacity)] transition-colors"
                                        >
                                            <ChevronLeft size={16} className="text-heading" />
                                        </button>

                                        {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                                            .filter(n => n === 1 || n === pagination.totalPages || Math.abs(n - page) <= 1)
                                            .reduce((acc, n, i, arr) => {
                                                if (i > 0 && n - arr[i - 1] > 1) acc.push("…");
                                                acc.push(n);
                                                return acc;
                                            }, [])
                                            .map((n, i) => n === "…" ? (
                                                <span key={`ellipsis-${i}`} className="text-body px-1">…</span>
                                            ) : (
                                                <button key={n} onClick={() => setPage(n)}
                                                    className={`w-9 h-9 rounded-xl text-sm font-semibold transition-colors ${n === page ? "bg-[var(--color-primary)] text-white" : "border border-accent-10 text-heading hover:bg-[var(--accent-opacity)]"}`}>
                                                    {n}
                                                </button>
                                            ))
                                        }

                                        <button
                                            onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                                            disabled={page === pagination.totalPages}
                                            className="p-2 rounded-xl border border-accent-10 disabled:opacity-30 hover:bg-[var(--accent-opacity)] transition-colors"
                                        >
                                            <ChevronRight size={16} className="text-heading" />
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Mobile Filter Drawer ── */}
            {sidebarOpen && (
                <>
                    <div
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
                        onClick={() => setSidebarOpen(false)}
                    />
                    <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-accent-10 rounded-t-3xl z-50 lg:hidden max-h-[85vh] overflow-y-auto">
                        <div className="sticky top-0 bg-card px-5 py-4 border-b border-accent-10 flex items-center justify-between">
                            <span className="text-heading font-bold flex items-center gap-2">
                                <SlidersHorizontal size={16} className="text-[var(--color-primary)]" />
                                Filters {activeFilters > 0 && <span className="text-xs bg-[var(--color-primary)] text-white px-2 py-0.5 rounded-full">{activeFilters}</span>}
                            </span>
                            <button onClick={() => setSidebarOpen(false)} className="p-1.5 rounded-lg hover:bg-[var(--accent-opacity)]">
                                <X size={18} className="text-heading" />
                            </button>
                        </div>
                        <div className="p-5">
                            <SidebarContent />
                        </div>
                        <div className="sticky bottom-0 bg-card border-t border-accent-10 p-4">
                            <button
                                onClick={() => setSidebarOpen(false)}
                                className="w-full py-3 rounded-xl bg-[var(--color-primary)] text-white font-bold text-sm hover:bg-[var(--color-secondary)] transition-colors"
                            >
                                Show {pagination.total || 0} Results
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}