"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    ArrowLeft, Package, MapPin, CreditCard, Clock,
    CheckCircle2, Truck, XCircle, RotateCcw,
    Loader2, Phone, User, Zap, Tag, X, RefreshCcw, Download,
} from "lucide-react";
import api from "@/app/lib/api";

// ─── Status configs ───────────────────────────────────────────────────────────
const STATUS_CONFIG = {
    pending: { label: "Pending", color: "text-amber-600", bg: "bg-amber-500/10", icon: Clock },
    confirmed: { label: "Confirmed", color: "text-blue-600", bg: "bg-blue-500/10", icon: CheckCircle2 },
    processing: { label: "Processing", color: "text-purple-600", bg: "bg-purple-500/10", icon: RotateCcw },
    shipped: { label: "Shipped", color: "text-indigo-600", bg: "bg-indigo-500/10", icon: Truck },
    delivered: { label: "Delivered", color: "text-green-600", bg: "bg-green-500/10", icon: CheckCircle2 },
    cancelled: { label: "Cancelled", color: "text-red-500", bg: "bg-red-500/10", icon: XCircle },
};

const PAYMENT_STATUS = {
    paid: { label: "Paid", color: "text-green-600" },
    pending: { label: "Pending", color: "text-amber-600" },
    failed: { label: "Failed", color: "text-red-500" },
    refunded: { label: "Refunded", color: "text-slate-500" },
};

