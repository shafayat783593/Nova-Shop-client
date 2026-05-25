"use client";

import { useState, useEffect } from "react";
import { Star, CheckCircle2, Loader2, Edit2, X, AlertCircle, MessageSquare } from "lucide-react";
import api from "@/app/lib/api";

// ─── Star Rating Input ────────────────────────────────────────────────────────
function StarInput({ value, onChange, disabled }) {
    const [hovered, setHovered] = useState(0);
    const labels = ["", "Poor", "Fair", "Good", "Great", "Excellent"];
    return (
        <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
                <button
                    key={star}
                    type="button"
                    disabled={disabled}
                    onClick={() => onChange(star)}
                    onMouseEnter={() => !disabled && setHovered(star)}
                    onMouseLeave={() => setHovered(0)}
                    className="transition-transform active:scale-90 disabled:cursor-not-allowed"
                >
                    <Star
                        size={28}
                        className="transition-all"
                        fill={(hovered || value) >= star ? "#f59e0b" : "transparent"}
                        stroke={(hovered || value) >= star ? "#f59e0b" : "#9ca3af"}
                        strokeWidth={1.5}
                    />
                </button>
            ))}
            {(hovered || value) > 0 && (
                <span className="text-amber-500 text-sm font-bold ml-2">
                    {labels[hovered || value]}
                </span>
            )}
        </div>
    );
}

// ─── Star Display (read-only) — also used by ProductReviews page ──────────────
export function StarDisplay({ value = 0, size = 14, showCount, count }) {
    return (
        <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
                <Star
                    key={star}
                    size={size}
                    fill={value >= star ? "#f59e0b" : "transparent"}
                    stroke="#f59e0b"
                    strokeWidth={1.5}
                />
            ))}
            {showCount && (
                <span className="text-body text-xs ml-1">({count?.toLocaleString() || 0})</span>
            )}
        </div>
    );
}

