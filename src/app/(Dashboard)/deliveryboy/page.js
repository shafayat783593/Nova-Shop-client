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

// ─── Backend URL ──────────────────────────────────────────────────────────────
const SOCKET_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtDate = (d) =>
    new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

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
        <div className="bg-card border-2 border-yellow-400/40 rounded-2xl overflow-hidden">
            <div className="bg-yellow-400/10 px-5 py-3 flex items-center gap-2 border-b border-yellow-400/20">
                <Clock size={14} className="text-yellow-400" />
                <p className="text-yellow-400 font-bold text-sm">New delivery request!</p>
            </div>
            <div className="px-5 py-4 space-y-3">
                <div className="flex items-center justify-between">
                    <p className="text-heading font-black text-base">{order.orderId}</p>
                    <p className="text-[var(--color-primary)] font-black text-lg">৳{Number(order.total).toFixed(0)}</p>
                </div>
                <div className="bg-bg rounded-xl p-3 space-y-1.5">
                    <p className="text-heading font-bold text-sm">{addr?.fullName}</p>
                    <div className="flex items-start gap-1.5">
                        <MapPin size={11} className="text-[var(--color-primary)] flex-shrink-0 mt-0.5" />
                        <p className="text-body text-xs leading-relaxed">
                            {[addr?.addressLine, addr?.area, addr?.district, addr?.division].filter(Boolean).join(", ")}
                        </p>
                    </div>
                    {addr?.phone && (
                        <a href={`tel:${addr.phone}`}
                            className="flex items-center gap-1.5 text-xs text-[var(--color-primary)] hover:underline">
                            <Phone size={11} /> {addr.phone}
                        </a>
                    )}
                </div>
                <p className="text-body text-xs">{order.items?.length || 0} item(s) · {order.paymentMethod?.toUpperCase()}</p>
                <div className="flex gap-3">
                    <button onClick={() => handleAction("reject")} disabled={!!loading}
                        className="flex-1 py-2.5 border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold rounded-xl text-sm disabled:opacity-60 flex items-center justify-center gap-2">
                        {loading === "reject" ? <Loader2 size={13} className="animate-spin" /> : <X size={13} />} Reject
                    </button>
                    <button onClick={() => handleAction("accept")} disabled={!!loading}
                        className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl text-sm disabled:opacity-60 flex items-center justify-center gap-2">
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

    // Stop tracking on unmount
    useEffect(() => () => {
        if (watchIdRef.current != null) navigator.geolocation?.clearWatch(watchIdRef.current);
    }, []);

    // ── Emit location via socket ──────────────────────────────────────────
    const emitLocation = useCallback((lat, lng) => {
        const socket = socketRef.current;

        console.log("Socket state:", {
            exists: !!socket,
            connected: socket?.connected,
            id: socket?.id,
        });

        if (!socket?.connected) {
            console.warn("❌ Socket not connected!");
            return;
        }

        const payload = {
            orderId: order.orderId,
            deliveryBoyId: String(deliveryBoyId),  // ✅ string guarantee
            lat,
            lng,
        };

        console.log("📍 Emitting:", payload);
        socket.emit("delivery:locationUpdate", payload);
    }, [order.orderId, deliveryBoyId, socketRef]);

    // ── Toggle continuous GPS tracking ────────────────────────────────────
    const handleToggleTracking = () => {
        if (!navigator.geolocation) {
            setGpsError("GPS not supported");
            return;
        }
        setGpsError("");

        if (tracking) {
            navigator.geolocation.clearWatch(watchIdRef.current);
            watchIdRef.current = null;
            setTracking(false);
            return;
        }

        setTracking(true);
        watchIdRef.current = navigator.geolocation.watchPosition(
            ({ coords }) => {
                setGpsError("");
                emitLocation(coords.latitude, coords.longitude);
            },
            (err) => {
                setGpsError(`GPS: ${err.message}`);
                setTracking(false);
                watchIdRef.current = null;
            },
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 3000 }
        );
    };

    // ── Send location once ────────────────────────────────────────────────
    const handleSendOnce = () => {
        if (!navigator.geolocation) { setGpsError("GPS not supported"); return; }
        setGpsError("");
        setSendingOnce(true);
        navigator.geolocation.getCurrentPosition(
            ({ coords }) => {
                emitLocation(coords.latitude, coords.longitude);
                setSendingOnce(false);
            },
            (err) => {
                setGpsError(`GPS: ${err.message}`);
                setSendingOnce(false);
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    };

    const handleDeliver = async () => {
        if (!confirm(`Confirm delivery of ${order.orderId}?`)) return;
        if (watchIdRef.current != null) {
            navigator.geolocation?.clearWatch(watchIdRef.current);
            watchIdRef.current = null;
            setTracking(false);
        }
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

    return (
        <div className="bg-card border border-accent-10 rounded-2xl overflow-hidden hover:shadow-md transition-all">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 cursor-pointer select-none"
                onClick={() => setExpanded(v => !v)}>
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
                    {tracking && (
                        <span className="flex items-center gap-1 text-emerald-400 text-xs font-bold">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
                            Live
                        </span>
                    )}
                    <p className="text-[var(--color-primary)] font-black">৳{Number(order.total).toFixed(0)}</p>
                    <ChevronRight size={14} className={`text-body transition-transform duration-200 ${expanded ? "rotate-90" : ""}`} />
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
                                    <p className="text-heading text-xs font-medium truncate max-w-[210px]">{item.nameSnapshot}</p>
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
                                    {[addr?.addressLine, addr?.area, addr?.district, addr?.division].filter(Boolean).join(", ")}
                                </p>
                            </div>
                            {addr?.phone && (
                                <a href={`tel:${addr.phone}`}
                                    className="flex items-center gap-1.5 text-xs text-[var(--color-primary)] hover:underline"
                                    onClick={e => e.stopPropagation()}>
                                    <Phone size={11} /> {addr.phone}
                                </a>
                            )}
                        </div>
                    </div>

                    {/* Payment */}
                    <div className="flex gap-2 flex-wrap">
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full
                            ${order.paymentMethod === "cod" ? "bg-yellow-400/10 text-yellow-400" : "bg-emerald-400/10 text-emerald-400"}`}>
                            {order.paymentMethod?.toUpperCase()}
                        </span>
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full
                            ${order.paymentStatus === "paid" ? "bg-emerald-400/10 text-emerald-400" : "bg-red-400/10 text-red-400"}`}>
                            {order.paymentStatus === "paid" ? "Paid" : "Unpaid"}
                        </span>
                    </div>

                    {/* GPS Error */}
                    {gpsError && (
                        <p className="text-red-400 text-xs bg-red-500/10 px-3 py-2 rounded-xl flex items-center gap-2">
                            <AlertCircle size={12} /> {gpsError}
                        </p>
                    )}

                    {/* Location buttons — ✅ NO disabled check on socketConnected */}
                    <div className="space-y-2">
                        <button onClick={handleToggleTracking}
                            className={`w-full py-2.5 font-bold rounded-xl text-sm transition-colors flex items-center justify-center gap-2
                                ${tracking
                                    ? "bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/30"
                                    : "border border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400"}`}>
                            <Navigation size={13} className={tracking ? "animate-pulse" : ""} />
                            {tracking ? "🟢 Stop Live Tracking" : "Start Live Tracking"}
                        </button>

                        <button onClick={handleSendOnce} disabled={sendingOnce}
                            className="w-full py-2 border border-accent-10 text-body font-semibold rounded-xl text-xs transition-colors hover:bg-accent-10 disabled:opacity-60 flex items-center justify-center gap-2">
                            {sendingOnce ? <Loader2 size={12} className="animate-spin" /> : <Navigation size={12} />}
                            Send Location Once
                        </button>
                    </div>

                    {/* Mark Delivered */}
                    <button onClick={handleDeliver} disabled={delivering}
                        className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl text-sm transition-all disabled:opacity-60 flex items-center justify-center gap-2">
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
        <div className="bg-card border border-accent-10 rounded-xl px-4 py-3 flex items-center gap-3">
            <div className="w-9 h-9 bg-emerald-400/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <CheckCircle2 size={16} className="text-emerald-400" />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-heading font-bold text-sm">{order.orderId}</p>
                <p className="text-body text-xs truncate">{addr?.fullName} · {addr?.district}</p>
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

    // ── Socket.IO ─────────────────────────────────────────────────────────
    useEffect(() => {
        if (!profile) return;

        // Disconnect previous
        if (socketRef.current) {
            socketRef.current.disconnect();
            socketRef.current = null;
        }

        console.log("🔌 Connecting socket to:", SOCKET_URL);

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

        // ✅ এটা দেখুন — কি আসছে?
        console.log("🔑 deliveryBoyId for socket:", deliveryBoyId);
        console.log("🔑 full profile:", profile);

        socket.on("connect", () => {
            console.log("✅ Delivery socket connected:", socket.id);
            setSocketConnected(true);
            console.log("📤 Emitting join:delivery with:", deliveryBoyId);
            socket.emit("join:delivery", deliveryBoyId);
        });

        socket.on("joined:delivery", (data) => {
            console.log("✅ joined:delivery confirmed:", data);
        });

        socket.on("connect_error", (err) => {
            console.error("❌ Socket connect_error:", err.message, "URL:", SOCKET_URL);
            setSocketConnected(false);
        });

        socket.on("disconnect", (reason) => {
            console.log("🔌 Socket disconnected:", reason);
            setSocketConnected(false);
        });

        socket.on("reconnect", (attempt) => {
            console.log("♻️  Reconnected after", attempt, "attempts");
            setSocketConnected(true);
            socket.emit("join:delivery", deliveryBoyId);
        });

        socket.on("delivery:assigned", (data) => {
            showToast(`New order: ${data.orderId} 📦`);
            fetchAll();
        });

        return () => {
            socket.disconnect();
            socketRef.current = null;
        };
    }, [profile?.deliveryBoyId, profile?._id]);

    // Auto-refresh every 60s
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
        } finally {
            setTogglingAvail(false);
        }
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
        <div className="min-h-screen bg-bg pb-10">

            {/* Topbar */}
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
                                <span className="ml-1" title={socketConnected ? "Connected" : "Disconnected"}>
                                    {socketConnected
                                        ? <Wifi size={10} className="text-emerald-400" />
                                        : <WifiOff size={10} className="text-gray-400 animate-pulse" />}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={fetchAll}
                            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-accent-10 text-body">
                            <RefreshCw size={14} />
                        </button>
                        <button onClick={handleToggleAvailability} disabled={togglingAvail}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold disabled:opacity-60
                                ${profile?.isAvailable
                                    ? "bg-emerald-400/10 text-emerald-400 hover:bg-emerald-400/20"
                                    : "bg-accent-10 text-body"}`}>
                            {togglingAvail ? <Loader2 size={12} className="animate-spin" /> : profile?.isAvailable ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
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

                {/* Assignments */}
                {assignedOrders.length > 0 && (
                    <div className="space-y-3">
                        <p className="text-heading font-black text-sm flex items-center gap-2">
                            <Clock size={14} className="text-yellow-400" />
                            Pending Requests ({assignedOrders.length})
                        </p>
                        {assignedOrders.map(order => (
                            <AssignmentCard key={order.orderId} order={order} onRespond={handleRespond} />
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
                        <button key={key} onClick={() => setTab(key)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all
                                ${tab === key ? "bg-[var(--color-primary)] text-white shadow" : "text-body hover:text-heading"}`}>
                            {label}
                            <span className={`text-xs px-1.5 py-0.5 rounded-full font-black ${tab === key ? "bg-white/20" : "bg-accent-10"}`}>
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
                            <p className="text-body text-sm">Accepted orders will appear here</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
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