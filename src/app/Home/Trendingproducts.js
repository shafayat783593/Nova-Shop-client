"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/app/lib/api";
import AddToCartButton from "../(Products)/components/AddToCartButton";

function StarRating({ rating }) {
    return (
        <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((s) => (
                <svg
                    key={s}
                    viewBox="0 0 20 20"
                    className={`w-3 h-3 md:w-3.5 md:h-3.5 ${s <= Math.round(rating) ? "fill-[#f4a261] text-[#f4a261]" : "fill-none text-[#6b705c]"}`}
                    stroke="currentColor"
                    strokeWidth="1.5"
                >
                    <path d="M10 1l2.39 4.84 5.34.78-3.87 3.77.91 5.33L10 13.27l-4.77 2.45.91-5.33L2.27 6.62l5.34-.78L10 1z" />
                </svg>
            ))}
        </div>
    );
}

function ProductCard({ product }) {
    const router = useRouter();
    const price = product.discountedPrice || product.basePrice;
    const hasDiscount = product.discountedPrice && product.discountedPrice < product.basePrice;
    const discountPct = hasDiscount ? Math.round(((product.basePrice - product.discountedPrice) / product.basePrice) * 100) : 0;

    return (
        <div className="group bg-card rounded-xl border border-accent-10 hover:shadow-xl transition-all duration-300 flex flex-col h-full overflow-hidden">
            {/* Image Container - Fixed Aspect Ratio (1:1 Square) */}
            <div className="relative aspect-square w-full overflow-hidden bg-gray-100">
                {product.images?.[0] ? (
                    <img
                        src={product.images[0]}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-3xl">🛍️</div>
                )}

                {/* Badges */}
                <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
                    {product.isFeatured && (
                        <span className="bg-primary text-white text-[8px] md:text-[9px] font-bold px-2 py-0.5 rounded-sm uppercase tracking-tighter">
                            Featured
                        </span>
                    )}
                    {hasDiscount && (
                        <span className="bg-danger text-white text-[8px] md:text-[9px] font-bold px-2 py-0.5 rounded-sm">
                            -{discountPct}%
                        </span>
                    )}
                </div>

                {/* Quick View Button (Desktop only) */}
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 hidden md:flex items-center justify-center">
                    <button
                        onClick={() => router.push(`/products/${product.slug}`)}
                        className="bg-white text-black text-xs font-bold px-5 py-2 rounded-full shadow-lg  text-primary "
                    >
                        View Product
                    </button>
                </div>
            </div>

            {/* Content Body - Fixed Spacing */}
            <div className="p-3 md:p-4 flex flex-col flex-grow">
                <span className="text-[8px] md:text-[10px] font-medium text-secondary/70 uppercase mb-1">
                    {product.category}
                </span>

                {/* Fixed Height Title (2 lines) */}
                <h3
                    className="text-xs md:text-sm font-bold text-heading leading-snug line-clamp-2 h-8 md:h-10 mb-2 cursor-pointer hover:text-primary transition-colors"
                    onClick={() => router.push(`/products/${product.slug}`)}
                >
                    {product.name}
                </h3>

                {/* Rating */}
                <div className="flex items-center gap-1 mb-3">
                    <StarRating rating={product.averageRating || 0} />
                    <span className="text-[10px] text-body opacity-70">({product.totalReviews || 0})</span>
                </div>

                {/* Price & Cart - Pushed to bottom */}
                <div className="mt-auto pt-2 flex flex-col gap-3">
                    <div className="flex items-baseline gap-2">
                        <span className="text-sm md:text-base font-bold text-heading">
                            ৳{price?.toLocaleString()}
                        </span>
                        {hasDiscount && (
                            <span className="text-[10px] md:text-xs text-body line-through opacity-60">
                                ৳{product.basePrice?.toLocaleString()}
                            </span>
                        )}
                    </div>
                    <AddToCartButton productId={product._id} />
                </div>
            </div>
        </div>
    );
}

function SkeletonCard() {
    return (
        <div className="bg-card rounded-xl overflow-hidden border border-accent-10 animate-pulse h-full">
            <div className="aspect-square bg-gray-200" />
            <div className="p-4 space-y-3">
                <div className="h-2 bg-gray-200 rounded w-1/3" />
                <div className="h-4 bg-gray-200 rounded w-full" />
                <div className="h-8 bg-gray-200 rounded w-full mt-4" />
            </div>
        </div>
    );
}

export default function TrendingProducts() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        api
            .get("/api/products?limit=8&isFeatured=true&sort=-totalReviews")
            .then((res) => setProducts(res.data.data || []))
            .catch(() => setProducts([]))
            .finally(() => setLoading(false));
    }, []);

    return (
        <section className="py-12 md:py-20 px-4 bg-bg">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
                    <div>
                        <span className="text-xs font-bold tracking-widest uppercase text-secondary mb-2 block">
                            🔥 Hot right now
                        </span>
                        <h2 className="text-2xl md:text-4xl font-bold text-heading">
                            Trending Products
                        </h2>
                    </div>
                    <button
                        onClick={() => router.push("/products?isFeatured=true")}
                        className="text-xs md:text-sm font-bold text-secondary hover:text-primary transition-all flex items-center gap-2 group"
                    >
                        VIEW ALL PRODUCTS
                        <span className="group-hover:translate-x-1 transition-transform">→</span>
                    </button>
                </div>

                {/* Main Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8">
                    {loading
                        ? Array(8).fill(null).map((_, i) => <SkeletonCard key={i} />)
                        : products.map((p) => <ProductCard key={p._id} product={p} />)}
                </div>

                {!loading && products.length === 0 && (
                    <div className="text-center py-20 text-body font-medium">No products available at the moment.</div>
                )}
            </div>
        </section>
    );
}