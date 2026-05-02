"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import api from "@/app/lib/api";
import {
    Search, Filter, ChevronDown, ChevronRight, MoreVertical,
    Truck, CheckCircle2, XCircle, Clock, Package, RefreshCw,
    User, Phone, MapPin, CreditCard, StickyNote, Loader2,
    AlertCircle, ArrowUpDown, Eye, UserCheck, Ban, X,
    BadgeCheck, Circle, Zap, ChevronLeft
} from "lucide-react";

// ══════════════════════════════════════════════════════════════
//  CONSTANTS
// ══════════════════════════════════════════════════════════════

const STATUS_CONFIG = {
    pending: { label: "Pending", color: "text-yellow-400", bg: "bg-yellow-400/10", border: "border-yellow-400/30", icon: Clock },
    confirmed: { label: "Confirmed", color: "text-blue-400", bg: "bg-blue-400/10", border: "border-blue-400/30", icon: BadgeCheck },
    processing: { label: "Processing", color: "text-purple-400", bg: "bg-purple-400/10", border: "border-purple-400/30", icon: Zap },
    shipped: { label: "Shipped", color: "text-cyan-400", bg: "bg-cyan-400/10", border: "border-cyan-400/30", icon: Truck },
    delivered: { label: "Delivered", color: "text-emerald-400", bg: "bg-emerald-400/10", border: "border-emerald-400/30", icon: CheckCircle2 },
    cancelled: { label: "Cancelled", color: "text-red-400", bg: "bg-red-400/10", border: "border-red-400/30", icon: XCircle },
};

const PAYMENT_CONFIG = {
    pending: { label: "Pending", color: "text-yellow-400", bg: "bg-yellow-400/10" },
    paid: { label: "Paid", color: "text-emerald-400", bg: "bg-emerald-400/10" },
    failed: { label: "Failed", color: "text-red-400", bg: "bg-red-400/10" },
    refunded: { label: "Refunded", color: "text-blue-400", bg: "bg-blue-400/10" },
};

const STATUS_TRANSITIONS = {
    pending: ["confirmed", "cancelled"],
    confirmed: ["processing", "cancelled"],
    processing: ["shipped", "cancelled"],
    shipped: ["delivered", "cancelled"],
    delivered: [],
    cancelled: [],
};

const fmtDate = (d) =>
    new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
const fmtTime = (d) =>
    new Date(d).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
const fmtCurrency = (n) => `৳${Number(n || 0).toLocaleString()}`;

// ══════════════════════════════════════════════════════════════
//  SMALL UI COMPONENTS
// ══════════════════════════════════════════════════════════════

function StatusBadge({ status, size = "sm" }) {
    const cfg = STATUS_CONFIG[status] || {};
    const Icon = cfg.icon || Circle;
    const pad = size === "sm" ? "px-2.5 py-1 text-[10px]" : "px-3 py-1.5 text-xs";
    return (
        <span className={`inline-flex items-center gap-1.5 font-bold rounded-full border ${cfg.bg} ${cfg.color} ${cfg.border} ${pad}`}>
            <Icon size={size === "sm" ? 10 : 12} />
            {cfg.label}
        </span>
    );
}

function PayBadge({ status }) {
    const cfg = PAYMENT_CONFIG[status] || {};
    return (
        <span className={`inline-flex items-center font-bold rounded-full px-2.5 py-1 text-[10px] ${cfg.bg} ${cfg.color}`}>
            {cfg.label}
        </span>
    );
}

function Toast({ msg, type, onClose }) {
    if (!msg) return null;
    return (
        <div className={`fixed bottom-6 right-6 z-[999] flex items-center gap-2.5 px-5 py-3 rounded-2xl shadow-xl text-sm font-semibold border animate-in slide-in-from-bottom-2
            ${type === "error" ? "bg-card border-red-500/30 text-red-400" : "bg-card border-emerald-500/30 text-emerald-400"}`}>
            {type === "error" ? <AlertCircle size={15} /> : <CheckCircle2 size={15} />}
            {msg}
            <button onClick={onClose} className="ml-2 opacity-60 hover:opacity-100"><X size={13} /></button>
        </div>
    );
}

// ══════════════════════════════════════════════════════════════
//  ASSIGN DELIVERY BOY MODAL
// ══════════════════════════════════════════════════════════════

