"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/app/lib/api";

function StarRating({ rating }) {
    return (
        <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((s) => (
                <svg
                    key={s}
                    viewBox="0 0 20 20"
                    className={`w-3.5 h-3.5 ${s <= Math.round(rating) ? "fill-[#f4a261] text-[#f4a261]" : "fill-none text-[#6b705c]"
                        }`}
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
    const discountPct = hasDiscount
        ? Math.round(((product.basePrice - product.discountedPrice) / product.basePrice) * 100)
        : 0;

    return (
        <div className="group bg-card rounded-2xl overflow-hidden border border-accent-10 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 flex flex-col">
            {/* Image */}
            <div className="relative overflow-hidden bg-[var(--accent-opacity)] h-52">
                {product.images?.[0] ? (
                    <img
                        src={product.images[0]}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-5xl">
                        🛍️
                    </div>
                )}
                {/* Badges */}
                <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                    {product.isFeatured && (
                        <span className="bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                            Featured
                        </span>
                    )}
                    {hasDiscount && (
                        <span className="bg-danger text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                            -{discountPct}%
                        </span>
                    )}
                </div>
                {/* Quick view overlay */}
                <div className="absolute inset-0 bg-[#1b4332]/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <button
                        onClick={() => router.push(`/products/${product.slug}`)}
                        className="bg-white text-[#1b4332] text-xs font-bold px-4 py-2 rounded-full translate-y-2 group-hover:translate-y-0 transition-transform duration-300"
                    >
                        Quick View
                    </button>
                </div>
            </div>

            {/* Body */}
            <div className="p-4 flex flex-col flex-1 gap-2">
                <span className="text-[10px] font-bold tracking-widest uppercase text-secondary">
                    {product.category}
                </span>
                <h3
                    className="text-sm font-bold text-heading leading-tight line-clamp-2"
                    style={{ fontFamily: "Syne, sans-serif" }}
                >
                    {product.name}
                </h3>

                {/* Rating */}
                <div className="flex items-center gap-1.5">
                    <StarRating rating={product.averageRating || 0} />
                    <span className="text-[11px] text-body">({product.totalReviews || 0})</span>
                </div>

                {/* Price + Cart */}
                <div className="flex items-center justify-between mt-auto pt-2">
                    <div className="flex items-baseline gap-1.5">
                        <span className="text-lg font-bold text-heading">
                            ৳{price?.toLocaleString()}
                        </span>
                        {hasDiscount && (
                            <span className="text-xs text-body line-through">
                                ৳{product.basePrice?.toLocaleString()}
                            </span>
                        )}
                    </div>
                    <button
                        onClick={() => router.push(`/products/${product.slug}`)}
                        className="bg-primary hover:bg-secondary text-white text-xs font-bold px-3 py-2 rounded-xl transition-colors duration-200 flex items-center gap-1"
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
                            <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0" />
                        </svg>
                        Add
                    </button>
                </div>
            </div>
        </div>
    );
}

function SkeletonCard() {
    return (
        <div className="bg-card rounded-2xl overflow-hidden border border-accent-10 animate-pulse">
            <div className="h-52 bg-[var(--accent-opacity)]" />
            <div className="p-4 flex flex-col gap-3">
                <div className="h-2.5 bg-[var(--accent-opacity)] rounded w-1/3" />
                <div className="h-4 bg-[var(--accent-opacity)] rounded w-3/4" />
                <div className="h-3 bg-[var(--accent-opacity)] rounded w-1/2" />
                <div className="h-6 bg-[var(--accent-opacity)] rounded w-1/2 mt-2" />
            </div>
        </div>
    );
}

export default function TrendingProducts() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
console.log(products)

    useEffect(() => {
        api
            .get("/api/products?limit=8&isFeatured=true&sort=-totalReviews")
            .then((res) => setProducts(res.data.data || []))
            .catch(() => setProducts([]))
            .finally(() => setLoading(false));
    }, []);
    return (
        <section className="py-16 px-4 bg-bg">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex items-end justify-between mb-10">
                    <div>
                        <span className="text-xs font-bold tracking-[0.25em] uppercase text-secondary mb-2 block">
                            🔥 Hot right now
                        </span>
                        <h2
                            className="text-4xl font-bold text-heading"
                            style={{ fontFamily: "Syne, sans-serif" }}
                        >
                            Trending Products
                        </h2>
                    </div>
                    <button
                        onClick={() => router.push("/products?isFeatured=true")}
                        className="text-sm font-semibold text-secondary hover:text-primary transition-colors flex items-center gap-1 group"
                    >
                        See All
                        <span className="group-hover:translate-x-1 transition-transform inline-block">→</span>
                    </button>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
                    {loading
                        ? Array(8).fill(null).map((_, i) => <SkeletonCard key={i} />)
                        : products.map((p) => <ProductCard key={p._id} product={p} />)}
                </div>

                {!loading && products.length === 0 && (
                    <div className="text-center py-16 text-body">No products found.</div>
                )}
            </div>
        </section>
    );
}