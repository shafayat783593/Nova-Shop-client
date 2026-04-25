"use client";

import { useWishlist } from "@/app/context/Wishlistcontext";
import { Heart, Loader2 } from "lucide-react";
import { useState } from "react";

export default function WishlistButton({
    productId,
    variantId = null,
    product = null,   // pass full product object for guest localStorage
    size = "icon",
    className = "",
}) {
    const { isWishlisted, toggleWishlist } = useWishlist();
    const [loading, setLoading] = useState(false);

    const wishlisted = isWishlisted(productId, variantId);

    const handleClick = async (e) => {
        e.stopPropagation();
        e.preventDefault();
        setLoading(true);
        await toggleWishlist({ productId, variantId, product });
        setLoading(false);
    };

    const sizeMap = {
        default: { btn: "px-4 py-2.5 rounded-xl gap-2 text-sm font-semibold", icon: 16 },
        sm: { btn: "px-3 py-1.5 rounded-lg gap-1.5 text-xs font-semibold", icon: 13 },
        icon: { btn: "w-9 h-9 rounded-xl justify-center", icon: 16 },
    };
    const s = sizeMap[size] || sizeMap.icon;

    const colorClass = wishlisted
        ? "border-red-400 bg-red-400/10 text-red-400 hover:bg-red-400/20"
        : "border-accent-10 bg-card text-body hover:border-red-300 hover:text-red-400 hover:bg-red-400/8";

    return (
        <button
            onClick={handleClick}
            disabled={loading}
            title={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
            className={`flex items-center border transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed active:scale-90 ${s.btn} ${colorClass} ${className}`}
        >
            {loading
                ? <Loader2 size={s.icon} className="animate-spin" />
                : <Heart size={s.icon} fill={wishlisted ? "currentColor" : "none"} strokeWidth={2} />
            }
            {size !== "icon" && <span>{wishlisted ? "Wishlisted" : "Wishlist"}</span>}
        </button>
    );
}