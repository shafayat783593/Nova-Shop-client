"use client";

import { useState, useEffect, useCallback } from "react";
import api from "@/app/lib/api";
import {
    Loader2, Package, CheckCircle2, MapPin, Phone, Star,
    ToggleLeft, ToggleRight, Navigation, AlertCircle,
    Truck, ChevronRight, RefreshCw,
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

// ─── Active Order Card ────────────────────────────────────────────────────────
function ActiveOrderCard({ order, onDelivered }) {
    const [delivering, setDelivering] = useState(false);
    const [expanded, setExpanded] = useState(false);
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

    return (
        <div className="bg-card border border-accent-10 rounded-2xl overflow-hidden hover:shadow-md transition-all">
            {/* Header — always visible */}
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

            {/* Expandable body */}
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
                                    <Phone size={11} />
                                    {addr.phone}
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

                    {/* Deliver CTA */}
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

// ─── GPS Location Card ────────────────────────────────────────────────────────
function GPSCard({ showToast }) {
    const [loading, setLoading] = useState(false);
    const [lastUpdate, setLastUpdate] = useState(null);

    const handleUpdate = () => {
        if (!navigator.geolocation) {
            showToast("Geolocation not supported by your browser", "error");
            return;
        }
        setLoading(true);
        navigator.geolocation.getCurrentPosition(
            async ({ coords }) => {
                try {
                    await api.patch("/api/deliveryboys/location", {
                        lat: coords.latitude,
                        lng: coords.longitude,
                    });
                    setLastUpdate(new Date());
                    showToast(`Location updated ✅ (${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)})`);
                } catch {
                    showToast("Failed to send location to server", "error");
                } finally {
                    setLoading(false);
                }
            },
            (err) => {
                const msgs = {
                    1: "Location permission denied — please allow in browser settings",
                    2: "Location unavailable",
                    3: "Location request timed out",
                };
                showToast(msgs[err.code] || "Failed to get location", "error");
                setLoading(false);
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    };

    return (
        <div className="bg-card border border-accent-10 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                    <Navigation size={14} className="text-blue-400" />
                    <p className="text-heading font-bold text-sm">GPS Location</p>
                </div>
                {lastUpdate && (
                    <p className="text-body text-xs">Last updated {fmtTime(lastUpdate)}</p>
                )}
            </div>
            <p className="text-body text-xs mb-3">
                Customers can see your location while their order is being delivered.
            </p>
            <button
                onClick={handleUpdate}
                disabled={loading}
                className="w-full py-2.5 border border-blue-500/20 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 font-bold rounded-xl text-sm transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
                {loading
                    ? <><Loader2 size={13} className="animate-spin" /> Getting location...</>
                    : <><Navigation size={13} /> Update My Location</>}
            </button>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function DeliveryDashboardPage() {
    const [profile, setProfile] = useState(null);
    const [orders, setOrders] = useState({ pending: [], completed: [], total: 0 });
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState("pending");
    const [togglingAvail, setTogglingAvail] = useState(false);
    const [toast, setToast] = useState({ msg: "", type: "success" });

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
            setOrders(ordersRes.data.data);
        } catch {
            showToast("Failed to load data", "error");
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    // Auto-refresh every 60s
    useEffect(() => {
        const t = setInterval(fetchAll, 60_000);
        return () => clearInterval(t);
    }, [fetchAll]);

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

    if (loading) return <Loading/>

    const pendingCount = orders.pending?.length || 0;
    const completedCount = orders.completed?.length || 0;

    return (
        <div className="min-h-screen bg-bg pb-10">

            {/* ── Sticky Topbar ─────────────────────────────────────────────── */}
            <div className="sticky top-0 z-40 bg-card/80 backdrop-blur border-b border-accent-10">
                <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
                    {/* Avatar + name */}
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-secondary)] rounded-xl flex items-center justify-center text-white font-black text-base uppercase select-none">
                            {profile?.name?.[0] || "D"}
                        </div>
                        <div>
                            <p className="text-heading font-black text-sm leading-tight">{profile?.name}</p>
                            <div className="flex items-center gap-1.5">
                                <span className={`w-1.5 h-1.5 rounded-full inline-block ${profile?.isAvailable ? "bg-emerald-400" : "bg-gray-400"}`} />
                                <p className="text-body text-xs">{profile?.isAvailable ? "Available" : "Offline"}</p>
                            </div>
                        </div>
                    </div>

                    {/* Right controls */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={fetchAll}
                            title="Refresh"
                            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-accent-10 transition-colors text-body"
                        >
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
                                : profile?.isAvailable
                                    ? <ToggleRight size={14} />
                                    : <ToggleLeft size={14} />}
                            {profile?.isAvailable ? "Go Offline" : "Go Online"}
                        </button>
                    </div>
                </div>
            </div>

            {/* ── Main Content ───────────────────────────────────────────────── */}
            <div className="max-w-2xl mx-auto px-4 py-5 space-y-4">

                {/* Stats */}
                <div className="grid grid-cols-4 gap-3">
                    {[
                        { label: "Active", value: pendingCount, icon: Truck, cls: "text-yellow-400", bg: "bg-yellow-400/10" },
                        { label: "Delivered", value: profile?.totalDelivered ?? 0, icon: CheckCircle2, cls: "text-emerald-400", bg: "bg-emerald-400/10" },
                        { label: "Rating", value: `${(profile?.rating ?? 5).toFixed(1)}★`, icon: Star, cls: "text-yellow-400", bg: "bg-yellow-400/10" },
                        { label: "Zones", value: profile?.zones?.length ?? 0, icon: MapPin, cls: "text-blue-400", bg: "bg-blue-400/10" },
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

                {/* GPS Card */}
                <GPSCard showToast={showToast} />

                {/* Zones */}
                {profile?.zones?.length > 0 && (
                    <div className="bg-card border border-accent-10 rounded-2xl px-4 py-3">
                        <p className="text-body text-[10px] font-semibold uppercase tracking-widest mb-2">
                            Coverage Zones
                        </p>
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
                            {orders.pending.map(order => (
                                <ActiveOrderCard
                                    key={order.orderId}
                                    order={order}
                                    onDelivered={handleDelivered}
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