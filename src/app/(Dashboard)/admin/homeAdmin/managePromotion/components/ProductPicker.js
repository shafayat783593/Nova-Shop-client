"use client";

// ─── ProductPicker ────────────────────────────────────────────────────────────
// Searchable, multi-select product picker for use in PromotionForm scope fields
// Props:
//   value        – string[] of selected product _ids
//   onChange     – (ids: string[]) => void
//   placeholder  – string
//   label        – string

import { useState, useEffect, useRef, useCallback } from "react";
import api from "@/app/lib/api";
import { Search, X, Check, ChevronDown, Loader2, Package } from "lucide-react";

export default function ProductPicker({ value = [], onChange, placeholder = "Search products…", label }) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [products, setProducts] = useState([]);
    const [selectedProducts, setSelectedProducts] = useState([]); // full objects of selected
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const containerRef = useRef(null);
    const searchRef = useRef(null);
    const listRef = useRef(null);
    const debounceRef = useRef(null);

    // Close on outside click
    useEffect(() => {
        const handler = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    // Focus search input when opened
    useEffect(() => {
        if (open) setTimeout(() => searchRef.current?.focus(), 50);
    }, [open]);

    // Fetch products whenever search or page changes
    const fetchProducts = useCallback(async (q, p) => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ limit: 12, page: p, isActive: "true" });
            if (q) params.set("search", q);
            const { data } = await api.get(`/api/products?${params}`);
            const items = data.data || [];
            setProducts((prev) => (p === 1 ? items : [...prev, ...items]));
            setHasMore(p < (data.pagination?.totalPages || 1));
        } catch {
            setProducts([]);
        } finally {
            setLoading(false);
        }
    }, []);

    // Debounced search
    useEffect(() => {
        if (!open) return;
        clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            setPage(1);
            fetchProducts(search, 1);
        }, 300);
        return () => clearTimeout(debounceRef.current);
    }, [search, open, fetchProducts]);

    // Load more on scroll
    const handleScroll = () => {
        const el = listRef.current;
        if (!el || loading || !hasMore) return;
        if (el.scrollTop + el.clientHeight >= el.scrollHeight - 40) {
            const next = page + 1;
            setPage(next);
            fetchProducts(search, next);
        }
    };

    // Sync full objects for selected ids (for displaying chips)
    useEffect(() => {
        if (!value.length) { setSelectedProducts([]); return; }
        // Merge from already-fetched products
        setSelectedProducts((prev) => {
            const map = new Map(prev.map((p) => [p._id, p]));
            products.forEach((p) => map.set(p._id, p));
            return value.map((id) => map.get(id)).filter(Boolean);
        });
    }, [value, products]);

    const toggle = (product) => {
        const isSelected = value.includes(product._id);
        const next = isSelected
            ? value.filter((id) => id !== product._id)
            : [...value, product._id];
        onChange(next);
        // Keep full object in selectedProducts
        if (!isSelected) {
            setSelectedProducts((prev) =>
                prev.find((p) => p._id === product._id) ? prev : [...prev, product]
            );
        }
    };

    const remove = (id, e) => {
        e.stopPropagation();
        onChange(value.filter((v) => v !== id));
        setSelectedProducts((prev) => prev.filter((p) => p._id !== id));
    };

    const clearAll = (e) => {
        e.stopPropagation();
        onChange([]);
        setSelectedProducts([]);
    };

    return (
        <div ref={containerRef} className="relative">
            {label && <label className="text-heading text-sm font-semibold block mb-1.5">{label}</label>}

            {/* Trigger */}
            <div
                onClick={() => setOpen((v) => !v)}
                className={`min-h-[42px] w-full px-3 py-2 flex flex-wrap gap-1.5 items-center cursor-pointer bg-bg border rounded-xl transition-colors ${open ? "border-[var(--color-primary)]" : "border-accent-10 hover:border-[var(--color-accent)]"
                    }`}
            >
                {selectedProducts.length === 0 ? (
                    <span className="text-body text-sm flex-1">{placeholder}</span>
                ) : (
                    selectedProducts.map((p) => (
                        <span
                            key={p._id}
                            className="flex items-center gap-1 pl-2 pr-1 py-0.5 rounded-lg bg-[var(--color-primary)]/15 text-[var(--color-primary)] text-xs font-semibold"
                        >
                            {p.images?.[0] && (
                                <img src={p.images[0]} alt="" className="w-4 h-4 rounded object-cover" />
                            )}
                            {p.name}
                            <button
                                type="button"
                                onClick={(e) => remove(p._id, e)}
                                className="ml-0.5 hover:text-[var(--color-danger)] transition-colors"
                            >
                                <X size={11} />
                            </button>
                        </span>
                    ))
                )}

                <div className="ml-auto flex items-center gap-1.5 pl-2">
                    {value.length > 0 && (
                        <button
                            type="button"
                            onClick={clearAll}
                            className="text-body hover:text-[var(--color-danger)] transition-colors"
                        >
                            <X size={14} />
                        </button>
                    )}
                    <ChevronDown
                        size={15}
                        className={`text-body transition-transform ${open ? "rotate-180" : ""}`}
                    />
                </div>
            </div>

            {/* Dropdown */}
            {open && (
                <div className="absolute z-50 mt-2 w-full bg-card border border-accent-10 rounded-2xl shadow-xl overflow-hidden">
                    {/* Search */}
                    <div className="p-3 border-b border-accent-10">
                        <div className="relative">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-body" />
                            <input
                                ref={searchRef}
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search by name, category…"
                                className="w-full pl-8 pr-3 py-2 text-sm bg-bg border border-accent-10 rounded-xl text-heading placeholder:text-body outline-none focus:border-[var(--color-primary)] transition-colors"
                            />
                        </div>
                    </div>

                    {/* Selected count */}
                    {value.length > 0 && (
                        <div className="px-3 py-1.5 bg-[var(--color-primary)]/5 border-b border-accent-10">
                            <span className="text-xs text-[var(--color-primary)] font-semibold">
                                {value.length} selected
                            </span>
                        </div>
                    )}

                    {/* List */}
                    <ul
                        ref={listRef}
                        onScroll={handleScroll}
                        className="max-h-60 overflow-y-auto divide-y divide-[var(--accent-opacity)]"
                    >
                        {products.length === 0 && !loading ? (
                            <li className="flex flex-col items-center justify-center py-8 text-body gap-2">
                                <Package size={28} className="opacity-30" />
                                <span className="text-sm">No products found</span>
                            </li>
                        ) : (
                            products.map((product) => {
                                const isSelected = value.includes(product._id);
                                return (
                                    <li
                                        key={product._id}
                                        onClick={() => toggle(product)}
                                        className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors ${isSelected
                                                ? "bg-[var(--color-primary)]/8"
                                                : "hover:bg-[var(--accent-opacity)]"
                                            }`}
                                    >
                                        {/* Thumbnail */}
                                        <div className="w-9 h-9 rounded-lg overflow-hidden bg-bg border border-accent-10 flex-shrink-0">
                                            {product.images?.[0] ? (
                                                <img
                                                    src={product.images[0]}
                                                    alt={product.name}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <Package size={14} className="text-body" />
                                                </div>
                                            )}
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-sm font-semibold truncate ${isSelected ? "text-[var(--color-primary)]" : "text-heading"}`}>
                                                {product.name}
                                            </p>
                                            <p className="text-body text-xs truncate">
                                                {product.category} · ৳{product.discountedPrice ?? product.basePrice}
                                            </p>
                                        </div>

                                        {/* Check */}
                                        <div className={`w-5 h-5 rounded-md border flex items-center justify-center flex-shrink-0 transition-colors ${isSelected
                                                ? "bg-[var(--color-primary)] border-[var(--color-primary)]"
                                                : "border-accent-10"
                                            }`}>
                                            {isSelected && <Check size={12} className="text-white" />}
                                        </div>
                                    </li>
                                );
                            })
                        )}

                        {loading && (
                            <li className="flex items-center justify-center py-4">
                                <Loader2 size={18} className="animate-spin text-body" />
                            </li>
                        )}

                        {!loading && hasMore && products.length > 0 && (
                            <li className="py-2 text-center text-body text-xs">Scroll for more</li>
                        )}
                    </ul>

                    {/* Footer */}
                    <div className="px-3 py-2 border-t border-accent-10 flex justify-end">
                        <button
                            type="button"
                            onClick={() => setOpen(false)}
                            className="px-4 py-1.5 rounded-lg bg-[var(--color-primary)] text-white text-xs font-semibold hover:bg-[var(--color-secondary)] transition-colors"
                        >
                            Done
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}