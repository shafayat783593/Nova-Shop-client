"use client";

// ─────────────────────────────────────────────────────────────────────────────
// Wishlist Page
// Route: /wishlist
// Shows all wishlisted products with:
//   - Remove button
//   - Move to cart button
//   - Edit note and priority
//   - Price change indicator
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
    Heart, ShoppingCart, Trash2, Star, Package,
    ChevronRight, Loader2, Check, Pencil, X,
    ArrowUpDown, SlidersHorizontal
} from "lucide-react";
import api from "@/app/lib/api";
import { useCart } from "@/app/context/Cartcontext";

// ─── Skeleton loader ──────────────────────────────────────────────────────────
function Shimmer({ className = "" }) {
    return (
        <div className={`relative overflow-hidden rounded-xl bg-[var(--accent-opacity)] ${className}`}>
            <div
                className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite]"
                style={{ background: "linear-gradient(90deg,transparent,rgba(255,255,255,0.07),transparent)" }}
            />
        </div>
    );
}

function WishlistSkeleton() {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-card rounded-2xl border border-accent-10 overflow-hidden">
                    <Shimmer className="aspect-[4/3] w-full rounded-none" />
                    <div className="p-4 space-y-2.5">
                        <Shimmer className="h-4 w-3/4" />
                        <Shimmer className="h-4 w-1/2" />
                        <Shimmer className="h-5 w-24 mt-1" />
                        <div className="flex gap-2 mt-3">
                            <Shimmer className="h-9 flex-1 rounded-xl" />
                            <Shimmer className="h-9 w-9 rounded-xl" />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

// ─── Priority stars ───────────────────────────────────────────────────────────
// Shows 1–5 star priority selector
function PriorityStars({ value = 1, onChange, readonly = false }) {
    return (
        <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
                <button
                    key={star}
                    type="button"
                    disabled={readonly}
                    onClick={() => onChange?.(star)}
                    className={`transition-colors ${readonly ? "cursor-default" : "hover:scale-110"}`}
                >
                    <Star
                        size={13}
                        className={star <= value ? "text-amber-400" : "text-[var(--accent-opacity)]"}
                        fill={star <= value ? "currentColor" : "none"}
                        strokeWidth={1.5}
                    />
                </button>
            ))}
        </div>
    );
}

