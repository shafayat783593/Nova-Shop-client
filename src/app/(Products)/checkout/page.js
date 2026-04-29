"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
    MapPin, CreditCard, ClipboardList, Plus, Loader2,
    Smartphone, ShieldCheck, Truck, Banknote,
    ArrowLeft, ArrowRight, Package, Zap, Tag, Check,
} from "lucide-react";
import api from "@/app/lib/api";
import { useCart } from "@/app/context/Cartcontext";
import AddressCard from "../address/AddressCard";
import AddressForm from "../address/AddressForm";

// ─── Constants ────────────────────────────────────────────────────────────────
const STEPS = [
    { id: 1, label: "Address", icon: MapPin },
    { id: 2, label: "Payment", icon: CreditCard },
    { id: 3, label: "Review", icon: ClipboardList },
];

const PAYMENT_METHODS = [
    { id: "bkash", label: "bKash", desc: "Pay via bKash mobile banking", icon: Smartphone, color: "text-pink-500", bg: "bg-pink-500/10 border-pink-500/30" },
    { id: "sslcommerz", label: "Card / SSL Commerce", desc: "Visa, Mastercard, Nagad, Rocket", icon: CreditCard, color: "text-blue-500", bg: "bg-blue-500/10 border-blue-500/30" },
    { id: "cod", label: "Cash on Delivery", desc: "Pay when your order arrives", icon: Banknote, color: "text-green-600", bg: "bg-green-500/10 border-green-500/30" },
];

const getShippingFee = (subtotal) => (subtotal >= 500 ? 0 : 80);