function AssignModal({ order, onClose, onAssigned, showToast }) {
    const [boys, setBoys] = useState([]);
    const [loading, setLoading] = useState(true);
    const [assigning, setAssigning] = useState(null);

    useEffect(() => {
        api.get("/api/deliveryboys/admin/delivery-boys?isActive=true&isAvailable=true")
            .then(({ data }) => setBoys(data.data || []))
            .catch(() => showToast("Failed to load delivery boys", "error"))
            .finally(() => setLoading(false));
    }, []);

    const handleAssign = async (boyId, boyName) => {
        setAssigning(boyId);
        try {
            await api.patch(`/api/orders/admin/${order.orderId}/assign`, { deliveryBoyId: boyId });
            showToast(`Order assigned to ${boyName} ✅`);
            onAssigned();
            onClose();
        } catch (err) {
            showToast(err.response?.data?.message || "Assignment failed", "error");
        } finally {
            setAssigning(null);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)" }}>
            <div className="bg-card border border-accent-10 rounded-2xl w-full max-w-md shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-accent-10">
                    <div>
                        <h2 className="text-heading font-black text-base">Assign Delivery Boy</h2>
                        <p className="text-body text-xs mt-0.5">Order: {order.orderId}</p>
                    </div>
                    <button onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-accent-10 transition-colors text-body">
                        <X size={16} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-4 max-h-[60vh] overflow-y-auto">
                    {loading ? (
                        <div className="flex items-center justify-center py-10">
                            <Loader2 size={24} className="animate-spin text-[var(--color-primary)]" />
                        </div>
                    ) : boys.length === 0 ? (
                        <div className="text-center py-10">
                            <Truck size={32} className="text-body mx-auto mb-3" />
                            <p className="text-heading font-bold text-sm mb-1">No available delivery boys</p>
                            <p className="text-body text-xs">All partners are currently offline or busy</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {boys.map(boy => (
                                <div key={boy._id}
                                    className="flex items-center gap-3 p-3 bg-bg rounded-xl border border-accent-10 hover:border-[var(--color-primary)]/30 transition-all">
                                    {/* Avatar */}
                                    <div className="w-10 h-10 bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-secondary)] rounded-xl flex items-center justify-center text-white font-black text-sm flex-shrink-0 uppercase">
                                        {boy.name?.[0] || "D"}
                                    </div>
                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-heading font-bold text-sm truncate">{boy.name}</p>
                                        <div className="flex items-center gap-2 flex-wrap mt-0.5">
                                            {boy.phone && (
                                                <span className="text-body text-xs flex items-center gap-1">
                                                    <Phone size={9} /> {boy.phone}
                                                </span>
                                            )}
                                            {boy.currentOrders > 0 && (
                                                <span className="text-yellow-400 text-[10px] font-bold">
                                                    {boy.currentOrders} active
                                                </span>
                                            )}
                                            {boy.zones?.length > 0 && (
                                                <span className="text-body text-[10px] truncate max-w-[100px]">
                                                    {boy.zones.slice(0, 2).join(", ")}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    {/* Rating + Assign */}
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        <span className="text-yellow-400 text-xs font-bold">
                                            ★{(boy.rating || 5).toFixed(1)}
                                        </span>
                                        <button
                                            onClick={() => handleAssign(boy._id, boy.name)}
                                            disabled={assigning === boy._id}
                                            className="px-3 py-1.5 bg-[var(--color-primary)] hover:bg-[var(--color-secondary)] text-white text-xs font-bold rounded-lg transition-colors disabled:opacity-60 flex items-center gap-1">
                                            {assigning === boy._id
                                                ? <Loader2 size={11} className="animate-spin" />
                                                : <UserCheck size={11} />}
                                            Assign
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// ══════════════════════════════════════════════════════════════
//  ORDER DETAIL DRAWER
// ══════════════════════════════════════════════════════════════

function OrderDrawer({ order, onClose, onUpdated, showToast }) {
    const [updatingStatus, setUpdatingStatus] = useState(false);
    const [adminNote, setAdminNote] = useState(order.adminNote || "");
    const [savingNote, setSavingNote] = useState(false);
    const [showAssign, setShowAssign] = useState(false);

    const transitions = STATUS_TRANSITIONS[order.orderStatus] || [];

    const handleStatusChange = async (newStatus) => {
        setUpdatingStatus(true);
        try {
            await api.patch(`/api/orders/admin/${order.orderId}/status`, {
                status: newStatus,
                adminNote: adminNote || undefined,
            });
            showToast(`Status updated to "${STATUS_CONFIG[newStatus]?.label}" ✅`);
            onUpdated();
            onClose();
        } catch (err) {
            showToast(err.response?.data?.message || "Update failed", "error");
        } finally {
            setUpdatingStatus(false);
        }
    };

    const handleSaveNote = async () => {
        setSavingNote(true);
        try {
            await api.patch(`/api/orders/admin/${order.orderId}/status`, {
                status: order.orderStatus,
                adminNote,
            });
            showToast("Note saved ✅");
        } catch {
            showToast("Failed to save note", "error");
        } finally {
            setSavingNote(false);
        }
    };

    const addr = order.shippingAddress;

    return (
        <>
            {/* Backdrop */}
            <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={onClose} />

            {/* Drawer */}
            <div className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-lg bg-card border-l border-accent-10 shadow-2xl flex flex-col overflow-hidden">

                {/* Drawer Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-accent-10 flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <button onClick={onClose}
                            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-accent-10 transition-colors text-body">
                            <X size={16} />
                        </button>
                        <div>
                            <h2 className="text-heading font-black text-base">{order.orderId}</h2>
                            <p className="text-body text-xs">{fmtDate(order.createdAt)} · {fmtTime(order.createdAt)}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <StatusBadge status={order.orderStatus} size="md" />
                        <PayBadge status={order.paymentStatus} />
                    </div>
                </div>

                {/* Drawer Body — scrollable */}
                <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

                    {/* Customer */}
                    <section>
                        <p className="text-body text-[10px] font-semibold uppercase tracking-widest mb-3">Customer</p>
                        <div className="bg-bg rounded-xl p-4 space-y-2">
                            <div className="flex items-center gap-2">
                                <User size={13} className="text-[var(--color-primary)]" />
                                <p className="text-heading font-bold text-sm">{addr?.fullName || "—"}</p>
                            </div>
                            {addr?.phone && (
                                <div className="flex items-center gap-2">
                                    <Phone size={13} className="text-[var(--color-primary)]" />
                                    <a href={`tel:${addr.phone}`} className="text-body text-sm hover:text-[var(--color-primary)] transition-colors">
                                        {addr.phone}
                                    </a>
                                </div>
                            )}
                            <div className="flex items-start gap-2">
                                <MapPin size={13} className="text-[var(--color-primary)] flex-shrink-0 mt-0.5" />
                                <p className="text-body text-sm leading-relaxed">
                                    {[addr?.addressLine, addr?.area, addr?.district, addr?.division, addr?.postalCode]
                                        .filter(Boolean).join(", ")}
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* Items */}
                    <section>
                        <p className="text-body text-[10px] font-semibold uppercase tracking-widest mb-3">
                            Items ({order.items?.length || 0})
                        </p>
                        <div className="bg-bg rounded-xl overflow-hidden">
                            {order.items?.map((item, i) => (
                                <div key={i}
                                    className={`flex items-center gap-3 px-4 py-3 ${i < order.items.length - 1 ? "border-b border-accent-10" : ""}`}>
                                    {item.imageSnapshot ? (
                                        <img src={item.imageSnapshot} alt={item.nameSnapshot}
                                            className="w-10 h-10 rounded-lg object-cover flex-shrink-0 bg-accent-10" />
                                    ) : (
                                        <div className="w-10 h-10 rounded-lg bg-accent-10 flex items-center justify-center flex-shrink-0">
                                            <Package size={14} className="text-body" />
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-heading font-semibold text-sm truncate">{item.nameSnapshot}</p>
                                        <p className="text-body text-xs">×{item.quantity} · {fmtCurrency(item.finalPrice)} each</p>
                                    </div>
                                    <p className="text-heading font-bold text-sm flex-shrink-0">
                                        {fmtCurrency(item.finalPrice * item.quantity)}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Financials */}
                    <section>
                        <p className="text-body text-[10px] font-semibold uppercase tracking-widest mb-3">Payment Summary</p>
                        <div className="bg-bg rounded-xl p-4 space-y-2">
                            {[
                                { label: "Subtotal", value: fmtCurrency(order.subtotal) },
                                ...(order.discount > 0 ? [{ label: "Discount", value: `-${fmtCurrency(order.discount)}`, color: "text-emerald-400" }] : []),
                                { label: "Shipping", value: order.shippingFee === 0 ? "Free" : fmtCurrency(order.shippingFee) },
                            ].map(({ label, value, color }) => (
                                <div key={label} className="flex justify-between text-sm">
                                    <span className="text-body">{label}</span>
                                    <span className={`font-semibold ${color || "text-heading"}`}>{value}</span>
                                </div>
                            ))}
                            <div className="border-t border-accent-10 pt-2 flex justify-between">
                                <span className="text-heading font-bold">Total</span>
                                <span className="text-[var(--color-primary)] font-black text-base">{fmtCurrency(order.total)}</span>
                            </div>
                            <div className="flex justify-between text-sm pt-1">
                                <span className="text-body">Payment Method</span>
                                <span className="text-heading font-bold uppercase">{order.paymentMethod}</span>
                            </div>
                            {order.transactionId && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-body">Transaction ID</span>
                                    <span className="text-body font-mono text-xs">{order.transactionId}</span>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Delivery Boy */}
                    {order.deliveryBoy && (
                        <section>
                            <p className="text-body text-[10px] font-semibold uppercase tracking-widest mb-3">Assigned Delivery</p>
                            <div className="bg-bg rounded-xl p-4 flex items-center gap-3">
                                <div className="w-10 h-10 bg-cyan-400/10 rounded-xl flex items-center justify-center">
                                    <Truck size={18} className="text-cyan-400" />
                                </div>
                                <div>
                                    <p className="text-heading font-bold text-sm">{order.deliveryBoy?.name || "Delivery Partner"}</p>
                                    {order.deliveryBoy?.phone && (
                                        <p className="text-body text-xs">{order.deliveryBoy.phone}</p>
                                    )}
                                </div>
                            </div>
                        </section>
                    )}

                    {/* Timeline */}
                    {order.timeline?.length > 0 && (
                        <section>
                            <p className="text-body text-[10px] font-semibold uppercase tracking-widest mb-3">Timeline</p>
                            <div className="space-y-0">
                                {[...order.timeline].reverse().map((entry, i) => {
                                    const cfg = STATUS_CONFIG[entry.status] || {};
                                    const Icon = cfg.icon || Circle;
                                    return (
                                        <div key={i} className="flex gap-3">
                                            <div className="flex flex-col items-center">
                                                <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${cfg.bg || "bg-accent-10"}`}>
                                                    <Icon size={12} className={cfg.color || "text-body"} />
                                                </div>
                                                {i < order.timeline.length - 1 && (
                                                    <div className="w-px flex-1 bg-accent-10 my-1" />
                                                )}
                                            </div>
                                            <div className="pb-4 min-w-0">
                                                <p className="text-heading font-bold text-sm capitalize">{entry.status}</p>
                                                <p className="text-body text-xs">{entry.message}</p>
                                                <p className="text-body text-[10px] mt-0.5">{fmtDate(entry.changedAt)} · {fmtTime(entry.changedAt)}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </section>
                    )}

                    {/* Customer Note */}
                    {order.customerNote && (
                        <section>
                            <p className="text-body text-[10px] font-semibold uppercase tracking-widest mb-2">Customer Note</p>
                            <div className="bg-yellow-400/5 border border-yellow-400/20 rounded-xl p-3">
                                <p className="text-heading text-sm">{order.customerNote}</p>
                            </div>
                        </section>
                    )}

                    {/* Admin Note */}
                    <section>
                        <p className="text-body text-[10px] font-semibold uppercase tracking-widest mb-2">Admin Note</p>
                        <textarea
                            value={adminNote}
                            onChange={e => setAdminNote(e.target.value)}
                            placeholder="Internal note for this order..."
                            rows={3}
                            className="w-full px-3 py-2.5 bg-bg border border-accent-10 rounded-xl text-heading text-sm outline-none focus:border-[var(--color-primary)] transition-all resize-none"
                        />
                        <button
                            onClick={handleSaveNote}
                            disabled={savingNote}
                            className="mt-2 px-4 py-2 bg-accent-10 hover:bg-accent-20 text-heading text-xs font-bold rounded-lg transition-colors disabled:opacity-60 flex items-center gap-1.5">
                            {savingNote ? <Loader2 size={11} className="animate-spin" /> : <StickyNote size={11} />}
                            Save Note
                        </button>
                    </section>
                </div>

                {/* Drawer Footer — Actions */}
                <div className="flex-shrink-0 border-t border-accent-10 px-6 py-4 space-y-3 bg-card">
                    {/* Status Transitions */}
                    {transitions.length > 0 && (
                        <div>
                            <p className="text-body text-[10px] font-semibold uppercase tracking-widest mb-2">Update Status</p>
                            <div className="flex gap-2 flex-wrap">
                                {transitions.map(newStatus => {
                                    const cfg = STATUS_CONFIG[newStatus];
                                    const Icon = cfg.icon;
                                    const isDanger = newStatus === "cancelled";
                                    return (
                                        <button
                                            key={newStatus}
                                            onClick={() => handleStatusChange(newStatus)}
                                            disabled={updatingStatus}
                                            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold transition-all disabled:opacity-60
                                                ${isDanger
                                                    ? "bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20"
                                                    : "bg-[var(--color-primary)] hover:bg-[var(--color-secondary)] text-white"}`}
                                        >
                                            {updatingStatus
                                                ? <Loader2 size={13} className="animate-spin" />
                                                : <Icon size={13} />}
                                            → {cfg.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Assign Delivery Boy */}
                    {["confirmed", "processing"].includes(order.orderStatus) && !order.deliveryBoy && (
                        <button
                            onClick={() => setShowAssign(true)}
                            className="w-full py-2.5 border border-cyan-500/30 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 font-bold rounded-xl text-sm transition-colors flex items-center justify-center gap-2">
                            <Truck size={14} />
                            Assign Delivery Boy
                        </button>
                    )}

                    {/* Re-assign if already shipped */}
                    {order.orderStatus === "shipped" && (
                        <button
                            onClick={() => setShowAssign(true)}
                            className="w-full py-2.5 border border-cyan-500/30 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 font-bold rounded-xl text-sm transition-colors flex items-center justify-center gap-2">
                            <Truck size={14} />
                            Re-assign Delivery Boy
                        </button>
                    )}
                </div>
            </div>

            {/* Assign Modal (on top of drawer) */}
            {showAssign && (
                <AssignModal
                    order={order}
                    onClose={() => setShowAssign(false)}
                    onAssigned={onUpdated}
                    showToast={showToast}
                />
            )}
        </>
    );
}

// ══════════════════════════════════════════════════════════════
//  ORDER ROW
// ══════════════════════════════════════════════════════════════

function OrderRow({ order, onSelect }) {
    const addr = order.shippingAddress;
    return (
        <tr
            onClick={() => onSelect(order)}
            className="border-b border-accent-10 hover:bg-accent-10/50 transition-colors cursor-pointer group"
        >
            <td className="px-4 py-3">
                <p className="text-heading font-bold text-sm">{order.orderId}</p>
                <p className="text-body text-xs">{fmtDate(order.createdAt)}</p>
            </td>
            <td className="px-4 py-3">
                <p className="text-heading font-semibold text-sm">{addr?.fullName || "—"}</p>
                <p className="text-body text-xs">{addr?.phone || "—"}</p>
            </td>
            <td className="px-4 py-3">
                <p className="text-heading font-bold">{fmtCurrency(order.total)}</p>
                <p className="text-body text-xs">{order.items?.length || 0} items</p>
            </td>
            <td className="px-4 py-3">
                <StatusBadge status={order.orderStatus} />
            </td>
            <td className="px-4 py-3">
                <PayBadge status={order.paymentStatus} />
                <p className="text-body text-[10px] mt-1 uppercase">{order.paymentMethod}</p>
            </td>
            <td className="px-4 py-3">
                {order.deliveryBoy
                    ? <p className="text-cyan-400 text-xs font-semibold">{order.deliveryBoy?.name || "Assigned"}</p>
                    : <p className="text-body text-xs">—</p>}
            </td>
            <td className="px-4 py-3 text-right">
                <button
                    onClick={(e) => { e.stopPropagation(); onSelect(order); }}
                    className="w-8 h-8 inline-flex items-center justify-center rounded-lg hover:bg-accent-10 transition-colors text-body group-hover:text-[var(--color-primary)]">
                    <ChevronRight size={15} />
                </button>
            </td>
        </tr>
    );
}

// ══════════════════════════════════════════════════════════════
//  MAIN PAGE
// ══════════════════════════════════════════════════════════════

export default function AdminOrdersPage() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [toast, setToast] = useState({ msg: "", type: "success" });

    // Filters
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [payFilter, setPayFilter] = useState("");
    const [sort, setSort] = useState("-createdAt");

    // Pagination
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const LIMIT = 15;

    const showToast = useCallback((msg, type = "success") => {
        setToast({ msg, type });
        setTimeout(() => setToast({ msg: "", type: "success" }), 4000);
    }, []);

    const fetchOrders = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page,
                limit: LIMIT,
                sort,
                ...(search && { search }),
                ...(statusFilter && { status: statusFilter }),
                ...(payFilter && { paymentStatus: payFilter }),
            });
            const { data } = await api.get(`/api/orders/admin/all?${params}`);
            setOrders(data.data || []);
            setTotalPages(data.pagination?.totalPages || 1);
            setTotal(data.pagination?.total || 0);
        } catch {
            showToast("Failed to load orders", "error");
        } finally {
            setLoading(false);
        }
    }, [page, sort, search, statusFilter, payFilter, showToast]);

    useEffect(() => {
        const t = setTimeout(fetchOrders, search ? 400 : 0);
        return () => clearTimeout(t);
    }, [fetchOrders]);

    // Reset page on filter change
    useEffect(() => { setPage(1); }, [search, statusFilter, payFilter]);

    // Stats from current data (quick count)
    const stats = {
        total,
        pending: orders.filter(o => o.orderStatus === "pending").length,
        shipped: orders.filter(o => o.orderStatus === "shipped").length,
        delivered: orders.filter(o => o.orderStatus === "delivered").length,
    };

    return (
        <div className="min-h-screen bg-bg">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">

                {/* ── Page Header ──────────────────────────────────────── */}
                <div className="flex items-start justify-between mb-6">
                    <div>
                        <h1 className="text-heading font-black text-2xl mb-1">Order Management</h1>
                        <p className="text-body text-sm">
                            {total.toLocaleString()} total orders
                        </p>
                    </div>
                    <button onClick={fetchOrders}
                        className="flex items-center gap-2 px-4 py-2 bg-card border border-accent-10 rounded-xl text-heading text-sm font-semibold hover:border-[var(--color-primary)]/40 transition-colors">
                        <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
                        Refresh
                    </button>
                </div>

                {/* ── Quick Stats ───────────────────────────────────────── */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                    {[
                        { label: "Total Orders", value: total, color: "text-[var(--color-primary)]", bg: "bg-[var(--color-primary)]/10" },
                        { label: "Pending", value: stats.pending, color: "text-yellow-400", bg: "bg-yellow-400/10" },
                        { label: "Shipped", value: stats.shipped, color: "text-cyan-400", bg: "bg-cyan-400/10" },
                        { label: "Delivered", value: stats.delivered, color: "text-emerald-400", bg: "bg-emerald-400/10" },
                    ].map(({ label, value, color, bg }) => (
                        <div key={label} className="bg-card border border-accent-10 rounded-2xl p-4 flex items-center gap-3">
                            <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center`}>
                                <Package size={18} className={color} />
                            </div>
                            <div>
                                <p className="text-heading font-black text-xl leading-tight">{value}</p>
                                <p className="text-body text-xs">{label}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* ── Filters ───────────────────────────────────────────── */}
                <div className="bg-card border border-accent-10 rounded-2xl p-4 mb-4">
                    <div className="flex flex-wrap gap-3">
                        {/* Search */}
                        <div className="relative flex-1 min-w-[200px]">
                            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-body" />
                            <input
                                type="text"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Search order ID, name, phone..."
                                className="w-full pl-9 pr-4 py-2.5 bg-bg border border-accent-10 rounded-xl text-heading text-sm outline-none focus:border-[var(--color-primary)] transition-all"
                            />
                        </div>

                        {/* Status */}
                        <select
                            value={statusFilter}
                            onChange={e => setStatusFilter(e.target.value)}
                            className="px-3 py-2.5 bg-bg border border-accent-10 rounded-xl text-heading text-sm outline-none focus:border-[var(--color-primary)] transition-all cursor-pointer min-w-[140px]">
                            <option value="">All Status</option>
                            {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                                <option key={k} value={k}>{v.label}</option>
                            ))}
                        </select>

                        {/* Payment */}
                        <select
                            value={payFilter}
                            onChange={e => setPayFilter(e.target.value)}
                            className="px-3 py-2.5 bg-bg border border-accent-10 rounded-xl text-heading text-sm outline-none focus:border-[var(--color-primary)] transition-all cursor-pointer min-w-[140px]">
                            <option value="">All Payments</option>
                            {Object.entries(PAYMENT_CONFIG).map(([k, v]) => (
                                <option key={k} value={k}>{v.label}</option>
                            ))}
                        </select>

                        {/* Sort */}
                        <select
                            value={sort}
                            onChange={e => setSort(e.target.value)}
                            className="px-3 py-2.5 bg-bg border border-accent-10 rounded-xl text-heading text-sm outline-none focus:border-[var(--color-primary)] transition-all cursor-pointer min-w-[160px]">
                            <option value="-createdAt">Newest First</option>
                            <option value="createdAt">Oldest First</option>
                            <option value="-total">Highest Amount</option>
                            <option value="total">Lowest Amount</option>
                        </select>
                    </div>
                </div>

                {/* ── Table ─────────────────────────────────────────────── */}
                <div className="bg-card border border-accent-10 rounded-2xl overflow-hidden">
                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <Loader2 size={28} className="animate-spin text-[var(--color-primary)]" />
                        </div>
                    ) : orders.length === 0 ? (
                        <div className="text-center py-20">
                            <Package size={36} className="text-body mx-auto mb-4" />
                            <p className="text-heading font-bold text-lg mb-1">No orders found</p>
                            <p className="text-body text-sm">Try adjusting your filters</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[700px]">
                                <thead>
                                    <tr className="bg-bg border-b border-accent-10">
                                        {["Order", "Customer", "Amount", "Status", "Payment", "Delivery", ""].map(h => (
                                            <th key={h}
                                                className="px-4 py-3 text-left text-body text-[10px] font-semibold uppercase tracking-widest">
                                                {h}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {orders.map(order => (
                                        <OrderRow
                                            key={order._id}
                                            order={order}
                                            onSelect={setSelectedOrder}
                                        />
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Pagination */}
                    {!loading && totalPages > 1 && (
                        <div className="flex items-center justify-between px-6 py-4 border-t border-accent-10">
                            <p className="text-body text-sm">
                                Page <span className="text-heading font-bold">{page}</span> of{" "}
                                <span className="text-heading font-bold">{totalPages}</span>
                            </p>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    className="w-9 h-9 flex items-center justify-center rounded-xl bg-bg border border-accent-10 hover:border-[var(--color-primary)]/30 transition-colors text-body disabled:opacity-40">
                                    <ChevronLeft size={15} />
                                </button>
                                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                    const p = page <= 3 ? i + 1 : page - 2 + i;
                                    if (p < 1 || p > totalPages) return null;
                                    return (
                                        <button key={p}
                                            onClick={() => setPage(p)}
                                            className={`w-9 h-9 flex items-center justify-center rounded-xl text-sm font-bold transition-colors
                                                ${p === page
                                                    ? "bg-[var(--color-primary)] text-white"
                                                    : "bg-bg border border-accent-10 text-body hover:border-[var(--color-primary)]/30"}`}>
                                            {p}
                                        </button>
                                    );
                                })}
                                <button
                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                    disabled={page === totalPages}
                                    className="w-9 h-9 flex items-center justify-center rounded-xl bg-bg border border-accent-10 hover:border-[var(--color-primary)]/30 transition-colors text-body disabled:opacity-40">
                                    <ChevronRight size={15} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Order Detail Drawer */}
            {selectedOrder && (
                <OrderDrawer
                    order={selectedOrder}
                    onClose={() => setSelectedOrder(null)}
                    onUpdated={() => {
                        fetchOrders();
                        setSelectedOrder(null);
                    }}
                    showToast={showToast}
                />
            )}

            <Toast msg={toast.msg} type={toast.type} onClose={() => setToast({ msg: "", type: "success" })} />
        </div>
    );
}