// ─── Review Form ──────────────────────────────────────────────────────────────
function ReviewForm({ productId, orderId, itemName, imageSnapshot, existing, onSuccess, onCancel }) {
    const [rating, setRating] = useState(existing?.rating || 0);
    const [comment, setComment] = useState(existing?.comment || "");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const isEdit = !!existing;

    const handleSubmit = async () => {
        if (rating === 0) { setError("Please select a star rating"); return; }
        setLoading(true);
        setError(null);
        try {
            if (isEdit) {
                await api.patch(`/api/reviews/${existing._id}`, { rating, comment });
            } else {
                await api.post("/api/reviews", { productId, orderId, rating, comment });
            }
            onSuccess();
        } catch (err) {
            setError(err.response?.data?.message || "Failed to submit. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-bg border border-accent-10 rounded-2xl p-4 space-y-4">
            {/* Product header */}
            <div className="flex items-center gap-3">
                {imageSnapshot
                    ? <img src={imageSnapshot} alt={itemName} className="w-12 h-12 rounded-xl object-cover border border-accent-10 flex-shrink-0" />
                    : <div className="w-12 h-12 rounded-xl bg-card border border-accent-10 flex-shrink-0 flex items-center justify-center"><Star size={18} className="text-body opacity-30" /></div>
                }
                <div className="flex-1 min-w-0">
                    <p className="text-heading font-bold text-sm line-clamp-1">{itemName}</p>
                    <p className="text-body text-xs">{isEdit ? "Edit your review" : "How was this product?"}</p>
                </div>
                {onCancel && (
                    <button onClick={onCancel} className="text-body hover:text-heading transition-colors ml-auto flex-shrink-0">
                        <X size={16} />
                    </button>
                )}
            </div>

            {/* Stars */}
            <div>
                <p className="text-body text-xs mb-2">Your rating <span className="text-[var(--color-danger)]">*</span></p>
                <StarInput value={rating} onChange={setRating} disabled={loading} />
            </div>

            {/* Comment */}
            <div>
                <p className="text-body text-xs mb-2 flex items-center gap-1">
                    <MessageSquare size={11} /> Your review <span className="opacity-50">(optional)</span>
                </p>
                <textarea
                    value={comment}
                    onChange={e => setComment(e.target.value)}
                    placeholder="Share details about the quality, packaging, or your experience..."
                    rows={3}
                    maxLength={1000}
                    disabled={loading}
                    className="w-full px-3.5 py-2.5 text-sm bg-card border border-accent-10 rounded-xl text-heading placeholder:text-body outline-none focus:border-[var(--color-primary)] resize-none disabled:opacity-60 transition-colors"
                />
                <p className="text-body text-xs text-right mt-0.5 opacity-60">{comment.length}/1000</p>
            </div>

            {error && (
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[var(--color-danger)]/8 text-[var(--color-danger)] text-xs">
                    <AlertCircle size={13} className="flex-shrink-0" /> {error}
                </div>
            )}

            <div className="flex gap-2.5">
                {onCancel && (
                    <button onClick={onCancel} disabled={loading}
                        className="flex-1 py-2.5 rounded-xl border border-accent-10 text-heading text-sm font-semibold hover:bg-bg transition-colors disabled:opacity-60">
                        Cancel
                    </button>
                )}
                <button
                    onClick={handleSubmit}
                    disabled={loading || rating === 0}
                    className="flex-1 py-2.5 rounded-xl bg-[var(--color-primary)] text-white text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-2 transition-all active:scale-98"
                >
                    {loading && <Loader2 size={13} className="animate-spin" />}
                    {isEdit ? "Update Review" : "Submit Review"}
                </button>
            </div>
        </div>
    );
}

// ─── Per-item card — handles its own state machine ────────────────────────────
function ItemReviewCard({ item, orderId, onAnySubmit }) {
    // state: "loading" | "can" | "done" | "editing" | "notEligible" | "error"
    const [state, setState] = useState("loading");
    const [myReview, setMyReview] = useState(null);
    const [debugMsg, setDebugMsg] = useState("");

    // ── KEY FIX: product may be a populated object OR a plain string ──────
    // Always extract the string ID safely
    const productId = item.product?._id
        ? String(item.product._id)
        : String(item.product);

    useEffect(() => {
        loadStatus();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const loadStatus = async () => {
        setState("loading");
        setDebugMsg("");
        try {
            const { data } = await api.get("/api/reviews/can-review", {
                params: { productId, orderId },
            });

            const info = data?.data;
            if (!info) throw new Error("Empty response from can-review");

            if (info.canReview) {
                setState("can");
                return;
            }

            if (info.reason === "already_reviewed") {
                const { data: rev } = await api.get("/api/reviews/my", {
                    params: { productId, orderId },
                });
                setMyReview(rev.data);
                setState("done");
            } else {
                // order_not_delivered | product_not_in_order
                setState("notEligible");
                setDebugMsg(info.reason || "not_eligible");
            }
        } catch (err) {
            // Show error state instead of silently hiding
            console.error("ReviewCard error:", err?.response?.data || err?.message);
            setState("error");
            setDebugMsg(err?.response?.data?.message || err?.message || "Unknown error");
        }
    };

    const handleSuccess = () => {
        loadStatus();
        onAnySubmit?.();
    };

    // ── Loading skeleton ──────────────────────────────────────────────────
    if (state === "loading") {
        return (
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-card border border-accent-10">
                <div className="w-12 h-12 rounded-xl bg-bg animate-pulse flex-shrink-0" />
                <div className="flex-1 space-y-2">
                    <div className="h-3 bg-bg rounded-lg animate-pulse w-2/3" />
                    <div className="h-3 bg-bg rounded-lg animate-pulse w-1/3" />
                </div>
            </div>
        );
    }

    // ── Error state ───────────────────────────────────────────────────────
    if (state === "error") {
        return (
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-[var(--color-danger)]/5 border border-[var(--color-danger)]/20">
                <div className="w-12 h-12 rounded-xl bg-[var(--color-danger)]/10 flex-shrink-0 flex items-center justify-center">
                    <AlertCircle size={18} className="text-[var(--color-danger)]" />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-heading font-bold text-sm line-clamp-1">{item.nameSnapshot}</p>
                    <p className="text-[var(--color-danger)] text-xs mt-0.5">{debugMsg}</p>
                </div>
                <button onClick={loadStatus}
                    className="text-xs text-body hover:text-heading border border-accent-10 rounded-lg px-2.5 py-1.5 flex-shrink-0">
                    Retry
                </button>
            </div>
        );
    }

    // ── Review form (new) ─────────────────────────────────────────────────
    if (state === "can") {
        return (
            <ReviewForm
                productId={productId}
                orderId={orderId}
                itemName={item.nameSnapshot}
                imageSnapshot={item.imageSnapshot}
                onSuccess={handleSuccess}
            />
        );
    }

    // ── Review form (edit) ────────────────────────────────────────────────
    if (state === "editing") {
        return (
            <ReviewForm
                productId={productId}
                orderId={orderId}
                itemName={item.nameSnapshot}
                imageSnapshot={item.imageSnapshot}
                existing={myReview}
                onSuccess={handleSuccess}
                onCancel={() => setState("done")}
            />
        );
    }

    // ── Already reviewed — show summary ───────────────────────────────────
    if (state === "done" && myReview) {
        return (
            <div className="bg-card border border-green-500/25 rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-3">
                    {item.imageSnapshot
                        ? <img src={item.imageSnapshot} alt={item.nameSnapshot}
                            className="w-12 h-12 rounded-xl object-cover border border-accent-10 flex-shrink-0" />
                        : <div className="w-12 h-12 rounded-xl bg-bg border border-accent-10 flex-shrink-0 flex items-center justify-center">
                            <Star size={16} className="text-body opacity-30" />
                          </div>
                    }
                    <div className="flex-1 min-w-0">
                        <p className="text-heading font-bold text-sm line-clamp-1">{item.nameSnapshot}</p>
                        <div className="flex items-center gap-2 mt-1">
                            <StarDisplay value={myReview.rating} size={13} />
                            <span className="text-green-600 text-xs flex items-center gap-1 font-medium">
                                <CheckCircle2 size={10} /> Reviewed
                            </span>
                        </div>
                    </div>
                    <button
                        onClick={() => setState("editing")}
                        className="flex items-center gap-1.5 text-xs text-body hover:text-[var(--color-primary)] transition-colors border border-accent-10 rounded-xl px-3 py-1.5 flex-shrink-0"
                    >
                        <Edit2 size={11} /> Edit
                    </button>
                </div>
                {myReview.comment && (
                    <p className="text-body text-sm leading-relaxed pl-3 border-l-2 border-amber-400/40 italic">
                        "{myReview.comment}"
                    </p>
                )}
            </div>
        );
    }

    // notEligible — hide silently (order not delivered or wrong product)
    return null;
}

// ─── Main Export ──────────────────────────────────────────────────────────────
export default function OrderReviewSection({ order, onReviewsUpdated }) {
    // Only show for delivered orders
    if (order?.orderStatus !== "delivered") return null;
    // Need at least one item
    if (!order?.items?.length) return null;

    return (
        <div className="bg-card border border-accent-10 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-accent-10 bg-amber-500/5">
                <h2 className="text-heading font-bold text-sm flex items-center gap-2">
                    <Star size={15} fill="#f59e0b" stroke="#f59e0b" />
                    Rate Your Items
                </h2>
                <p className="text-body text-xs mt-0.5">
                    Help others by sharing your honest feedback
                </p>
            </div>

            <div className="p-4 space-y-3">
                {order.items.map((item, i) => (
                    <ItemReviewCard
                        key={`${item.product?._id || item.product}-${i}`}
                        item={item}
                        orderId={String(order._id)}
                        onAnySubmit={onReviewsUpdated}
                    />
                ))}
            </div>
        </div>
    );
}