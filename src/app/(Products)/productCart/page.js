"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
    ShoppingCart, Trash2, Plus, Minus, Tag, Truck,
    ArrowRight, Package, RefreshCw, Shield, Zap,
    X, Check, ChevronRight, Loader2, AlertCircle, ShoppingBag,
    CheckSquare, Square, MinusSquare
} from "lucide-react";
import { useCart } from "../../context/Cartcontext";

// ─── Shimmer skeleton ─────────────────────────────────────────────────────────
function Shimmer({ className = "" }) {
    return (
        <div className={`relative overflow-hidden bg-[var(--accent-opacity)] rounded-xl ${className}`}>
            <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite]"
                style={{ background: "linear-gradient(90deg,transparent,rgba(255,255,255,0.07),transparent)" }} />
        </div>
    );
}

function CartSkeleton() {
    return (
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
            <style>{`@keyframes shimmer{0%{transform:translateX(-100%)}100%{transform:translateX(100%)}}`}</style>
            <div className="lg:col-span-2 space-y-4">
                {/* Select-all skeleton */}
                <Shimmer className="h-12 rounded-2xl" />
                {[1, 2, 3].map(i => (
                    <div key={i} className="bg-card rounded-2xl border border-accent-10 p-5 flex gap-4">
                        <Shimmer className="w-6 h-6 rounded flex-shrink-0 self-center" />
                        <Shimmer className="w-24 h-24 rounded-xl flex-shrink-0" />
                        <div className="flex-1 space-y-2.5">
                            <Shimmer className="h-4 w-3/4" />
                            <Shimmer className="h-3 w-1/3" />
                            <Shimmer className="h-8 w-28 rounded-xl mt-3" />
                        </div>
                        <Shimmer className="w-16 h-5" />
                    </div>
                ))}
            </div>
            <div className="space-y-4">
                <Shimmer className="h-64 rounded-2xl" />
                <Shimmer className="h-12 rounded-xl" />
            </div>
        </div>
    );
}

// ─── Custom Checkbox ──────────────────────────────────────────────────────────
function Checkbox({ checked, indeterminate, onChange, size = 20 }) {
    return (
        <button
            onClick={onChange}
            className="flex-shrink-0 transition-transform active:scale-90"
            style={{ width: size, height: size }}
        >
            {indeterminate ? (
                <MinusSquare size={size} className="text-[var(--color-primary)]" />
            ) : checked ? (
                <CheckSquare size={size} className="text-[var(--color-primary)]" />
            ) : (
                <Square size={size} className="text-body opacity-40 hover:opacity-70 transition-opacity" />
            )}
        </button>
    );
}

// ─── Qty control ──────────────────────────────────────────────────────────────
function QtyControl({ value, onInc, onDec, max = 99, loading }) {
    return (
        <div className={`flex items-center rounded-xl border border-accent-10 overflow-hidden w-fit transition-opacity ${loading ? "opacity-50 pointer-events-none" : ""}`}>
            <button onClick={onDec}
                className="w-8 h-8 flex items-center justify-center hover:bg-[var(--accent-opacity)] transition-colors text-heading">
                <Minus size={13} />
            </button>
            <span className="w-9 text-center text-heading text-sm font-bold border-x border-accent-10 select-none">
                {loading ? <Loader2 size={12} className="mx-auto animate-spin" /> : value}
            </span>
            <button onClick={onInc}
                className="w-8 h-8 flex items-center justify-center hover:bg-[var(--accent-opacity)] transition-colors text-heading">
                <Plus size={13} />
            </button>
        </div>
    );
}

