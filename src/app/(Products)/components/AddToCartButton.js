"use client";

// ─── AddToCartButton ──────────────────────────────────────────────────────────
// Drop-in button for any product page
// Usage:
//   <AddToCartButton productId={p._id} variantId={selectedVariant?._id} qty={qty} />

import { useState } from "react";
import { ShoppingCart, Check, Loader2 } from "lucide-react";
import { useCart } from "@/app/context/Cartcontext";

export default function AddToCartButton({
    productId,
    variantId,
    qty = 1,
    inStock = true,
    className = "",
    size = "default",   // "default" | "sm" | "icon"
    onSuccess,
}) {
    const { addToCart, adding } = useCart();
    const [added, setAdded] = useState(false);
    const [error, setError] = useState(null);

    const handle = async (e) => {
        e.stopPropagation();
        if (!inStock || adding || added) return;
        setError(null);
        const result = await addToCart({ productId, variantId, quantity: qty });
        if (result.success) {
            setAdded(true);
            onSuccess?.();
            setTimeout(() => setAdded(false), 2200);
        } else {
            setError(result.message);
            setTimeout(() => setError(null), 3000);
        }
    };

    const sizeClasses = {
        default: "px-5 py-2.5 text-sm gap-2",
        sm: "px-3 py-1.5 text-xs gap-1.5",
        icon: "w-10 h-10 p-0 justify-center",
    }[size];

    const stateClass = added
        ? "bg-green-500 text-white"
        : !inStock
            ? "bg-[var(--accent-opacity)] text-body cursor-not-allowed"
            : "bg-[var(--color-primary)] hover:bg-[var(--color-secondary)] text-white active:scale-95";

    return (
        <div className="relative">
            <button
                onClick={handle}
                disabled={!inStock || adding || added}
                className={`flex items-center rounded-xl font-bold transition-all duration-200 ${sizeClasses} ${stateClass} ${className}`}
            >
                {adding ? (
                    <><Loader2 size={size === "sm" ? 13 : 16} className="animate-spin" />
                        {size !== "icon" && "Adding…"}</>
                ) : added ? (
                    <><Check size={size === "sm" ? 13 : 16} />
                        {size !== "icon" && "Added!"}</>
                ) : (
                    <><ShoppingCart size={size === "sm" ? 13 : 16} />
                        {size !== "icon" && (inStock ? "Add to Cart" : "Out of Stock")}</>
                )}
            </button>
            {error && (
                <p className="absolute top-full mt-1 left-0 text-xs text-[var(--color-danger)] whitespace-nowrap bg-card border border-[var(--color-danger)]/20 rounded-lg px-2 py-1 z-10">
                    {error}
                </p>
            )}
        </div>
    );
}