// ─── Step Bar ─────────────────────────────────────────────────────────────────
function StepBar({ current }) {
    return (
        <div className="flex items-center justify-center mb-8">
            {STEPS.map((step, idx) => {
                const done = current > step.id;
                const active = current === step.id;
                const Icon = step.icon;
                return (
                    <div key={step.id} className="flex items-center">
                        <div className="flex flex-col items-center gap-1">
                            <div className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all
                                ${done ? "bg-[var(--color-primary)] border-[var(--color-primary)]" : ""}
                                ${active ? "border-[var(--color-primary)] bg-[var(--color-primary)]/10" : ""}
                                ${!done && !active ? "border-accent-10 bg-card" : ""}`}
                            >
                                {done
                                    ? <Check size={16} className="text-white" />
                                    : <Icon size={15} className={active ? "text-[var(--color-primary)]" : "text-body"} />
                                }
                            </div>
                            <span className={`text-xs font-semibold ${active ? "text-[var(--color-primary)]" : "text-body"}`}>
                                {step.label}
                            </span>
                        </div>
                        {idx < STEPS.length - 1 && (
                            <div className={`w-16 sm:w-24 h-0.5 mx-2 mb-5 rounded transition-all
                                ${current > step.id ? "bg-[var(--color-primary)]" : "bg-accent-10"}`}
                            />
                        )}
                    </div>
                );
            })}
        </div>
    );
}

// ─── Order Sidebar ────────────────────────────────────────────────────────────
function OrderSidebar({ items = [], subtotal = 0, discount = 0, shippingFee = 80, total = 0, coupon = null }) {
    return (
        <div className="bg-card border border-accent-10 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-accent-10">
                <h3 className="text-heading font-bold text-sm flex items-center gap-2">
                    <Package size={15} className="text-[var(--color-primary)]" />
                    Order Summary
                    <span className="ml-auto text-body text-xs font-normal">
                        {items.length} item{items.length !== 1 ? "s" : ""}
                    </span>
                </h3>
            </div>

            <div className="px-5 py-3 space-y-2.5 max-h-52 overflow-y-auto">
                {items.map((item, i) => {
                    const img = item.imageSnapshot || item.image || "";
                    const name = item.nameSnapshot || item.name || "Product";
                    const price = (item.finalPrice ?? item.priceAtAdd ?? item.price ?? 0) * (item.quantity || 1);
                    return (
                        <div key={i} className="flex items-center gap-2.5">
                            <div className="w-10 h-10 rounded-lg overflow-hidden bg-bg border border-accent-10 flex-shrink-0">
                                {img
                                    ? <img src={img} alt={name} className="w-full h-full object-cover" />
                                    : <div className="w-full h-full flex items-center justify-center">
                                        <Package size={14} className="text-body opacity-30" />
                                    </div>
                                }
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-heading text-xs font-semibold line-clamp-1">{name}</p>
                                <p className="text-body text-xs">x{item.quantity}</p>
                            </div>
                            <p className="text-heading text-xs font-bold flex-shrink-0">
                                ৳{price.toLocaleString()}
                            </p>
                        </div>
                    );
                })}
            </div>

            <div className="px-5 py-4 border-t border-accent-10 space-y-2">
                <div className="flex justify-between text-sm">
                    <span className="text-body">Subtotal</span>
                    <span className="text-heading font-semibold">৳{subtotal.toLocaleString()}</span>
                </div>
                {discount > 0 && (
                    <div className="flex justify-between text-sm">
                        <span className="text-green-600 flex items-center gap-1"><Zap size={11} /> Discount</span>
                        <span className="text-green-600 font-semibold">-৳{discount.toLocaleString()}</span>
                    </div>
                )}
                {coupon?.code && (
                    <div className="flex justify-between text-sm">
                        <span className="text-green-600 flex items-center gap-1"><Tag size={11} /> {coupon.code}</span>
                        <span className="text-green-600 font-semibold">-৳{coupon.discountAmount?.toLocaleString()}</span>
                    </div>
                )}
                <div className="flex justify-between text-sm">
                    <span className="text-body flex items-center gap-1"><Truck size={11} /> Delivery</span>
                    {shippingFee === 0
                        ? <span className="text-green-600 font-semibold">Free</span>
                        : <span className="text-heading font-semibold">৳{shippingFee}</span>
                    }
                </div>
                {shippingFee > 0 && subtotal > 0 && (
                    <p className="text-body text-xs">
                        Add ৳{Math.max(0, 500 - subtotal).toLocaleString()} more for free shipping
                    </p>
                )}
                <div className="flex justify-between text-base font-bold pt-2 border-t border-accent-10">
                    <span className="text-heading">Total</span>
                    <span className="text-[var(--color-primary)] text-lg">৳{total.toLocaleString()}</span>
                </div>
            </div>
        </div>
    );
}

// ─── Step 1: Address ──────────────────────────────────────────────────────────
function StepAddress({ selectedAddressId, onSelect, onNext }) {
    const [addresses, setAddresses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editAddr, setEditAddr] = useState(null);
    const [deleteId, setDeleteId] = useState(null);

    const fetchAddresses = useCallback(async () => {
        setLoading(true);
        try {
            const { data } = await api.get("/api/addresses");
            const list = data.data || [];
            setAddresses(list);
            if (!selectedAddressId && list.length > 0) {
                const def = list.find(a => a.isDefault) || list[0];
                onSelect(def._id);
            }
        } catch (err) {
            console.error("Fetch addresses:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchAddresses(); }, []);

    const handleDelete = async (id) => {
        setDeleteId(id);
        try {
            await api.delete(`/api/addresses/${id}`);
            setAddresses(prev => prev.filter(a => a._id !== id));
            if (selectedAddressId === id) onSelect(null);
        } catch (err) {
            console.error(err);
        } finally {
            setDeleteId(null);
        }
    };

    const handleSetDefault = async (id) => {
        try {
            await api.patch(`/api/addresses/${id}/default`);
            setAddresses(prev => prev.map(a => ({ ...a, isDefault: a._id === id })));
        } catch (err) {
            console.error(err);
        }
    };

    if (loading) {
        return (
            <div className="space-y-3">
                {[1, 2].map(i => (
                    <div key={i} className="h-28 rounded-2xl bg-[var(--accent-opacity)] animate-pulse" />
                ))}
            </div>
        );
    }

    if (showForm || editAddr) {
        return (
            <div className="bg-bg border border-accent-10 rounded-2xl p-5">
                <h3 className="text-heading font-bold text-sm mb-5">
                    {editAddr ? "Edit Address" : "Add New Address"}
                </h3>
                <AddressForm
                    defaultValues={editAddr}
                    onSuccess={(saved) => {
                        fetchAddresses();
                        setShowForm(false);
                        setEditAddr(null);
                        onSelect(saved._id);
                    }}
                    onCancel={() => { setShowForm(false); setEditAddr(null); }}
                />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="space-y-3">
                {addresses.length === 0 ? (
                    <p className="text-body text-sm text-center py-6">
                        No saved addresses. Add one below.
                    </p>
                ) : (
                    addresses.map(addr => (
                        <AddressCard
                            key={addr._id}
                            address={addr}
                            selectable
                            selected={selectedAddressId === addr._id}
                            onSelect={() => onSelect(addr._id)}
                            onEdit={() => setEditAddr(addr)}
                            onDelete={() => handleDelete(addr._id)}
                            onSetDefault={() => handleSetDefault(addr._id)}
                            deleteLoading={deleteId === addr._id}
                        />
                    ))
                )}
            </div>

            <button
                onClick={() => setShowForm(true)}
                className="w-full py-3 rounded-2xl border-2 border-dashed border-accent-10 hover:border-[var(--color-primary)]/40 transition-all text-body hover:text-[var(--color-primary)] text-sm font-semibold flex items-center justify-center gap-2"
            >
                <Plus size={16} /> Add New Address
            </button>

            <button
                onClick={onNext}
                disabled={!selectedAddressId}
                className="w-full py-3.5 rounded-xl bg-[var(--color-primary)] hover:bg-[var(--color-secondary)] text-white font-bold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
                Continue to Payment <ArrowRight size={16} />
            </button>
        </div>
    );
}

// ─── Step 2: Payment ──────────────────────────────────────────────────────────
function StepPayment({ selected, onSelect, onNext, onBack }) {
    return (
        <div className="space-y-4">
            <div className="space-y-3">
                {PAYMENT_METHODS.map(method => {
                    const Icon = method.icon;
                    const isActive = selected === method.id;
                    return (
                        <button
                            key={method.id}
                            onClick={() => onSelect(method.id)}
                            className={`w-full p-4 rounded-2xl border-2 text-left transition-all
                                ${isActive
                                    ? "border-[var(--color-primary)] bg-[var(--color-primary)]/5"
                                    : "border-accent-10 bg-card hover:border-[var(--color-primary)]/30"
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${method.bg}`}>
                                    <Icon size={18} className={method.color} />
                                </div>
                                <div className="flex-1">
                                    <p className="text-heading font-bold text-sm">{method.label}</p>
                                    <p className="text-body text-xs">{method.desc}</p>
                                </div>
                                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0
                                    ${isActive ? "border-[var(--color-primary)]" : "border-accent-10"}`}
                                >
                                    {isActive && <div className="w-2 h-2 rounded-full bg-[var(--color-primary)]" />}
                                </div>
                            </div>
                        </button>
                    );
                })}
            </div>

            <div className="flex gap-3">
                <button onClick={onBack}
                    className="flex-1 py-3 rounded-xl border border-accent-10 text-heading text-sm font-semibold hover:bg-[var(--accent-opacity)] transition-colors flex items-center justify-center gap-2">
                    <ArrowLeft size={15} /> Back
                </button>
                <button onClick={onNext} disabled={!selected}
                    className="flex-1 py-3 rounded-xl bg-[var(--color-primary)] hover:bg-[var(--color-secondary)] text-white font-bold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-40">
                    Review Order <ArrowRight size={15} />
                </button>
            </div>

            <p className="text-center text-body text-xs flex items-center justify-center gap-1.5">
                <ShieldCheck size={12} className="text-[var(--color-primary)]" />
                All payments are secured and encrypted
            </p>
        </div>
    );
}

