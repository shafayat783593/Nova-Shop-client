"use client";

import { useState, useEffect } from "react";
import { Star, ChevronDown, Loader2, User } from "lucide-react";
import api from "@/app/lib/api";
import { StarDisplay } from "@/app/(Customer)/Myorder/components/Orderreviewsection";
// import { StarDisplay } from "./OrderReviewSection";

// ─── Rating Breakdown Bar ─────────────────────────────────────────────────────
function RatingBar({ star, count, total }) {
    const pct = total > 0 ? Math.round((count / total) * 100) : 0;
    return (
        <div className="flex items-center gap-2 group cursor-default">
            <div className="flex items-center gap-0.5 w-16 flex-shrink-0">
                <span className="text-body text-xs w-2">{star}</span>
                <Star size={11} fill="#f59e0b" stroke="#f59e0b" className="ml-0.5" />
            </div>
            <div className="flex-1 h-2 rounded-full bg-bg overflow-hidden">
                <div
                    className="h-full rounded-full bg-amber-400 transition-all duration-700"
                    style={{ width: `${pct}%` }}
                />
            </div>
            <span className="text-body text-xs w-7 text-right">{count}</span>
        </div>
    );
}

// ─── Avatar ───────────────────────────────────────────────────────────────────
function Avatar({ user }) {
    if (user?.avatar) {
        return (
            <img src={user.avatar} alt={user.name}
                className="w-9 h-9 rounded-full object-cover flex-shrink-0 border border-accent-10" />
        );
    }
    const initials = user?.name
        ? user.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()
        : "?";
    return (
        <div className="w-9 h-9 rounded-full bg-[var(--color-primary)]/15 flex items-center justify-center flex-shrink-0 text-[var(--color-primary)] text-sm font-bold select-none">
            {initials}
        </div>
    );
}

// ─── Single Review Card ───────────────────────────────────────────────────────
function ReviewCard({ review }) {
    return (
        <div className="py-4 border-b border-accent-10 last:border-0">
            <div className="flex items-start gap-3">
                <Avatar user={review.user} />
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div>
                            <p className="text-heading font-bold text-sm">
                                {review.user?.name || "Anonymous"}
                            </p>
                            <p className="text-body text-xs mt-0.5">
                                {new Date(review.createdAt).toLocaleDateString("en-BD", {
                                    day: "numeric",
                                    month: "long",
                                    year: "numeric",
                                })}
                            </p>
                        </div>
                        <StarDisplay value={review.rating} size={14} />
                    </div>
                    {review.comment && (
                        <p className="text-body text-sm mt-2 leading-relaxed">
                            {review.comment}
                        </p>
                    )}
                    {/* Verified purchase badge */}
                    <div className="flex items-center gap-1 mt-2">
                        <span className="text-green-600 text-xs flex items-center gap-1 font-medium">
                            <User size={10} /> Verified Purchase
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Main: ProductReviews ─────────────────────────────────────────────────────
// Drop this on the product detail page
// Props: productId, averageRating, totalReviews
export default function ProductReviews({ productId, averageRating = 0, totalReviews = 0 }) {
    const [reviews, setReviews] = useState([]);
    const [breakdown, setBreakdown] = useState({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });
    const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);

    const fetchReviews = async (page = 1, append = false) => {
        if (page === 1) setLoading(true);
        else setLoadingMore(true);

        try {
            const { data } = await api.get(`/api/reviews/product/${productId}`, {
                params: { page, limit: 5 },
            });
            setReviews(prev => append ? [...prev, ...data.data] : data.data);
            setBreakdown(data.ratingBreakdown);
            setPagination(data.pagination);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };

    useEffect(() => {
        if (productId) fetchReviews(1);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [productId]);

    const handleLoadMore = () => {
        fetchReviews(pagination.page + 1, true);
    };

    return (
<div className="bg-card border border-accent-10 rounded-2xl max-w-7xl mx-auto overflow-hidden">
            <div className="px-5 py-4 border-b border-accent-10">
                <h2 className="text-heading font-bold text-base flex items-center gap-2">
                    <Star size={16} fill="#f59e0b" stroke="#f59e0b" />
                    Ratings &amp; Reviews
                </h2>
            </div>

            {/* Summary */}
            <div className="px-5 py-5 flex flex-col sm:flex-row gap-6 border-b border-accent-10">
                {/* Average score */}
                <div className="flex flex-col items-center justify-center sm:w-36 flex-shrink-0">
                    <p className="text-heading font-black text-5xl leading-none">
                        {Number(averageRating).toFixed(1)}
                    </p>
                    <StarDisplay value={Number(averageRating)} size={18} />
                    <p className="text-body text-xs mt-1">
                        {totalReviews.toLocaleString()} review{totalReviews !== 1 ? "s" : ""}
                    </p>
                </div>

                {/* Breakdown bars */}
                <div className="flex-1 space-y-1.5 justify-center flex flex-col">
                    {[5, 4, 3, 2, 1].map(star => (
                        <RatingBar
                            key={star}
                            star={star}
                            count={breakdown[star] || 0}
                            total={totalReviews}
                        />
                    ))}
                </div>
            </div>

            {/* Reviews list */}
            <div className="px-5">
                {loading ? (
                    <div className="py-10 flex justify-center">
                        <Loader2 size={22} className="animate-spin text-[var(--color-primary)]" />
                    </div>
                ) : reviews.length === 0 ? (
                    <div className="py-10 text-center space-y-2">
                        <Star size={32} className="text-body opacity-20 mx-auto" />
                        <p className="text-heading font-bold text-sm">No reviews yet</p>
                        <p className="text-body text-xs">Be the first to review this product after purchase</p>
                    </div>
                ) : (
                    <div>
                        {reviews.map(review => (
                            <ReviewCard key={review._id} review={review} />
                        ))}
                    </div>
                )}
            </div>

            {/* Load more */}
            {!loading && pagination.page < pagination.pages && (
                <div className="px-5 pb-5 pt-2">
                    <button
                        onClick={handleLoadMore}
                        disabled={loadingMore}
                        className="w-full py-2.5 rounded-xl border border-accent-10 text-heading text-sm font-semibold hover:bg-bg transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
                    >
                        {loadingMore
                            ? <><Loader2 size={14} className="animate-spin" /> Loading...</>
                            : <><ChevronDown size={14} /> Load more reviews ({pagination.total - reviews.length} remaining)</>
                        }
                    </button>
                </div>
            )}
        </div>
    );
}