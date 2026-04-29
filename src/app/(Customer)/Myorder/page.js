"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    Package, ChevronRight, Clock, CheckCircle2, Truck,
    XCircle, Loader2, ShoppingBag, RotateCcw, MapPin,
} from "lucide-react";
import api from "@/app/lib/api";

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
    pending: {
        label: "Pending",
        color: "text-amber-600",
        bg: "bg-amber-500/10 border-amber-500/20",
        icon: Clock,
    },
    confirmed: {
        label: "Confirmed",
        color: "text-blue-600",
        bg: "bg-blue-500/10 border-blue-500/20",
        icon: CheckCircle2,
    },
    processing: {
        label: "Processing",
        color: "text-purple-600",
        bg: "bg-purple-500/10 border-purple-500/20",
        icon: RotateCcw,
    },
    shipped: {
        label: "Shipped",
        color: "text-indigo-600",
        bg: "bg-indigo-500/10 border-indigo-500/20",
        icon: Truck,
    },
    delivered: {
        label: "Delivered",
        color: "text-green-600",
        bg: "bg-green-500/10 border-green-500/20",
        icon: CheckCircle2,
    },
    cancelled: {
        label: "Cancelled",
        color: "text-[var(--color-danger)]",
        bg: "bg-[var(--color-danger)]/8 border-[var(--color-danger)]/20",
        icon: XCircle,
    },
};