// ─── Cart Item Card ───────────────────────────────────────────────────────────
function CartItemCard({ item, onQty, onRemove, selected, onToggleSelect }) {
    const [qtyLoading, setQtyLoading] = useState(false);
    const [removing, setRemoving] = useState(false);

    const handleQty = async (qty) => {
        setQtyLoading(true);
        await onQty(item._id, qty);
        setQtyLoading(false);
    };

    const handleRemove = async () => {
        setRemoving(true);
        await onRemove(item._id);
    };

    const hasDiscount = item.finalPrice < item.priceAtAdd;
    const lineTotal = (item.finalPrice ?? item.priceAtAdd) * item.quantity;

    return (
        <div className={`bg-card rounded-2xl border transition-all duration-200 p-4 sm:p-5 flex gap-3 sm:gap-4
            ${selected ? "border-[var(--color-primary)]/40 bg-[var(--color-primary)]/3" : "border-accent-10"}
            ${removing ? "opacity-40 scale-95" : ""}
        `}>
            {/* Checkbox */}
            <div className="flex items-center pt-1">
                <Checkbox
                    checked={selected}
                    onChange={() => onToggleSelect(item._id)}
                    size={20}
                />
            </div>

            {/* Image */}
            <div
                className="w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0 rounded-xl overflow-hidden bg-bg border border-accent-10 cursor-pointer"
                onClick={() => onToggleSelect(item._id)}
            >
                {item.imageSnapshot ? (
                    <img src={item.imageSnapshot} alt={item.nameSnapshot} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <Package size={24} className="text-body opacity-30" />
                    </div>
                )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0 flex flex-col justify-between gap-2">
                <div>
                    <p
                        className="text-heading font-bold text-sm sm:text-base leading-snug line-clamp-2 cursor-pointer hover:text-[var(--color-primary)] transition-colors"
                        onClick={() => onToggleSelect(item._id)}
                    >
                        {item.nameSnapshot}
                    </p>
                    {item.variant && (
                        <p className="text-body text-xs mt-0.5">Variant: {item.variant}</p>
                    )}
                    {/* Applied promotions */}
                    {item.appliedPromotions?.length > 0 && (
                        <div className="flex items-center gap-1.5 mt-1.5">
                            <Zap size={11} className="text-[var(--color-primary)]" />
                            <span className="text-[var(--color-primary)] text-xs font-semibold">
                                Promo — ৳{item.appliedPromotions.reduce((s, p) => s + p.discountAmount, 0).toFixed(0)} OFF
                            </span>
                        </div>
                    )}
                    {!item.isAvailable && (
                        <div className="flex items-center gap-1 mt-1">
                            <AlertCircle size={12} className="text-[var(--color-danger)]" />
                            <span className="text-[var(--color-danger)] text-xs">Unavailable</span>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                    <QtyControl
                        value={item.quantity}
                        onInc={() => handleQty(item.quantity + 1)}
                        onDec={() => item.quantity > 1 && handleQty(item.quantity - 1)}
                        max={item.stockSnapshot ?? 99}
                        loading={qtyLoading}
                    />
                    <button
                        onClick={handleRemove}
                        disabled={removing}
                        className="flex items-center gap-1 text-xs text-body hover:text-[var(--color-danger)] transition-colors"
                    >
                        <Trash2 size={13} /> Remove
                    </button>
                </div>
            </div>

            {/* Price */}
            <div className="flex flex-col items-end justify-between flex-shrink-0">
                <div className="text-right">
                    <p className={`font-black text-base ${selected ? "text-heading" : "text-body"}`}>
                        ৳{lineTotal?.toLocaleString()}
                    </p>
                    {hasDiscount && (
                        <p className="text-body text-xs line-through">
                            ৳{(item.priceAtAdd * item.quantity)?.toLocaleString()}
                        </p>
                    )}
                </div>
                <p className="text-body text-xs">৳{(item.finalPrice ?? item.priceAtAdd)?.toLocaleString()} each</p>
            </div>
        </div>
    );
}

// ─── Coupon Input ─────────────────────────────────────────────────────────────
function CouponInput({ onApply, onRemove, appliedCoupon }) {
    const [code, setCode] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleApply = async () => {
        if (!code.trim()) return;
        setLoading(true); setError(null);
        const result = await onApply(code.trim());
        setLoading(false);
        if (result.success) setCode("");
        else setError(result.message);
    };

    const handleRemove = async () => {
        setLoading(true);
        await onRemove();
        setLoading(false);
    };

    if (appliedCoupon?.code) {
        return (
            <div className="flex items-center justify-between p-3 rounded-xl bg-green-500/10 border border-green-500/25">
                <div className="flex items-center gap-2">
                    <Check size={14} className="text-green-500" />
                    <div>
                        <p className="text-green-600 text-sm font-bold">{appliedCoupon.code}</p>
                        <p className="text-body text-xs">-৳{appliedCoupon.discountAmount?.toLocaleString()} saved</p>
                    </div>
                </div>
                <button onClick={handleRemove} disabled={loading}
                    className="text-body hover:text-[var(--color-danger)] transition-colors">
                    <X size={15} />
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-1.5">
            <div className="flex gap-2">
                <div className="relative flex-1">
                    <Tag size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-body" />
                    <input
                        value={code}
                        onChange={e => setCode(e.target.value.toUpperCase())}
                        onKeyDown={e => e.key === "Enter" && handleApply()}
                        placeholder="Enter coupon code"
                        className="w-full pl-9 pr-3 py-2.5 text-sm bg-bg border border-accent-10 rounded-xl text-heading placeholder:text-body outline-none focus:border-[var(--color-primary)] uppercase font-mono tracking-wider"
                    />
                </div>
                <button
                    onClick={handleApply}
                    disabled={!code.trim() || loading}
                    className="px-4 py-2.5 rounded-xl bg-[var(--color-primary)] text-white text-sm font-bold hover:bg-[var(--color-secondary)] transition-colors disabled:opacity-50 flex items-center gap-1.5"
                >
                    {loading ? <Loader2 size={14} className="animate-spin" /> : "Apply"}
                </button>
            </div>
            {error && <p className="text-[var(--color-danger)] text-xs flex items-center gap-1"><AlertCircle size={11} />{error}</p>}
        </div>
    );
}

// ─── Order Summary ────────────────────────────────────────────────────────────
function OrderSummary({ cart, summary, onCoupon, onRemoveCoupon, onCheckout }) {
    const { subtotal, discount, shippingFee, total, selectedCount, selectedItemCount } = summary;
    const savings = discount;

    const hasSelected = selectedCount > 0;

    return (
        <div className="bg-card border border-accent-10 rounded-2xl overflow-hidden sticky top-6">
            <div className="px-5 py-4 border-b border-accent-10">
                <h2 className="text-heading font-bold text-base flex items-center gap-2">
                    <ShoppingBag size={16} className="text-[var(--color-primary)]" />
                    Order Summary
                </h2>
                {selectedCount > 0 && (
                    <p className="text-body text-xs mt-0.5">
                        {selectedCount} product{selectedCount !== 1 ? "s" : ""} selected ({selectedItemCount} items)
                    </p>
                )}
            </div>

            <div className="p-5 space-y-3">
                <div className="space-y-2.5">
                    <div className="flex justify-between text-sm">
                        <span className="text-body">Subtotal</span>
                        <span className={`font-semibold ${hasSelected ? "text-heading" : "text-body"}`}>
                            {hasSelected ? `৳${subtotal?.toLocaleString()}` : "—"}
                        </span>
                    </div>

                    {discount > 0 && hasSelected && (
                        <div className="flex justify-between text-sm">
                            <span className="text-green-600 flex items-center gap-1.5">
                                <Zap size={12} /> Discount
                            </span>
                            <span className="text-green-600 font-semibold">-৳{discount?.toLocaleString()}</span>
                        </div>
                    )}

                    {cart.appliedCoupon?.discountAmount > 0 && hasSelected && (
                        <div className="flex justify-between text-sm">
                            <span className="text-green-600 flex items-center gap-1.5">
                                <Tag size={12} /> Coupon ({cart.appliedCoupon.code})
                            </span>
                            <span className="text-green-600 font-semibold">
                                -৳{Math.round(cart.appliedCoupon.discountAmount * selectedCount / (cart.items?.length || 1))?.toLocaleString()}
                            </span>
                        </div>
                    )}

                    <div className="flex justify-between text-sm items-center">
                        <span className="text-body flex items-center gap-1.5">
                            <Truck size={12} /> Shipping
                        </span>
                        {!hasSelected ? (
                            <span className="text-body">—</span>
                        ) : shippingFee === 0 ? (
                            <span className="text-green-600 font-semibold flex items-center gap-1">
                                <Check size={12} /> FREE
                            </span>
                        ) : (
                            <span className="text-heading font-semibold">৳{shippingFee?.toLocaleString()}</span>
                        )}
                    </div>
                </div>

                {/* Total */}
                <div className="border-t border-accent-10 pt-3 flex justify-between items-center">
                    <span className="text-heading font-bold">Total</span>
                    <span className={`font-black text-xl ${hasSelected ? "text-heading" : "text-body"}`}>
                        {hasSelected ? `৳${total?.toLocaleString()}` : "৳0"}
                    </span>
                </div>

                {savings > 0 && hasSelected && (
                    <div className="bg-green-500/10 border border-green-500/20 rounded-xl px-3 py-2 text-center">
                        <p className="text-green-600 text-sm font-bold">🎉 You save ৳{savings.toLocaleString()}!</p>
                    </div>
                )}

                {!hasSelected && (
                    <div className="bg-[var(--accent-opacity)] rounded-xl px-3 py-2.5 text-center">
                        <p className="text-body text-xs">Select items to see total</p>
                    </div>
                )}
            </div>

            {/* Coupon */}
            <div className="px-5 pb-4 space-y-3">
                <CouponInput
                    onApply={onCoupon}
                    onRemove={onRemoveCoupon}
                    appliedCoupon={cart.appliedCoupon}
                />
            </div>

            {/* Checkout button */}
            <div className="px-5 pb-5 space-y-2">
                <button
                    onClick={onCheckout}
                    disabled={!hasSelected}
                    className="w-full py-3.5 rounded-xl bg-[var(--color-primary)] hover:bg-[var(--color-secondary)] text-white font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-98 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    Checkout ({selectedCount}) <ArrowRight size={16} />
                </button>
                {!hasSelected && (
                    <p className="text-center text-body text-xs">Please select at least one item</p>
                )}
                <p className="text-center text-body text-xs flex items-center justify-center gap-1.5">
                    <Shield size={11} /> Secured by 256-bit SSL
                </p>
            </div>

            {/* Trust strip */}
            <div className="border-t border-accent-10 px-5 py-3 grid grid-cols-3 gap-2">
                {[
                    { icon: Truck, text: "Fast Delivery" },
                    { icon: RefreshCw, text: "Easy Return" },
                    { icon: Shield, text: "Safe Pay" },
                ].map(({ icon: Icon, text }) => (
                    <div key={text} className="flex flex-col items-center gap-1 text-center">
                        <Icon size={14} className="text-[var(--color-primary)]" />
                        <span className="text-body text-xs">{text}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─── Main Cart Page ───────────────────────────────────────────────────────────
export default function CartPage() {
    const router = useRouter();
    const {
        cart, loading,
        updateQty, removeItem, removeSelectedItems,
        applyCoupon, removeCoupon,
        isItemSelected, isAllSelected,
        toggleSelectItem, selectAll, deselectAll,
        selectedSummary,
    } = useCart();

    if (loading) return <CartSkeleton />;

    // Empty cart
    if (!cart || cart.items?.length === 0) {
        return (
            <div className="min-h-screen bg-bg flex items-center justify-center px-4">
                <style>{`@keyframes shimmer{0%{transform:translateX(-100%)}100%{transform:translateX(100%)}}`}</style>
                <div className="text-center max-w-sm space-y-6">
                    <div className="w-32 h-32 mx-auto relative">
                        <div className="w-full h-full rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center">
                            <ShoppingCart size={52} className="text-[var(--color-primary)] opacity-60" />
                        </div>
                        <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-[var(--accent-opacity)] flex items-center justify-center text-body text-sm font-bold">0</div>
                    </div>
                    <div>
                        <h2 className="text-heading text-2xl font-black mb-2">Your cart is empty</h2>
                        <p className="text-body text-sm">Looks like you haven't added anything yet. Start shopping!</p>
                    </div>
                    <button
                        onClick={() => router.push("/products")}
                        className="px-8 py-3 rounded-xl bg-[var(--color-primary)] hover:bg-[var(--color-secondary)] text-white font-bold transition-colors flex items-center gap-2 mx-auto"
                    >
                        <ShoppingBag size={16} /> Browse Products
                    </button>
                </div>
            </div>
        );
    }

    const allSelected = isAllSelected();
    const summary = selectedSummary();
    const someSelected = summary.selectedCount > 0;
    const partialSelected = someSelected && summary.selectedCount < cart.items.length;
    const unavailableItems = cart.items?.filter(i => !i.isAvailable) || [];

    return (
        <div className="min-h-screen bg-bg">
            <style>{`
                @keyframes shimmer{0%{transform:translateX(-100%)}100%{transform:translateX(100%)}}
                @keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
                .cart-item{animation:fadeIn 0.3s ease both}
            `}</style>

            <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8">

                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-heading text-2xl lg:text-3xl font-black flex items-center gap-3">
                            <ShoppingCart className="text-[var(--color-primary)]" size={28} />
                            My Cart
                        </h1>
                        <p className="text-body text-sm mt-1">{cart.totalItems} item{cart.totalItems !== 1 ? "s" : ""} in your cart</p>
                    </div>
                    <button
                        onClick={() => router.push("/products")}
                        className="text-[var(--color-primary)] text-sm font-semibold hover:underline flex items-center gap-1"
                    >
                        Continue Shopping <ChevronRight size={14} />
                    </button>
                </div>

                {/* Unavailable warning */}
                {unavailableItems.length > 0 && (
                    <div className="mb-5 p-4 rounded-2xl bg-[var(--color-danger)]/8 border border-[var(--color-danger)]/20 flex gap-3">
                        <AlertCircle size={18} className="text-[var(--color-danger)] flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="text-heading text-sm font-bold">Some items are unavailable</p>
                            <p className="text-body text-xs mt-0.5">
                                {unavailableItems.map(i => i.nameSnapshot).join(", ")} — please remove before checkout.
                            </p>
                        </div>
                    </div>
                )}

                {/* Free shipping progress */}
                {cart.shippingFee > 0 && (() => {
                    const freeAt = 500;
                    const pct = Math.min(100, (summary.subtotal / freeAt) * 100);
                    const remaining = Math.max(0, freeAt - summary.subtotal);
                    return (
                        <div className="mb-5 p-4 rounded-2xl bg-card border border-accent-10">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-heading text-sm font-semibold flex items-center gap-1.5">
                                    <Truck size={14} className="text-[var(--color-primary)]" />
                                    {remaining > 0
                                        ? `Add ৳${remaining.toLocaleString()} more for free shipping!`
                                        : "You qualify for free shipping!"
                                    }
                                </p>
                                <span className="text-body text-xs">{Math.round(pct)}%</span>
                            </div>
                            <div className="h-2 rounded-full bg-[var(--accent-opacity)] overflow-hidden">
                                <div
                                    className="h-full rounded-full bg-[var(--color-primary)] transition-all duration-500"
                                    style={{ width: `${pct}%` }}
                                />
                            </div>
                        </div>
                    );
                })()}

                {/* Main grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* ── Items ── */}
                    <div className="lg:col-span-2 space-y-3">

                        {/* ── Select All Bar ── */}
                        <div className="bg-card rounded-2xl border border-accent-10 px-4 py-3 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                                <Checkbox
                                    checked={allSelected}
                                    indeterminate={partialSelected}
                                    onChange={() => allSelected ? deselectAll() : selectAll()}
                                    size={20}
                                />
                                <span className="text-heading text-sm font-semibold">
                                    Select All ({cart.items?.length})
                                </span>
                                {someSelected && (
                                    <span className="text-[var(--color-primary)] text-xs font-medium bg-[var(--color-primary)]/10 px-2 py-0.5 rounded-full">
                                        {summary.selectedCount} selected
                                    </span>
                                )}
                            </div>

                            {someSelected && (
                                <button
                                    onClick={removeSelectedItems}
                                    className="flex items-center gap-1.5 text-xs text-body hover:text-[var(--color-danger)] transition-colors font-medium"
                                >
                                    <Trash2 size={13} />
                                    Delete Selected
                                </button>
                            )}
                        </div>

                        {/* ── Item Cards ── */}
                        {cart.items?.map((item, i) => (
                            <div key={item._id} className="cart-item" style={{ animationDelay: `${i * 40}ms` }}>
                                <CartItemCard
                                    item={item}
                                    onQty={updateQty}
                                    onRemove={removeItem}
                                    selected={isItemSelected(item._id)}
                                    onToggleSelect={toggleSelectItem}
                                />
                            </div>
                        ))}

                        {/* Applied promotions notice */}
                        {cart.discount > 0 && (
                            <div className="p-4 rounded-2xl bg-[var(--color-primary)]/6 border border-[var(--color-primary)]/15 flex items-center gap-3">
                                <Zap size={18} className="text-[var(--color-primary)] flex-shrink-0" />
                                <div>
                                    <p className="text-[var(--color-primary)] text-sm font-bold">Promotions Active 🎉</p>
                                    <p className="text-body text-xs mt-0.5">
                                        Up to ৳{cart.discount?.toLocaleString()} in savings applied to your cart
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ── Summary ── */}
                    <div>
                        <OrderSummary
                            cart={cart}
                            summary={summary}
                            onCoupon={applyCoupon}
                            onRemoveCoupon={removeCoupon}
                            onCheckout={() => router.push("/checkout")}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}