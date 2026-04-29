"use client";


import api from "@/app/lib/api";
import { ArrowLeft, ArrowRight, Check, CreditCard, Loader2, MapPin, Package, X } from "lucide-react";
import { useRouter } from "next/navigation"; 
import { useEffect, useState } from "react";

// ─── Buy Now Modal ─────────────────────────────────────────────────────────────
 export const BuyNowModal = ({ product, selectedVariant, qty, onClose }) => {
    const router = useRouter();
    const [step, setStep] = useState(1); // 1=address, 2=payment, 3=confirm
    const [addresses, setAddresses] = useState([]);
    const [addrLoading, setAddrLoading] = useState(true);
    const [selectedAddrId, setSelectedAddrId] = useState(null);
    const [selectedAddress, setSelectedAddress] = useState(null);
    const [paymentMethod, setPaymentMethod] = useState("cod");
    const [placing, setPlacing] = useState(false);
    const [error, setError] = useState(null);
    const [note, setNote] = useState("");

    const price = selectedVariant?.price ?? product.discountedPrice ?? product.basePrice;
    const subtotal = price * qty;
    const shippingFee = subtotal >= 500 ? 0 : 80;
    const total = subtotal + shippingFee;

    useEffect(() => {
        api.get("/api/addresses")
            .then(({ data }) => {
                setAddresses(data.data || []);
                const def = data.data?.find(a => a.isDefault) || data.data?.[0];
                if (def) {
                    setSelectedAddrId(def._id);
                    setSelectedAddress(def);
                }
            })
            .catch(console.error)
            .finally(() => setAddrLoading(false));
    }, []);

    const handlePlace = async () => {
        if (!selectedAddrId) return;
        setPlacing(true);
        setError(null);
        try {
            const { data } = await api.post("/api/orders/buy-now", {
                productId: product._id,
                variantId: selectedVariant?._id || undefined,
                quantity: qty,
                shippingAddressId: selectedAddrId,
                paymentMethod,
                customerNote: note,
            });

            const orderId = data.data.orderId;
            onClose();

            if (paymentMethod === "bkash") {
                const bkRes = await api.post("/api/payments/bkash/create", { orderId });
                window.location.href = bkRes.data.data.bkashURL;
                return;
            }
            if (paymentMethod === "sslcommerz") {
                const sslRes = await api.post("/api/payments/sslcommerz/init", { orderId });
                window.location.href = sslRes.data.data.gatewayURL;
                return;
            }
            // COD
            router.push(`/payment/success?orderId=${orderId}`);
        } catch (err) {
            setError(err.response?.data?.message || "Order দেওয়া যায়নি। আবার চেষ্টা করুন।");
        } finally {
            setPlacing(false);
        }
    };

    const PAYMENT_OPTIONS = [
        { id: "cod", label: "Cash on Delivery", icon: "💵" },
        { id: "bkash", label: "bKash", icon: "📱" },
        { id: "sslcommerz", label: "Card / SSL", icon: "💳" },
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

            {/* Sheet */}
            <div className="relative bg-card w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl z-10 max-h-[92vh] flex flex-col">

                {/* Header */}
                <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-accent-10 flex-shrink-0">
                    <div>
                        <h2 className="text-heading font-black text-lg">Buy Now</h2>
                        <p className="text-body text-xs mt-0.5">
                            {step === 1 ? "Delivery address নির্বাচন করুন" :
                                step === 2 ? "Payment method বেছে নিন" :
                                    "Order confirm করুন"}
                        </p>
                    </div>
                    <button onClick={onClose}
                        className="w-8 h-8 rounded-full bg-[var(--accent-opacity)] flex items-center justify-center hover:bg-[var(--color-danger)]/10 transition-colors">
                        <X size={16} className="text-heading" />
                    </button>
                </div>

                {/* Step indicator */}
                <div className="flex gap-1 px-6 pt-3 flex-shrink-0">
                    {[1, 2, 3].map(s => (
                        <div key={s} className={`h-1 flex-1 rounded-full transition-all duration-300
                            ${s <= step ? "bg-[var(--color-primary)]" : "bg-[var(--accent-opacity)]"}`} />
                    ))}
                </div>

                {/* Scrollable content */}
                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">

                    {/* Product preview */}
                    <div className="flex items-center gap-3 p-3 bg-bg rounded-2xl border border-accent-10">
                        <div className="w-14 h-14 rounded-xl overflow-hidden bg-[var(--accent-opacity)] flex-shrink-0">
                            {product.images?.[0]
                                ? <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                                : <div className="w-full h-full flex items-center justify-center"><Package size={20} className="text-body opacity-30" /></div>
                            }
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-heading text-sm font-bold line-clamp-1">{product.name}</p>
                            {selectedVariant && (
                                <p className="text-body text-xs">{selectedVariant.size} {selectedVariant.color}</p>
                            )}
                            <p className="text-body text-xs">Qty: {qty}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                            <p className="text-heading font-black">৳{total.toLocaleString()}</p>
                            <p className="text-body text-xs">{shippingFee === 0 ? "Free shipping" : `+৳${shippingFee} shipping`}</p>
                        </div>
                    </div>

                    {/* ── STEP 1: Address ── */}
                    {step === 1 && (
                        <div className="space-y-3">
                            <p className="text-heading text-sm font-bold">Delivery Address</p>
                            {addrLoading ? (
                                <div className="space-y-2">
                                    {[1, 2].map(i => <div key={i} className="h-20 rounded-2xl bg-[var(--accent-opacity)] animate-pulse" />)}
                                </div>
                            ) : addresses.length === 0 ? (
                                <div className="text-center py-6">
                                    <MapPin size={32} className="mx-auto text-body opacity-30 mb-2" />
                                    <p className="text-body text-sm">কোনো address নেই।</p>
                                    <button
                                        onClick={() => router.push("/profile/addresses")}
                                        className="mt-3 text-[var(--color-primary)] text-sm font-semibold hover:underline"
                                    >
                                        Address যোগ করুন →
                                    </button>
                                </div>
                            ) : (
                                addresses.map(addr => (
                                    <button
                                        key={addr._id}
                                        onClick={() => { setSelectedAddrId(addr._id); setSelectedAddress(addr); }}
                                        className={`w-full text-left p-4 rounded-2xl border-2 transition-all
                                            ${selectedAddrId === addr._id
                                                ? "border-[var(--color-primary)] bg-[var(--color-primary)]/5"
                                                : "border-accent-10 hover:border-[var(--color-primary)]/30"
                                            }`}
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <div>
                                                <p className="text-heading text-sm font-bold">{addr.fullName}</p>
                                                <p className="text-body text-xs mt-0.5">{addr.phone}</p>
                                                <p className="text-body text-xs">{addr.addressLine}, {addr.area}, {addr.district}</p>
                                            </div>
                                            <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 mt-1 transition-all
                                                ${selectedAddrId === addr._id ? "border-[var(--color-primary)] bg-[var(--color-primary)]" : "border-accent-10"}`}>
                                                {selectedAddrId === addr._id && <Check size={10} className="text-white m-auto" />}
                                            </div>
                                        </div>
                                        {addr.isDefault && (
                                            <span className="mt-2 inline-block text-xs text-[var(--color-primary)] font-semibold bg-[var(--color-primary)]/10 px-2 py-0.5 rounded-full">Default</span>
                                        )}
                                    </button>
                                ))
                            )}
                        </div>
                    )}

                    {/* ── STEP 2: Payment ── */}
                    {step === 2 && (
                        <div className="space-y-3">
                            <p className="text-heading text-sm font-bold">Payment Method</p>
                            {PAYMENT_OPTIONS.map(opt => (
                                <button
                                    key={opt.id}
                                    onClick={() => setPaymentMethod(opt.id)}
                                    className={`w-full flex items-center gap-3 p-4 rounded-2xl border-2 text-left transition-all
                                        ${paymentMethod === opt.id
                                            ? "border-[var(--color-primary)] bg-[var(--color-primary)]/5"
                                            : "border-accent-10 hover:border-[var(--color-primary)]/30"
                                        }`}
                                >
                                    <span className="text-2xl">{opt.icon}</span>
                                    <span className="text-heading font-bold text-sm flex-1">{opt.label}</span>
                                    <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 transition-all
                                        ${paymentMethod === opt.id ? "border-[var(--color-primary)] bg-[var(--color-primary)]" : "border-accent-10"}`}>
                                        {paymentMethod === opt.id && <Check size={10} className="text-white m-auto" />}
                                    </div>
                                </button>
                            ))}

                            <div>
                                <label className="text-heading text-sm font-semibold block mb-1.5">
                                    বিশেষ নির্দেশনা <span className="text-body font-normal">(ঐচ্ছিক)</span>
                                </label>
                                <textarea
                                    value={note}
                                    onChange={e => setNote(e.target.value)}
                                    rows={2}
                                    placeholder="যেমন: সন্ধ্যার পর deliver করুন..."
                                    className="w-full px-3 py-2.5 text-sm bg-bg border border-accent-10 rounded-xl text-heading placeholder:text-body outline-none focus:border-[var(--color-primary)] resize-none transition-all"
                                />
                            </div>
                        </div>
                    )}

                    {/* ── STEP 3: Confirm ── */}
                    {step === 3 && (
                        <div className="space-y-3">
                            {/* Address */}
                            <div className="bg-bg rounded-2xl p-4 border border-accent-10">
                                <p className="text-body text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                    <MapPin size={11} /> Delivering to
                                </p>
                                <p className="text-heading font-bold text-sm">{selectedAddress?.fullName}</p>
                                <p className="text-body text-xs mt-0.5">{selectedAddress?.phone}</p>
                                <p className="text-body text-xs">{selectedAddress?.addressLine}, {selectedAddress?.area}, {selectedAddress?.district}</p>
                            </div>

                            {/* Payment */}
                            <div className="bg-bg rounded-2xl p-4 border border-accent-10">
                                <p className="text-body text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                    <CreditCard size={11} /> Payment
                                </p>
                                <p className="text-heading font-bold text-sm">
                                    {PAYMENT_OPTIONS.find(p => p.id === paymentMethod)?.icon}{" "}
                                    {PAYMENT_OPTIONS.find(p => p.id === paymentMethod)?.label}
                                </p>
                            </div>

                            {/* Price breakdown */}
                            <div className="bg-bg rounded-2xl p-4 border border-accent-10 space-y-2 text-sm">
                                <div className="flex justify-between text-body">
                                    <span>Subtotal ({qty}x)</span>
                                    <span>৳{subtotal.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-body">
                                    <span>Shipping</span>
                                    <span className={shippingFee === 0 ? "text-green-600 font-semibold" : ""}>
                                        {shippingFee === 0 ? "Free" : `৳${shippingFee}`}
                                    </span>
                                </div>
                                <div className="flex justify-between font-black text-heading text-base border-t border-accent-10 pt-2">
                                    <span>Total</span>
                                    <span className="text-[var(--color-primary)]">৳{total.toLocaleString()}</span>
                                </div>
                            </div>

                            {error && (
                                <div className="p-3 rounded-xl bg-[var(--color-danger)]/10 border border-[var(--color-danger)]/20 text-[var(--color-danger)] text-sm font-medium">
                                    {error}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer buttons */}
                <div className="px-6 pb-6 pt-3 border-t border-accent-10 flex-shrink-0 space-y-2">
                    {step < 3 ? (
                        <div className="flex gap-3">
                            {step > 1 && (
                                <button
                                    onClick={() => setStep(s => s - 1)}
                                    className="flex-1 py-3 rounded-xl border border-accent-10 text-heading font-bold text-sm hover:bg-[var(--accent-opacity)] transition-colors flex items-center justify-center gap-2"
                                >
                                    <ArrowLeft size={15} /> Back
                                </button>
                            )}
                            <button
                                onClick={() => setStep(s => s + 1)}
                                disabled={step === 1 && !selectedAddrId}
                                className="flex-1 py-3 rounded-xl bg-[var(--color-primary)] hover:bg-[var(--color-secondary)] text-white font-bold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                {step === 1 ? "Payment এ যান" : "Review করুন"} <ArrowRight size={15} />
                            </button>
                        </div>
                    ) : (
                        <div className="flex gap-3">
                            <button
                                onClick={() => setStep(2)}
                                className="flex-1 py-3 rounded-xl border border-accent-10 text-heading font-bold text-sm hover:bg-[var(--accent-opacity)] transition-colors flex items-center justify-center gap-2"
                            >
                                <ArrowLeft size={15} /> Back
                            </button>
                            <button
                                onClick={handlePlace}
                                disabled={placing}
                                className="flex-1 py-3.5 rounded-xl bg-[var(--color-primary)] hover:bg-[var(--color-secondary)] text-white font-black text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-60 shadow-lg shadow-[var(--color-primary)]/25"
                            >
                                {placing
                                    ? <><Loader2 size={15} className="animate-spin" /> Placing...</>
                                    : <>Confirm Order ৳{total.toLocaleString()} ✓</>
                                }
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}