// ─── Single wishlist card ─────────────────────────────────────────────────────
function WishlistCard({ item, onRemove, onMoveToCart, onUpdate }) {
    const router = useRouter();

    // Local state for edit mode
    const [editMode, setEditMode] = useState(false);
    const [note, setNote] = useState(item.note || "");
    const [priority, setPriority] = useState(item.priority || 1);
    const [saving, setSaving] = useState(false);
    const [removing, setRemoving] = useState(false);
    const [moving, setMoving] = useState(false);
    const [moveAdded, setMoveAdded] = useState(false);

    const product = item.product; // populated product object

    // Price now vs price when added
    const currentPrice = product?.discountedPrice ?? product?.basePrice;
    const addedPrice = item.priceAtAdd;
    const priceDropped = currentPrice < addedPrice;
    const priceRised = currentPrice > addedPrice;

    // ── Save note + priority changes ─────────────────────────────────────────
    const handleSaveEdit = async () => {
        setSaving(true);
        try {
            await api.patch(`/api/wishlist/${product._id}`, { note, priority });
            onUpdate?.(); // re-fetch the list
            setEditMode(false);
        } catch {
            // silent fail
        } finally {
            setSaving(false);
        }
    };

    // ── Remove from wishlist ──────────────────────────────────────────────────
    const handleRemove = async (e) => {
        e.stopPropagation();
        setRemoving(true);
        await onRemove(product._id);
        // Note: if onRemove re-fetches the list, this component will unmount
    };

    // ── Move to cart ──────────────────────────────────────────────────────────
    const handleMoveToCart = async (e) => {
        e.stopPropagation();
        setMoving(true);
        await onMoveToCart(product._id, item.variant);
        setMoveAdded(true);
        setTimeout(() => setMoveAdded(false), 2000);
        setMoving(false);
    };

    if (!product) return null; // safety check

    return (
        <div
            className={`
                group bg-card rounded-2xl border border-accent-10 overflow-hidden
                hover:border-[var(--color-primary)]/40 hover:shadow-lg
                transition-all duration-300
                ${removing ? "opacity-30 scale-95 pointer-events-none" : ""}
            `}
        >
            {/* ── Product image ── */}
            <div
                className="relative aspect-[4/3] overflow-hidden bg-bg cursor-pointer"
                onClick={() => router.push(`/products/${product.slug}`)}
            >
                {product.images?.[0] ? (
                    <img
                        src={product.images[0]}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <Package size={36} className="text-body opacity-20" />
                    </div>
                )}

                {/* Price change badge */}
                {priceDropped && (
                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded-lg bg-green-500 text-white text-xs font-bold shadow">
                        Price Drop!
                    </span>
                )}
                {priceRised && (
                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded-lg bg-orange-400 text-white text-xs font-bold shadow">
                        Price Up
                    </span>
                )}

                {/* Remove button (top right) */}
                <button
                    onClick={handleRemove}
                    disabled={removing}
                    className="
                        absolute top-2 right-2 w-8 h-8 rounded-xl
                        bg-card/70 backdrop-blur border border-accent-10
                        flex items-center justify-center
                        text-body hover:text-[var(--color-danger)] hover:border-[var(--color-danger)]/40
                        opacity-0 group-hover:opacity-100 transition-all
                    "
                >
                    <Trash2 size={14} />
                </button>
            </div>

            {/* ── Product info ── */}
            <div className="p-4 space-y-3">
                {/* Category + name */}
                <div>
                    <span className="text-xs text-[var(--color-primary)] font-semibold capitalize">
                        {product.category}
                    </span>
                    <h3
                        className="text-heading font-bold text-sm leading-snug mt-0.5 line-clamp-2 cursor-pointer hover:text-[var(--color-primary)] transition-colors"
                        onClick={() => router.push(`/products/${product.slug}`)}
                    >
                        {product.name}
                    </h3>
                </div>

                {/* Priority stars */}
                {!editMode ? (
                    <div className="flex items-center justify-between">
                        <PriorityStars value={priority} readonly />
                        <button
                            onClick={() => setEditMode(true)}
                            className="text-body hover:text-heading transition-colors p-1 rounded-lg hover:bg-[var(--accent-opacity)]"
                        >
                            <Pencil size={12} />
                        </button>
                    </div>
                ) : (
                    // Edit mode: note + priority
                    <div className="space-y-2 animate-[fadeIn_0.2s_ease]">
                        <PriorityStars value={priority} onChange={setPriority} />
                        <textarea
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            placeholder="Add a note…"
                            rows={2}
                            className="
                                w-full text-xs px-2.5 py-2 rounded-xl
                                bg-bg border border-accent-10 text-heading
                                placeholder:text-body outline-none resize-none
                                focus:border-[var(--color-primary)] transition-colors
                            "
                        />
                        <div className="flex gap-2">
                            <button
                                onClick={handleSaveEdit}
                                disabled={saving}
                                className="flex-1 py-1.5 rounded-xl bg-[var(--color-primary)] text-white text-xs font-bold hover:bg-[var(--color-secondary)] transition-colors flex items-center justify-center gap-1"
                            >
                                {saving
                                    ? <Loader2 size={11} className="animate-spin" />
                                    : <Check size={11} />
                                }
                                Save
                            </button>
                            <button
                                onClick={() => setEditMode(false)}
                                className="px-3 py-1.5 rounded-xl border border-accent-10 text-body text-xs hover:bg-[var(--accent-opacity)] transition-colors"
                            >
                                <X size={11} />
                            </button>
                        </div>
                    </div>
                )}

                {/* Note preview (when not editing) */}
                {!editMode && note && (
                    <p className="text-body text-xs italic line-clamp-1 border-l-2 border-[var(--color-accent)] pl-2">
                        {note}
                    </p>
                )}

                {/* Price */}
                <div className="flex items-end gap-2">
                    <span className="text-heading font-black text-base">
                        ৳{currentPrice?.toLocaleString()}
                    </span>
                    {/* Show original price if it changed */}
                    {(priceDropped || priceRised) && (
                        <span className={`text-xs line-through ${priceDropped ? "text-green-500" : "text-orange-400"}`}>
                            ৳{addedPrice?.toLocaleString()}
                        </span>
                    )}
                </div>

                {/* Move to cart button */}
                <button
                    onClick={handleMoveToCart}
                    disabled={moving || moveAdded || !product.isActive}
                    className={`
                        w-full py-2.5 rounded-xl text-sm font-bold
                        flex items-center justify-center gap-2
                        transition-all duration-200 active:scale-95
                        ${moveAdded
                            ? "bg-green-500 text-white"
                            : product.isActive
                                ? "bg-[var(--color-primary)] hover:bg-[var(--color-secondary)] text-white"
                                : "bg-[var(--accent-opacity)] text-body cursor-not-allowed"
                        }
                    `}
                >
                    {moving ? <Loader2 size={15} className="animate-spin" /> : null}
                    {moveAdded ? <Check size={15} /> : null}
                    {!moving && !moveAdded ? <ShoppingCart size={15} /> : null}

                    {moving ? "Moving…"
                        : moveAdded ? "Added to Cart!"
                            : !product.isActive ? "Unavailable"
                                : "Move to Cart"}
                </button>
            </div>
        </div>
    );
}

