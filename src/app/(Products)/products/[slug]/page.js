"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/app/lib/api";
import {
    ShoppingCart, Heart, Share2, Star, StarHalf,
    ChevronLeft, ChevronRight, Shield, Truck, RefreshCw,
    Plus, Minus, Tag, Zap, Package, ChevronDown,
    Check, ArrowLeft, ZoomIn, Copy, MessageCircle,
    Loader2
} from "lucide-react";
import AddToCartButton from "../../components/AddToCartButton";
import WishlistButton from "../../components/Wishlistbutton";
import c, { useCart } from "@/app/context/Cartcontext";
import { useAuth } from "@/app/context/AuthContext";

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function Skeleton({ className = "" }) {
    return (
        <div className={`relative overflow-hidden rounded-lg bg-[var(--accent-opacity)] ${className}`}>
            <div
                className="absolute inset-0"
                style={{
                    background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.08) 50%, transparent 100%)",
                    animation: "shimmer 1.6s infinite",
                }}
            />
        </div>
    );
}

function ProductSkeleton() {
    return (
        <div className="max-w-7xl mx-auto px-4 py-8 lg:px-8">
            <style>{`
                @keyframes shimmer { 0%{transform:translateX(-100%)} 100%{transform:translateX(100%)} }
            `}</style>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                {/* Left: image */}
                <div className="space-y-3">
                    <Skeleton className="aspect-square w-full rounded-2xl" />
                    <div className="flex gap-2">
                        {[...Array(4)].map((_, i) => <Skeleton key={i} className="w-16 h-16 rounded-xl flex-shrink-0" />)}
                    </div>
                </div>

                {/* Right: info */}
                <div className="space-y-4 py-2">
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-8 w-3/4" />
                    <Skeleton className="h-6 w-1/2" />
                    <Skeleton className="h-10 w-40" />
                    <div className="space-y-2 pt-2">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-5/6" />
                        <Skeleton className="h-4 w-4/6" />
                    </div>
                    <div className="flex gap-3 pt-4">
                        <Skeleton className="h-12 flex-1 rounded-xl" />
                        <Skeleton className="h-12 flex-1 rounded-xl" />
                        <Skeleton className="h-12 w-12 rounded-xl" />
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Star Rating ──────────────────────────────────────────────────────────────
function StarRating({ rating = 0, size = 14 }) {
    const full = Math.floor(rating);
    const half = rating % 1 >= 0.4;
    return (
        <div className="flex items-center gap-0.5">
            {[...Array(5)].map((_, i) => (
                <span key={i} className={i < full ? "text-amber-400" : "text-[var(--accent-opacity)]"}>
                    <Star size={size} fill={i < full ? "currentColor" : "none"} strokeWidth={1.5} />
                </span>
            ))}
        </div>
    );
}

// ─── Image Gallery ────────────────────────────────────────────────────────────
function ImageGallery({ images = [], name = "" }) {
    const [active, setActive] = useState(0);
    const [zoomed, setZoomed] = useState(false);
    const [mousePos, setMousePos] = useState({ x: 50, y: 50 });
    const allImages = images.length ? images : ["/placeholder.png"];

    const handleMouseMove = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        setMousePos({
            x: ((e.clientX - rect.left) / rect.width) * 100,
            y: ((e.clientY - rect.top) / rect.height) * 100,
        });
    };

    return (
        <div className="space-y-3 sticky top-6">
            {/* Main image */}
            <div
                className="relative aspect-square rounded-2xl overflow-hidden bg-card border border-accent-10 cursor-zoom-in group"
                onMouseEnter={() => setZoomed(true)}
                onMouseLeave={() => setZoomed(false)}
                onMouseMove={handleMouseMove}
            >
                <img
                    src={allImages[active]}
                    alt={name}
                    className="w-full h-full object-cover transition-transform duration-300"
                    style={zoomed ? {
                        transform: "scale(2)",
                        transformOrigin: `${mousePos.x}% ${mousePos.y}%`,
                    } : {}}
                />

                {/* Nav arrows */}
                {allImages.length > 1 && (
                    <>
                        <button
                            onClick={() => setActive((p) => (p - 1 + allImages.length) % allImages.length)}
                            className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-card/80 backdrop-blur flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow border border-accent-10"
                        >
                            <ChevronLeft size={16} className="text-heading" />
                        </button>
                        <button
                            onClick={() => setActive((p) => (p + 1) % allImages.length)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-card/80 backdrop-blur flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow border border-accent-10"
                        >
                            <ChevronRight size={16} className="text-heading" />
                        </button>
                    </>
                )}

                {/* Zoom hint */}
                <div className="absolute bottom-3 right-3 flex items-center gap-1 bg-card/70 backdrop-blur px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                    <ZoomIn size={12} className="text-body" />
                    <span className="text-body text-xs">Hover to zoom</span>
                </div>

                {/* Dots */}
                {allImages.length > 1 && (
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                        {allImages.map((_, i) => (
                            <button
                                key={i}
                                onClick={() => setActive(i)}
                                className={`rounded-full transition-all ${i === active ? "w-4 h-1.5 bg-[var(--color-primary)]" : "w-1.5 h-1.5 bg-white/50"}`}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Thumbnails */}
            {allImages.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                    {allImages.map((img, i) => (
                        <button
                            key={i}
                            onClick={() => setActive(i)}
                            className={`w-16 h-16 flex-shrink-0 rounded-xl overflow-hidden border-2 transition-all ${i === active
                                ? "border-[var(--color-primary)] shadow-md"
                                : "border-accent-10 opacity-60 hover:opacity-100"
                                }`}
                        >
                            <img src={img} alt="" className="w-full h-full object-cover" />
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

// ─── Variant Selector ─────────────────────────────────────────────────────────
function VariantSelector({ variants = [], selected, onSelect }) {
    const sizes = [...new Set(variants.map((v) => v.size).filter(Boolean))];
    const colors = [...new Set(variants.map((v) => v.color).filter(Boolean))];

    const [activeSize, setActiveSize] = useState(selected?.size || sizes[0] || null);
    const [activeColor, setActiveColor] = useState(selected?.color || colors[0] || null);




    const handleSizeChange = (size) => {
        setActiveSize(size);
        // নতুন size এর সাথে match করে প্রথম available variant খোঁজো
        const matchedVariant = variants.find(v => v.size === size);
        if (matchedVariant) {
            setActiveColor(matchedVariant.color);
            onSelect(matchedVariant);
        }
    };

    const handleColorChange = (color) => {
        setActiveColor(color);
        const matchedVariant = variants.find(v => v.color === color);
        if (matchedVariant) {
            setActiveSize(matchedVariant.size);
            onSelect(matchedVariant);
        }
    };




    const getVariant = (size, color) =>
        variants.find((v) => v.size === size && v.color === color);

    const handleChange = (size, color) => {
        const v = getVariant(size, color);
        if (v) onSelect(v);
    };

    const isAvailable = (size, color) => {
        // শুধু check করো ওই color/size এর কোনো variant আছে কিনা
        // অন্য dimension ignore করো
        if (size && !color) {
            return variants.some(v => v.size === size && v.stock > 0);
        }
        if (color && !size) {
            return variants.some(v => v.color === color && v.stock > 0);
        }
        return variants.some(v => v.size === size && v.color === color && v.stock > 0);
    };
    return (
        <div className="space-y-4">
            {sizes.length > 0 && (
                <div>
                    <p className="text-heading text-sm font-semibold mb-2">
                        Size: <span className="text-[var(--color-primary)]">{activeSize}</span>
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {sizes.map((size) => {
                            const avail = isAvailable(size, null);
                            return (
                                <button
                                    key={size}
                                    onClick={() => handleSizeChange(size)}
                                    disabled={!avail}
                                    className={`px-4 py-1.5 rounded-xl text-sm font-semibold border transition-all ${activeSize === size
                                        ? "border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
                                        : avail
                                            ? "border-accent-10 text-heading hover:border-[var(--color-secondary)]"
                                            : "border-accent-10 text-body opacity-40 cursor-not-allowed line-through"
                                        }`}
                                >
                                    {size}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {colors.length > 0 && (
                <div>
                    <p className="text-heading text-sm font-semibold mb-2">
                        Color: <span className="text-[var(--color-primary)]">{activeColor}</span>
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {colors.map((color) => {
                            const avail = isAvailable(null, color);
                            return (
                                <button
                                    key={color}
                                    onClick={() => handleColorChange(color)}

                                    disabled={!avail}
                                    className={`px-4 py-1.5 rounded-xl text-sm font-medium border transition-all ${activeColor === color
                                        ? "border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
                                        : avail
                                            ? "border-accent-10 text-heading hover:border-[var(--color-secondary)]"
                                            : "border-accent-10 text-body opacity-40 cursor-not-allowed"
                                        }`}
                                >
                                    {color}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Promo Badge ──────────────────────────────────────────────────────────────
function PromoBadge({ promo }) {
    const labels = {
        product: "Product Deal",
        cart: "Cart Offer",
        bxgy: `Buy ${promo.bxgy?.buy} Get ${promo.bxgy?.get}`,
        free_shipping: "Free Shipping",
    };
    const discountLabel =
        promo.discountType === "percent" ? `${promo.value}% OFF`
            : promo.discountType === "fixed" ? `৳${promo.value} OFF`
                : promo.type === "free_shipping" ? "FREE SHIPPING"
                    : promo.type === "bxgy" ? labels.bxgy
                        : "OFFER";

    return (
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/20">
            <Zap size={14} className="text-[var(--color-primary)] flex-shrink-0" />
            <div className="min-w-0">
                <span className="text-[var(--color-primary)] text-xs font-bold">{discountLabel}</span>
                {promo.name && <span className="text-body text-xs ml-1.5">· {promo.name}</span>}
                {promo.conditions?.minCartValue && (
                    <span className="text-body text-xs ml-1">on ৳{promo.conditions.minCartValue}+ cart</span>
                )}
            </div>
        </div>
    );
}

// ─── Quantity Picker ──────────────────────────────────────────────────────────
function QtyPicker({ value, onChange, max = 99 }) {
    return (
        <div className="flex items-center gap-0 rounded-xl border border-accent-10 overflow-hidden w-fit">
            <button
                onClick={() => onChange(Math.max(1, value - 1))}
                className="w-10 h-10 flex items-center justify-center hover:bg-[var(--accent-opacity)] transition-colors text-heading"
            >
                <Minus size={14} />
            </button>
            <span className="w-10 text-center text-heading text-sm font-bold border-x border-accent-10">
                {value}
            </span>
            <button
                onClick={() => onChange(Math.min(max, value + 1))}
                className="w-10 h-10 flex items-center justify-center hover:bg-[var(--accent-opacity)] transition-colors text-heading"
            >
                <Plus size={14} />
            </button>
        </div>
    );
}

// ─── Review Card ──────────────────────────────────────────────────────────────
function ReviewCard({ review }) {
    return (
        <div className="bg-card rounded-2xl p-5 border border-accent-10 space-y-3">
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-[var(--color-primary)]/15 flex items-center justify-center text-[var(--color-primary)] font-bold text-sm">
                        {(review.user?.name || "U")[0].toUpperCase()}
                    </div>
                    <div>
                        <p className="text-heading text-sm font-semibold">{review.user?.name || "Customer"}</p>
                        <p className="text-body text-xs">{new Date(review.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</p>
                    </div>
                </div>
                <StarRating rating={review.rating} size={13} />
            </div>
            <p className="text-body text-sm leading-relaxed">{review.comment}</p>
            {review.images?.length > 0 && (
                <div className="flex gap-2">
                    {review.images.map((img, i) => (
                        <img key={i} src={img} alt="" className="w-14 h-14 rounded-lg object-cover border border-accent-10" />
                    ))}
                </div>
            )}
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ProductPage() {
    const { slug } = useParams();
    const router = useRouter();
    const {  isAuth } = useAuth();

    const [product, setProduct] = useState(null);
    const [promotions, setPromotions] = useState([]);
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);

    const [selectedVariant, setSelectedVariant] = useState(null);
    const [qty, setQty] = useState(1);
    const [wishlisted, setWishlisted] = useState(false);
    const [addedToCart, setAddedToCart] = useState(false);
    const [showFullDesc, setShowFullDesc] = useState(false);

    const [copied, setCopied] = useState(false);
    const [activeTab, setActiveTab] = useState("description");
    const [buyingNow, setBuyingNow] = useState(false);
    const { addToCart } = useCart();

    useEffect(() => {
        if (!slug) return;
        (async () => {
            setLoading(true);
            try {
                const [prodRes, promoRes] = await Promise.all([
                    api.get(`/api/products/${slug}`),
                    api.get("/api/promotions/active"),
                ]);
                const p = prodRes.data.data;
                setProduct(p);

                // Set default variant
                if (p.hasVariants && p.variants?.length) {
                    setSelectedVariant(p.variants[0]);
                }

                // Filter relevant promotions
                const allPromos = promoRes.data.data || [];
                const relevant = allPromos.filter((promo) => {
                    if (promo.type === "cart" || promo.type === "free_shipping") return true;
                    if (promo.type === "product") {
                        const inScope = !promo.scope?.products?.length || promo.scope.products.some((id) => id === p._id || id?._id === p._id);
                        const inCat = !promo.scope?.categories?.length || promo.scope.categories.includes(p.category);
                        const excluded = promo.scope?.excludeProducts?.some((id) => id === p._id || id?._id === p._id);
                        return (inScope || inCat) && !excluded;
                    }
                    if (promo.type === "bxgy") {
                        return promo.bxgy?.productIds?.some((id) => id === p._id || id?._id === p._id);
                    }
                    return false;
                });
                setPromotions(relevant);

                // Fetch reviews
                try {
                    const revRes = await api.get(`/api/reviews/${p._id}?limit=6`);
                    setReviews(revRes.data.data || []);
                } catch { }

            } catch {
                // handle 404
            } finally {
                setLoading(false);
            }
        })();
    }, [slug]);


    const handleBuyNow = async () => {
        if (!inStock) return;
        setBuyingNow(true);
        try {
            const result = await addToCart({
                productId: product._id,
                variantId: selectedVariant?._id || undefined,
                quantity: qty,
                product,
            });
            if (result?.success) {
                router.push("/checkout");
            } else {
                alert(result?.message || "Cart এ add করা যায়নি");
            }
        } catch (err) {
            console.error(err);
        } finally {
            setBuyingNow(false);
        }
    };
    const handleAddToCart = () => {
        setAddedToCart(true);
        setTimeout(() => setAddedToCart(false), 2000);
        // TODO: dispatch to cart store
    };

    const handleCopyLink = () => {
        navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (loading) return <ProductSkeleton />;
    if (!product) return (
        <div className="min-h-screen bg-bg flex items-center justify-center">
            <div className="text-center space-y-3">
                <Package size={48} className="mx-auto text-body opacity-30" />
                <p className="text-heading font-semibold">Product not found</p>
                <button onClick={() => router.back()} className="text-[var(--color-primary)] text-sm hover:underline flex items-center gap-1 mx-auto">
                    <ArrowLeft size={14} /> Go back
                </button>
            </div>
        </div>
    );

    const effectivePrice = selectedVariant
        ? selectedVariant.price
        : product.discountedPrice ?? product.basePrice;

    const originalPrice = selectedVariant ? null : product.discountedPrice ? product.basePrice : null;

    const discountPercent = originalPrice
        ? Math.round(((originalPrice - effectivePrice) / originalPrice) * 100)
        : null;

    const stock = selectedVariant ? selectedVariant.stock : null;
    const inStock = stock === null ? true : stock > 0;
    const lowStock = stock !== null && stock > 0 && stock <= 5;

    const allImages = [...(product.images || []), ...(product.gallery || [])].filter(Boolean);

    return (
        <div className="min-h-screen bg-bg">


            <div className="max-w-7xl mx-auto px-4 py-6 lg:px-8">

                {/* Breadcrumb */}
                <nav className="flex items-center gap-2 text-body text-xs mb-6 fade-up">
                    <button onClick={() => router.push("/")} className="hover:text-[var(--color-primary)] transition-colors">Home</button>
                    <ChevronRight size={12} />
                    <button onClick={() => router.push(`/products?category=${product.category}`)} className="hover:text-[var(--color-primary)] transition-colors capitalize">{product.category}</button>
                    <ChevronRight size={12} />
                    <span className="text-heading truncate max-w-[200px]">{product.name}</span>
                </nav>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 xl:gap-14">

                    {/* ── Left: Gallery ── */}
                    <div className="fade-up-1">
                        <ImageGallery images={allImages} name={product.name} />
                    </div>

                    {/* ── Right: Product Info ── */}
                    <div className="space-y-5 fade-up-2">

                        {/* Badges row */}
                        <div className="flex flex-wrap items-center gap-2">
                            {product.isFeatured && (
                                <span className="px-2.5 py-1 rounded-full bg-amber-400/15 text-amber-600 text-xs font-bold uppercase tracking-wider">
                                    ⭐ Featured
                                </span>
                            )}
                            {!inStock && (
                                <span className="px-2.5 py-1 rounded-full bg-red-500/15 text-red-500 text-xs font-bold uppercase tracking-wider">
                                    Out of Stock
                                </span>
                            )}
                            {lowStock && (
                                <span className="px-2.5 py-1 rounded-full bg-orange-400/15 text-orange-500 text-xs font-bold uppercase tracking-wider">
                                    Only {stock} left!
                                </span>
                            )}
                            <span className="px-2.5 py-1 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-xs font-semibold capitalize">
                                {product.category}
                            </span>
                        </div>

                        {/* Name */}
                        <h1 className="text-heading text-2xl lg:text-3xl font-bold leading-snug">
                            {product.name}
                        </h1>

                        {/* Rating row */}
                        <div className="flex items-center gap-3 flex-wrap">
                            <StarRating rating={product.averageRating} size={16} />
                            <span className="text-heading font-bold text-sm">{product.averageRating?.toFixed(1) || "0.0"}</span>
                            <span className="text-body text-sm">({product.totalReviews || 0} reviews)</span>
                            <button
                                onClick={() => setActiveTab("reviews")}
                                className="text-[var(--color-primary)] text-sm hover:underline flex items-center gap-1"
                            >
                                <MessageCircle size={13} /> Write a review
                            </button>
                        </div>

                        {/* Price */}
                        <div className="flex items-end gap-3 flex-wrap">
                            <span className="text-heading text-3xl font-black">
                                ৳{effectivePrice?.toLocaleString()}
                            </span>
                            {originalPrice && (
                                <span className="text-body text-lg line-through">
                                    ৳{originalPrice?.toLocaleString()}
                                </span>
                            )}
                            {discountPercent && (
                                <span className="px-2.5 py-1 rounded-full bg-green-500/15 text-green-600 text-sm font-bold">
                                    -{discountPercent}%
                                </span>
                            )}
                        </div>

                        {/* Active Promotions */}
                        {promotions.length > 0 && (
                            <div className="space-y-2">
                                <p className="text-body text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
                                    <Tag size={12} /> Available Offers
                                </p>
                                <div className="space-y-2">
                                    {promotions.map((promo) => (
                                        <PromoBadge key={promo._id} promo={promo} />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Divider */}
                        <hr className="border-accent-10" />

                        {/* Variants */}
                        {product.hasVariants && product.variants?.length > 0 && (
                            <div className="fade-up-3">
                                <VariantSelector
                                    variants={product.variants}
                                    selected={selectedVariant}
                                    onSelect={setSelectedVariant}
                                />
                                {selectedVariant && (
                                    <p className="text-body text-xs mt-2">
                                        SKU: <span className="text-heading font-mono">{selectedVariant.sku || "—"}</span>
                                        {selectedVariant.stock > 0 && (
                                            <span className="ml-3 text-green-600">✓ {selectedVariant.stock} in stock</span>
                                        )}
                                    </p>
                                )}
                            </div>
                        )}

                        {/* Qty + CTA */}
                        <div className="flex items-center gap-3 flex-wrap fade-up-4">
                            <QtyPicker
                                value={qty}
                                onChange={setQty}
                                max={stock ?? 99}
                            />

                            <AddToCartButton productId={product._id} variantId={selectedVariant?._id} qty={qty} />




                            <button
                                onClick={() => {
                                    if (!inStock) return;

                                    // loading থাকলে কিছুই করবো না
                                    if (loading) return;

                                    const params = new URLSearchParams({
                                        mode: "buynow",
                                        productId: product._id,
                                        qty: String(qty),
                                    });

                                    if (selectedVariant?._id) {
                                        params.set("variantId", selectedVariant._id);
                                    }

                                  
                                    if (isAuth) {
                                        router.push(`/checkout?${params.toString()}`);
                                    } else {
                                        router.push(`/login?redirect=/checkout?${params.toString()}`);
                                    }
                                }}
                                disabled={!inStock || loading}
                                className="flex-1 min-w-[140px] h-11 rounded-xl font-bold text-sm border-2 border-[var(--color-primary)] text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                Buy Now
                            </button>

                            <WishlistButton
                                productId={product._id}
                                product={product}
                                size="icon"
                            />
                            <button
                                onClick={handleCopyLink}
                                className="w-11 h-11 rounded-xl border border-accent-10 flex items-center justify-center text-body hover:text-heading hover:border-[var(--color-accent)] transition-all"
                                title="Copy link"
                            >
                                {copied ? <Check size={16} className="text-green-500" /> : <Share2 size={16} />}
                            </button>
                        </div>

                        {/* Trust badges */}
                        <div className="grid grid-cols-3 gap-3 fade-up-5">
                            {[
                                { icon: Truck, label: "Free Delivery", sub: "On orders ৳500+" },
                                { icon: RefreshCw, label: "Easy Return", sub: "7-day policy" },
                                { icon: Shield, label: "Secure Pay", sub: "100% protected" },
                            ].map(({ icon: Icon, label, sub }) => (
                                <div key={label} className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-card border border-accent-10 text-center">
                                    <Icon size={18} className="text-[var(--color-primary)]" />
                                    <p className="text-heading text-xs font-semibold">{label}</p>
                                    <p className="text-body text-xs">{sub}</p>
                                </div>
                            ))}
                        </div>

                        {/* Tags */}
                        {product.tags?.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {product.tags.map((tag) => (
                                    <span key={tag} className="px-2.5 py-1 rounded-full bg-[var(--accent-opacity)] text-body text-xs">
                                        #{tag}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Tabs: Description / Reviews ── */}
                <div className="mt-14 fade-up">
                    <div className="flex gap-1 border-b border-accent-10 mb-8">
                        {["description", "reviews"].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-6 py-3 text-sm font-bold capitalize transition-all border-b-2 -mb-px ${activeTab === tab
                                    ? "border-[var(--color-primary)] text-[var(--color-primary)]"
                                    : "border-transparent text-body hover:text-heading"
                                    }`}
                            >
                                {tab}
                                {tab === "reviews" && product.totalReviews > 0 && (
                                    <span className="ml-1.5 text-xs font-normal opacity-70">({product.totalReviews})</span>
                                )}
                            </button>
                        ))}
                    </div>

                    {/* Description */}
                    {activeTab === "description" && (
                        <div className="max-w-3xl fade-up">
                            <div
                                className={`text-body text-sm leading-relaxed prose prose-sm max-w-none overflow-hidden transition-all ${showFullDesc ? "" : "max-h-40"
                                    }`}
                                style={{ maskImage: showFullDesc ? "none" : "linear-gradient(to bottom, black 60%, transparent 100%)" }}
                            >
                                {product.description}
                            </div>
                            <button
                                onClick={() => setShowFullDesc((v) => !v)}
                                className="mt-3 flex items-center gap-1 text-[var(--color-primary)] text-sm font-semibold hover:underline"
                            >
                                {showFullDesc ? "Show less" : "Read more"}
                                <ChevronDown size={14} className={`transition-transform ${showFullDesc ? "rotate-180" : ""}`} />
                            </button>
                        </div>
                    )}

                    {/* Reviews */}
                    {activeTab === "reviews" && (
                        <div className="space-y-6 fade-up">
                            {/* Summary */}
                            <div className="flex items-center gap-8 p-6 bg-card rounded-2xl border border-accent-10 w-fit">
                                <div className="text-center">
                                    <p className="text-heading text-5xl font-black">
                                        {product.averageRating?.toFixed(1) || "—"}
                                    </p>
                                    <StarRating rating={product.averageRating} size={18} />
                                    <p className="text-body text-xs mt-1">{product.totalReviews} reviews</p>
                                </div>
                            </div>

                            {reviews.length === 0 ? (
                                <div className="text-center py-12 text-body">
                                    <MessageCircle size={36} className="mx-auto mb-3 opacity-30" />
                                    <p>No reviews yet. Be the first!</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {reviews.map((r) => <ReviewCard key={r._id} review={r} />)}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}