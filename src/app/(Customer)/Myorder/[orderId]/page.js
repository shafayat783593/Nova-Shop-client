"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { io as socketIO } from "socket.io-client";
import {
    ArrowLeft, Package, MapPin, CreditCard, Clock,
    CheckCircle2, Truck, XCircle, RotateCcw,
    Loader2, Phone, User, Zap, Tag, X, RefreshCcw, Download,
    Navigation, AlertCircle,
} from "lucide-react";
import api from "@/app/lib/api";

// ─── Status configs ───────────────────────────────────────────────────────────
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

// ─── Real-time Delivery Tracker ───────────────────────────────────────────────
// Shown when orderStatus === "shipped" and delivery boy is on the way
function DeliveryTracker({ order, deliveryBoyLocation, customerLocation }) {
    const mapRef = useRef(null);
    const mapObjRef = useRef(null);
    const dbMarkerRef = useRef(null);
    const cusMarkerRef = useRef(null);
    const lineRef = useRef(null);

    const [mapReady, setMapReady] = useState(false);
    const [distance, setDistance] = useState(null);
    const [eta, setEta] = useState(null);

    const snapshot = order.deliveryBoySnapshot;

    // ── Calculate distance & ETA when location changes ────────────────────
    useEffect(() => {
        if (!deliveryBoyLocation || !customerLocation?.lat) return;
        const dist = calcDistance(
            deliveryBoyLocation.lat, deliveryBoyLocation.lng,
            customerLocation.lat, customerLocation.lng
        );
        setDistance(dist.toFixed(2));
        // avg 20 km/h in city traffic
        setEta(Math.ceil((dist / 20) * 60));
    }, [deliveryBoyLocation, customerLocation]);

    // ── Load Leaflet map ───────────────────────────────────────────────────
    useEffect(() => {
        if (typeof window === "undefined" || !mapRef.current) return;
        if (mapObjRef.current) return; // already initialized

        import("leaflet").then(L => {
            // Fix default icon
            delete L.Icon.Default.prototype._getIconUrl;
            L.Icon.Default.mergeOptions({
                iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
                iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
                shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
            });

            const initialLat = deliveryBoyLocation?.lat || customerLocation?.lat || 23.8103;
            const initialLng = deliveryBoyLocation?.lng || customerLocation?.lng || 90.4125;

            const map = L.map(mapRef.current).setView([initialLat, initialLng], 14);

            L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
                attribution: "© OpenStreetMap contributors",
            }).addTo(map);

            // Delivery boy marker (blue)
            const dbIcon = L.divIcon({
                html: `<div style="background:#3b82f6;width:36px;height:36px;border-radius:50%;border:3px solid white;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,0.3)">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="white" viewBox="0 0 24 24"><path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9l1.96 2.5H17V9.5h2.5zm-1.5 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/></svg>
                        </div>`,
                className: "",
                iconSize: [36, 36],
                iconAnchor: [18, 18],
            });

            // Customer marker (red)
            const cusIcon = L.divIcon({
                html: `<div style="background:#ef4444;width:36px;height:36px;border-radius:50%;border:3px solid white;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,0.3)">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="white" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
                        </div>`,
                className: "",
                iconSize: [36, 36],
                iconAnchor: [18, 36],
            });

            if (deliveryBoyLocation) {
                dbMarkerRef.current = L.marker(
                    [deliveryBoyLocation.lat, deliveryBoyLocation.lng],
                    { icon: dbIcon }
                ).bindPopup("Delivery Partner").addTo(map);
            }

            if (customerLocation?.lat) {
                cusMarkerRef.current = L.marker(
                    [customerLocation.lat, customerLocation.lng],
                    { icon: cusIcon }
                ).bindPopup("Your Location").addTo(map);
            }

            if (deliveryBoyLocation && customerLocation?.lat) {
                lineRef.current = L.polyline(
                    [[deliveryBoyLocation.lat, deliveryBoyLocation.lng], [customerLocation.lat, customerLocation.lng]],
                    { color: "#3b82f6", weight: 3, opacity: 0.7, dashArray: "8 8" }
                ).addTo(map);

                map.fitBounds([
                    [deliveryBoyLocation.lat, deliveryBoyLocation.lng],
                    [customerLocation.lat, customerLocation.lng],
                ], { padding: [40, 40] });
            }

            mapObjRef.current = map;
            setMapReady(true);
        });

        return () => {
            if (mapObjRef.current) {
                mapObjRef.current.remove();
                mapObjRef.current = null;
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // init once

    // ── Update delivery boy marker position ────────────────────────────────
    useEffect(() => {
        if (!mapObjRef.current || !deliveryBoyLocation) return;

        import("leaflet").then(L => {
            if (dbMarkerRef.current) {
                dbMarkerRef.current.setLatLng([deliveryBoyLocation.lat, deliveryBoyLocation.lng]);
            }

            if (lineRef.current && customerLocation?.lat) {
                lineRef.current.setLatLngs([
                    [deliveryBoyLocation.lat, deliveryBoyLocation.lng],
                    [customerLocation.lat, customerLocation.lng],
                ]);
            }
        });
    }, [deliveryBoyLocation, customerLocation]);

    return (
        <div className="bg-card border border-indigo-500/30 rounded-2xl overflow-hidden">
            {/* Header */}
            <div className="bg-indigo-500/10 px-5 py-3.5 flex items-center justify-between border-b border-indigo-500/20">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
                    <p className="text-indigo-400 font-bold text-sm">Live Delivery Tracking</p>
                </div>
                {distance && (
                    <p className="text-indigo-300 text-xs font-semibold">
                        {distance} km away · ~{eta} min
                    </p>
                )}
            </div>

            {/* Delivery Boy Info */}
            {snapshot?.name && (
                <div className="px-5 py-3 flex items-center gap-3 border-b border-accent-10">
                    <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center font-black text-indigo-400 uppercase">
                        {snapshot.name[0]}
                    </div>
                    <div>
                        <p className="text-heading font-bold text-sm">{snapshot.name}</p>
                        {snapshot.phone && (
                            <a
                                href={`tel:${snapshot.phone}`}
                                className="text-[var(--color-primary)] text-xs flex items-center gap-1 hover:underline"
                            >
                                <Phone size={10} /> {snapshot.phone}
                            </a>
                        )}
                    </div>
                    <div className="ml-auto flex items-center gap-1.5">
                        <Truck size={14} className="text-indigo-400" />
                        <span className="text-indigo-400 text-xs font-bold">On the way</span>
                    </div>
                </div>
            )}

            {/* Leaflet CSS */}
            <link
                rel="stylesheet"
                href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
                crossOrigin=""
            />

            {/* Map */}
            <div ref={mapRef} className="w-full h-72" />

            {/* No location yet */}
            {!deliveryBoyLocation && (
                <div className="absolute inset-0 flex items-center justify-center bg-card/80 z-10 rounded-b-2xl">
                    <div className="text-center px-4">
                        <Navigation size={28} className="text-body mx-auto mb-2 animate-bounce" />
                        <p className="text-body text-sm">Waiting for delivery partner location...</p>
                    </div>
                </div>
            )}
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
                            {i < entries.length - 1 && (
                                <div className="w-0.5 h-6 bg-accent-10 my-1" />
                            )}
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
                    <button onClick={onClose}
                        className="flex-1 py-2.5 rounded-xl border border-accent-10 text-heading text-sm font-semibold hover:bg-[var(--accent-opacity)] transition-colors">
                        Keep Order
                    </button>
                    <button onClick={handleCancel} disabled={loading}
                        className="flex-1 py-2.5 rounded-xl bg-[var(--color-danger)] text-white text-sm font-semibold hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2">
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

    // Real-time delivery tracking
    const [deliveryBoyLoc, setDeliveryBoyLoc] = useState(null);
    const socketRef = useRef(null);

    // ── Fetch order ───────────────────────────────────────────────────────
    const fetchOrder = useCallback(async () => {
        try {
            const { data } = await api.get(`/api/orders/${orderId}`);
            setOrder(data.data);
        } catch (err) {
            console.error("Fetch order error:", err);
        } finally {
            setLoading(false);
        }
    }, [orderId]);

    const fetchInvoice = useCallback(async (orderMongoId) => {
        if (!orderMongoId) return;
        try {
            const { data } = await api.get(`/api/invoices/by-order/${orderMongoId}`);
            setInvoice(data.data || null);
        } catch {
            setInvoice(null);
        }
    }, []);

    useEffect(() => { fetchOrder(); }, [fetchOrder]);

    useEffect(() => {
        if (order?._id) fetchInvoice(order._id);
    }, [order?._id, fetchInvoice]);

    // ── Socket.IO — real-time tracking ────────────────────────────────────
    useEffect(() => {
        if (!order?.user) return;

        const socket = socketIO(process.env.NEXT_PUBLIC_SOCKET_URL || "", {
            withCredentials: true,
            transports: ["websocket"],
        });
        socketRef.current = socket;

        socket.on("connect", () => {
            socket.emit("join:user", order.user);
        });

        // Real-time status updates
        socket.on("order:statusUpdate", (data) => {
            if (data.orderId === orderId) {
                setOrder(prev => prev ? {
                    ...prev,
                    orderStatus: data.orderStatus,
                    deliveryBoySnapshot: data.deliveryBoySnapshot || prev.deliveryBoySnapshot,
                } : prev);
            }
        });

        // Real-time location update from delivery boy
        socket.on("delivery:locationUpdate", (data) => {
            if (data.orderId === orderId) {
                setDeliveryBoyLoc({ lat: data.lat, lng: data.lng });
            }
        });

        return () => socket.disconnect();
    }, [order?.user, orderId]);

    // ── Download invoice ──────────────────────────────────────────────────
    const handleDownloadInvoice = async () => {
        if (!invoice?.invoiceNo) {
            setInvoiceError("Invoice not available yet.");
            setTimeout(() => setInvoiceError(null), 4000);
            return;
        }
        setDownloading(true);
        try {
            const response = await api.get(
                `/api/invoices/${invoice.invoiceNo}/download`,
                { responseType: "blob" }
            );
            const url = window.URL.createObjectURL(new Blob([response.data], { type: "application/pdf" }));
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", `invoice-${invoice.invoiceNo}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch {
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
            if (data.data.method === "bkash") window.location.href = data.data.bkashURL;
            if (data.data.method === "sslcommerz") window.location.href = data.data.gatewayURL;
        } catch (err) {
            setRetryError(err.response?.data?.message || "Payment failed. Please try again.");
            setRetrying(false);
        }
    };

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

    const cfg = STATUS_CONFIG[order.orderStatus] || STATUS_CONFIG.pending;
    const payCfg = PAYMENT_STATUS[order.paymentStatus] || PAYMENT_STATUS.pending;
    const StatusIcon = cfg.icon;

    const canCancel = ["pending", "confirmed"].includes(order.orderStatus);
    const canRetry = order.paymentMethod !== "cod"
        && ["failed", "pending"].includes(order.paymentStatus)
        && !["cancelled", "delivered"].includes(order.orderStatus);

    const isShipped = order.orderStatus === "shipped";
    const payLabel = { bkash: "bKash", sslcommerz: "SSL Commerce", cod: "Cash on Delivery" }[order.paymentMethod] || order.paymentMethod;

    return (
        <div className="min-h-screen bg-bg">
            <div className="max-w-3xl mx-auto px-4 lg:px-8 py-8 space-y-5">

                {/* ── Header ────────────────────────────────────────────── */}
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
                        <button
                            onClick={handleDownloadInvoice}
                            disabled={downloading || !invoice}
                            title={invoice ? `Download Invoice ${invoice.invoiceNo}` : "Invoice not available yet"}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-xs font-bold transition-all
                                ${invoice
                                    ? "border-[var(--color-primary)]/30 bg-card text-heading hover:bg-[var(--color-primary)]/8"
                                    : "border-accent-10 bg-card text-body opacity-50 cursor-not-allowed"}`}
                        >
                            {downloading
                                ? <Loader2 size={14} className="animate-spin" />
                                : <Download size={14} className={invoice ? "text-[var(--color-primary)]" : "text-body"} />}
                            {invoice ? "Invoice" : "No Invoice"}
                        </button>
                        <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${cfg.color} ${cfg.bg}`}>
                            <StatusIcon size={12} /> {cfg.label}
                        </span>
                    </div>
                </div>

                {invoiceError && (
                    <div className="p-3 rounded-xl bg-[var(--color-danger)]/8 border border-[var(--color-danger)]/20 text-[var(--color-danger)] text-sm">
                        {invoiceError}
                    </div>
                )}

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
                        <button onClick={handleDownloadInvoice} disabled={downloading}
                            className="text-green-600 text-xs font-bold hover:underline">
                            {downloading ? "..." : "Download PDF"}
                        </button>
                    </div>
                )}

                {/* ── Retry Payment Banner ───────────────────────────────── */}
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
                        <button onClick={handleRetryPayment} disabled={retrying}
                            className="flex-shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--color-primary)] hover:bg-[var(--color-secondary)] text-white text-sm font-bold transition-colors disabled:opacity-60 whitespace-nowrap">
                            {retrying
                                ? <><Loader2 size={14} className="animate-spin" /> Processing...</>
                                : <><RefreshCcw size={14} /> Pay Now — ৳{order.total?.toLocaleString()}</>}
                        </button>
                    </div>
                )}

                {/* ── Real-time Delivery Tracker ─────────────────────────── */}
                {isShipped && (
                    <DeliveryTracker
                        order={order}
                        deliveryBoyLocation={deliveryBoyLoc}
                        customerLocation={order.customerLocation}
                    />
                )}

                {/* ── Order Prepared Banner ──────────────────────────────── */}
                {order.orderStatus === "prepared" && (
                    <div className="flex items-center gap-3 p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-2xl">
                        <Package size={20} className="text-cyan-400 flex-shrink-0" />
                        <div>
                            <p className="text-cyan-400 font-bold text-sm">Your order is packed and ready!</p>
                            <p className="text-body text-xs mt-0.5">A delivery partner will be assigned soon.</p>
                        </div>
                    </div>
                )}

                {/* ── Items ─────────────────────────────────────────────── */}
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

                {/* ── Address + Payment ──────────────────────────────────── */}
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

                        {/* Delivery boy info (visible after accept) */}
                        {order.deliveryBoySnapshot?.name && (
                            <div className="mt-3 pt-3 border-t border-accent-10">
                                <p className="text-body text-xs font-bold uppercase tracking-wider mb-1.5">Delivery Partner</p>
                                <p className="text-heading font-semibold text-sm flex items-center gap-1.5">
                                    <User size={12} className="text-[var(--color-primary)]" />
                                    {order.deliveryBoySnapshot.name}
                                </p>
                                {order.deliveryBoySnapshot.phone && (
                                    <a
                                        href={`tel:${order.deliveryBoySnapshot.phone}`}
                                        className="text-body text-xs flex items-center gap-1.5 mt-0.5 hover:text-[var(--color-primary)] transition-colors"
                                    >
                                        <Phone size={11} className="text-[var(--color-primary)]" />
                                        {order.deliveryBoySnapshot.phone}
                                    </a>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Timeline ───────────────────────────────────────────── */}
                {order.timeline?.length > 0 && (
                    <div className="bg-card border border-accent-10 rounded-2xl p-5">
                        <h2 className="text-heading font-bold text-sm flex items-center gap-2 mb-5">
                            <Clock size={14} className="text-[var(--color-primary)]" /> Order Timeline
                        </h2>
                        <Timeline entries={[...order.timeline].reverse()} />
                    </div>
                )}

                {/* ── Cancel ─────────────────────────────────────────────── */}
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