function StatusBadge({ status }) {
    const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
    const Icon = cfg.icon;
    return (
        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-xs font-bold ${cfg.color} ${cfg.bg}`}>
            <Icon size={11} />
            {cfg.label}
        </span>
    );
}

// ─── Filter tabs ──────────────────────────────────────────────────────────────
const FILTERS = [
    { value: "", label: "All" },
    { value: "pending", label: "Pending" },
    { value: "confirmed", label: "Confirmed" },
    { value: "shipped", label: "Shipped" },
    { value: "delivered", label: "Delivered" },
    { value: "cancelled", label: "Cancelled" },
];

// ─── Order Card ───────────────────────────────────────────────────────────────
function OrderCard({ order, onClick }) {
    const firstImage = order.items?.[0]?.imageSnapshot;
    const itemCount = order.items?.reduce((s, i) => s + i.quantity, 0) || 0;

    return (
        <div
            onClick={onClick}
            className="bg-card border border-accent-10 rounded-2xl p-4 sm:p-5 hover:border-[var(--color-primary)]/30 hover:shadow-sm transition-all cursor-pointer group"
        >
            <div className="flex items-start gap-3 sm:gap-4">

                {/* Product images preview */}
                <div className="flex -space-x-3 flex-shrink-0">
                    {order.items?.slice(0, 3).map((item, i) => (
                        <div
                            key={item._id || i}
                            className="w-12 h-12 rounded-xl border-2 border-bg overflow-hidden bg-bg flex-shrink-0"
                            style={{ zIndex: order.items.length - i }}
                        >
                            {item.imageSnapshot
                                ? <img src={item.imageSnapshot} alt={item.nameSnapshot} className="w-full h-full object-cover" />
                                : <div className="w-full h-full flex items-center justify-center"><Package size={16} className="text-body opacity-30" /></div>
                            }
                        </div>
                    ))}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                        <div>
                            <p className="text-heading font-black text-sm tracking-wide">{order.orderId}</p>
                            <p className="text-body text-xs mt-0.5">
                                {itemCount} item{itemCount !== 1 ? "s" : ""} ·{" "}
                                {new Date(order.createdAt).toLocaleDateString("en-BD", {
                                    day: "numeric", month: "short", year: "numeric"
                                })}
                            </p>
                        </div>
                        <StatusBadge status={order.orderStatus} />
                    </div>

                    <div className="flex items-center justify-between mt-3">
                        <div>
                            <p className="text-heading font-black text-base">৳{order.total?.toLocaleString()}</p>
                            <p className="text-body text-xs capitalize">{order.paymentMethod} · {order.paymentStatus}</p>
                        </div>
                        <ChevronRight
                            size={18}
                            className="text-body group-hover:text-[var(--color-primary)] group-hover:translate-x-0.5 transition-all"
                        />
                    </div>
                </div>
            </div>

            {/* Shipping address */}
            {order.shippingAddress && (
                <div className="mt-3 pt-3 border-t border-accent-10 flex items-center gap-1.5 text-body text-xs">
                    <MapPin size={11} className="text-[var(--color-primary)] flex-shrink-0" />
                    {order.shippingAddress.area}, {order.shippingAddress.district}
                </div>
            )}
        </div>
    );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function OrderSkeleton() {
    return (
        <div className="space-y-3">
            {[1, 2, 3].map(i => (
                <div key={i} className="h-28 rounded-2xl bg-[var(--accent-opacity)] animate-pulse" />
            ))}
        </div>
    );
}

// ─── Main Orders Page ─────────────────────────────────────────────────────────
export default function MyOrdersPage() {
    const router = useRouter();

    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const fetchOrders = async (status = "", p = 1) => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ page: p, limit: 10 });
            if (status) params.set("status", status);
            const { data } = await api.get(`/api/orders/my?${params}`);
            setOrders(data.data);
            setTotalPages(data.pagination.totalPages);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders(filter, page);
    }, [filter, page]);

    const handleFilterChange = (value) => {
        setFilter(value);
        setPage(1);
    };

    return (
        <div className="min-h-screen bg-bg">
            <div className="max-w-3xl mx-auto px-4 lg:px-8 py-8">

                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-heading text-2xl font-black flex items-center gap-3">
                        <Package className="text-[var(--color-primary)]" size={24} />
                        My Orders
                    </h1>
                    <p className="text-body text-sm mt-1">Track and manage your orders</p>
                </div>

                {/* Filter tabs */}
                <div className="flex gap-2 overflow-x-auto pb-2 mb-5 scrollbar-none">
                    {FILTERS.map(f => (
                        <button
                            key={f.value}
                            onClick={() => handleFilterChange(f.value)}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex-shrink-0
                                ${filter === f.value
                                    ? "bg-[var(--color-primary)] text-white"
                                    : "bg-card border border-accent-10 text-body hover:border-[var(--color-primary)]/40"
                                }`}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>

                {/* Content */}
                {loading ? (
                    <OrderSkeleton />
                ) : orders.length === 0 ? (
                    <div className="text-center py-16 space-y-4">
                        <div className="w-20 h-20 mx-auto rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center">
                            <ShoppingBag size={36} className="text-[var(--color-primary)] opacity-60" />
                        </div>
                        <p className="text-heading font-bold text-lg">No orders found</p>
                        <p className="text-body text-sm">
                            {filter ? `No ${filter} orders.` : "You haven't placed any orders yet."}
                        </p>
                        <button
                            onClick={() => router.push("/products")}
                            className="px-6 py-2.5 rounded-xl bg-[var(--color-primary)] text-white font-bold text-sm hover:bg-[var(--color-secondary)] transition-colors"
                        >
                            Start Shopping
                        </button>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {orders.map(order => (
                            <OrderCard
                                key={order._id}
                                order={order}
                                onClick={() => router.push(`/Myorder/${order.orderId}`)}
                            />
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && !loading && (
                    <div className="flex items-center justify-center gap-3 mt-8">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="px-4 py-2 rounded-xl border border-accent-10 text-heading text-sm font-semibold disabled:opacity-40 hover:bg-[var(--accent-opacity)] transition-colors"
                        >
                            Previous
                        </button>
                        <span className="text-body text-sm">{page} / {totalPages}</span>
                        <button
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                            className="px-4 py-2 rounded-xl border border-accent-10 text-heading text-sm font-semibold disabled:opacity-40 hover:bg-[var(--accent-opacity)] transition-colors"
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}