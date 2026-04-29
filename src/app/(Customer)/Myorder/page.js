"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import api from "@/app/lib/api";
import { useAuth } from "@/app/context/AuthContext";

// ─── Status config ─────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
    pending: { label: "Pending", color: "bg-amber-100 text-amber-700", dot: "bg-amber-400", icon: "⏳" },
    confirmed: { label: "Confirmed", color: "bg-blue-100 text-blue-700", dot: "bg-blue-400", icon: "✅" },
    processing: { label: "Processing", color: "bg-violet-100 text-violet-700", dot: "bg-violet-400", icon: "📦" },
    shipped: { label: "Shipped", color: "bg-orange-100 text-orange-700", dot: "bg-orange-400", icon: "🚚" },
    delivered: { label: "Delivered", color: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-500", icon: "🎉" },
    cancelled: { label: "Cancelled", color: "bg-red-100 text-red-600", dot: "bg-red-400", icon: "✕" },
};

const PAYMENT_STATUS = {
    pending: { label: "Pending", color: "text-amber-600" },
    paid: { label: "Paid", color: "text-emerald-600" },
    failed: { label: "Failed", color: "text-red-500" },
    refunded: { label: "Refunded", color: "text-slate-500" },
};

const ALL_STATUSES = ["all", "pending", "confirmed", "processing", "shipped", "delivered", "cancelled"];

// ─── Icons ─────────────────────────────────────────────────────────────────────
const IconLoader = () => (
    <svg className="animate-spin w-6 h-6 text-rose-400" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
);

const IconEmpty = () => (
    <svg viewBox="0 0 120 120" className="w-28 h-28 mx-auto mb-4 opacity-30">
        <circle cx="60" cy="60" r="55" fill="#f1f5f9" />
        <rect x="35" y="35" width="50" height="60" rx="6" fill="#cbd5e1" />
        <rect x="44" y="48" width="32" height="4" rx="2" fill="#94a3b8" />
        <rect x="44" y="58" width="24" height="4" rx="2" fill="#94a3b8" />
        <rect x="44" y="68" width="20" height="4" rx="2" fill="#94a3b8" />
    </svg>
);

const IconChevronRight = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-slate-400">
        <polyline points="9 18 15 12 9 6" />
    </svg>
);

