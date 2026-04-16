"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import useCloudinaryUpload from "@/utils/useCloudinaryUpload";
import api from "@/app/lib/api";
import {
    FiPackage, FiTag, FiDollarSign, FiList, FiImage,
    FiPlus, FiTrash2, FiExternalLink, FiToggleLeft,
    FiToggleRight, FiSave, FiArrowLeft, FiAlertCircle,
    FiCheckCircle, FiX, FiUploadCloud, FiLayers, FiLoader,
} from "react-icons/fi";

const CATEGORIES = [
    "Electronics", "Clothing", "Footwear", "Home & Living",
    "Beauty", "Sports", "Books", "Toys", "Accessories", "Printing", "Other",
];

const EMPTY_VARIANT = { size: "", color: "", stock: "", price: "", sku: "" };

export default function EditProductPage() {
    const router = useRouter();
    const { id } = useParams();

    const [form, setForm] = useState(null);
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [toast, setToast] = useState(null);

    const { uploading, uploadSingle } = useCloudinaryUpload();   // Single upload ব্যবহার করছি

    const showToast = (type, msg) => {
        setToast({ type, msg });
        setTimeout(() => setToast(null), 4000);
    };

    // ── Fetch Product ─────────────────────────────────────────────────────
    useEffect(() => {
        if (!id) return;

        const fetchProduct = async () => {
            try {
                const { data } = await api.get(`/api/products/${id}`);
                const p = data.data;

                setForm({
                    name: p.name || "",
                    description: p.description || "",
                    category: p.category || "",
                    tags: (p.tags || []).join(", "),
                    basePrice: p.basePrice ?? "",
                    discountedPrice: p.discountedPrice ?? "",
                    images: p.images || [],
                    gallery: p.gallery || [],
                    hasVariants: Boolean(p.hasVariants) || (p.variants?.length > 0),
                    variants: p.variants?.length
                        ? p.variants.map((v) => ({
                            size: v.size || "",
                            color: v.color || "",
                            stock: v.stock ?? 0,
                            price: v.price ?? 0,
                            sku: v.sku || "",
                        }))
                        : [{ ...EMPTY_VARIANT }],
                    isActive: p.isActive ?? true,
                    isFeatured: p.isFeatured ?? false,
                });
            } catch (err) {
                console.error(err);
                showToast("error", "Failed to load product");
            } finally {
                setFetching(false);
            }
        };

        fetchProduct();
    }, [id]);

    // ── Helpers ───────────────────────────────────────────────────────────
    const set = (name, val) => {
        setForm((prev) => ({ ...prev, [name]: val }));
        setErrors((prev) => ({ ...prev, [name]: undefined }));
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        set(name, type === "checkbox" ? checked : value);
    };

    // ── Variants Handlers ─────────────────────────────────────────────────
    const setVariant = (i, field, val) => {
        setForm((prev) => {
            const variants = [...prev.variants];
            variants[i] = { ...variants[i], [field]: val };
            return { ...prev, variants };
        });
    };

    const addVariant = () => {
        setForm((prev) => ({
            ...prev,
            variants: [...prev.variants, { ...EMPTY_VARIANT }],
        }));
    };

    const removeVariant = (i) => {
        setForm((prev) => ({
            ...prev,
            variants: prev.variants.filter((_, idx) => idx !== i),
        }));
    };

    const toggleVariants = (checked) => {
        set("hasVariants", checked);
        if (!checked) {
            set("variants", []);
        } else if (form.variants.length === 0) {
            set("variants", [{ ...EMPTY_VARIANT }]);
        }
    };

    // ── Image Upload ──────────────────────────────────────────────────────
    const handleUpload = async (e, field) => {
        const files = Array.from(e.target.files);
        if (!files.length) return;

        try {
            for (const file of files) {
                const result = await uploadSingle(file, { folder: "products" });
                if (result?.url) {
                    setForm((prev) => ({
                        ...prev,
                        [field]: [...prev[field], result.url],
                    }));
                }
            }
            setErrors((prev) => ({ ...prev, [field]: undefined }));
        } catch (err) {
            showToast("error", "Image upload failed");
        }
        e.target.value = "";
    };

    const removeImg = (field, url) => {
        setForm((prev) => ({
            ...prev,
            [field]: prev[field].filter((u) => u !== url),
        }));
    };

    // ── Submit ────────────────────────────────────────────────────────────
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form) return;

        setErrors({});
        setLoading(true);

        const payload = {
            name: form.name.trim(),
            description: form.description.trim(),
            category: form.category,
            tags: form.tags ? form.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
            basePrice: Number(form.basePrice),
            discountedPrice: form.discountedPrice ? Number(form.discountedPrice) : undefined,
            images: form.images,
            gallery: form.gallery,
            hasVariants: form.hasVariants,
            variants: form.hasVariants
                ? form.variants.map((v) => ({
                    size: v.size?.trim() || undefined,
                    color: v.color?.trim() || undefined,
                    stock: Number(v.stock),
                    price: Number(v.price),
                    sku: v.sku?.trim() || undefined,
                }))
                : [],
            isActive: form.isActive,
            isFeatured: form.isFeatured,
        };

        try {
            await api.put(`/api/products/${id}`, payload);
            showToast("success", "Product updated successfully!");
            setTimeout(() => router.push("/admin/manage-products"), 1500);
        } catch (err) {
            const apiErrors = err?.response?.data?.errors;
            if (Array.isArray(apiErrors)) {
                const formattedErrors = {};
                apiErrors.forEach((item) => {
                    formattedErrors[item.field] = item.message;
                });
                setErrors(formattedErrors);
            }
            showToast("error", err?.response?.data?.message || "Update failed");
        } finally {
            setLoading(false);
        }
    };

    // ── Loading States ────────────────────────────────────────────────────
    if (fetching) {
        return (
            <div className="min-h-screen bg-bg flex items-center justify-center">
                <div className="flex flex-col items-center gap-4 text-body">
                    <FiLoader size={36} className="animate-spin text-[color:var(--color-primary)]" />
                    <p className="text-sm font-semibold">Loading product…</p>
                </div>
            </div>
        );
    }

    if (!form) {
        return (
            <div className="min-h-screen bg-bg flex items-center justify-center">
                <div className="text-center text-body">
                    <FiAlertCircle size={40} className="mx-auto mb-3 text-[color:var(--color-danger)]" />
                    <p className="font-semibold">Product not found</p>
                    <button
                        onClick={() => router.push("/admin/products")}
                        className="mt-4 text-sm underline"
                    >
                        Back to products
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-bg">
            {toast && (
                <div
                    className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-xl text-white text-sm font-semibold ${toast.type === "success" ? "bg-[color:var(--color-success)]" : "bg-[color:var(--color-danger)]"
                        }`}
                >
                    {toast.type === "success" ? <FiCheckCircle size={18} /> : <FiAlertCircle size={18} />}
                    {toast.msg}
                    <button onClick={() => setToast(null)} className="ml-2 opacity-70 hover:opacity-100">
                        <FiX size={15} />
                    </button>
                </div>
            )}

            <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-10">
                <div className="flex items-center gap-4 mb-10">
                    <button
                        onClick={() => router.push("/admin/products")}
                        className="p-2.5 rounded-xl border border-accent-10 text-body hover:bg-card hover:text-heading transition-all"
                    >
                        <FiArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="font-display text-3xl sm:text-4xl font-bold text-heading tracking-tight">
                            Edit Product
                        </h1>
                        <p className="text-body text-sm mt-1 font-mono truncate max-w-xs">ID: {id}</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-7">
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-7">
                        <div className="xl:col-span-2 space-y-7">
                            {/* Basic Information, Pricing - তোমার আগের কোড রাখো (এখানে সংক্ষেপে রাখলাম) */}
                            <Card icon={<FiPackage />} title="Basic Information">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                    <Field label="Product Name" required error={errors.name} className="sm:col-span-2">
                                        <Input name="name" value={form.name} onChange={handleChange}
                                            placeholder="e.g. Premium Organic Cotton Tee"
                                            icon={<FiPackage size={15} />} error={errors.name} />
                                    </Field>
                                    <Field label="Category" required error={errors.category}>
                                        <select name="category" value={form.category} onChange={handleChange}
                                            className={selectClass(errors.category)}>
                                            <option value="">Select category…</option>
                                            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </Field>
                                    <Field label="Tags" error={errors.tags}>
                                        <Input name="tags" value={form.tags} onChange={handleChange}
                                            placeholder="cotton, summer (comma separated)" icon={<FiTag size={15} />} />
                                    </Field>
                                    <Field label="Description" required error={errors.description} className="sm:col-span-2">
                                        <textarea name="description" value={form.description} onChange={handleChange}
                                            rows={5} placeholder="Describe your product…"
                                            className={`${inputBase(errors.description)} resize-none leading-relaxed`} />
                                    </Field>
                                </div>
                            </Card>

                            <Card icon={<FiDollarSign />} title="Pricing">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                    <Field label="Base Price (৳)" required error={errors.basePrice}>
                                        <Input name="basePrice" type="number" min="0" step="0.01"
                                            value={form.basePrice} onChange={handleChange}
                                            placeholder="0.00" icon={<FiDollarSign size={15} />} error={errors.basePrice} />
                                    </Field>
                                    <Field label="Discounted Price (৳)" error={errors.discountedPrice}>
                                        <Input name="discountedPrice" type="number" min="0" step="0.01"
                                            value={form.discountedPrice} onChange={handleChange}
                                            placeholder="Optional" icon={<FiDollarSign size={15} />} />
                                    </Field>
                                </div>
                            </Card>
                            {/* Variants - Fixed with hasVariants Toggle */}
                            <Card icon={<FiLayers />} title="Product Variants">
                                <div className="mb-6">
                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={form.hasVariants}
                                            onChange={(e) => toggleVariants(e.target.checked)}
                                            className="w-5 h-5 accent-primary"
                                        />
                                        <div>
                                            <p className="font-semibold">This product has variants (Size/Color)</p>
                                            <p className="text-xs text-body">e.g. T-shirts, Shoes, etc.</p>
                                        </div>
                                    </label>
                                </div>

                                {form.hasVariants && (
                                    <>
                                        {errors.variants && (
                                            <p className="text-red-500 text-sm mb-4">
                                                <FiAlertCircle size={13} className="inline mr-1" />
                                                {errors.variants}
                                            </p>
                                        )}
                                        <div className="space-y-4">
                                            {form.variants.map((v, i) => (
                                                <VariantRow
                                                    key={i}
                                                    index={i}
                                                    variant={v}
                                                    onChange={setVariant}
                                                    onRemove={removeVariant}
                                                    canRemove={form.variants.length > 1}
                                                />
                                            ))}
                                        </div>
                                        <button
                                            type="button"
                                            onClick={addVariant}
                                            className="mt-5 flex items-center gap-2 px-5 py-2.5 rounded-xl border-2 border-dashed border-[color:var(--color-accent)] text-sm font-bold hover:bg-[color:var(--color-accent)]/10"
                                        >
                                            <FiPlus size={16} /> Add Variant
                                        </button>
                                    </>
                                )}

                                {!form.hasVariants && (
                                    <p className="text-body text-sm py-8 text-center border border-dashed rounded-xl">
                                        This is a single version product (Banner, Poster, Book, etc.)
                                    </p>
                                )}
                            </Card>
                        </div>

                        {/* Right Column - Status + Images */}
                        <div className="space-y-7">
                            <Card icon={<FiList />} title="Status & Visibility">
                                <ToggleField label="Active" sublabel="Visible to customers" checked={form.isActive} onChange={(v) => set("isActive", v)} />
                                <ToggleField label="Featured" sublabel="Show on homepage" checked={form.isFeatured} onChange={(v) => set("isFeatured", v)} />
                            </Card>

                            <Card icon={<FiImage />} title="Product Images" subtitle="Main display images">
                                <ImageUploadZone field="images" images={form.images} uploading={uploading} error={errors.images} onUpload={handleUpload} onRemove={removeImg} required />
                            </Card>

                            <Card icon={<FiImage />} title="Gallery" subtitle="Additional views">
                                <ImageUploadZone field="gallery" images={form.gallery} uploading={uploading} error={errors.gallery} onUpload={handleUpload} onRemove={removeImg} />
                            </Card>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 pt-2 pb-10">
                        <button
                            type="submit"
                            disabled={loading || uploading}
                            className="flex items-center gap-2.5 px-10 py-3.5 rounded-xl bg-[color:var(--color-primary)] text-white font-display font-bold text-base tracking-wide hover:bg-[color:var(--color-secondary)] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-[color:var(--color-primary)]/20"
                        >
                            <FiSave size={18} />
                            {loading ? "Saving…" : "Save Changes"}
                        </button>
                        <button
                            type="button"
                            onClick={() => router.push("/admin/products")}
                            className="px-8 py-3.5 rounded-xl border border-accent-10 text-body font-semibold hover:bg-card transition-all"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
// ─── Shared sub-components (same as add page) ─────────────────────────────────

function Card({ icon, title, subtitle, children }) {
    return (
        <div className="bg-card rounded-2xl border border-accent-10 p-6 shadow-sm">
            <div className="flex items-center gap-2.5 mb-5">
                <span className="text-[color:var(--color-primary)] opacity-80">{icon}</span>
                <div>
                    <h2 className="font-display font-semibold text-lg text-heading leading-tight">{title}</h2>
                    {subtitle && <p className="text-body text-xs">{subtitle}</p>}
                </div>
            </div>
            {children}
        </div>
    );
}

function Field({ label, error, required, children, className = "" }) {
    return (
        <div className={`flex flex-col gap-1.5 ${className}`}>
            <label className="text-xs font-bold text-heading tracking-wide uppercase">
                {label}{required && <span className="text-[color:var(--color-danger)] ml-1">*</span>}
            </label>
            {children}
            {error && (
                <p className="text-[color:var(--color-danger)] text-xs flex items-center gap-1">
                    <FiAlertCircle size={11} />{Array.isArray(error) ? error[0] : error}
                </p>
            )}
        </div>
    );
}

function Input({ icon, error, className = "", ...props }) {
    return (
        <div className="relative">
            {icon && <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-body opacity-60">{icon}</span>}
            <input {...props} className={`${inputBase(error)} ${icon ? "pl-9" : ""} ${className}`} />
        </div>
    );
}

function VariantRow({ index, variant, onChange, onRemove, canRemove }) {
    return (
        <div className="p-4 rounded-xl border border-accent-10 bg-bg group">
            <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-heading uppercase tracking-wide">Variant #{index + 1}</span>
                {canRemove && (
                    <button type="button" onClick={() => onRemove(index)}
                        className="opacity-0 group-hover:opacity-100 flex items-center gap-1 text-xs text-[color:var(--color-danger)] hover:underline transition-opacity">
                        <FiTrash2 size={12} /> Remove
                    </button>
                )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {[
                    { field: "size", placeholder: "S / M / XL", label: "Size" },
                    { field: "color", placeholder: "Red / #ff0000", label: "Color" },
                    { field: "stock", placeholder: "0", label: "Stock", type: "number" },
                    { field: "price", placeholder: "0.00", label: "Price (৳)", type: "number" },
                    { field: "sku", placeholder: "SKU-001", label: "SKU" },
                ].map(({ field, placeholder, label, type = "text" }) => (
                    <div key={field} className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-body uppercase tracking-wide">{label}</label>
                        <input type={type} value={variant[field]}
                            onChange={(e) => onChange(index, field, e.target.value)}
                            placeholder={placeholder} min={type === "number" ? 0 : undefined}
                            step={field === "price" ? "0.01" : undefined}
                            className={inputBase()} />
                    </div>
                ))}
            </div>
        </div>
    );
}

function ToggleField({ label, sublabel, checked, onChange }) {
    return (
        <div className="flex items-center justify-between py-2">
            <div>
                <p className="text-sm font-semibold text-heading">{label}</p>
                <p className="text-xs text-body">{sublabel}</p>
            </div>
            <button type="button" onClick={() => onChange(!checked)}
                className={`text-2xl transition-colors ${checked ? "text-[color:var(--color-success)]" : "text-body opacity-40"}`}>
                {checked ? <FiToggleRight /> : <FiToggleLeft />}
            </button>
        </div>
    );
}

function ImageUploadZone({ field, images, uploading, error, onUpload, onRemove, required }) {
    return (
        <div className="space-y-3">
            <label htmlFor={`upload-${field}`}
                className={`flex flex-col items-center justify-center w-full py-7 border-2 border-dashed rounded-xl cursor-pointer transition-all ${error ? "border-[color:var(--color-danger)]" : "border-[color:var(--color-accent)] hover:bg-[color:var(--color-accent)]/10"
                    }`}>
                <input id={`upload-${field}`} type="file" multiple accept="image/*"
                    onChange={(e) => onUpload(e, field)} className="hidden" />
                {uploading ? (
                    <span className="text-body text-xs font-semibold animate-pulse">Uploading…</span>
                ) : (
                    <>
                        <FiUploadCloud size={28} className="text-[color:var(--color-accent-hover)] mb-2" />
                        <span className="text-body text-xs font-semibold">Click to upload</span>
                        <span className="text-body text-[10px] opacity-60 mt-1">PNG · JPG · WEBP</span>
                    </>
                )}
            </label>
            {error && (
                <p className="text-[color:var(--color-danger)] text-xs flex items-center gap-1">
                    <FiAlertCircle size={11} />{Array.isArray(error) ? error[0] : error}
                </p>
            )}
            {images.length > 0 && (
                <>
                    <div className="grid grid-cols-3 gap-2">
                        {images.map((url, i) => (
                            <div key={i} className="relative group aspect-square">
                                <img src={url} alt="" className="w-full h-full object-cover rounded-lg border border-accent-10" />
                                <button type="button" onClick={() => onRemove(field, url)}
                                    className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[color:var(--color-danger)] text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md">
                                    <FiX size={11} />
                                </button>
                            </div>
                        ))}
                    </div>
                    <div className="bg-bg rounded-lg border border-accent-10 p-3">
                        <p className="text-[10px] font-bold text-body uppercase tracking-wider mb-2">Cloudinary URLs</p>
                        <div className="space-y-1.5 max-h-28 overflow-y-auto pr-1">
                            {images.map((url, i) => (
                                <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                                    className="flex items-center gap-2 text-[10px] font-mono text-[color:var(--color-secondary)] hover:text-[color:var(--color-primary)] group/url">
                                    <span className="w-4 h-4 rounded-full bg-[color:var(--color-accent)] text-[color:var(--color-primary)] flex items-center justify-center text-[9px] font-bold shrink-0">{i + 1}</span>
                                    <span className="truncate flex-1">{url}</span>
                                    <FiExternalLink size={10} className="shrink-0 opacity-0 group-hover/url:opacity-100 transition-opacity" />
                                </a>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

const inputBase = (error) =>
    ["w-full px-3.5 py-2.5 rounded-lg text-sm font-medium text-heading bg-bg",
        "border transition-all duration-150 outline-none",
        "placeholder:text-body placeholder:opacity-40 placeholder:font-normal",
        "focus:ring-2 focus:ring-[color:var(--color-accent)]/40 focus:border-[color:var(--color-accent-hover)]",
        error ? "border-[color:var(--color-danger)]/60" : "border-accent-10 hover:border-[color:var(--color-accent-hover)]",
    ].join(" ");

const selectClass = (error) => inputBase(error) + " cursor-pointer appearance-none";