"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { io as socketIO } from "socket.io-client";
import api from "@/app/lib/api";
import {
    Loader2, Package, CheckCircle2, MapPin, Phone, Star,
    ToggleLeft, ToggleRight, Navigation, AlertCircle,
    Truck, ChevronRight, RefreshCw, Check, X, Clock,
    Wifi, WifiOff,
} from "lucide-react";
import Loading from "@/app/components/global/Loading";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtDate = (d) =>
    new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

const fmtTime = (d) =>
    new Date(d).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ msg, type }) {
    if (!msg) return null;
    return (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-5 py-3 rounded-2xl shadow-xl text-sm font-semibold border
            ${type === "error"
                ? "bg-card border-red-500/30 text-red-400"
                : "bg-card border-accent-10 text-heading"}`}>
            {type === "error"
                ? <AlertCircle size={14} className="text-red-400" />
                : <CheckCircle2 size={14} className="text-emerald-400" />}
            {msg}
        </div>
    );
}

// ─── Assignment Card — shown when deliveryAssignStatus === "assigned" ─────────
function AssignmentCard({ order, onAccept, onReject }) {
    const [loading, setLoading] = useState(null); // "accept" | "reject"
    const addr = order.shippingAddress;

    const handleRespond = async (action) => {
        setLoading(action);
        try {
            await onAccept(order.orderId, action);
        } finally {
            setLoading(null);
        }
    };

    return (
        <div className="bg-card border-2 border-yellow-400/40 rounded-2xl overflow-hidden animate-pulse-once">
            {/* Banner */}
            <div className="bg-yellow-400/10 px-5 py-3 flex items-center gap-2 border-b border-yellow-400/20">
                <Clock size={14} className="text-yellow-400" />
                <p className="text-yellow-400 font-bold text-sm">New delivery request — respond quickly!</p>
            </div>

            <div className="px-5 py-4 space-y-3">
                {/* Order ID + Amount */}
                <div className="flex items-center justify-between">
                    <p className="text-heading font-black text-base">{order.orderId}</p>
                    <p className="text-[var(--color-primary)] font-black text-lg">
                        ৳{Number(order.total).toFixed(0)}
                    </p>
                </div>

                {/* Address */}
                <div className="bg-bg rounded-xl p-3 space-y-1.5">
                    <p className="text-heading font-bold text-sm">{addr?.fullName}</p>
                    <div className="flex items-start gap-1.5">
                        <MapPin size={11} className="text-[var(--color-primary)] flex-shrink-0 mt-0.5" />
                        <p className="text-body text-xs leading-relaxed">
                            {[addr?.addressLine, addr?.area, addr?.district, addr?.division]
                                .filter(Boolean).join(", ")}
                        </p>
                    </div>
                    {addr?.phone && (
                        <a
                            href={`tel:${addr.phone}`}
                            className="flex items-center gap-1.5 text-xs text-[var(--color-primary)] hover:underline"
                        >
                            <Phone size={11} /> {addr.phone}
                        </a>
                    )}
                </div>

                {/* Items count */}
                <p className="text-body text-xs">{order.items?.length || 0} item(s) · {order.paymentMethod?.toUpperCase()}</p>

                {/* Action buttons */}
                <div className="flex gap-3 pt-1">
                    <button
                        onClick={() => handleRespond("reject")}
                        disabled={!!loading}
                        className="flex-1 py-2.5 border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold rounded-xl text-sm transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                    >
                        {loading === "reject"
                            ? <Loader2 size={13} className="animate-spin" />
                            : <X size={13} />}
                        Reject
                    </button>
                    <button
                        onClick={() => handleRespond("accept")}
                        disabled={!!loading}
                        className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl text-sm transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                    >
                        {loading === "accept"
                            ? <Loader2 size={13} className="animate-spin" />
                            : <Check size={13} />}
                        Accept
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Active Order Card ─────────────────────────────────────────────────────────
function ActiveOrderCard({ order, onDelivered, onLocationSend, socketConnected }) {
    const [delivering, setDelivering] = useState(false);
    const [expanded, setExpanded] = useState(false);
    const [sendingLoc, setSendingLoc] = useState(false);
    const addr = order.shippingAddress;

    const handleDeliver = async () => {
        if (!confirm(`Confirm delivery of ${order.orderId}?`)) return;
        setDelivering(true);
        try {
            await api.patch(`/api/deliveryboys/orders/${order.orderId}/delivered`);
            onDelivered(order.orderId);
        } catch (err) {
            alert(err.response?.data?.message || "Failed to update");
        } finally {
            setDelivering(false);
        }
    };

    const handleShareLocation = () => {
        if (!navigator.geolocation) return;
        setSendingLoc(true);
        navigator.geolocation.getCurrentPosition(
            ({ coords }) => {
                onLocationSend(order.orderId, coords.latitude, coords.longitude);
                setSendingLoc(false);
            },
            () => setSendingLoc(false),
            { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
        );
    };

    return (
        <div className="bg-card border border-accent-10 rounded-2xl overflow-hidden hover:shadow-md transition-all">
            {/* Header */}
            <div
                className="flex items-center justify-between px-5 py-4 cursor-pointer select-none"
                onClick={() => setExpanded(v => !v)}
            >
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-yellow-400/10 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Truck size={18} className="text-yellow-400" />
                    </div>
                    <div>
                        <p className="text-heading font-bold text-sm">{order.orderId}</p>
                        <p className="text-body text-xs">{fmtDate(order.createdAt)}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <p className="text-[var(--color-primary)] font-black">৳{Number(order.total).toFixed(0)}</p>
                    <ChevronRight
                        size={14}
                        className={`text-body transition-transform duration-200 ${expanded ? "rotate-90" : ""}`}
                    />
                </div>
            </div>

            {expanded && (
                <div className="border-t border-accent-10 px-5 pb-5 pt-4 space-y-4">
                    {/* Items */}
                    <div>
                        <p className="text-body text-[10px] font-semibold uppercase tracking-widest mb-2">Items</p>
                        <div className="bg-bg rounded-xl p-3 space-y-1.5">
                            {order.items?.map((item, i) => (
                                <div key={i} className="flex items-center justify-between">
                                    <p className="text-heading text-xs font-medium truncate max-w-[210px]">
                                        {item.nameSnapshot}
                                    </p>
                                    <span className="text-body text-xs flex-shrink-0 ml-2">×{item.quantity}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Address */}
                    <div>
                        <p className="text-body text-[10px] font-semibold uppercase tracking-widest mb-2">Deliver to</p>
                        <div className="bg-bg rounded-xl p-3 space-y-2">
                            <p className="text-heading text-sm font-bold">{addr?.fullName}</p>
                            <div className="flex items-start gap-1.5">
                                <MapPin size={12} className="text-[var(--color-primary)] flex-shrink-0 mt-0.5" />
                                <p className="text-body text-xs leading-relaxed">
                                    {[addr?.addressLine, addr?.area, addr?.district, addr?.division]
                                        .filter(Boolean).join(", ")}
                                </p>
                            </div>
                            {addr?.phone && (
                                <a
                                    href={`tel:${addr.phone}`}
                                    className="flex items-center gap-1.5 text-xs text-[var(--color-primary)] hover:underline"
                                    onClick={e => e.stopPropagation()}
                                >
                                    <Phone size={11} /> {addr.phone}
                                </a>
                            )}
                        </div>
                    </div>

                    {/* Payment badges */}
                    <div className="flex gap-2 flex-wrap">
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full
                            ${order.paymentMethod === "cod"
                                ? "bg-yellow-400/10 text-yellow-400"
                                : "bg-emerald-400/10 text-emerald-400"}`}>
                            {order.paymentMethod?.toUpperCase()}
                        </span>
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full
                            ${order.paymentStatus === "paid"
                                ? "bg-emerald-400/10 text-emerald-400"
                                : "bg-red-400/10 text-red-400"}`}>
                            {order.paymentStatus === "paid" ? "Paid" : "Unpaid"}
                        </span>
                    </div>

                    {/* Share Location */}
                    <button
                        onClick={handleShareLocation}
                        disabled={sendingLoc || !socketConnected}
                        className="w-full py-2.5 border border-blue-500/20 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 font-bold rounded-xl text-sm transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                    >
                        {sendingLoc
                            ? <><Loader2 size={13} className="animate-spin" /> Sending...</>
                            : <><Navigation size={13} /> Share My Location</>}
                    </button>

                    {/* Mark Delivered */}
                    <button
                        onClick={handleDeliver}
                        disabled={delivering}
                        className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 active:scale-[0.99] text-white font-bold rounded-xl text-sm transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                    >
                        {delivering
                            ? <><Loader2 size={14} className="animate-spin" /> Updating...</>
                            : <><CheckCircle2 size={14} /> Mark as Delivered</>}
                    </button>
                </div>
            )}
        </div>
    );
}

// ─── Completed Order Row ──────────────────────────────────────────────────────
function CompletedRow({ order }) {
    const addr = order.shippingAddress;
    return (
        <div className="bg-card border border-accent-10 rounded-xl px-4 py-3 flex items-center gap-3 hover:shadow-sm transition-all">
            <div className="w-9 h-9 bg-emerald-400/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <CheckCircle2 size={16} className="text-emerald-400" />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-heading font-bold text-sm">{order.orderId}</p>
                <p className="text-body text-xs truncate">
                    {addr?.fullName} · {addr?.district}
                </p>
            </div>
            <div className="text-right flex-shrink-0">
                <p className="text-heading font-bold text-sm">৳{Number(order.total).toFixed(0)}</p>
                <p className="text-body text-xs">{fmtDate(order.updatedAt || order.createdAt)}</p>
            </div>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function DeliveryDashboardPage() {
    const [profile, setProfile] = useState(null);
    const [orders, setOrders] = useState({ pending: [], completed: [], total: 0 });
    const [assignedOrders, setAssignedOrders] = useState([]); // waiting for accept/reject
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState("pending");
    const [togglingAvail, setTogglingAvail] = useState(false);
    const [socketConnected, setSocketConnected] = useState(false);
    const [toast, setToast] = useState({ msg: "", type: "success" });

    const socketRef = useRef(null);

    const showToast = useCallback((msg, type = "success") => {
        setToast({ msg, type });
        setTimeout(() => setToast({ msg: "", type: "success" }), 3500);
    }, []);

    const fetchAll = useCallback(async () => {
        try {
            const [profileRes, ordersRes] = await Promise.all([
                api.get("/api/deliveryboys/profile"),
                api.get("/api/deliveryboys/orders"),
            ]);
            setProfile(profileRes.data.data);
            const data = ordersRes.data.data;
            setOrders(data);

            // Separate "assigned but not accepted" orders
            const assigned = (data.pending || []).filter(
                o => o.deliveryAssignStatus === "assigned"
            );
            setAssignedOrders(assigned);
        } catch {
            showToast("Failed to load data", "error");
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    // ── Socket.IO connection ───────────────────────────────────────────────
    useEffect(() => {
        if (!profile) return;

        const socket = socketIO(process.env.NEXT_PUBLIC_SOCKET_URL || "", {
            withCredentials: true,
            transports: ["websocket"],
        });

        socketRef.current = socket;

        socket.on("connect", () => {
            setSocketConnected(true);
            socket.emit("join:delivery", profile.deliveryBoyId || profile._id);
        });

        socket.on("disconnect", () => setSocketConnected(false));

        // Admin assigned a new order
        socket.on("delivery:assigned", (data) => {
            showToast(`New order assigned: ${data.orderId} 📦`);
            fetchAll();
        });

        return () => {
            socket.disconnect();
        };
    }, [profile, fetchAll, showToast]);

    // ── Auto-refresh every 60s ─────────────────────────────────────────────
    useEffect(() => {
        const t = setInterval(fetchAll, 60_000);
        return () => clearInterval(t);
    }, [fetchAll]);

    // ── Send location via socket ───────────────────────────────────────────
    const handleLocationSend = useCallback((orderId, lat, lng) => {
        const socket = socketRef.current;
        if (!socket || !socket.connected) {
            showToast("Socket not connected", "error");
            return;
        }

        const deliveryBoyId = profile?.deliveryBoyId || profile?._id;
        socket.emit("delivery:locationUpdate", { orderId, deliveryBoyId, lat, lng });
        showToast(`Location sent ✅ (${lat.toFixed(4)}, ${lng.toFixed(4)})`);
    }, [profile, showToast]);

    // ── Accept / Reject assignment ─────────────────────────────────────────
    const handleRespond = useCallback(async (orderId, action) => {
        try {
            await api.patch(`/api/deliveryboys/orders/${orderId}/respond`, { action });
            setAssignedOrders(prev => prev.filter(o => o.orderId !== orderId));
            showToast(
                action === "accept"
                    ? "Order accepted! Head to the customer 🚴"
                    : "Order rejected. Admin will reassign."
            );
            setTimeout(fetchAll, 1000);
        } catch (err) {
            showToast(err.response?.data?.message || "Failed to respond", "error");
        }
    }, [fetchAll, showToast]);

    const handleToggleAvailability = async () => {
        if (!profile) return;
        setTogglingAvail(true);
        try {
            const newVal = !profile.isAvailable;
            await api.patch("/api/deliveryboys/availability", { isAvailable: newVal });
            setProfile(p => ({ ...p, isAvailable: newVal }));
            showToast(newVal ? "You are now available 🟢" : "You are now offline 🔴");
        } catch {
            showToast("Failed to update availability", "error");
        } finally {
            setTogglingAvail(false);
        }
    };

    const handleDelivered = useCallback((orderId) => {
        setOrders(prev => ({
            ...prev,
            pending: prev.pending.filter(o => o.orderId !== orderId),
        }));
        showToast("Delivered! Invoice email sent to customer 🎉");
        setTimeout(fetchAll, 2000);
    }, [fetchAll, showToast]);

    if (loading) return <Loading />;

    // Active = accepted + shipped (not just "assigned")
    const activeOrders = (orders.pending || []).filter(
        o => o.deliveryAssignStatus === "accepted" || o.orderStatus === "shipped"
    );
    const pendingCount = activeOrders.length;
    const completedCount = orders.completed?.length || 0;

    return (
        <div className="min-h-screen bg-bg pb-10">

            {/* ── Sticky Topbar ─────────────────────────────────────────── */}
            <div className="sticky top-0 z-40 bg-card/80 backdrop-blur border-b border-accent-10">
                <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-secondary)] rounded-xl flex items-center justify-center text-white font-black text-base uppercase select-none">
                            {profile?.name?.[0] || "D"}
                        </div>
                        <div>
                            <p className="text-heading font-black text-sm leading-tight">{profile?.name}</p>
                            <div className="flex items-center gap-1.5">
                                <span className={`w-1.5 h-1.5 rounded-full inline-block ${profile?.isAvailable ? "bg-emerald-400" : "bg-gray-400"}`} />
                                <p className="text-body text-xs">{profile?.isAvailable ? "Available" : "Offline"}</p>
                                {/* Socket status */}
                                <span className="ml-1">
                                    {socketConnected
                                        ? <Wifi size={10} className="text-emerald-400" />
                                        : <WifiOff size={10} className="text-gray-400" />}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button onClick={fetchAll} title="Refresh"
                            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-accent-10 transition-colors text-body">
                            <RefreshCw size={14} />
                        </button>
                        <button
                            onClick={handleToggleAvailability}
                            disabled={togglingAvail}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all disabled:opacity-60
                                ${profile?.isAvailable
                                    ? "bg-emerald-400/10 text-emerald-400 hover:bg-emerald-400/20"
                                    : "bg-accent-10 text-body hover:bg-accent-20"}`}
                        >
                            {togglingAvail
                                ? <Loader2 size={12} className="animate-spin" />
                                : profile?.isAvailable ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                            {profile?.isAvailable ? "Go Offline" : "Go Online"}
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-2xl mx-auto px-4 py-5 space-y-4">

                {/* Stats */}
                <div className="grid grid-cols-4 gap-3">
                    {[
                        { label: "Active", value: pendingCount, cls: "text-yellow-400", bg: "bg-yellow-400/10", icon: Truck },
                        { label: "Delivered", value: profile?.totalDelivered ?? 0, cls: "text-emerald-400", bg: "bg-emerald-400/10", icon: CheckCircle2 },
                        { label: "Rating", value: `${(profile?.rating ?? 5).toFixed(1)}★`, cls: "text-yellow-400", bg: "bg-yellow-400/10", icon: Star },
                        { label: "Zones", value: profile?.zones?.length ?? 0, cls: "text-blue-400", bg: "bg-blue-400/10", icon: MapPin },
                    ].map(({ label, value, icon: Icon, cls, bg }) => (
                        <div key={label} className="bg-card border border-accent-10 rounded-2xl p-3 flex flex-col items-center text-center">
                            <div className={`w-8 h-8 ${bg} rounded-xl flex items-center justify-center mb-2`}>
                                <Icon size={14} className={cls} />
                            </div>
                            <p className="text-heading font-black text-lg leading-tight">{value}</p>
                            <p className="text-body text-[10px] mt-0.5">{label}</p>
                        </div>
                    ))}
                </div>

                {/* ── New assignment requests ────────────────────────────── */}
                {assignedOrders.length > 0 && (
                    <div className="space-y-3">
                        <p className="text-heading font-black text-sm flex items-center gap-2">
                            <Clock size={14} className="text-yellow-400" />
                            Pending Requests ({assignedOrders.length})
                        </p>
                        {assignedOrders.map(order => (
                            <AssignmentCard
                                key={order.orderId}
                                order={order}
                                onAccept={handleRespond}
                                onReject={handleRespond}
                            />
                        ))}
                    </div>
                )}

                {/* Zones */}
                {profile?.zones?.length > 0 && (
                    <div className="bg-card border border-accent-10 rounded-2xl px-4 py-3">
                        <p className="text-body text-[10px] font-semibold uppercase tracking-widest mb-2">Coverage Zones</p>
                        <div className="flex flex-wrap gap-2">
                            {profile.zones.map(zone => (
                                <span key={zone}
                                    className="px-3 py-1 bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-xs font-bold rounded-full border border-[var(--color-primary)]/20">
                                    {zone}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Tabs */}
                <div className="flex gap-1 bg-card border border-accent-10 rounded-xl p-1 w-fit">
                    {[
                        { key: "pending", label: "Active Deliveries", count: pendingCount },
                        { key: "completed", label: "Completed", count: completedCount },
                    ].map(({ key, label, count }) => (
                        <button
                            key={key}
                            onClick={() => setTab(key)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all
                                ${tab === key
                                    ? "bg-[var(--color-primary)] text-white shadow"
                                    : "text-body hover:text-heading"}`}
                        >
                            {label}
                            <span className={`text-xs px-1.5 py-0.5 rounded-full font-black
                                ${tab === key ? "bg-white/20" : "bg-accent-10"}`}>
                                {count}
                            </span>
                        </button>
                    ))}
                </div>

                {/* Active Deliveries */}
                {tab === "pending" && (
                    pendingCount === 0 ? (
                        <div className="text-center py-16 bg-card border border-accent-10 rounded-2xl">
                            <div className="w-14 h-14 bg-accent-10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <Package size={24} className="text-body" />
                            </div>
                            <p className="text-heading font-bold text-base mb-1">No active deliveries</p>
                            <p className="text-body text-sm">Orders assigned to you will appear here</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {activeOrders.map(order => (
                                <ActiveOrderCard
                                    key={order.orderId}
                                    order={order}
                                    onDelivered={handleDelivered}
                                    onLocationSend={handleLocationSend}
                                    socketConnected={socketConnected}
                                />
                            ))}
                        </div>
                    )
                )}

                {/* Completed */}
                {tab === "completed" && (
                    completedCount === 0 ? (
                        <div className="text-center py-16 bg-card border border-accent-10 rounded-2xl">
                            <CheckCircle2 size={36} className="text-body mx-auto mb-4" />
                            <p className="text-heading font-bold text-base mb-1">No completed deliveries yet</p>
                            <p className="text-body text-sm">Delivered orders will show up here</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {orders.completed.map(order => (
                                <CompletedRow key={order.orderId} order={order} />
                            ))}
                        </div>
                    )
                )}
            </div>

            <Toast msg={toast.msg} type={toast.type} />
        </div>
    );
}