// ─── Progress Track ─────────────────────────────────────────────────────────────
function OrderProgress({ status }) {
    const steps = ["pending", "confirmed", "processing", "shipped", "delivered"];
    if (status === "cancelled") return (
        <div className="flex items-center gap-2 mt-3 text-xs text-red-500 font-medium">
            <span className="w-2 h-2 bg-red-400 rounded-full" />
            Order Cancelled
        </div>
    );

    const currentIdx = steps.indexOf(status);
    return (
        <div className="flex items-center gap-1 mt-3">
            {steps.map((s, i) => {
                const done = i <= currentIdx;
                return (
                    <div key={s} className="flex items-center flex-1">
                        <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 transition-all duration-500 ${done ? "bg-rose-400 scale-110" : "bg-slate-200"}`} />
                        {i < steps.length - 1 && (
                            <div className={`flex-1 h-0.5 transition-all duration-500 ${i < currentIdx ? "bg-rose-300" : "bg-slate-200"}`} />
                        )}
                    </div>
                );
            })}
        </div>
    );
}

// ─── Order Card ─────────────────────────────────────────────────────────────────
function OrderCard({ order, onClick, onCancel }) {
    const cfg = STATUS_CONFIG[order.orderStatus] || STATUS_CONFIG.pending;
    const payCfg = PAYMENT_STATUS[order.paymentStatus] || {};
    const totalItems = order.items?.reduce((s, i) => s + i.quantity, 0) || 0;
    const firstImage = order.items?.[0]?.imageSnapshot;
    const [cancelling, setCancelling] = useState(false);

    const canCancel = ["pending", "confirmed"].includes(order.orderStatus);

    const handleCancel = async (e) => {
        e.stopPropagation();
        if (!confirm("এই অর্ডারটি cancel করতে চান?")) return;
        setCancelling(true);
        try {
            await onCancel(order.orderId);
        } finally {
            setCancelling(false);
        }
    };

    return (
        <div
            onClick={onClick}
            className="bg-white rounded-3xl shadow-sm hover:shadow-md transition-all duration-200 p-5 cursor-pointer group border border-transparent hover:border-rose-100"
        >
            {/* Header */}
            <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-800 text-sm tracking-wide">{order.orderId}</span>
                        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${cfg.color}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                            {cfg.label}
                        </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                        {new Date(order.createdAt).toLocaleDateString("bn-BD", { day: "numeric", month: "long", year: "numeric" })}
                    </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="font-bold text-rose-500 text-base">৳{order.total?.toFixed(0)}</span>
                    <IconChevronRight />
                </div>
            </div>

            {/* Items preview */}
            <div className="flex items-center gap-3 mb-3">
                <div className="flex -space-x-2">
                    {order.items?.slice(0, 3).map((item, i) => (
                        <div key={i} className="w-10 h-10 rounded-xl border-2 border-white bg-slate-100 overflow-hidden relative flex-shrink-0">
                            {item.imageSnapshot ? (
                                <Image src={item.imageSnapshot} alt={item.nameSnapshot} fill className="object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-lg">📦</div>
                            )}
                        </div>
                    ))}
                    {order.items?.length > 3 && (
                        <div className="w-10 h-10 rounded-xl border-2 border-white bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500">
                            +{order.items.length - 3}
                        </div>
                    )}
                </div>
                <div>
                    <p className="text-sm font-medium text-slate-700 line-clamp-1">{order.items?.[0]?.nameSnapshot}</p>
                    <p className="text-xs text-slate-400">{totalItems}টি পণ্য · {order.paymentMethod?.toUpperCase()}</p>
                </div>
            </div>

            {/* Progress */}
            <OrderProgress status={order.orderStatus} />

            {/* Footer */}
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-50">
                <span className={`text-xs font-semibold ${payCfg.color}`}>
                    Payment: {payCfg.label}
                </span>
                <div className="flex items-center gap-2">
                    {canCancel && (
                        <button
                            onClick={handleCancel}
                            disabled={cancelling}
                            className="text-xs text-red-400 hover:text-red-600 font-medium transition-colors px-2 py-1 hover:bg-red-50 rounded-lg disabled:opacity-50"
                        >
                            {cancelling ? "..." : "Cancel"}
                        </button>
                    )}
                    <span className="text-xs text-rose-500 font-medium group-hover:underline">বিস্তারিত →</span>
                </div>
            </div>
        </div>
    );
}

// ─── Order Detail Modal ──────────────────────────────────────────────────────
function OrderDetailModal({ order, onClose, onCancel }) {
    const cfg = STATUS_CONFIG[order.orderStatus] || STATUS_CONFIG.pending;
    const canCancel = ["pending", "confirmed"].includes(order.orderStatus);

    const handleCancel = async () => {
        if (!confirm("এই অর্ডারটি cancel করতে চান?")) return;
        await onCancel(order.orderId);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white rounded-t-3xl sm:rounded-3xl w-full sm:max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl z-10">
                {/* Header */}
                <div className="sticky top-0 bg-white rounded-t-3xl px-6 pt-6 pb-4 border-b border-slate-100 z-10">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="font-bold text-slate-800 text-lg">{order.orderId}</h2>
                            <p className="text-xs text-slate-400 mt-0.5">
                                {new Date(order.createdAt).toLocaleString("bn-BD")}
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className={`text-xs font-semibold px-3 py-1.5 rounded-full ${cfg.color}`}>
                                {cfg.icon} {cfg.label}
                            </span>
                            <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors">
                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>

                <div className="px-6 pb-6 space-y-5 pt-4">
                    {/* Items */}
                    <div>
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">পণ্য সমূহ</h3>
                        <div className="space-y-3">
                            {order.items?.map((item, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <div className="w-14 h-14 rounded-2xl bg-slate-100 overflow-hidden flex-shrink-0 relative">
                                        {item.imageSnapshot ? (
                                            <Image src={item.imageSnapshot} alt={item.nameSnapshot} fill className="object-cover" />
                                        ) : <div className="w-full h-full flex items-center justify-center text-xl">📦</div>}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-slate-800 line-clamp-1">{item.nameSnapshot}</p>
                                        <p className="text-xs text-slate-400">Qty: {item.quantity}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-bold text-slate-800">৳{(item.finalPrice * item.quantity).toFixed(0)}</p>
                                        {item.finalPrice < item.priceAtOrder && (
                                            <p className="text-xs text-slate-400 line-through">৳{(item.priceAtOrder * item.quantity).toFixed(0)}</p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Delivery info */}
                    <div className="bg-slate-50 rounded-2xl p-4">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Delivery ঠিকানা</h3>
                        <p className="font-semibold text-slate-800 text-sm">{order.shippingAddress?.fullName}</p>
                        <p className="text-slate-500 text-xs mt-1">{order.shippingAddress?.phone}</p>
                        <p className="text-slate-600 text-xs mt-1">
                            {order.shippingAddress?.addressLine}, {order.shippingAddress?.area}<br />
                            {order.shippingAddress?.district}, {order.shippingAddress?.division}
                        </p>
                    </div>

                    {/* Delivery boy */}
                    {order.deliveryBoy && (
                        <div className="bg-orange-50 rounded-2xl p-4 flex items-center gap-3">
                            <div className="w-10 h-10 bg-orange-200 rounded-full flex items-center justify-center text-lg">🚴</div>
                            <div>
                                <p className="text-xs text-orange-600 font-semibold">Delivery Person</p>
                                <p className="text-sm font-bold text-slate-800">{order.deliveryBoy.name}</p>
                                <p className="text-xs text-slate-500">{order.deliveryBoy.phone}</p>
                            </div>
                        </div>
                    )}

                    {/* Payment summary */}
                    <div>
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Payment</h3>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between text-slate-600">
                                <span>Subtotal</span><span>৳{order.subtotal?.toFixed(0)}</span>
                            </div>
                            {order.discount > 0 && (
                                <div className="flex justify-between text-emerald-600">
                                    <span>Discount</span><span>−৳{order.discount?.toFixed(0)}</span>
                                </div>
                            )}
                            <div className="flex justify-between text-slate-600">
                                <span>Shipping</span><span>৳{order.shippingFee?.toFixed(0)}</span>
                            </div>
                            <div className="flex justify-between font-bold text-slate-800 border-t border-slate-100 pt-2">
                                <span>Total</span>
                                <span className="text-rose-500 text-base">৳{order.total?.toFixed(0)}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                                <span className="text-slate-400">Method</span>
                                <span className="font-semibold text-slate-700 uppercase">{order.paymentMethod}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                                <span className="text-slate-400">Payment Status</span>
                                <span className={`font-semibold ${PAYMENT_STATUS[order.paymentStatus]?.color}`}>
                                    {PAYMENT_STATUS[order.paymentStatus]?.label}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Timeline */}
                    {order.timeline?.length > 0 && (
                        <div>
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Order Timeline</h3>
                            <div className="relative pl-5">
                                <div className="absolute left-1.5 top-0 bottom-0 w-0.5 bg-slate-100" />
                                {[...order.timeline].reverse().map((entry, i) => {
                                    const entryCfg = STATUS_CONFIG[entry.status] || {};
                                    return (
                                        <div key={i} className="relative mb-4 last:mb-0">
                                            <div className={`absolute -left-[14px] w-3 h-3 rounded-full border-2 border-white ${entryCfg.dot || "bg-slate-300"}`} />
                                            <p className="text-sm font-semibold text-slate-700">{entry.message}</p>
                                            <p className="text-xs text-slate-400 mt-0.5">
                                                {new Date(entry.changedAt).toLocaleString("en-BD", { hour12: true, hour: "numeric", minute: "2-digit", day: "numeric", month: "short" })}
                                            </p>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Note */}
                    {order.customerNote && (
                        <div className="bg-amber-50 rounded-2xl p-3">
                            <p className="text-xs text-amber-600 font-semibold mb-1">আপনার নোট</p>
                            <p className="text-sm text-slate-700">{order.customerNote}</p>
                        </div>
                    )}

                    {/* Cancel */}
                    {canCancel && (
                        <button
                            onClick={handleCancel}
                            className="w-full py-3 border-2 border-red-200 text-red-500 hover:bg-red-50 font-semibold rounded-2xl transition-colors text-sm"
                        >
                            Order Cancel করুন
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

// ─── Main Orders Page ─────────────────────────────────────────────────────────
export default function MyOrdersPage() {
    const router = useRouter();
    const { isAuth, loading: authLoading } = useAuth();

    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedStatus, setSelectedStatus] = useState("all");
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState(null);
    const [selectedOrder, setSelectedOrder] = useState(null);

    const fetchOrders = useCallback(async (status, pg) => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ page: pg, limit: 10 });
            if (status !== "all") params.append("status", status);
            const { data } = await api.get(`/api/orders/my?${params}`);
            setOrders(data.data || []);
            setPagination(data.pagination);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (authLoading) return;
        if (!isAuth) { router.push("/login"); return; }
        fetchOrders(selectedStatus, page);
    }, [isAuth, authLoading, selectedStatus, page, fetchOrders, router]);

    const handleCancel = async (orderId) => {
        try {
            await api.patch(`/api/orders/${orderId}/cancel`, { reason: "Cancelled by customer" });
            fetchOrders(selectedStatus, page);
        } catch (err) {
            alert(err.response?.data?.message || "Cancel করা যায়নি");
        }
    };

    const handleStatusChange = (status) => {
        setSelectedStatus(status);
        setPage(1);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-rose-50/40 via-white to-orange-50/30">
            {/* Header */}
            <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-slate-100">
                <div className="max-w-2xl mx-auto px-4 h-16 flex items-center justify-between">
                    <button onClick={() => router.back()} className="text-slate-500 hover:text-rose-500 transition-colors flex items-center gap-2 text-sm font-medium">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
                        Back
                    </button>
                    <h1 className="font-bold text-slate-800 text-lg tracking-tight">My Orders</h1>
                    <div className="text-sm text-slate-400 font-medium">
                        {pagination?.total || 0}টি
                    </div>
                </div>
            </header>

            <div className="max-w-2xl mx-auto px-4 py-6">
                {/* Status filter tabs */}
                <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
                    {ALL_STATUSES.map(status => {
                        const cfg = STATUS_CONFIG[status];
                        const active = selectedStatus === status;
                        return (
                            <button
                                key={status}
                                onClick={() => handleStatusChange(status)}
                                className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 border
                                    ${active
                                        ? "bg-rose-500 text-white border-rose-500 shadow-lg shadow-rose-200"
                                        : "bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:text-slate-700"
                                    }`}
                            >
                                {status === "all" ? "সবগুলো" : (cfg?.label || status)}
                            </button>
                        );
                    })}
                </div>

                {/* Orders list */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-3">
                        <IconLoader />
                        <p className="text-sm text-slate-400">অর্ডার লোড হচ্ছে...</p>
                    </div>
                ) : orders.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <IconEmpty />
                        <h3 className="font-bold text-slate-600 text-lg mb-2">কোনো অর্ডার নেই</h3>
                        <p className="text-slate-400 text-sm mb-6">
                            {selectedStatus !== "all"
                                ? `"${STATUS_CONFIG[selectedStatus]?.label}" status-এ কোনো অর্ডার নেই`
                                : "আপনি এখনো কোনো অর্ডার করেননি"}
                        </p>
                        <button
                            onClick={() => router.push("/")}
                            className="bg-rose-500 hover:bg-rose-600 text-white font-bold px-6 py-3 rounded-2xl transition-colors text-sm"
                        >
                            এখনই কেনাকাটা করুন →
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {orders.map(order => (
                            <OrderCard
                                key={order._id}
                                order={order}
                                onClick={() => setSelectedOrder(order)}
                                onCancel={handleCancel}
                            />
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {pagination && pagination.totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-8">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:border-rose-300 hover:text-rose-500 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
                        </button>

                        {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(pg => (
                            <button
                                key={pg}
                                onClick={() => setPage(pg)}
                                className={`w-10 h-10 rounded-full text-sm font-bold transition-all
                                    ${pg === page
                                        ? "bg-rose-500 text-white shadow-lg shadow-rose-200"
                                        : "bg-white border border-slate-200 text-slate-500 hover:border-rose-300 hover:text-rose-500"
                                    }`}
                            >
                                {pg}
                            </button>
                        ))}

                        <button
                            onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                            disabled={page === pagination.totalPages}
                            className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:border-rose-300 hover:text-rose-500 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
                        </button>
                    </div>
                )}
            </div>

            {/* Order Detail Modal */}
            {selectedOrder && (
                <OrderDetailModal
                    order={selectedOrder}
                    onClose={() => setSelectedOrder(null)}
                    onCancel={async (orderId) => {
                        await handleCancel(orderId);
                        setSelectedOrder(null);
                    }}
                />
            )}
        </div>
    );
}