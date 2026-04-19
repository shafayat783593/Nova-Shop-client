"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import api from "@/app/lib/api";
import {
    FiPlus, FiEdit2, FiTrash2, FiSearch, FiFilter,
    FiToggleLeft, FiToggleRight, FiLoader, FiAlertCircle,
    FiCheckCircle, FiX, FiPackage, FiChevronLeft,
    FiChevronRight, FiRefreshCw, FiStar,
} from "react-icons/fi";
import Loading from "@/app/components/global/Loading";

export default function ManageProductsPage() {
    const router = useRouter();
    const [products, setProducts] = useState([]);
    const [pagination, setPagination] = useState({ total: 0, page: 1, totalPages: 1 });
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState(null);
    const [deleteModal, setDeleteModal] = useState(null); // product to delete
    const [toggling, setToggling] = useState(null); // id being toggled

    // Filters
    const [search, setSearch] = useState("");
    const [category, setCategory] = useState("");
    const [page, setPage] = useState(1);

    const showToast = (type, msg) => {
        setToast({ type, msg });
        setTimeout(() => setToast(null), 4000);
    };

    // ── Fetch ─────────────────────────────────────────────────────────────────

    const fetchProducts = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ page, limit: 10 });
            if (search) params.set("search", search);
            if (category) params.set("category", category);

            const { data } = await api.get(`/api/products?${params}`);
            setProducts(data.data || []);
            setPagination(data.pagination || {});
        } catch {
            showToast("error", "Failed to load products");
        } finally {
            setLoading(false);
        }
    }, [page, search, category]);

    useEffect(() => { fetchProducts(); }, [fetchProducts]);

    // ── Toggle status ─────────────────────────────────────────────────────────

    const handleToggle = async (product) => {
        setToggling(product._id);
        try {
            const { data } = await api.patch(`/api/products/${product._id}/toggle`);
            setProducts((prev) =>
                prev.map((p) =>
                    p._id === product._id ? { ...p, isActive: data.data.isActive } : p
                )
            );
            showToast("success", data.message);
        } catch {
            showToast("error", "Failed to update status");
        } finally {
            setToggling(null);
        }
    };

    // ── Delete ────────────────────────────────────────────────────────────────

    const confirmDelete = async () => {
        if (!deleteModal) return;
        try {
            await api.delete(`/api/products/${deleteModal._id}`);
            setProducts((prev) => prev.filter((p) => p._id !== deleteModal._id));
            showToast("success", "Product deleted successfully");
        } catch {
            showToast("error", "Delete failed");
        } finally {
            setDeleteModal(null);
        }
    };

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <div className="min-h-screen bg-bg">
            {/* Toast */}
            {toast && (
                <div
                    className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-xl text-white text-sm font-semibold ${toast.type === "success" ? "bg-[color:var(--color-success)]" : "bg-[color:var(--color-danger)]"
                        }`}
                >
                    {toast.type === "success" ? <FiCheckCircle size={18} /> : <FiAlertCircle size={18} />}
                    {toast.msg}
                    <button onClick={() => setToast(null)} className="ml-2 opacity-70 hover:opacity-100">
                        <FiX size={15} />
                    </button>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                    <div className="bg-card rounded-2xl border border-accent-10 p-8 max-w-sm w-full mx-4 shadow-2xl">
                        <div className="text-center mb-6">
                            <div className="w-14 h-14 rounded-full bg-[color:var(--color-danger)]/10 flex items-center justify-center mx-auto mb-4">
                                <FiTrash2 size={24} className="text-[color:var(--color-danger)]" />
                            </div>
                            <h3 className="font-display font-bold text-xl text-heading mb-2">Delete Product?</h3>
                            <p className="text-body text-sm">
                                <span className="font-semibold text-heading">{deleteModal.name}</span> will be permanently removed.
                                This cannot be undone.
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setDeleteModal(null)}
                                className="flex-1 py-3 rounded-xl border border-accent-10 text-body font-semibold hover:bg-bg transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDelete}
                                className="flex-1 py-3 rounded-xl bg-[color:var(--color-danger)] text-white font-bold hover:opacity-90 transition-all"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-10">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="font-display text-3xl sm:text-4xl font-bold text-heading tracking-tight">
                            Manage Products
                        </h1>
                        <p className="text-body text-sm mt-1">
                            {pagination.total} product{pagination.total !== 1 ? "s" : ""} total
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={fetchProducts}
                            className="p-2.5 rounded-xl border border-accent-10 text-body hover:bg-card transition-all"
                            title="Refresh"
                        >
                            <FiRefreshCw size={18} className={loading ? "animate-spin" : ""} />
                        </button>
                        <button
                            onClick={() => router.push("/admin/create-product")}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[color:var(--color-primary)] text-white font-bold font-display text-sm hover:bg-[color:var(--color-secondary)] transition-all shadow-lg shadow-[color:var(--color-primary)]/20"
                        >
                            <FiPlus size={18} /> Add Product
                        </button>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-card rounded-2xl border border-accent-10 p-5 mb-6 flex flex-col sm:flex-row gap-4">
                    {/* Search */}
                    <div className="relative flex-1">
                        <FiSearch size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-body opacity-50" />
                        <input
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                            placeholder="Search products…"
                            className={inputBase() + " pl-9"}
                        />
                    </div>

                    {/* Category filter */}
                    <div className="relative sm:w-56">
                        <FiFilter size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-body opacity-50 pointer-events-none" />
                        <select
                            value={category}
                            onChange={(e) => { setCategory(e.target.value); setPage(1); }}
                            className={inputBase() + " pl-9 appearance-none cursor-pointer"}
                        >
                            <option value="">All categories</option>
                            {["Electronics", "Clothing", "Footwear", "Home & Living", "Beauty", "Sports", "Books", "Toys", "Accessories", "Other"]
                                .map((c) => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-card rounded-2xl border border-accent-10 overflow-hidden shadow-sm">
                    {loading ? (
                       <Loading/>
                    ) : products.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-24 gap-4 text-body">
                            <FiPackage size={44} className="opacity-30" />
                            <p className="font-semibold">No products found</p>
                            <button
                                onClick={() => router.push("/admin/products/add")}
                                className="text-sm text-[color:var(--color-primary)] hover:underline font-semibold"
                            >
                                Add your first product →
                            </button>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-accent-10">
                                        <th className="text-left px-5 py-4 text-[11px] font-bold text-body uppercase tracking-wider">Product</th>
                                        <th className="text-left px-4 py-4 text-[11px] font-bold text-body uppercase tracking-wider hidden sm:table-cell">Category</th>
                                        <th className="text-left px-4 py-4 text-[11px] font-bold text-body uppercase tracking-wider hidden md:table-cell">Price</th>
                                        <th className="text-left px-4 py-4 text-[11px] font-bold text-body uppercase tracking-wider hidden lg:table-cell">Variants</th>
                                        <th className="text-center px-4 py-4 text-[11px] font-bold text-body uppercase tracking-wider">Status</th>
                                        <th className="text-right px-5 py-4 text-[11px] font-bold text-body uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {products.map((product, i) => (
                                        <tr
                                            key={product._id}
                                            className={`border-b border-accent-10 last:border-0 hover:bg-bg/60 transition-colors ${i % 2 === 0 ? "" : "bg-bg/30"
                                                }`}
                                        >
                                            {/* Product info */}
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-12 h-12 rounded-lg overflow-hidden border border-accent-10 shrink-0 bg-bg">
                                                        {product.images?.[0] ? (
                                                            <img src={product.images[0]} alt={product.name}
                                                                className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center">
                                                                <FiPackage size={20} className="text-body opacity-30" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="font-semibold text-heading text-sm truncate max-w-[180px]">
                                                            {product.name}
                                                        </p>
                                                        {product.isFeatured && (
                                                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[color:var(--color-secondary)] bg-[color:var(--color-accent)]/20 px-2 py-0.5 rounded-full mt-1">
                                                                <FiStar size={9} /> Featured
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="px-4 py-4 hidden sm:table-cell">
                                                <span className="text-xs font-semibold text-body bg-bg px-2.5 py-1 rounded-lg border border-accent-10">
                                                    {product.category}
                                                </span>
                                            </td>

                                            <td className="px-4 py-4 hidden md:table-cell">
                                                <div>
                                                    <p className="text-sm font-bold text-heading">৳{product.basePrice?.toLocaleString()}</p>
                                                    {product.discountedPrice && (
                                                        <p className="text-xs text-[color:var(--color-success)] font-semibold">
                                                            ৳{product.discountedPrice?.toLocaleString()}
                                                        </p>
                                                    )}
                                                </div>
                                            </td>

                                            <td className="px-4 py-4 hidden lg:table-cell">
                                                <span className="text-xs text-body font-medium">
                                                    {product.variants?.length || 0} variant{product.variants?.length !== 1 ? "s" : ""}
                                                </span>
                                            </td>

                                            {/* Status toggle */}
                                            <td className="px-4 py-4 text-center">
                                                <button
                                                    onClick={() => handleToggle(product)}
                                                    disabled={toggling === product._id}
                                                    title={product.isActive ? "Click to deactivate" : "Click to activate"}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all disabled:opacity-50"
                                                    style={{
                                                        background: product.isActive
                                                            ? "rgba(82,183,136,0.12)"
                                                            : "rgba(214,40,40,0.10)",
                                                        color: product.isActive
                                                            ? "var(--color-success)"
                                                            : "var(--color-danger)",
                                                    }}
                                                >
                                                    {toggling === product._id ? (
                                                        <FiLoader size={13} className="animate-spin" />
                                                    ) : product.isActive ? (
                                                        <FiToggleRight size={15} />
                                                    ) : (
                                                        <FiToggleLeft size={15} />
                                                    )}
                                                    {product.isActive ? "Active" : "Inactive"}
                                                </button>
                                            </td>

                                            {/* Actions */}
                                            <td className="px-5 py-4">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => router.push(`/admin/create-product/${product.slug}`)}
                                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border border-accent-10 text-body hover:bg-[color:var(--color-primary)] hover:text-white hover:border-[color:var(--color-primary)] transition-all"
                                                    >
                                                        <FiEdit2 size={13} /> Edit
                                                    </button>
                                                    <button
                                                        onClick={() => setDeleteModal(product)}
                                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border border-accent-10 text-body hover:bg-[color:var(--color-danger)] hover:text-white hover:border-[color:var(--color-danger)] transition-all"
                                                    >
                                                        <FiTrash2 size={13} /> Delete
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                    <div className="flex items-center justify-between mt-6">
                        <p className="text-xs text-body font-medium">
                            Page {pagination.page} of {pagination.totalPages} · {pagination.total} total
                        </p>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={page <= 1}
                                className="p-2 rounded-lg border border-accent-10 text-body hover:bg-card disabled:opacity-30 transition-all"
                            >
                                <FiChevronLeft size={16} />
                            </button>
                            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                                .filter((p) => p === 1 || p === pagination.totalPages || Math.abs(p - page) <= 1)
                                .map((p, idx, arr) => (
                                    <>
                                        {idx > 0 && arr[idx - 1] !== p - 1 && (
                                            <span key={`ellipsis-${p}`} className="text-body text-xs px-1">…</span>
                                        )}
                                        <button
                                            key={p}
                                            onClick={() => setPage(p)}
                                            className={`w-9 h-9 rounded-lg text-sm font-bold transition-all ${p === page
                                                    ? "bg-[color:var(--color-primary)] text-white shadow-sm"
                                                    : "border border-accent-10 text-body hover:bg-card"
                                                }`}
                                        >
                                            {p}
                                        </button>
                                    </>
                                ))
                            }
                            <button
                                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                                disabled={page >= pagination.totalPages}
                                className="p-2 rounded-lg border border-accent-10 text-body hover:bg-card disabled:opacity-30 transition-all"
                            >
                                <FiChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

const inputBase = (error) =>
    ["w-full px-3.5 py-2.5 rounded-lg text-sm font-medium text-heading bg-bg",
        "border transition-all duration-150 outline-none",
        "placeholder:text-body placeholder:opacity-40 placeholder:font-normal",
        "focus:ring-2 focus:ring-[color:var(--color-accent)]/40 focus:border-[color:var(--color-accent-hover)]",
        error ? "border-[color:var(--color-danger)]/60" : "border-accent-10 hover:border-[color:var(--color-accent-hover)]",
    ].join(" ");