"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { FaStar, FaQuoteLeft, FaChevronLeft, FaChevronRight, FaUserCircle } from "react-icons/fa";
import api from "@/app/lib/api";

function Stars({ rating }) {
    return (
        <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
                <FaStar
                    key={star}
                    size={13}
                    color={star <= rating ? "var(--color-accent)" : "var(--accent-opacity)"}
                />
            ))}
        </div>
    );
}

function TestimonialCard({ review }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.4 }}
            className="min-w-[280px] sm:min-w-[320px] snap-start bg-card border border-accent-10 rounded-2xl p-5 flex flex-col justify-between shrink-0"
        >
            <div>
                <FaQuoteLeft size={18} style={{ color: "var(--color-accent)" }} />
                <p className="text-body text-sm mt-3 leading-relaxed line-clamp-4">
                    {review.comment}
                </p>
            </div>

            <div className="flex items-center gap-3 mt-5 pt-4 border-t border-accent-10">
                {review.user?.avatar ? (
                    <img
                        src={review.user.avatar}
                        alt={review.user?.name}
                        className="w-10 h-10 rounded-full object-cover"
                    />
                ) : (
                    <FaUserCircle size={38} className="text-body" />
                )}
                <div className="min-w-0">
                    <p className="text-heading font-semibold text-sm truncate">{review.user?.name || "Verified Buyer"}</p>
                    <p className="text-body text-xs truncate">on {review.product?.name || "a product"}</p>
                    <Stars rating={review.rating} />
                </div>
            </div>
        </motion.div>
    );
}

export default function HomeReviewsSection() {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const scrollRef = useRef(null);

    useEffect(() => {
        (async () => {
            try {
                const res = await api.get("/api/reviews/featured", { params: { limit: 10 } });
                console.log(res.data ,"data.....")
                setReviews(res.data.data || []);
            } catch (err) {
                console.error("Failed to load featured reviews:", err);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const scroll = (dir) => {
        if (!scrollRef.current) return;
        scrollRef.current.scrollBy({ left: dir * 340, behavior: "smooth" });
    };

    if (!loading && reviews.length === 0) return null;

    return (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
            <div className="flex items-end justify-between mb-6">
                <div>
                    <h2 className="font-display text-2xl sm:text-3xl font-bold text-heading">
                        What Our Customers Say
                    </h2>
                    <p className="text-body text-sm mt-1">Real reviews from real NovaShop buyers</p>
                </div>

                <div className="hidden sm:flex gap-2">
                    <button
                        onClick={() => scroll(-1)}
                        className="w-9 h-9 rounded-full border border-accent-10 flex items-center justify-center text-body hover:text-[var(--color-accent)]"
                        aria-label="Scroll left"
                    >
                        <FaChevronLeft size={13} />
                    </button>
                    <button
                        onClick={() => scroll(1)}
                        className="w-9 h-9 rounded-full border border-accent-10 flex items-center justify-center text-body hover:text-[var(--color-accent)]"
                        aria-label="Scroll right"
                    >
                        <FaChevronRight size={13} />
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex gap-4 overflow-hidden">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="min-w-[300px] h-44 rounded-2xl bg-accent-10 animate-pulse" />
                    ))}
                </div>
            ) : (
                <div
                    ref={scrollRef}
                    className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-2 scroll-smooth"
                    style={{ scrollbarWidth: "none" }}
                >
                    {reviews.map((review) => (
                        <TestimonialCard key={review._id} review={review} />
                    ))}
                </div>
            )}
        </section>
    );
}