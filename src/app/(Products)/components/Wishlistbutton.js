"use client";

// ─────────────────────────────────────────────────────────────────────────────
// WishlistButton
// A reusable heart button — works just like AddToCartButton
//
// Usage:
//   <WishlistButton productId={product._id} />
//   <WishlistButton productId={product._id} size="sm" />
//   <WishlistButton productId={product._id} size="icon" />
//
// Props:
//   productId  – string (required)
//   variantId  – string (optional)
//   size       – "default" | "sm" | "icon"
//   className  – extra tailwind classes
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from "react";
import { Heart, Loader2 } from "lucide-react";
import api from "@/app/lib/api";
import { useAuth } from "@/app/context/AuthContext";

export default function WishlistButton({
    productId,
    variantId = null,
    size = "icon",
    className = "",
}) {
    const { isAuth } = useAuth();

    // Is this product already wishlisted?
    const [wishlisted, setWishlisted] = useState(false);
    const [loading, setLoading] = useState(false);

    // ── Check wishlist status when component mounts ──────────────────────────
    useEffect(() => {
        // Only check if user is logged in and we have a productId
        if (!isAuth || !productId) return;

        api.get(`/api/wishlist/check/${productId}`)
            .then(({ data }) => setWishlisted(data.wishlisted))
            .catch(() => { }); // silent fail — don't crash the page
    }, [productId, isAuth]);

    // ── Handle click: toggle wishlist ────────────────────────────────────────
    const handleClick = async (e) => {
        // Stop click from bubbling up (e.g. navigating to product page)
        e.stopPropagation();
        e.preventDefault();

        // Guest users can't wishlist
        if (!isAuth) {
            alert("Please log in to save items to your wishlist.");
            return;
        }

        setLoading(true);
        try {
            const { data } = await api.post("/api/wishlist/toggle", {
                productId,
                variantId,
            });
            // Backend tells us the new state
            setWishlisted(data.wishlisted);
        } catch {
            // silent fail
        } finally {
            setLoading(false);
        }
    };

    // ── Size variants ────────────────────────────────────────────────────────
    const sizeMap = {
        default: { btn: "px-4 py-2.5 rounded-xl gap-2 text-sm font-semibold", icon: 16 },
        sm: { btn: "px-3 py-1.5 rounded-lg  gap-1.5 text-xs font-semibold", icon: 13 },
        icon: { btn: "w-9 h-9 rounded-xl justify-center", icon: 16 },
    };
    const s = sizeMap[size] || sizeMap.icon;

    // ── Color: red when wishlisted, muted when not ───────────────────────────
    const colorClass = wishlisted
        ? "border-red-400 bg-red-400/10 text-red-400 hover:bg-red-400/20"
        : "border-accent-10 bg-card text-body hover:border-red-300 hover:text-red-400 hover:bg-red-400/8";

    return (
        <button
            onClick={handleClick}
            disabled={loading}
            title={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
            className={`
                flex items-center border transition-all duration-200
                disabled:opacity-60 disabled:cursor-not-allowed
                active:scale-90
                ${s.btn} ${colorClass} ${className}
            `}
        >
            {/* Spinner while loading */}
            {loading ? (
                <Loader2 size={s.icon} className="animate-spin" />
            ) : (
                <Heart
                    size={s.icon}
                    // Solid heart when wishlisted, outline when not
                    fill={wishlisted ? "currentColor" : "none"}
                    strokeWidth={2}
                />
            )}

            {/* Show text label for non-icon sizes */}
            {size !== "icon" && (
                <span>
                    {wishlisted ? "Wishlisted" : "Wishlist"}
                </span>
            )}
        </button>
    );
}