// ─── Step 3: Review ───────────────────────────────────────────────────────────
function StepReview({ address, paymentMethod, total, onBack, onPlace, placing }) {
    const payLabel = PAYMENT_METHODS.find(p => p.id === paymentMethod)?.label || paymentMethod;
    const [note, setNote] = useState("");

    return (
        <div className="space-y-4">
            <div className="bg-bg border border-accent-10 rounded-2xl p-4">
                <p className="text-body text-xs font-bold uppercase tracking-wider mb-2">Delivering to</p>
                {address ? (
                    <>
                        <p className="text-heading font-bold text-sm">{address.fullName}</p>
                        <p className="text-body text-sm">{address.addressLine}, {address.area}, {address.district}, {address.division}</p>
                        <p className="text-body text-sm">{address.phone}</p>
                    </>
                ) : (
                    <p className="text-body text-sm">Loading address...</p>
                )}
            </div>

            <div className="bg-bg border border-accent-10 rounded-2xl p-4">
                <p className="text-body text-xs font-bold uppercase tracking-wider mb-2">Payment Method</p>
                <p className="text-heading font-bold text-sm">{payLabel}</p>
                {paymentMethod === "cod" && (
                    <p className="text-body text-xs mt-0.5">Pay ৳{total?.toLocaleString()} when your order arrives</p>
                )}
            </div>

            <div>
                <label className="text-heading text-sm font-semibold block mb-1.5">
                    Order Note <span className="text-body font-normal">(optional)</span>
                </label>
                <textarea
                    value={note}
                    onChange={e => setNote(e.target.value)}
                    placeholder="Any special instructions..."
                    rows={2}
                    className="w-full px-3.5 py-2.5 text-sm bg-bg border border-accent-10 rounded-xl text-heading placeholder:text-body outline-none focus:border-[var(--color-primary)] transition-all resize-none"
                />
            </div>

            <div className="flex gap-3">
                <button onClick={onBack}
                    className="flex-1 py-3 rounded-xl border border-accent-10 text-heading text-sm font-semibold hover:bg-[var(--accent-opacity)] transition-colors flex items-center justify-center gap-2">
                    <ArrowLeft size={15} /> Back
                </button>
                <button onClick={() => onPlace(note)} disabled={placing}
                    className="flex-1 py-3 rounded-xl bg-[var(--color-primary)] hover:bg-[var(--color-secondary)] text-white font-bold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-60">
                    {placing
                        ? <><Loader2 size={15} className="animate-spin" /> Placing...</>
                        : <>Place Order — ৳{total?.toLocaleString()}</>
                    }
                </button>
            </div>
        </div>
    );
}

