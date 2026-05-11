"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { io as socketIO } from "socket.io-client";
import {
    ArrowLeft, Package, MapPin, CreditCard, Clock,
    CheckCircle2, Truck, XCircle, RotateCcw,
    Loader2, Phone, User, Zap, Tag, X, RefreshCcw, Download,
    Navigation, Wifi, WifiOff,
} from "lucide-react";
import api from "@/app/lib/api";

// ─── Constants ────────────────────────────────────────────────────────────────
const SOCKET_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

const STATUS_CONFIG = {
    pending: { label: "Pending", color: "text-amber-600", bg: "bg-amber-500/10", icon: Clock },
    confirmed: { label: "Confirmed", color: "text-blue-600", bg: "bg-blue-500/10", icon: CheckCircle2 },
    processing: { label: "Processing", color: "text-purple-600", bg: "bg-purple-500/10", icon: RotateCcw },
    prepared: { label: "Prepared", color: "text-cyan-600", bg: "bg-cyan-500/10", icon: Package },
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

// ─── Haversine distance (km) ──────────────────────────────────────────────────
function calcDistance(lat1, lng1, lat2, lng2) {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ─── Inject Leaflet CSS once ──────────────────────────────────────────────────
let cssInjected = false;
function injectLeafletCSS() {
    if (cssInjected || typeof document === "undefined") return;
    if (document.getElementById("leaflet-css")) { cssInjected = true; return; }
    const link = document.createElement("link");
    link.id = "leaflet-css";
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    link.crossOrigin = "";
    document.head.appendChild(link);
    cssInjected = true;
}

// ─── DeliveryMap ─────────────────────────────────────────────────────────────
// KEY FIXES:
//  1. No overflow-hidden on wrapper — Leaflet needs visible container
//  2. Explicit px height on map div, not relying on parent
//  3. invalidateSize() after mount so Leaflet knows real dimensions
//  4. deliveryBoyLoc updates move marker without reinitializing map
function DeliveryMap({ order, deliveryBoyLoc, customerLoc, snapshot }) {
    const divRef = useRef(null);
    const mapRef = useRef(null);
    const dbMarkerRef = useRef(null);
    const lineRef = useRef(null);
    const initRef = useRef(false);

    const [distance, setDistance] = useState(null);
    const [eta, setEta] = useState(null);

    // ── Recalculate distance & ETA ────────────────────────────────────────
    useEffect(() => {
        const dbLat = deliveryBoyLoc?.lat;
        const dbLng = deliveryBoyLoc?.lng;
        const cuLat = customerLoc?.lat;
        const cuLng = customerLoc?.lng;

        if (dbLat == null || dbLng == null || cuLat == null || cuLng == null) return;

        const d = calcDistance(dbLat, dbLng, cuLat, cuLng);
        setDistance(d.toFixed(2));
        setEta(Math.ceil((d / 20) * 60)); // avg 20 km/h city
    }, [deliveryBoyLoc, customerLoc]);

    // ── Init map once ─────────────────────────────────────────────────────
    useEffect(() => {
        if (typeof window === "undefined") return;
        if (initRef.current) return;
        if (!divRef.current) return;

        initRef.current = true;
        injectLeafletCSS();

        // Default center: Dhaka
        const lat0 = deliveryBoyLoc?.lat ?? customerLoc?.lat ?? 23.8103;
        const lng0 = deliveryBoyLoc?.lng ?? customerLoc?.lng ?? 90.4125;

        import("leaflet").then((L) => {
            // Strict-mode guard
            if (divRef.current?._leaflet_id) return;

            delete L.Icon.Default.prototype._getIconUrl;
            L.Icon.Default.mergeOptions({
                iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
                iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
                shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
            });

            const map = L.map(divRef.current, {
                zoomControl: true,
                scrollWheelZoom: true,
                attributionControl: false,
            }).setView([lat0, lng0], 14);

            L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
                maxZoom: 19,
            }).addTo(map);

            // ── Icons ──────────────────────────────────────────────────────
            const truckIcon = L.divIcon({
                html: `<div style="background:#3b82f6;width:40px;height:40px;border-radius:50%;border:3px solid #fff;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 10px rgba(59,130,246,.55)">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="white" viewBox="0 0 24 24">
                        <path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4z"/>
                    </svg></div>`,
                className: "", iconSize: [40, 40], iconAnchor: [20, 20],
            });

            const pinIcon = L.divIcon({
                html: `<div style="background:#ef4444;width:40px;height:40px;border-radius:50%;border:3px solid #fff;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 10px rgba(239,68,68,.55)">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="white" viewBox="0 0 24 24">
                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                    </svg></div>`,
                className: "", iconSize: [40, 40], iconAnchor: [20, 40],
            });

            // ── Delivery boy marker ────────────────────────────────────────
            if (deliveryBoyLoc?.lat != null) {
                dbMarkerRef.current = L.marker(
                    [deliveryBoyLoc.lat, deliveryBoyLoc.lng],
                    { icon: truckIcon }
                ).bindPopup(snapshot?.name || "Delivery Partner").addTo(map);
            }

            // ── Customer marker ────────────────────────────────────────────
            if (customerLoc?.lat != null) {
                L.marker([customerLoc.lat, customerLoc.lng], { icon: pinIcon })
                    .bindPopup("Your Location").addTo(map);
            }

            // ── Line between them ──────────────────────────────────────────
            if (deliveryBoyLoc?.lat != null && customerLoc?.lat != null) {
                lineRef.current = L.polyline(
                    [[deliveryBoyLoc.lat, deliveryBoyLoc.lng], [customerLoc.lat, customerLoc.lng]],
                    { color: "#3b82f6", weight: 3, opacity: 0.7, dashArray: "10 6" }
                ).addTo(map);
                map.fitBounds(lineRef.current.getBounds(), { padding: [50, 50] });
            }

            mapRef.current = map;

            // ✅ CRITICAL: tell Leaflet the real container size
            setTimeout(() => map.invalidateSize(), 100);
        });

        return () => {
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
                initRef.current = false;
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ── Update marker & line when delivery boy moves ───────────────────────
    useEffect(() => {
        if (!mapRef.current || !deliveryBoyLoc?.lat) return;

        const ll = [deliveryBoyLoc.lat, deliveryBoyLoc.lng];

        if (dbMarkerRef.current) {
            dbMarkerRef.current.setLatLng(ll);
        } else {
            // First location update but map already init (late arrival)
            import("leaflet").then((L) => {
                const truckIcon = L.divIcon({
                    html: `<div style="background:#3b82f6;width:40px;height:40px;border-radius:50%;border:3px solid #fff;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 10px rgba(59,130,246,.55)">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="white" viewBox="0 0 24 24">
                            <path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4z"/>
                        </svg></div>`,
                    className: "", iconSize: [40, 40], iconAnchor: [20, 20],
                });
                dbMarkerRef.current = L.marker(ll, { icon: truckIcon })
                    .bindPopup(snapshot?.name || "Delivery Partner")
                    .addTo(mapRef.current);
            });
        }

        // Smooth pan to delivery boy
        mapRef.current.panTo(ll, { animate: true, duration: 0.8 });

        // Update line
        if (lineRef.current && customerLoc?.lat != null) {
            lineRef.current.setLatLngs([ll, [customerLoc.lat, customerLoc.lng]]);
        } else if (!lineRef.current && customerLoc?.lat != null) {
            import("leaflet").then((L) => {
                lineRef.current = L.polyline(
                    [ll, [customerLoc.lat, customerLoc.lng]],
                    { color: "#3b82f6", weight: 3, opacity: 0.7, dashArray: "10 6" }
                ).addTo(mapRef.current);
            });
        }
    }, [deliveryBoyLoc, customerLoc, snapshot]);

    return (
        <div className="bg-card border border-indigo-500/30 rounded-2xl">
            {/* Header */}
            <div className="bg-indigo-500/10 px-5 py-3.5 flex items-center justify-between border-b border-indigo-500/20 rounded-t-2xl">
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse inline-block" />
                    <p className="text-indigo-400 font-bold text-sm">Live Delivery Tracking</p>
                </div>
                {distance && eta ? (
                    <p className="text-indigo-300 text-xs font-semibold">
                        {distance} km · ~{eta} min
                    </p>
                ) : (
                    <p className="text-indigo-300/60 text-xs">Calculating distance...</p>
                )}
            </div>

            {/* Delivery boy info */}
            {snapshot?.name && (
                <div className="px-5 py-3 flex items-center gap-3 border-b border-accent-10">
                    <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center font-black text-indigo-400 text-lg uppercase select-none">
                        {snapshot.name[0]}
                    </div>
                    <div className="flex-1">
                        <p className="text-heading font-bold text-sm">{snapshot.name}</p>
                        {snapshot.phone && (
                            <a href={`tel:${snapshot.phone}`}
                                className="text-[var(--color-primary)] text-xs flex items-center gap-1 hover:underline">
                                <Phone size={10} /> {snapshot.phone}
                            </a>
                        )}
                    </div>
                    <div className="flex items-center gap-1.5">
                        <Truck size={14} className="text-indigo-400" />
                        <span className="text-indigo-400 text-xs font-bold">On the way</span>
                    </div>
                </div>
            )}

            {/* ✅ Map — NO overflow-hidden, explicit px height */}
            <div style={{ position: "relative", height: "320px", borderRadius: "0 0 1rem 1rem" }}>
                {/* Map div */}
                <div
                    ref={divRef}
                    style={{ width: "100%", height: "100%", borderRadius: "0 0 1rem 1rem" }}
                />

                {/* Waiting overlay — z-index higher than Leaflet tiles (400) */}
                {!deliveryBoyLoc && (
                    <div style={{
                        position: "absolute", inset: 0, zIndex: 500,
                        display: "flex", flexDirection: "column",
                        alignItems: "center", justifyContent: "center",
                        background: "rgba(var(--card-rgb, 255,255,255), 0.88)",
                        borderRadius: "0 0 1rem 1rem",
                    }}>
                        <Navigation size={28} className="text-indigo-400 mb-2 animate-bounce" />
                        <p className="text-body text-sm font-semibold">Waiting for partner&apos;s location...</p>
                        <p className="text-body text-xs mt-1 opacity-60">Updates every few seconds</p>
                    </div>
                )}
            </div>

            {/* Legend */}
            <div className="px-5 py-2.5 flex items-center gap-4 border-t border-accent-10 rounded-b-2xl">
                <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-blue-500 inline-block" />
                    <span className="text-body text-xs">Delivery Partner</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-red-500 inline-block" />
                    <span className="text-body text-xs">Your Location</span>
                </div>
                {!customerLoc?.lat && (
                    <span className="text-yellow-500 text-xs ml-auto">
                        ⚠ Location not shared at order time
                    </span>
                )}
            </div>
        </div>
    );
}

// ─── Timeline ─────────────────────────────────────────────────────────────────
function Timeline({ entries }) {
    return (
        <div className="space-y-0">
            {entries.map((entry, i) => {
                const cfg = STATUS_CONFIG[entry.status] || STATUS_CONFIG.pending;
                const Icon = cfg.icon;
                return (
                    <div key={i} className="flex gap-3">
                        <div className="flex flex-col items-center">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${cfg.bg}`}>
                                <Icon size={14} className={cfg.color} />
                            </div>
                            {i < entries.length - 1 && <div className="w-0.5 h-6 bg-accent-10 my-1" />}
                        </div>
                        <div className="pb-4">
                            <p className={`text-sm font-bold ${cfg.color}`}>{cfg.label || entry.status}</p>
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
        setLoading(true); setError(null);
        try {
            await api.patch(`/api/orders/${orderId}/cancel`, { reason });
            onCancelled(); onClose();
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
                    <button onClick={onClose}><X size={18} className="text-body" /></button>
                </div>
                <p className="text-body text-sm">Please tell us why you want to cancel.</p>
                <textarea value={reason} onChange={e => setReason(e.target.value)}
                    placeholder="Reason (optional)" rows={3}
                    className="w-full px-3.5 py-2.5 text-sm bg-bg border border-accent-10 rounded-xl text-heading outline-none focus:border-[var(--color-danger)] resize-none" />
                {error && <p className="text-[var(--color-danger)] text-xs">{error}</p>}
                <div className="flex gap-3">
                    <button onClick={onClose}
                        className="flex-1 py-2.5 rounded-xl border border-accent-10 text-heading text-sm font-semibold">
                        Keep Order
                    </button>
                    <button onClick={handleCancel} disabled={loading}
                        className="flex-1 py-2.5 rounded-xl bg-[var(--color-danger)] text-white text-sm font-semibold disabled:opacity-60 flex items-center justify-center gap-2">
                        {loading && <Loader2 size={13} className="animate-spin" />}
                        Cancel Order
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function OrderDetailPage() {
    const router = useRouter();
    const { orderId } = useParams();

    const [order, setOrder] = useState(null);
    const [invoice, setInvoice] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showCancel, setShowCancel] = useState(false);
    const [retrying, setRetrying] = useState(false);
    const [retryError, setRetryError] = useState(null);
    const [downloading, setDownloading] = useState(false);
    const [invoiceError, setInvoiceError] = useState(null);
    const [socketOk, setSocketOk] = useState(false);
    const [deliveryBoyLoc, setDeliveryBoyLoc] = useState(null);

    const socketRef = useRef(null);

    // ── Fetch order ───────────────────────────────────────────────────────
    const fetchOrder = useCallback(async () => {
        try {
            const { data } = await api.get(`/api/orders/${orderId}`);
            setOrder(data.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [orderId]);

    useEffect(() => { fetchOrder(); }, [fetchOrder]);

    // Fetch invoice after order loads
    useEffect(() => {
        if (!order?._id) return;
        api.get(`/api/invoices/by-order/${order._id}`)
            .then(({ data }) => setInvoice(data.data || null))
            .catch(() => setInvoice(null));
    }, [order?._id]);

    // ── Socket.IO ─────────────────────────────────────────────────────────
 useEffect(() => {
    if (!order?.user) return;

    if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
    }

    const socket = socketIO(SOCKET_URL, {
        withCredentials: true,
        transports: ["websocket", "polling"],
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 2000,
        timeout: 10000,
    });

    socketRef.current = socket;

    // ✅ String guarantee — ObjectId object হলেও কাজ করবে
    const userId = String(order.user._id || order.user);

    socket.on("connect", () => {
        console.log("✅ Customer socket connected:", socket.id);
        setSocketOk(true);
        socket.emit("join:user", userId);  // ✅ string পাঠাচ্ছি
    });

    socket.on("joined:user", ({ room }) => {
        console.log("✅ Customer joined room:", room);
        // ✅ এটা log হলে room match নিশ্চিত
    });

    socket.on("connect_error", (err) => {
        console.error("❌ Socket error:", err.message);
        setSocketOk(false);
    });

    socket.on("disconnect", (reason) => {
        setSocketOk(false);
    });

    socket.on("reconnect", () => {
        setSocketOk(true);
        socket.emit("join:user", userId);
    });

    socket.on("order:statusUpdate", (data) => {
        if (data.orderId !== orderId) return;
        setOrder(prev => prev ? {
            ...prev,
            orderStatus: data.orderStatus || prev.orderStatus,
            deliveryBoySnapshot: data.deliveryBoySnapshot || prev.deliveryBoySnapshot,
        } : prev);
    });

    socket.on("delivery:locationUpdate", (data) => {
        console.log("📍 Customer received location:", data);  // ✅ এটা আসছে কিনা দেখুন
        if (data.orderId !== orderId) return;
        setDeliveryBoyLoc({ lat: data.lat, lng: data.lng });
    });

    return () => {
        socket.disconnect();
        socketRef.current = null;
    };
}, [order?.user, orderId]);

    // ── Download invoice ──────────────────────────────────────────────────
    const handleDownloadInvoice = async () => {
        if (!invoice?.invoiceNo) {
            setInvoiceError("Invoice not available yet.");
            setTimeout(() => setInvoiceError(null), 3000);
            return;
        }
        setDownloading(true);
        try {
            const res = await api.get(
                `/api/invoices/${invoice.invoiceNo}/download`,
                { responseType: "blob" }
            );
            const url = window.URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
            const a = document.createElement("a");
            a.href = url;
            a.download = `invoice-${invoice.invoiceNo}.pdf`;
            document.body.appendChild(a); a.click(); a.remove();
            window.URL.revokeObjectURL(url);
        } catch {
            setInvoiceError("Download failed.");
            setTimeout(() => setInvoiceError(null), 3000);
        } finally {
            setDownloading(false);
        }
    };

    // ── Retry payment ─────────────────────────────────────────────────────
    const handleRetryPayment = async () => {
        setRetrying(true); setRetryError(null);
        try {
            const { data } = await api.post("/api/payments/retry", { orderId: order.orderId });
            if (data.data.method === "bkash") window.location.href = data.data.bkashURL;
            if (data.data.method === "sslcommerz") window.location.href = data.data.gatewayURL;
        } catch (err) {
            setRetryError(err.response?.data?.message || "Payment failed.");
            setRetrying(false);
        }
    };

    // ── Render ────────────────────────────────────────────────────────────
    if (loading) return (
        <div className="min-h-screen bg-bg flex items-center justify-center">
            <Loader2 size={28} className="animate-spin text-[var(--color-primary)]" />
        </div>
    );

    if (!order) return (
        <div className="min-h-screen bg-bg flex items-center justify-center">
            <p className="text-body">Order not found.</p>
        </div>
    );

    const cfg = STATUS_CONFIG[order.orderStatus] || STATUS_CONFIG.pending;
    const payCfg = PAYMENT_STATUS[order.paymentStatus] || PAYMENT_STATUS.pending;
    const StatusIcon = cfg.icon;

    const canCancel = ["pending", "confirmed"].includes(order.orderStatus);
    const canRetry = order.paymentMethod !== "cod"
        && ["failed", "pending"].includes(order.paymentStatus)
        && !["cancelled", "delivered"].includes(order.orderStatus);
    const isShipped = order.orderStatus === "shipped";
    const payLabel = {
        bkash: "bKash", sslcommerz: "SSL Commerce", cod: "Cash on Delivery",
    }[order.paymentMethod] || order.paymentMethod;

    return (
        <div className="min-h-screen bg-bg">
            <div className="max-w-3xl mx-auto px-4 lg:px-8 py-8 space-y-5">

                {/* ── Header ── */}
                <div className="flex flex-wrap items-center gap-3">
                    <button onClick={() => router.push("/orders")}
                        className="text-body hover:text-heading transition-colors">
                        <ArrowLeft size={20} />
                    </button>
                    <div className="flex-1 min-w-[200px]">
                        <h1 className="text-heading font-black text-xl">{order.orderId}</h1>
                        <div className="flex items-center gap-2 mt-0.5">
                            <p className="text-body text-xs">
                                Placed {new Date(order.createdAt).toLocaleDateString("en-BD", {
                                    day: "numeric", month: "long", year: "numeric",
                                })}
                            </p>
                            <span title={socketOk ? "Live updates on" : "Reconnecting..."}>
                                {socketOk
                                    ? <Wifi size={11} className="text-emerald-400" />
                                    : <WifiOff size={11} className="text-gray-400 animate-pulse" />}
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={handleDownloadInvoice} disabled={downloading || !invoice}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-xs font-bold transition-all
                                ${invoice
                                    ? "border-[var(--color-primary)]/30 bg-card text-heading hover:bg-[var(--color-primary)]/8"
                                    : "border-accent-10 bg-card text-body opacity-50 cursor-not-allowed"}`}>
                            {downloading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                            {invoice ? "Invoice" : "No Invoice"}
                        </button>
                        <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${cfg.color} ${cfg.bg}`}>
                            <StatusIcon size={12} /> {cfg.label}
                        </span>
                    </div>
                </div>

                {invoiceError && (
                    <div className="p-3 rounded-xl bg-red-500/8 border border-red-500/20 text-red-400 text-sm">
                        {invoiceError}
                    </div>
                )}

                {invoice && (
                    <div className="flex items-center justify-between p-3 rounded-xl bg-green-500/8 border border-green-500/20">
                        <div className="flex items-center gap-2 text-green-600 text-xs font-semibold">
                            <Download size={13} />
                            Invoice #{invoice.invoiceNo} available
                        </div>
                        <button onClick={handleDownloadInvoice} disabled={downloading}
                            className="text-green-600 text-xs font-bold hover:underline">
                            {downloading ? "..." : "Download PDF"}
                        </button>
                    </div>
                )}

                {/* Retry Payment */}
                {canRetry && (
                    <div className="bg-[var(--color-primary)]/8 border border-[var(--color-primary)]/25 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div className="flex items-start gap-3">
                            <div className="w-9 h-9 bg-[var(--color-primary)]/15 rounded-xl flex items-center justify-center flex-shrink-0">
                                <CreditCard size={16} className="text-[var(--color-primary)]" />
                            </div>
                            <div>
                                <p className="text-heading font-bold text-sm">Payment Incomplete</p>
                                <p className="text-body text-xs mt-0.5">Payment is {order.paymentStatus}.</p>
                                {retryError && <p className="text-[var(--color-danger)] text-xs mt-1">{retryError}</p>}
                            </div>
                        </div>
                        <button onClick={handleRetryPayment} disabled={retrying}
                            className="flex-shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--color-primary)] text-white text-sm font-bold disabled:opacity-60">
                            {retrying
                                ? <><Loader2 size={14} className="animate-spin" /> Processing...</>
                                : <><RefreshCcw size={14} /> Pay Now — ৳{order.total?.toLocaleString()}</>}
                        </button>
                    </div>
                )}

                {/* ── Real-time Map ── */}
                {isShipped && (
                    <DeliveryMap
                        order={order}
                        deliveryBoyLoc={deliveryBoyLoc}
                        customerLoc={order.customerLocation}
                        snapshot={order.deliveryBoySnapshot}
                    />
                )}

                {/* Prepared Banner */}
                {order.orderStatus === "prepared" && (
                    <div className="flex items-center gap-3 p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-2xl">
                        <Package size={20} className="text-cyan-400 flex-shrink-0" />
                        <div>
                            <p className="text-cyan-400 font-bold text-sm">Your order is packed and ready!</p>
                            <p className="text-body text-xs mt-0.5">A delivery partner will be assigned soon.</p>
                        </div>
                    </div>
                )}

                {/* Items */}
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
                                        : <div className="w-full h-full flex items-center justify-center"><Package size={16} className="text-body opacity-30" /></div>}
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
                    <div className="px-5 py-4 border-t border-accent-10 space-y-2">
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

                {/* Address + Payment */}
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

                        {order.deliveryBoySnapshot?.name && (
                            <div className="mt-3 pt-3 border-t border-accent-10">
                                <p className="text-body text-xs font-bold uppercase tracking-wider mb-1.5">
                                    Delivery Partner
                                </p>
                                <p className="text-heading font-semibold text-sm flex items-center gap-1.5">
                                    <User size={12} className="text-[var(--color-primary)]" />
                                    {order.deliveryBoySnapshot.name}
                                </p>
                                {order.deliveryBoySnapshot.phone && (
                                    <a href={`tel:${order.deliveryBoySnapshot.phone}`}
                                        className="text-body text-xs flex items-center gap-1.5 mt-0.5 hover:text-[var(--color-primary)] transition-colors">
                                        <Phone size={11} className="text-[var(--color-primary)]" />
                                        {order.deliveryBoySnapshot.phone}
                                    </a>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Timeline */}
                {order.timeline?.length > 0 && (
                    <div className="bg-card border border-accent-10 rounded-2xl p-5">
                        <h2 className="text-heading font-bold text-sm flex items-center gap-2 mb-5">
                            <Clock size={14} className="text-[var(--color-primary)]" /> Order Timeline
                        </h2>
                        <Timeline entries={[...order.timeline].reverse()} />
                    </div>
                )}

                {canCancel && (
                    <div className="flex justify-end">
                        <button onClick={() => setShowCancel(true)}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-[var(--color-danger)]/30 text-[var(--color-danger)] text-sm font-semibold hover:bg-[var(--color-danger)]/8 transition-colors">
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