// ─── Timeline ─────────────────────────────────────────────────────────────────
function Timeline({ entries }) {
    return (
        <div className="space-y-0">
            {entries.map((entry, i) => {
                const cfg = STATUS_CONFIG[entry.status] || STATUS_CONFIG.pending;
                const Icon = cfg.icon;
                const isLast = i === entries.length - 1;
                return (
                    <div key={i} className="flex gap-3">
                        <div className="flex flex-col items-center">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${cfg.bg}`}>
                                <Icon size={14} className={cfg.color} />
                            </div>
                            {!isLast && <div className="w-0.5 h-6 bg-accent-10 my-1" />}
                        </div>
                        <div className="pb-4">
                            <p className={`text-sm font-bold ${cfg.color}`}>{cfg.label}</p>
                            <p className="text-body text-xs">{entry.message}</p>
                            <p className="text-body text-xs mt-0.5">
                                {new Date(entry.changedAt).toLocaleString("en-BD", {
                                    day: "numeric", month: "short", year: "numeric",
                                    hour: "2-digit", minute: "2-digit",
                                })}
                            </p>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

// ─── Cancel Modal ─────────────────────────────────────────────────────────────
function CancelModal({ orderId, onClose, onCancelled }) {
    const [reason, setReason] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleCancel = async () => {
        setLoading(true);
        setError(null);
        try {
            await api.patch(`/api/orders/${orderId}/cancel`, { reason });
            onCancelled();
            onClose();
        } catch (err) {
            setError(err.response?.data?.message || "Failed to cancel");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4">
            <div className="bg-card border border-accent-10 rounded-2xl p-6 max-w-sm w-full space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-heading font-bold">Cancel Order?</h3>
                    <button onClick={onClose} className="text-body hover:text-heading transition-colors">
                        <X size={18} />
                    </button>
                </div>
                <p className="text-body text-sm">Please tell us why you want to cancel.</p>
                <textarea
                    value={reason}
                    onChange={e => setReason(e.target.value)}
                    placeholder="Reason (optional)"
                    rows={3}
                    className="w-full px-3.5 py-2.5 text-sm bg-bg border border-accent-10 rounded-xl text-heading placeholder:text-body outline-none focus:border-[var(--color-danger)] transition-all resize-none"
                />
                {error && <p className="text-[var(--color-danger)] text-xs">{error}</p>}
                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 py-2.5 rounded-xl border border-accent-10 text-heading text-sm font-semibold hover:bg-[var(--accent-opacity)] transition-colors"
                    >
                        Keep Order
                    </button>
                    <button
                        onClick={handleCancel}
                        disabled={loading}
                        className="flex-1 py-2.5 rounded-xl bg-[var(--color-danger)] text-white text-sm font-semibold hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2"
                    >
                        {loading && <Loader2 size={13} className="animate-spin" />}
                        Cancel Order
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Main Order Detail Page ───────────────────────────────────────────────────
export default function OrderDetailPage() {
    const router = useRouter();
    const { orderId } = useParams();

    const [order, setOrder] = useState(null);
    const [invoice, setInvoice] = useState(null);   // ✅ separate invoice state
    const [loading, setLoading] = useState(true);
    const [showCancel, setShowCancel] = useState(false);
    const [retrying, setRetrying] = useState(false);
    const [retryError, setRetryError] = useState(null);
    const [downloading, setDownloading] = useState(false);
    const [invoiceError, setInvoiceError] = useState(null);

    // ── Fetch order ───────────────────────────────────────────────────────
    const fetchOrder = async () => {
        try {
            const { data } = await api.get(`/api/orders/${orderId}`);
            setOrder(data.data);
        } catch (err) {
            console.error("Fetch order error:", err);
        } finally {
            setLoading(false);
        }
    };

    // ── Fetch invoice linked to this order ────────────────────────────────
    // Invoice is stored separately — we find it by order._id via the API
    const fetchInvoice = async (orderMongoId) => {
        if (!orderMongoId) return;
        try {
            // GET /api/invoices/by-order/:orderId  (MongoDB _id)
            const { data } = await api.get(`/api/invoices/by-order/${orderMongoId}`);
            setInvoice(data.data || null);
        } catch {
            // No invoice yet — that's fine, don't show error
            setInvoice(null);
        }
    };

    useEffect(() => {
        fetchOrder();
    }, [orderId]);

    // When order loads, try to fetch its invoice
    useEffect(() => {
        if (order?._id) {
            fetchInvoice(order._id);
        }
    }, [order?._id]);

    // ── Download invoice PDF ───────────────────────────────────────────────
    const handleDownloadInvoice = async () => {
        if (!invoice?.invoiceNo) {
            setInvoiceError("Invoice not available yet. Complete payment first.");
            setTimeout(() => setInvoiceError(null), 4000);
            return;
        }

        setDownloading(true);
        setInvoiceError(null);
        try {
            const response = await api.get(`/api/invoices/${invoice.invoiceNo}/download`, {
                responseType: "blob",
            });

            const url = window.URL.createObjectURL(new Blob([response.data], { type: "application/pdf" }));
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", `invoice-${invoice.invoiceNo}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error("Download failed:", err);
            setInvoiceError("Download failed. Please try again.");
            setTimeout(() => setInvoiceError(null), 4000);
        } finally {
            setDownloading(false);
        }
    };

    // ── Retry payment ──────────────────────────────────────────────────────
    const handleRetryPayment = async () => {
        setRetrying(true);
        setRetryError(null);
        try {
            const { data } = await api.post("/api/payments/retry", { orderId: order.orderId });
            if (data.data.method === "bkash") {
                window.location.href = data.data.bkashURL;
            } else if (data.data.method === "sslcommerz") {
                window.location.href = data.data.gatewayURL;
            }
        } catch (err) {
            setRetryError(err.response?.data?.message || "Payment failed. Please try again.");
            setRetrying(false);
        }
    };

    // ── Loading / not found states ─────────────────────────────────────────
    if (loading) {
        return (
            <div className="min-h-screen bg-bg flex items-center justify-center">
                <Loader2 size={28} className="animate-spin text-[var(--color-primary)]" />
            </div>
        );
    }

    if (!order) {
        return (
            <div className="min-h-screen bg-bg flex items-center justify-center">
                <p className="text-body">Order not found.</p>
            </div>
        );
    }

    // ── Derived values ─────────────────────────────────────────────────────
    const cfg = STATUS_CONFIG[order.orderStatus] || STATUS_CONFIG.pending;
    const payCfg = PAYMENT_STATUS[order.paymentStatus] || PAYMENT_STATUS.pending;
    const StatusIcon = cfg.icon;
    const canCancel = ["pending", "confirmed"].includes(order.orderStatus);
    const canRetry = order.paymentMethod !== "cod"
        && ["failed", "pending"].includes(order.paymentStatus)
        && !["cancelled", "delivered"].includes(order.orderStatus);
    const payLabel = { bkash: "bKash", sslcommerz: "SSL Commerce", cod: "Cash on Delivery" }[order.paymentMethod] || order.paymentMethod;

    return (
        <div className="min-h-screen bg-bg">
            <div className="max-w-3xl mx-auto px-4 lg:px-8 py-8 space-y-5">

                {/* ── Header ── */}
                <div className="flex flex-wrap items-center gap-3">
                    <button onClick={() => router.push("/orders")} className="text-body hover:text-heading transition-colors">
                        <ArrowLeft size={20} />
                    </button>
                    <div className="flex-1 min-w-[200px]">
                        <h1 className="text-heading font-black text-xl">{order.orderId}</h1>
                        <p className="text-body text-xs mt-0.5">
                            Placed {new Date(order.createdAt).toLocaleDateString("en-BD", {
                                day: "numeric", month: "long", year: "numeric",
                            })}
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* ── Invoice Download Button ── */}
                        <button
                            onClick={handleDownloadInvoice}
                            disabled={downloading || !invoice}
                            title={invoice ? `Download Invoice ${invoice.invoiceNo}` : "Invoice not available yet"}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-xs font-bold transition-all
                                ${invoice
                                    ? "border-[var(--color-primary)]/30 bg-card text-heading hover:bg-[var(--color-primary)]/8 hover:border-[var(--color-primary)]"
                                    : "border-accent-10 bg-card text-body opacity-50 cursor-not-allowed"
                                }`}
                        >
                            {downloading
                                ? <Loader2 size={14} className="animate-spin" />
                                : <Download size={14} className={invoice ? "text-[var(--color-primary)]" : "text-body"} />
                            }
                            {invoice ? `Invoice` : "No Invoice"}
                        </button>

                        {/* Order status badge */}
                        <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${cfg.color} ${cfg.bg}`}>
                            <StatusIcon size={12} /> {cfg.label}
                        </span>
                    </div>
                </div>

                {/* Invoice error toast */}
                {invoiceError && (
                    <div className="p-3 rounded-xl bg-[var(--color-danger)]/8 border border-[var(--color-danger)]/20 text-[var(--color-danger)] text-sm">
                        {invoiceError}
                    </div>
                )}

                {/* Invoice info banner (shows invoiceNo when available) */}
                {invoice && (
                    <div className="flex items-center justify-between p-3 rounded-xl bg-green-500/8 border border-green-500/20">
                        <div className="flex items-center gap-2 text-green-600 text-xs font-semibold">
                            <Download size={13} />
                            Invoice #{invoice.invoiceNo} available
                            {invoice.emailSentAt && (
                                <span className="text-green-500 font-normal ml-1">
                                    · Email sent {new Date(invoice.emailSentAt).toLocaleDateString("en-BD", { day: "numeric", month: "short" })}
                                </span>
                            )}
                        </div>
                        <button
                            onClick={handleDownloadInvoice}
                            disabled={downloading}
                            className="text-green-600 text-xs font-bold hover:underline"
                        >
                            {downloading ? "..." : "Download PDF"}
                        </button>
                    </div>
                )}

                {/* ── Retry Payment Banner ── */}
                {canRetry && (
                    <div className="bg-[var(--color-primary)]/8 border border-[var(--color-primary)]/25 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div className="flex items-start gap-3">
                            <div className="w-9 h-9 bg-[var(--color-primary)]/15 rounded-xl flex items-center justify-center flex-shrink-0">
                                <CreditCard size={16} className="text-[var(--color-primary)]" />
                            </div>
                            <div>
                                <p className="text-heading font-bold text-sm">Payment Incomplete</p>
                                <p className="text-body text-xs mt-0.5">
                                    Your payment is {order.paymentStatus}. Complete it to confirm your order.
                                </p>
                                {retryError && (
                                    <p className="text-[var(--color-danger)] text-xs mt-1 font-medium">{retryError}</p>
                                )}
                            </div>
                        </div>
                        <button
                            onClick={handleRetryPayment}
                            disabled={retrying}
                            className="flex-shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--color-primary)] hover:bg-[var(--color-secondary)] text-white text-sm font-bold transition-colors disabled:opacity-60 whitespace-nowrap"
                        >
                            {retrying
                                ? <><Loader2 size={14} className="animate-spin" /> Processing...</>
                                : <><RefreshCcw size={14} /> Pay Now — ৳{order.total?.toLocaleString()}</>
                            }
                        </button>
                    </div>
                )}

                {/* ── Items ── */}
                <div className="bg-card border border-accent-10 rounded-2xl overflow-hidden">
                    <div className="px-5 py-3.5 border-b border-accent-10">
                        <h2 className="text-heading font-bold text-sm flex items-center gap-2">
                            <Package size={14} className="text-[var(--color-primary)]" /> Items
                        </h2>
                    </div>
                    <div className="divide-y divide-accent-10">
                        {order.items.map((item, i) => (
                            <div key={i} className="px-5 py-4 flex items-center gap-3">
                                <div className="w-14 h-14 rounded-xl overflow-hidden bg-bg border border-accent-10 flex-shrink-0">
                                    {item.imageSnapshot
                                        ? <img src={item.imageSnapshot} alt={item.nameSnapshot} className="w-full h-full object-cover" />
                                        : <div className="w-full h-full flex items-center justify-center"><Package size={16} className="text-body opacity-30" /></div>
                                    }
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-heading font-bold text-sm line-clamp-1">{item.nameSnapshot}</p>
                                    <p className="text-body text-xs">Qty: {item.quantity} × ৳{item.finalPrice?.toLocaleString()}</p>
                                    {item.appliedPromotions?.length > 0 && (
                                        <p className="text-[var(--color-primary)] text-xs flex items-center gap-1 mt-0.5">
                                            <Zap size={10} /> Promo applied
                                        </p>
                                    )}
                                </div>
                                <p className="text-heading font-black text-sm flex-shrink-0">
                                    ৳{(item.finalPrice * item.quantity)?.toLocaleString()}
                                </p>
                            </div>
                        ))}
                    </div>

                    {/* Price breakdown */}
                    <div className="px-5 py-4 border-t border-accent-10 space-y-2 bg-[var(--accent-opacity)]/30">
                        <div className="flex justify-between text-sm">
                            <span className="text-body">Subtotal</span>
                            <span className="text-heading">৳{order.subtotal?.toLocaleString()}</span>
                        </div>
                        {order.discount > 0 && (
                            <div className="flex justify-between text-sm">
                                <span className="text-green-600 flex items-center gap-1"><Zap size={11} /> Discount</span>
                                <span className="text-green-600">-৳{order.discount?.toLocaleString()}</span>
                            </div>
                        )}
                        {order.appliedCoupon?.code && (
                            <div className="flex justify-between text-sm">
                                <span className="text-green-600 flex items-center gap-1"><Tag size={11} /> {order.appliedCoupon.code}</span>
                                <span className="text-green-600">-৳{order.appliedCoupon.discountAmount?.toLocaleString()}</span>
                            </div>
                        )}
                        <div className="flex justify-between text-sm">
                            <span className="text-body">Shipping</span>
                            <span className={order.shippingFee === 0 ? "text-green-600 font-semibold" : "text-heading"}>
                                {order.shippingFee === 0 ? "FREE" : `৳${order.shippingFee}`}
                            </span>
                        </div>
                        <div className="flex justify-between font-black text-base pt-2 border-t border-accent-10">
                            <span className="text-heading">Total</span>
                            <span className="text-[var(--color-primary)] text-lg">৳{order.total?.toLocaleString()}</span>
                        </div>
                    </div>
                </div>

                {/* ── Address + Payment ── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-card border border-accent-10 rounded-2xl p-4">
                        <h2 className="text-heading font-bold text-sm flex items-center gap-2 mb-3">
                            <MapPin size={14} className="text-[var(--color-primary)]" /> Delivery Address
                        </h2>
                        <div className="space-y-1 text-sm text-body">
                            <p className="text-heading font-semibold">{order.shippingAddress.fullName}</p>
                            <p>{order.shippingAddress.addressLine}</p>
                            <p>{order.shippingAddress.area}, {order.shippingAddress.district}</p>
                            <p>{order.shippingAddress.division}</p>
                            <p className="flex items-center gap-1 mt-1.5">
                                <Phone size={11} className="text-[var(--color-primary)]" />
                                {order.shippingAddress.phone}
                            </p>
                        </div>
                    </div>

                    <div className="bg-card border border-accent-10 rounded-2xl p-4">
                        <h2 className="text-heading font-bold text-sm flex items-center gap-2 mb-3">
                            <CreditCard size={14} className="text-[var(--color-primary)]" /> Payment
                        </h2>
                        <div className="space-y-1.5 text-sm">
                            <div className="flex justify-between">
                                <span className="text-body">Method</span>
                                <span className="text-heading font-semibold">{payLabel}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-body">Status</span>
                                <span className={`font-bold ${payCfg.color}`}>{payCfg.label}</span>
                            </div>
                            {order.transactionId && (
                                <div className="flex justify-between">
                                    <span className="text-body">Trx ID</span>
                                    <span className="text-heading font-mono text-xs truncate max-w-[120px]">
                                        {order.transactionId}
                                    </span>
                                </div>
                            )}
                            {order.paidAt && (
                                <div className="flex justify-between">
                                    <span className="text-body">Paid At</span>
                                    <span className="text-heading text-xs">
                                        {new Date(order.paidAt).toLocaleDateString("en-BD", {
                                            day: "numeric", month: "short", year: "numeric",
                                        })}
                                    </span>
                                </div>
                            )}
                        </div>

                        {order.deliveryBoy && (
                            <div className="mt-3 pt-3 border-t border-accent-10">
                                <p className="text-body text-xs font-bold uppercase tracking-wider mb-1.5">Delivery Agent</p>
                                <p className="text-heading font-semibold text-sm flex items-center gap-1.5">
                                    <User size={12} className="text-[var(--color-primary)]" />
                                    {order.deliveryBoy.name}
                                </p>
                                <p className="text-body text-xs flex items-center gap-1.5 mt-0.5">
                                    <Phone size={11} className="text-[var(--color-primary)]" />
                                    {order.deliveryBoy.phone}
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Timeline ── */}
                {order.timeline?.length > 0 && (
                    <div className="bg-card border border-accent-10 rounded-2xl p-5">
                        <h2 className="text-heading font-bold text-sm flex items-center gap-2 mb-5">
                            <Clock size={14} className="text-[var(--color-primary)]" /> Order Timeline
                        </h2>
                        <Timeline entries={[...order.timeline].reverse()} />
                    </div>
                )}

                {/* ── Cancel ── */}
                {canCancel && (
                    <div className="flex justify-end">
                        <button
                            onClick={() => setShowCancel(true)}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-[var(--color-danger)]/30 text-[var(--color-danger)] text-sm font-semibold hover:bg-[var(--color-danger)]/8 transition-colors"
                        >
                            <XCircle size={15} /> Cancel Order
                        </button>
                    </div>
                )}
            </div>

            {showCancel && (
                <CancelModal
                    orderId={order.orderId}
                    onClose={() => setShowCancel(false)}
                    onCancelled={fetchOrder}
                />
            )}
        </div>
    );
}