// ─── Main Checkout Page ───────────────────────────────────────────────────────
export default function CheckoutPage() {
    const router = useRouter();
    const searchParams = useSearchParams();

    // ── URL params ─────────────────────────────────────────────────────────
    const isBuyNow = searchParams.get("mode") === "buynow";
    const productId = searchParams.get("productId") || null;
    const variantId = searchParams.get("variantId") || null;
    const qty = Math.max(1, Number(searchParams.get("qty") || 1));

    // ── Cart context ───────────────────────────────────────────────────────
    const { cart, selectedSummary, loading: cartLoading } = useCart();

    // ✅ selectedSummary is a function — call it here, not inside sidebarData
    const summary = selectedSummary ? selectedSummary() : null;

    // ── State ──────────────────────────────────────────────────────────────
    const [bnProduct, setBnProduct] = useState(null);
    const [bnLoading, setBnLoading] = useState(false);  // ✅ starts false
    const [step, setStep] = useState(1);
    const [error, setError] = useState(null);
    const [selectedAddrId, setSelectedAddrId] = useState(null);
    const [selectedAddress, setSelectedAddress] = useState(null);
    const [paymentMethod, setPaymentMethod] = useState("cod");
    const [placing, setPlacing] = useState(false);

    // ── Fetch product for Buy Now ──────────────────────────────────────────
    useEffect(() => {
        if (!isBuyNow || !productId) return;
        setBnLoading(true);
        api.get(`/api/products/${productId}`)
            .then(({ data }) => setBnProduct(data.data))
            .catch(() => setError("Product not found."))
            .finally(() => setBnLoading(false));
    }, [isBuyNow, productId]);

    // ── Fetch full address when ID selected ────────────────────────────────
    useEffect(() => {
        if (!selectedAddrId) return;
        api.get("/api/addresses")
            .then(({ data }) => {
                const addr = (data.data || []).find(a => a._id === selectedAddrId);
                setSelectedAddress(addr || null);
            })
            .catch(console.error);
    }, [selectedAddrId]);

    // ── Sidebar data ───────────────────────────────────────────────────────
    const sidebarData = (() => {
        if (isBuyNow && bnProduct) {
            const variant = bnProduct.variants?.find(v => v._id === variantId);
            const price = variant?.price ?? bnProduct.discountedPrice ?? bnProduct.basePrice ?? 0;
            const subtotal = price * qty;
            const shippingFee = getShippingFee(subtotal);
            return {
                items: [{ nameSnapshot: bnProduct.name, imageSnapshot: bnProduct.images?.[0] || "", finalPrice: price, quantity: qty }],
                subtotal,
                discount: 0,
                shippingFee,
                total: subtotal + shippingFee,
                coupon: null,
            };
        }

        // Cart mode — use summary from context
        const subtotal = summary?.subtotal || 0;
        const discount = summary?.discount || 0;
        const afterDiscount = Math.max(0, subtotal - discount);
        const couponDiscount = cart?.appliedCoupon?.discountAmount || 0;
        const shippingFee = afterDiscount > 0 ? getShippingFee(afterDiscount) : 0;
        const total = Math.max(0, afterDiscount - couponDiscount + shippingFee);

        return {
            items: summary?.selectedItems || [],
            subtotal,
            discount,
            shippingFee,
            total,
            coupon: cart?.appliedCoupon || null,
        };
    })();

    // ── Place order ────────────────────────────────────────────────────────
    const handlePlaceOrder = async (note) => {
        setPlacing(true);
        setError(null);
        try {
            const basePayload = { shippingAddressId: selectedAddrId, paymentMethod, customerNote: note };
            const endpoint = isBuyNow ? "/api/orders/buy-now" : "/api/orders";
            const payload = isBuyNow
                ? { ...basePayload, productId, variantId: variantId || undefined, quantity: qty }
                : basePayload;

            const { data } = await api.post(endpoint, payload);
            const orderId = data.data.orderId;

            if (paymentMethod === "cod") {
                router.push(`/payment/success?orderId=${orderId}`);
                return;
            }
            if (paymentMethod === "bkash") {
                const { data: bkashRes } = await api.post("/api/payments/bkash/create", { orderId });
                if (bkashRes.data?.bkashURL) { window.location.href = bkashRes.data.bkashURL; return; }
                throw new Error("bKash URL not received");
            }
            if (paymentMethod === "sslcommerz") {
                const { data: sslRes } = await api.post("/api/payments/sslcommerz/init", { orderId });
                if (sslRes.data?.gatewayURL) { window.location.href = sslRes.data.gatewayURL; return; }
                throw new Error("SSLCommerz URL not received");
            }
        } catch (err) {
            setError(err.response?.data?.message || "Failed to place order. Please try again.");
            setPlacing(false);
        }
    };

    // ── Guards ─────────────────────────────────────────────────────────────

    // Buy Now: show spinner only while product is loading
    if (isBuyNow && bnLoading) {
        return (
            <div className="min-h-screen bg-bg flex items-center justify-center">
                <Loader2 size={28} className="animate-spin text-[var(--color-primary)]" />
            </div>
        );
    }

    // Cart mode: wait for cart to finish loading, then check if empty
    // ✅ Don't redirect while cartLoading is true — that causes the skeleton loop
    if (!isBuyNow && !cartLoading && cart !== null && !cart?.items?.length) {
        router.replace("/cart");
        return null;
    }

    return (
        <div className="min-h-screen bg-bg">
            <div className="max-w-5xl mx-auto px-4 lg:px-8 py-8">

                <div className="flex items-center gap-3 mb-8">
                    <button
                        onClick={() => router.push(isBuyNow ? "/" : "/cart")}
                        className="text-body hover:text-heading transition-colors"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <h1 className="text-heading text-xl lg:text-2xl font-black">Checkout</h1>
                    {isBuyNow && (
                        <span className="text-xs font-bold text-[var(--color-primary)] bg-[var(--color-primary)]/10 px-2.5 py-1 rounded-full">
                            Buy Now
                        </span>
                    )}
                </div>

                <StepBar current={step} />

                {error && (
                    <div className="mb-6 p-4 rounded-2xl bg-[var(--color-danger)]/8 border border-[var(--color-danger)]/20 text-[var(--color-danger)] text-sm font-semibold">
                        {error}
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    <div className="lg:col-span-2">
                        <div className="bg-card border border-accent-10 rounded-2xl p-5 sm:p-6">

                            {step === 1 && (
                                <>
                                    <h2 className="text-heading font-bold text-base mb-5 flex items-center gap-2">
                                        <MapPin size={16} className="text-[var(--color-primary)]" /> Delivery Address
                                    </h2>
                                    <StepAddress
                                        selectedAddressId={selectedAddrId}
                                        onSelect={setSelectedAddrId}
                                        onNext={() => setStep(2)}
                                    />
                                </>
                            )}

                            {step === 2 && (
                                <>
                                    <h2 className="text-heading font-bold text-base mb-5 flex items-center gap-2">
                                        <CreditCard size={16} className="text-[var(--color-primary)]" /> Payment Method
                                    </h2>
                                    <StepPayment
                                        selected={paymentMethod}
                                        onSelect={setPaymentMethod}
                                        onNext={() => setStep(3)}
                                        onBack={() => setStep(1)}
                                    />
                                </>
                            )}

                            {step === 3 && (
                                <>
                                    <h2 className="text-heading font-bold text-base mb-5 flex items-center gap-2">
                                        <ClipboardList size={16} className="text-[var(--color-primary)]" /> Review Your Order
                                    </h2>
                                    <StepReview
                                        address={selectedAddress}
                                        paymentMethod={paymentMethod}
                                        total={sidebarData.total}
                                        onBack={() => setStep(2)}
                                        onPlace={handlePlaceOrder}
                                        placing={placing}
                                    />
                                </>
                            )}
                        </div>
                    </div>

                    <div className="lg:sticky lg:top-6 lg:self-start">
                        <OrderSidebar {...sidebarData} />
                    </div>
                </div>
            </div>
        </div>
    );
}