// ─── Sort options ──────────────────────────────────────────────────────────────
const SORT_OPTIONS = [
    { value: "default", label: "Date Added" },
    { value: "priority", label: "Priority (High first)" },
    { value: "price-asc", label: "Price: Low to High" },
    { value: "price-desc", label: "Price: High to Low" },
    { value: "price-drop", label: "Price Dropped" },
];

// ─── Main Wishlist Page ───────────────────────────────────────────────────────
export default function WishlistPage() {
    const router = useRouter();
    const { addToCart } = useCart();

    const [wishlist, setWishlist] = useState(null);
    const [loading, setLoading] = useState(true);
    const [sortBy, setSortBy] = useState("default");
    const [sortOpen, setSortOpen] = useState(false);

    // ── Fetch wishlist ────────────────────────────────────────────────────────
    const fetchWishlist = useCallback(async () => {
        try {
            const { data } = await api.get("/api/wishlist");
            setWishlist(data.data);
        } catch {
            setWishlist({ items: [], totalItems: 0 });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchWishlist(); }, [fetchWishlist]);

    // ── Remove from wishlist ──────────────────────────────────────────────────
    const handleRemove = async (productId) => {
        try {
            await api.delete(`/api/wishlist/${productId}`);
            await fetchWishlist(); // re-fetch to update the list
        } catch { }
    };

    // ── Move to cart: call wishlist backend + cart backend ────────────────────
    const handleMoveToCart = async (productId, variantId) => {
        try {
            // Step 1: remove from wishlist
            await api.post(`/api/wishlist/move-to-cart/${productId}`);
            // Step 2: add to cart
            await addToCart({ productId, variantId, quantity: 1 });
            // Step 3: refresh wishlist
            await fetchWishlist();
        } catch { }
    };

    // ── Sort items ────────────────────────────────────────────────────────────
    const getSortedItems = () => {
        if (!wishlist?.items) return [];
        const items = [...wishlist.items];

        switch (sortBy) {
            case "priority":
                // Higher priority number = shown first
                return items.sort((a, b) => (b.priority || 1) - (a.priority || 1));
            case "price-asc":
                return items.sort((a, b) => {
                    const priceA = a.product?.discountedPrice ?? a.product?.basePrice ?? 0;
                    const priceB = b.product?.discountedPrice ?? b.product?.basePrice ?? 0;
                    return priceA - priceB;
                });
            case "price-desc":
                return items.sort((a, b) => {
                    const priceA = a.product?.discountedPrice ?? a.product?.basePrice ?? 0;
                    const priceB = b.product?.discountedPrice ?? b.product?.basePrice ?? 0;
                    return priceB - priceA;
                });
            case "price-drop":
                // Items where price dropped come first
                return items.sort((a, b) => {
                    const dropA = a.product ? (a.priceAtAdd - (a.product.discountedPrice ?? a.product.basePrice)) : 0;
                    const dropB = b.product ? (b.priceAtAdd - (b.product.discountedPrice ?? b.product.basePrice)) : 0;
                    return dropB - dropA;
                });
            default:
                return items; // keep original order
        }
    };

    const sortedItems = getSortedItems();

    // ── Loading state ─────────────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="min-h-screen bg-bg px-4 lg:px-8 py-8">
                <style>{`@keyframes shimmer{0%{transform:translateX(-100%)}100%{transform:translateX(100%)}}`}</style>
                <div className="max-w-7xl mx-auto space-y-8">
                    <Shimmer className="h-9 w-56" />
                    <WishlistSkeleton />
                </div>
            </div>
        );
    }

    // ── Empty state ───────────────────────────────────────────────────────────
    if (!wishlist?.items?.length) {
        return (
            <div className="min-h-screen bg-bg flex items-center justify-center px-4">
                <style>{`@keyframes shimmer{0%{transform:translateX(-100%)}100%{transform:translateX(100%)}}`}</style>
                <div className="text-center max-w-sm space-y-6">
                    {/* Big heart illustration */}
                    <div className="w-28 h-28 mx-auto rounded-full bg-red-400/10 flex items-center justify-center">
                        <Heart size={48} className="text-red-400 opacity-60" />
                    </div>

                    <div>
                        <h2 className="text-heading text-2xl font-black mb-2">
                            Your wishlist is empty
                        </h2>
                        <p className="text-body text-sm">
                            Save products you love — we'll tell you when the price drops!
                        </p>
                    </div>

                    <button
                        onClick={() => router.push("/products")}
                        className="px-8 py-3 rounded-xl bg-[var(--color-primary)] hover:bg-[var(--color-secondary)] text-white font-bold transition-colors flex items-center gap-2 mx-auto"
                    >
                        Browse Products <ChevronRight size={16} />
                    </button>
                </div>
            </div>
        );
    }

    // ── Main page ─────────────────────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-bg">
            <style>{`
                @keyframes shimmer { 0%{transform:translateX(-100%)} 100%{transform:translateX(100%)} }
                @keyframes fadeIn  { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
                .card-enter { animation: fadeIn 0.35s ease both; }
            `}</style>

            <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8 space-y-8">

                {/* ── Header ── */}
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h1 className="text-heading text-3xl font-black flex items-center gap-3">
                            <Heart className="text-red-400" size={28} fill="currentColor" />
                            My Wishlist
                        </h1>
                        <p className="text-body text-sm mt-1">
                            {wishlist.totalItems} saved item{wishlist.totalItems !== 1 ? "s" : ""}
                        </p>
                    </div>

                    {/* Sort dropdown */}
                    <div className="relative">
                        <button
                            onClick={() => setSortOpen((v) => !v)}
                            className="flex items-center gap-2 px-4 py-2.5 bg-card border border-accent-10 rounded-xl text-sm text-heading font-semibold hover:border-[var(--color-primary)] transition-colors"
                        >
                            <ArrowUpDown size={14} className="text-body" />
                            {SORT_OPTIONS.find((o) => o.value === sortBy)?.label}
                        </button>

                        {sortOpen && (
                            <div className="absolute right-0 top-full mt-2 w-52 bg-card border border-accent-10 rounded-2xl shadow-xl z-20 overflow-hidden">
                                {SORT_OPTIONS.map((opt) => (
                                    <button
                                        key={opt.value}
                                        onClick={() => { setSortBy(opt.value); setSortOpen(false); }}
                                        className={`
                                            w-full text-left px-4 py-2.5 text-sm transition-colors
                                            flex items-center justify-between
                                            ${sortBy === opt.value
                                                ? "bg-[var(--color-primary)]/8 text-[var(--color-primary)] font-semibold"
                                                : "text-heading hover:bg-[var(--accent-opacity)]"
                                            }
                                        `}
                                    >
                                        {opt.label}
                                        {sortBy === opt.value && <Check size={13} />}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Product grid ── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                    {sortedItems.map((item, index) => (
                        <div
                            key={item.product?._id || index}
                            className="card-enter"
                            style={{ animationDelay: `${index * 40}ms` }}
                        >
                            <WishlistCard
                                item={item}
                                onRemove={handleRemove}
                                onMoveToCart={handleMoveToCart}
                                onUpdate={fetchWishlist}
                            />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}