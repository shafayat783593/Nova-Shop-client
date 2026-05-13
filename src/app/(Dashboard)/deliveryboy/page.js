"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { io as socketIO } from "socket.io-client";
import api from "@/app/lib/api";
import {
    Loader2, Package, CheckCircle2, MapPin, Phone, Star,
    ToggleLeft, ToggleRight, Navigation, AlertCircle,
    Truck, ChevronRight, RefreshCw, Check, X, Clock,
    Wifi, WifiOff, Zap, TrendingUp,
} from "lucide-react";
import Loading from "@/app/components/global/Loading";

const SOCKET_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

const fmtDate = (d) =>
    new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ msg, type }) {
    if (!msg) return null;
    return (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-6 py-3.5 rounded-2xl shadow-2xl text-sm font-semibold border backdrop-blur-xl
            ${type === "error"
                ? "bg-[#1a0a0a]/90 border-red-500/40 text-red-300"
                : "bg-card/90 border-emerald-500/30 text-emerald-300"}`}
            style={{ minWidth: 220 }}>
            {type === "error"
                ? <AlertCircle size={15} className="text-red-400" />
                : <CheckCircle2 size={15} className="text-emerald-400" />}
            {msg}
        </div>
    );
}

// ─── Assignment Card ──────────────────────────────────────────────────────────
function AssignmentCard({ order, onRespond }) {
    const [loading, setLoading] = useState(null);
    const addr = order.shippingAddress;

    const handleAction = async (action) => {
        setLoading(action);
        try { await onRespond(order.orderId, action); }
        finally { setLoading(null); }
    };

    return (
        <div className="relative bg-card rounded-3xl overflow-hidden border border-yellow-400/30"
            style={{ boxShadow: "0 0 0 1px rgba(250,204,21,0.08), 0 8px 32px rgba(0,0,0,0.3)" }}>
            {/* Glow strip */}
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-yellow-400 to-transparent" />
            <div className="px-6 py-4 flex items-center gap-3 border-b border-yellow-400/15">
                <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-yellow-400" />
                </span>
                <p className="text-yellow-400 font-bold text-sm tracking-wide">New Delivery Request</p>
                <span className="ml-auto text-yellow-400/50 text-xs font-mono">{order.orderId}</span>
            </div>
            <div className="px-6 py-5 space-y-4">
                <div className="flex items-start justify-between gap-4">
                    <div className="space-y-0.5">
                        <p className="text-heading font-black text-base">{addr?.fullName}</p>
                        <p className="text-body text-xs">{order.items?.length || 0} items · {order.paymentMethod?.toUpperCase()}</p>
                    </div>
                    <p className="text-[var(--color-primary)] font-black text-2xl leading-none">৳{Number(order.total).toFixed(0)}</p>
                </div>
                <div className="bg-bg/60 rounded-2xl p-4 space-y-2 border border-accent-10">
                    <div className="flex items-start gap-2">
                        <MapPin size={12} className="text-[var(--color-primary)] flex-shrink-0 mt-0.5" />
                        <p className="text-body text-xs leading-relaxed">
                            {[addr?.addressLine, addr?.area, addr?.district, addr?.division].filter(Boolean).join(", ")}
                        </p>
                    </div>
                    {addr?.phone && (
                        <a href={`tel:${addr.phone}`}
                            className="flex items-center gap-2 text-xs text-[var(--color-primary)] hover:underline w-fit">
                            <Phone size={11} /> {addr.phone}
                        </a>
                    )}
                </div>
                <div className="grid grid-cols-2 gap-3 pt-1">
                    <button onClick={() => handleAction("reject")} disabled={!!loading}
                        className="py-3 border border-red-500/25 bg-red-500/8 hover:bg-red-500/15 text-red-400 font-bold rounded-2xl text-sm disabled:opacity-60 flex items-center justify-center gap-2 transition-all">
                        {loading === "reject" ? <Loader2 size={13} className="animate-spin" /> : <X size={13} />} Reject
                    </button>
                    <button onClick={() => handleAction("accept")} disabled={!!loading}
                        className="py-3 bg-emerald-500 hover:bg-emerald-400 text-white font-bold rounded-2xl text-sm disabled:opacity-60 flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/20">
                        {loading === "accept" ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />} Accept
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Active Order Card ────────────────────────────────────────────────────────
function ActiveOrderCard({ order, onDelivered, socketRef, deliveryBoyId }) {
    const [delivering, setDelivering] = useState(false);
    const [expanded, setExpanded] = useState(false);
    const [tracking, setTracking] = useState(false);
    const [sendingOnce, setSendingOnce] = useState(false);
    const [gpsError, setGpsError] = useState("");
    const watchIdRef = useRef(null);
    const addr = order.shippingAddress;

    useEffect(() => () => {
        if (watchIdRef.current != null) navigator.geolocation?.clearWatch(watchIdRef.current);
    }, []);

    const emitLocation = useCallback((lat, lng) => {
        const socket = socketRef.current;
        if (!socket?.connected) return;
        socket.emit("delivery:locationUpdate", {
            orderId: order.orderId,
            deliveryBoyId: String(deliveryBoyId),
            lat, lng,
        });
    }, [order.orderId, deliveryBoyId, socketRef]);

    const handleToggleTracking = () => {
        if (!navigator.geolocation) { setGpsError("GPS not supported"); return; }
        setGpsError("");
        if (tracking) {
            navigator.geolocation.clearWatch(watchIdRef.current);
            watchIdRef.current = null;
            setTracking(false);
            return;
        }
        setTracking(true);
        watchIdRef.current = navigator.geolocation.watchPosition(
            ({ coords }) => { setGpsError(""); emitLocation(coords.latitude, coords.longitude); },
            (err) => { setGpsError(`GPS: ${err.message}`); setTracking(false); watchIdRef.current = null; },
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 3000 }
        );
    };

    const handleSendOnce = () => {
        if (!navigator.geolocation) { setGpsError("GPS not supported"); return; }
        setGpsError(""); setSendingOnce(true);
        navigator.geolocation.getCurrentPosition(
            ({ coords }) => { emitLocation(coords.latitude, coords.longitude); setSendingOnce(false); },
            (err) => { setGpsError(`GPS: ${err.message}`); setSendingOnce(false); },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    };

    const handleDeliver = async () => {
        if (!confirm(`Confirm delivery of ${order.orderId}?`)) return;
        if (watchIdRef.current != null) {
            navigator.geolocation?.clearWatch(watchIdRef.current);
            watchIdRef.current = null; setTracking(false);
        }
        setDelivering(true);
        try {
            await api.patch(`/api/deliveryboys/orders/${order.orderId}/delivered`);
            onDelivered(order.orderId);
        } catch (err) {
            alert(err.response?.data?.message || "Failed to update");
        } finally { setDelivering(false); }
    };

    return (
        <div className="bg-card border border-accent-10 rounded-3xl overflow-hidden transition-all hover:border-[var(--color-primary)]/30"
            style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.2)" }}>
            <div className="flex items-center gap-4 px-6 py-5 cursor-pointer select-none"
                onClick={() => setExpanded(v => !v)}>
                {/* Icon */}
                <div className="w-12 h-12 rounded-2xl bg-yellow-400/10 border border-yellow-400/20 flex items-center justify-center flex-shrink-0">
                    <Truck size={20} className="text-yellow-400" />
                </div>
                {/* Info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <p className="text-heading font-bold text-sm">{order.orderId}</p>
                        {tracking && (
                            <span className="flex items-center gap-1 bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> LIVE
                            </span>
                        )}
                    </div>
                    <p className="text-body text-xs mt-0.5">{addr?.fullName} · {addr?.district}</p>
                </div>
                {/* Right */}
                <div className="flex items-center gap-3 flex-shrink-0">
                    <p className="text-[var(--color-primary)] font-black text-lg">৳{Number(order.total).toFixed(0)}</p>
                    <div className={`w-7 h-7 rounded-xl bg-accent-10 flex items-center justify-center transition-transform duration-300 ${expanded ? "rotate-90" : ""}`}>
                        <ChevronRight size={13} className="text-body" />
                    </div>
                </div>
            </div>

            {expanded && (
                <div className="border-t border-accent-10 px-6 pb-6 pt-5 space-y-5">
                    {/* Items */}
                    <div>
                        <p className="text-body text-[10px] font-bold uppercase tracking-widest mb-3">Order Items</p>
                        <div className="bg-bg/60 rounded-2xl p-4 border border-accent-10 space-y-2">
                            {order.items?.map((item, i) => (
                                <div key={i} className="flex items-center justify-between">
                                    <p className="text-heading text-xs font-medium truncate max-w-[65%]">{item.nameSnapshot}</p>
                                    <span className="text-body text-xs bg-accent-10 px-2 py-0.5 rounded-full">×{item.quantity}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Address */}
                    <div>
                        <p className="text-body text-[10px] font-bold uppercase tracking-widest mb-3">Deliver To</p>
                        <div className="bg-bg/60 rounded-2xl p-4 border border-accent-10 space-y-2.5">
                            <p className="text-heading text-sm font-bold">{addr?.fullName}</p>
                            <div className="flex items-start gap-2">
                                <MapPin size={12} className="text-[var(--color-primary)] flex-shrink-0 mt-0.5" />
                                <p className="text-body text-xs leading-relaxed">
                                    {[addr?.addressLine, addr?.area, addr?.district, addr?.division].filter(Boolean).join(", ")}
                                </p>
                            </div>
                            {addr?.phone && (
                                <a href={`tel:${addr.phone}`}
                                    className="inline-flex items-center gap-2 text-xs text-[var(--color-primary)] hover:underline"
                                    onClick={e => e.stopPropagation()}>
                                    <Phone size={11} /> {addr.phone}
                                </a>
                            )}
                        </div>
                    </div>

                    {/* Badges */}
                    <div className="flex gap-2 flex-wrap">
                        <span className={`text-[10px] font-bold px-3 py-1.5 rounded-full border
                            ${order.paymentMethod === "cod" ? "bg-yellow-400/10 border-yellow-400/25 text-yellow-400" : "bg-emerald-400/10 border-emerald-400/25 text-emerald-400"}`}>
                            {order.paymentMethod?.toUpperCase()}
                        </span>
                        <span className={`text-[10px] font-bold px-3 py-1.5 rounded-full border
                            ${order.paymentStatus === "paid" ? "bg-emerald-400/10 border-emerald-400/25 text-emerald-400" : "bg-red-400/10 border-red-400/25 text-red-400"}`}>
                            {order.paymentStatus === "paid" ? "Paid" : "Unpaid"}
                        </span>
                    </div>

                    {gpsError && (
                        <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 px-4 py-2.5 rounded-2xl flex items-center gap-2">
                            <AlertCircle size={12} /> {gpsError}
                        </p>
                    )}

                    {/* GPS Buttons */}
                    <div className="grid grid-cols-2 gap-3">
                        <button onClick={handleToggleTracking}
                            className={`py-3 font-bold rounded-2xl text-sm transition-all flex items-center justify-center gap-2
                                ${tracking
                                    ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25"
                                    : "border border-blue-500/25 bg-blue-500/8 text-blue-400 hover:bg-blue-500/15"}`}>
                            <Navigation size={13} className={tracking ? "animate-pulse" : ""} />
                            {tracking ? "Stop Tracking" : "Live Track"}
                        </button>
                        <button onClick={handleSendOnce} disabled={sendingOnce}
                            className="py-3 border border-accent-10 text-body font-semibold rounded-2xl text-sm hover:bg-accent-10 disabled:opacity-60 flex items-center justify-center gap-2 transition-all">
                            {sendingOnce ? <Loader2 size={12} className="animate-spin" /> : <Navigation size={12} />}
                            Send Once
                        </button>
                    </div>

                    {/* Deliver */}
                    <button onClick={handleDeliver} disabled={delivering}
                        className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-white font-black rounded-2xl text-sm transition-all disabled:opacity-60 flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/20">
                        {delivering
                            ? <><Loader2 size={15} className="animate-spin" /> Updating...</>
                            : <><CheckCircle2 size={15} /> Mark as Delivered</>}
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
        <div className="bg-card border border-accent-10 rounded-2xl px-5 py-4 flex items-center gap-4 hover:border-emerald-500/20 transition-all">
            <div className="w-10 h-10 bg-emerald-400/10 border border-emerald-400/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <CheckCircle2 size={16} className="text-emerald-400" />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-heading font-bold text-sm">{order.orderId}</p>
                <p className="text-body text-xs mt-0.5 truncate">{addr?.fullName} · {addr?.district}</p>
            </div>
            <div className="text-right flex-shrink-0">
                <p className="text-heading font-bold">৳{Number(order.total).toFixed(0)}</p>
                <p className="text-body text-xs mt-0.5">{fmtDate(order.updatedAt || order.createdAt)}</p>
            </div>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function DeliveryDashboardPage() {
    const [profile, setProfile] = useState(null);
    const [orders, setOrders] = useState({ pending: [], completed: [], total: 0 });
    const [assignedOrders, setAssignedOrders] = useState([]);
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
            setAssignedOrders((data.pending || []).filter(o => o.deliveryAssignStatus === "assigned"));
        } catch {
            showToast("Failed to load data", "error");
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    useEffect(() => {
        if (!profile) return;
        if (socketRef.current) { socketRef.current.disconnect(); socketRef.current = null; }

        const socket = socketIO(SOCKET_URL, {
            withCredentials: true,
            transports: ["websocket", "polling"],
            reconnection: true,
            reconnectionAttempts: Infinity,
            reconnectionDelay: 2000,
            timeout: 10000,
        });
        socketRef.current = socket;
        const deliveryBoyId = String(profile?.deliveryBoyId || profile?._id || "");

        socket.on("connect", () => {
            setSocketConnected(true);
            socket.emit("join:delivery", deliveryBoyId);
        });
        socket.on("joined:delivery", () => {});
        socket.on("connect_error", () => setSocketConnected(false));
        socket.on("disconnect", () => setSocketConnected(false));
        socket.on("reconnect", () => {
            setSocketConnected(true);
            socket.emit("join:delivery", deliveryBoyId);
        });
        socket.on("delivery:assigned", (data) => {
            showToast(`New order: ${data.orderId} 📦`);
            fetchAll();
        });

        return () => { socket.disconnect(); socketRef.current = null; };
    }, [profile?.deliveryBoyId, profile?._id]);

    useEffect(() => {
        const t = setInterval(fetchAll, 60_000);
        return () => clearInterval(t);
    }, [fetchAll]);

    const handleRespond = useCallback(async (orderId, action) => {
        try {
            await api.patch(`/api/deliveryboys/orders/${orderId}/respond`, { action });
            setAssignedOrders(prev => prev.filter(o => o.orderId !== orderId));
            showToast(action === "accept" ? "Order accepted! 🚴" : "Order rejected.");
            setTimeout(fetchAll, 800);
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
            showToast(newVal ? "Available 🟢" : "Offline 🔴");
        } catch {
            showToast("Failed to update", "error");
        } finally { setTogglingAvail(false); }
    };

    const handleDelivered = useCallback((orderId) => {
        setOrders(prev => ({
            ...prev,
            pending: prev.pending.filter(o => o.orderId !== orderId),
        }));
        showToast("Delivered! 🎉");
        setTimeout(fetchAll, 2000);
    }, [fetchAll, showToast]);

    if (loading) return <Loading />;

    const deliveryBoyId = profile?.deliveryBoyId || profile?._id || "";
    const activeOrders = (orders.pending || []).filter(
        o => o.deliveryAssignStatus === "accepted" || o.orderStatus === "shipped"
    );
    const pendingCount = activeOrders.length;
    const completedCount = orders.completed?.length || 0;

    return (
        <div className="min-h-screen bg-bg">

            {/* ── Topbar ── */}
            <div className="sticky top-0 z-40 bg-card/80 backdrop-blur-xl border-b border-accent-10">
                <div className="w-full px-6 lg:px-10 py-3.5 flex items-center justify-between gap-4">
                    {/* Left: avatar + name */}
                    <div className="flex items-center gap-4">
                        <div className="relative w-10 h-10 flex-shrink-0">
                            <div className="w-10 h-10 bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-secondary)] rounded-2xl flex items-center justify-center text-white font-black text-base uppercase select-none shadow-lg">
                                {profile?.name?.[0] || "D"}
                            </div>
                            <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-card ${profile?.isAvailable ? "bg-emerald-400" : "bg-gray-500"}`} />
                        </div>
                        <div>
                            <p className="text-heading font-black text-sm leading-tight">{profile?.name}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                                <p className="text-body text-xs">{profile?.isAvailable ? "Available" : "Offline"}</p>
                                <span title={socketConnected ? "Connected" : "Disconnected"}>
                                    {socketConnected
                                        ? <Wifi size={10} className="text-emerald-400" />
                                        : <WifiOff size={10} className="text-gray-500 animate-pulse" />}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Right: actions */}
                    <div className="flex items-center gap-2">
                        <button onClick={fetchAll}
                            className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-accent-10 text-body transition-colors">
                            <RefreshCw size={15} />
                        </button>
                        <button onClick={handleToggleAvailability} disabled={togglingAvail}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold disabled:opacity-60 transition-all
                                ${profile?.isAvailable
                                    ? "bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 hover:bg-emerald-500/25"
                                    : "bg-accent-10 border border-accent-10 text-body hover:bg-accent-10/80"}`}>
                            {togglingAvail
                                ? <Loader2 size={13} className="animate-spin" />
                                : profile?.isAvailable ? <ToggleRight size={15} /> : <ToggleLeft size={15} />}
                            {profile?.isAvailable ? "Go Offline" : "Go Online"}
                        </button>
                    </div>
                </div>
            </div>

            {/* ── Body ── */}
            <div className="w-full px-6 lg:px-10 py-6 space-y-6">

                {/* ── Stats strip ── */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {[
                        { label: "Active", value: pendingCount, icon: Truck, color: "text-yellow-400", bg: "bg-yellow-400/10", border: "border-yellow-400/20" },
                        { label: "Delivered", value: profile?.totalDelivered ?? 0, icon: CheckCircle2, color: "text-emerald-400", bg: "bg-emerald-400/10", border: "border-emerald-400/20" },
                        { label: "Rating", value: `${(profile?.rating ?? 5).toFixed(1)}★`, icon: Star, color: "text-yellow-400", bg: "bg-yellow-400/10", border: "border-yellow-400/20" },
                        { label: "Zones", value: profile?.zones?.length ?? 0, icon: MapPin, color: "text-blue-400", bg: "bg-blue-400/10", border: "border-blue-400/20" },
                    ].map(({ label, value, icon: Icon, color, bg, border }) => (
                        <div key={label}
                            className={`bg-card border ${border} rounded-3xl p-5 flex items-center gap-4`}
                            style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.15)" }}>
                            <div className={`w-12 h-12 ${bg} border ${border} rounded-2xl flex items-center justify-center flex-shrink-0`}>
                                <Icon size={20} className={color} />
                            </div>
                            <div>
                                <p className="text-heading font-black text-2xl leading-none">{value}</p>
                                <p className="text-body text-xs mt-1">{label}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* ── 2-col layout on wide screens ── */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* ── Sidebar (left on desktop) ── */}
                    <div className="space-y-4 lg:col-span-1">

                        {/* Zones */}
                        {profile?.zones?.length > 0 && (
                            <div className="bg-card border border-accent-10 rounded-3xl px-5 py-4"
                                style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.12)" }}>
                                <p className="text-body text-[10px] font-bold uppercase tracking-widest mb-3">Coverage Zones</p>
                                <div className="flex flex-wrap gap-2">
                                    {profile.zones.map(zone => (
                                        <span key={zone}
                                            className="px-3 py-1.5 bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-xs font-bold rounded-full border border-[var(--color-primary)]/20">
                                            {zone}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* New requests */}
                        {assignedOrders.length > 0 && (
                            <div className="space-y-3">
                                <p className="text-heading font-black text-sm flex items-center gap-2 px-1">
                                    <Clock size={14} className="text-yellow-400" />
                                    Pending Requests
                                    <span className="ml-auto bg-yellow-400/15 border border-yellow-400/25 text-yellow-400 text-[10px] font-black px-2 py-0.5 rounded-full">
                                        {assignedOrders.length}
                                    </span>
                                </p>
                                {assignedOrders.map(order => (
                                    <AssignmentCard key={order.orderId} order={order} onRespond={handleRespond} />
                                ))}
                            </div>
                        )}

                        {/* Empty sidebar state */}
                        {assignedOrders.length === 0 && (!profile?.zones || profile.zones.length === 0) && (
                            <div className="bg-card border border-accent-10 rounded-3xl p-6 text-center">
                                <Zap size={28} className="text-body mx-auto mb-3 opacity-40" />
                                <p className="text-body text-sm">Waiting for new requests...</p>
                            </div>
                        )}
                    </div>

                    {/* ── Main content (right) ── */}
                    <div className="lg:col-span-2 space-y-4">

                        {/* Tabs */}
                        <div className="flex gap-1 bg-card border border-accent-10 rounded-2xl p-1.5 w-fit">
                            {[
                                { key: "pending", label: "Active Deliveries", count: pendingCount },
                                { key: "completed", label: "Completed", count: completedCount },
                            ].map(({ key, label, count }) => (
                                <button key={key} onClick={() => setTab(key)}
                                    className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-sm font-bold transition-all
                                        ${tab === key
                                            ? "bg-[var(--color-primary)] text-white shadow-lg shadow-[var(--color-primary)]/25"
                                            : "text-body hover:text-heading"}`}>
                                    {label}
                                    <span className={`text-xs px-2 py-0.5 rounded-full font-black ${tab === key ? "bg-white/20 text-white" : "bg-accent-10 text-body"}`}>
                                        {count}
                                    </span>
                                </button>
                            ))}
                        </div>

                        {/* Active tab */}
                        {tab === "pending" && (
                            pendingCount === 0 ? (
                                <div className="flex flex-col items-center justify-center py-24 bg-card border border-accent-10 rounded-3xl text-center">
                                    <div className="w-16 h-16 bg-accent-10 rounded-3xl flex items-center justify-center mb-5">
                                        <Package size={26} className="text-body opacity-50" />
                                    </div>
                                    <p className="text-heading font-bold text-base mb-1.5">No active deliveries</p>
                                    <p className="text-body text-sm">Accepted orders will appear here</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {activeOrders.map(order => (
                                        <ActiveOrderCard
                                            key={order.orderId}
                                            order={order}
                                            onDelivered={handleDelivered}
                                            socketRef={socketRef}
                                            deliveryBoyId={deliveryBoyId}
                                        />
                                    ))}
                                </div>
                            )
                        )}

                        {/* Completed tab */}
                        {tab === "completed" && (
                            completedCount === 0 ? (
                                <div className="flex flex-col items-center justify-center py-24 bg-card border border-accent-10 rounded-3xl text-center">
                                    <TrendingUp size={32} className="text-body mb-5 opacity-40" />
                                    <p className="text-heading font-bold text-base mb-1.5">No completed deliveries yet</p>
                                    <p className="text-body text-sm">Delivered orders will show up here</p>
                                </div>
                            ) : (
                                <div className="space-y-2.5">
                                    {orders.completed.map(order => (
                                        <CompletedRow key={order.orderId} order={order} />
                                    ))}
                                </div>
                            )
                        )}
                    </div>
                </div>
            </div>

            <Toast msg={toast.msg} type={toast.type} />
        </div>
    );
}