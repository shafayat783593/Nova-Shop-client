"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import useCloudinaryUpload from "@/utils/useCloudinaryUpload";
import api from "@/app/lib/api";
import {
  FiPackage, FiTag, FiDollarSign, FiList, FiImage,
  FiPlus, FiTrash2, FiExternalLink, FiToggleLeft,
  FiToggleRight, FiSave, FiArrowLeft, FiAlertCircle,
  FiCheckCircle, FiX, FiUploadCloud, FiLayers,
} from "react-icons/fi";

// ─── Constants ────────────────────────────────────────────────────────────────
const CATEGORIES = [
  "Electronics", "Clothing", "Footwear", "Home & Living",
  "Beauty", "Sports", "Books", "Toys", "Accessories", "Printing", "Other",
];

const EMPTY_VARIANT = { size: "", color: "", stock: "", price: "", sku: "" };

const INITIAL = {
  name: "",
  description: "",
  category: "",
  tags: "",
  basePrice: "",
  discountedPrice: "",
  images: [],
  gallery: [],
  hasVariants: false,
  variants: [],
  isActive: true,
  isFeatured: false,
};

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AddProductPage() {
  const router = useRouter();
  const [form, setForm] = useState(INITIAL);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const { uploading, uploadSingle } = useCloudinaryUpload();

  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  };

  // ── Field helpers ─────────────────────────────────────────────────────────
  const set = (name, val) => {
    setForm((p) => ({ ...p, [name]: val }));
    if (errors[name]) setErrors((p) => ({ ...p, [name]: undefined }));
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    set(name, type === "checkbox" ? checked : value);
  };

  // ── Variants Handlers ─────────────────────────────────────────────────────
  const setVariant = (i, field, val) => {
    setForm((p) => {
      const v = [...p.variants];
      v[i] = { ...v[i], [field]: val };
      return { ...p, variants: v };
    });
  };

  const addVariant = () => {
    setForm((p) => ({
      ...p,
      variants: [...p.variants, { ...EMPTY_VARIANT }],
    }));
  };

  const removeVariant = (i) => {
    setForm((p) => ({
      ...p,
      variants: p.variants.filter((_, idx) => idx !== i),
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

  // ── Image upload ──────────────────────────────────────────────────────────
  const handleUpload = async (e, field) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    try {
      const result = await uploadSingle(files[0], { folder: "products" });
      if (result?.url) {
        setForm((p) => ({
          ...p,
          [field]: [...p[field], result.url],
        }));
        setErrors((p) => ({ ...p, [field]: undefined }));
      }
    } catch (err) {
      showToast("error", err.message || "Upload failed");
    } finally {
      e.target.value = "";
    }
  };

  const removeImg = (field, url) =>
    setForm((p) => ({ ...p, [field]: p[field].filter((u) => u !== url) }));

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
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
      variants: form.variants.map((v) => ({
        size: v.size?.trim() || undefined,
        color: v.color?.trim() || undefined,
        stock: Number(v.stock),
        price: Number(v.price),
        sku: v.sku?.trim() || undefined,
      })),
      isActive: form.isActive,
      isFeatured: form.isFeatured,
    };

    if (!form.hasVariants) {
      payload.variants = [];
    }

    try {
      await api.post("/api/products", payload);
      showToast("success", "Product created successfully!");
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

      showToast("error", err?.response?.data?.message || "Failed to create product");
    } finally {
      setLoading(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-bg">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-xl text-white text-sm font-semibold transition-all ${toast.type === "success" ? "bg-green-600" : "bg-red-600"
            }`}
        >
          {toast.type === "success" ? <FiCheckCircle size={18} /> : <FiAlertCircle size={18} />}
          {toast.msg}
          <button onClick={() => setToast(null)} className="ml-2">
            <FiX size={15} />
          </button>
        </div>
      )}

      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-10">
        {/* Header */}
        <div className="flex items-center gap-4 mb-10">
          <button
            onClick={() => router.back()}
            className="p-2.5 rounded-xl border border-accent-10 hover:bg-card transition-all"
          >
            <FiArrowLeft size={20} />
          </button>
          <div>
            <h1 className="font-display text-3xl sm:text-4xl font-bold text-heading tracking-tight">
              Add New Product
            </h1>
            <p className="text-body text-sm mt-1">
              Create product with or without variants
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            {/* Left Column */}
            <div className="xl:col-span-2 space-y-8">
              {/* Basic Information */}
              <Card icon={<FiPackage />} title="Basic Information">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <Field label="Product Name" required error={errors.name} className="sm:col-span-2">
                    <Input
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      placeholder="e.g. Election Campaign Banner"
                      icon={<FiPackage size={15} />}
                      error={errors.name}
                    />
                  </Field>

                  <Field label="Category" required error={errors.category}>
                    <select
                      name="category"
                      value={form.category}
                      onChange={handleChange}
                      className={selectClass(errors.category)}
                    >
                      <option value="">Select category...</option>
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <Field label="Tags (comma separated)" error={errors.tags}>
                    <Input
                      name="tags"
                      value={form.tags}
                      onChange={handleChange}
                      placeholder="election, banner, printing"
                      icon={<FiTag size={15} />}
                    />
                  </Field>

                  <Field label="Description" required error={errors.description} className="sm:col-span-2">
                    <textarea
                      name="description"
                      value={form.description}
                      onChange={handleChange}
                      rows={5}
                      placeholder="Describe your product in detail..."
                      className={`${inputBase(errors.description)} resize-none`}
                    />
                  </Field>
                </div>
              </Card>

              {/* Pricing */}
              <Card icon={<FiDollarSign />} title="Pricing">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <Field label="Base Price (৳)" required error={errors.basePrice}>
                    <Input
                      name="basePrice"
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.basePrice}
                      onChange={handleChange}
                      placeholder="0.00"
                      icon={<FiDollarSign size={15} />}
                      error={errors.basePrice}
                    />
                  </Field>
                  <Field label="Discounted Price (৳)" error={errors.discountedPrice}>
                    <Input
                      name="discountedPrice"
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.discountedPrice}
                      onChange={handleChange}
                      placeholder="Optional"
                      icon={<FiDollarSign size={15} />}
                    />
                  </Field>
                </div>
              </Card>

              {/* Variants */}
              <Card icon={<FiLayers />} title="Product Variants">
                <div className="mb-6">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.hasVariants}
                      onChange={(e) => toggleVariants(e.target.checked)}
                      className="w-5 h-5 accent-primary rounded"
                    />
                    <div>
                      <p className="font-semibold text-heading">This product has variants (Size / Color)</p>
                      <p className="text-xs text-body">Example: T-shirts, Shoes, Mobile covers etc.</p>
                    </div>
                  </label>
                </div>

                {form.hasVariants && (
                  <>
                    {errors.variants && (
                      <p className="text-red-500 text-sm mb-4 flex items-center gap-1">
                        <FiAlertCircle size={16} /> {errors.variants}
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
                      className="mt-5 flex items-center gap-2 px-6 py-3 border-2 border-dashed border-accent rounded-xl hover:bg-accent/10 transition-all text-sm font-medium"
                    >
                      <FiPlus size={18} /> Add Another Variant
                    </button>
                  </>
                )}

                {!form.hasVariants && (
                  <p className="text-body text-sm py-8 text-center border border-dashed border-accent-10 rounded-xl bg-bg">
                    Single version product (like Banner, Poster, Flex, Book, Mug etc.)
                  </p>
                )}
              </Card>
            </div>

            {/* Right Column */}
            <div className="space-y-8">
              {/* Status */}
              <Card icon={<FiList />} title="Status & Visibility">
                <div className="space-y-5">
                  <ToggleField
                    label="Active"
                    sublabel="Visible to customers"
                    checked={form.isActive}
                    onChange={(v) => set("isActive", v)}
                  />
                  <ToggleField
                    label="Featured"
                    sublabel="Show on homepage"
                    checked={form.isFeatured}
                    onChange={(v) => set("isFeatured", v)}
                  />
                </div>
              </Card>

              {/* Main Images */}
              <Card icon={<FiImage />} title="Product Images" subtitle="(Main display images)">
                <ImageUploadZone
                  field="images"
                  images={form.images}
                  uploading={uploading}
                  error={errors.images}
                  onUpload={handleUpload}
                  onRemove={removeImg}
                  required
                />
              </Card>

              {/* Gallery */}
              <Card icon={<FiImage />} title="Gallery" subtitle="(Additional images)">
                <ImageUploadZone
                  field="gallery"
                  images={form.gallery}
                  uploading={uploading}
                  error={errors.gallery}
                  onUpload={handleUpload}
                  onRemove={removeImg}
                />
              </Card>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex items-center gap-4 pt-8">
            <button
              type="submit"
              disabled={loading || uploading}
              className="flex-1 py-4 bg-primary hover:bg-primary/90 text-white font-bold rounded-2xl disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              <FiSave size={20} />
              {loading ? "Publishing Product..." : "Publish Product"}
            </button>

            <button
              type="button"
              onClick={() => setForm(INITIAL)}
              className="px-8 py-4 border border-accent-10 rounded-2xl font-medium hover:bg-card transition-all"
            >
              Reset
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Sub Components ───────────────────────────────────────────────────────────

function Card({ icon, title, subtitle, children }) {
  return (
    <div className="bg-card rounded-2xl border border-accent-10 p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <span className="text-primary opacity-80">{icon}</span>
        <div>
          <h2 className="font-semibold text-xl text-heading">{title}</h2>
          {subtitle && <p className="text-body text-sm mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {children}
    </div>
  );
}

function Field({ label, required, error, children, className = "" }) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label className="text-xs font-bold uppercase tracking-widest text-heading">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {error && (
        <p className="text-red-500 text-xs flex items-center gap-1 mt-1">
          <FiAlertCircle size={12} /> {error}
        </p>
      )}
    </div>
  );
}

function Input({ icon, error, className = "", ...props }) {
  return (
    <div className="relative">
      {icon && (
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-body opacity-60">
          {icon}
        </span>
      )}
      <input
        {...props}
        className={`${inputBase(error)} ${icon ? "pl-10" : ""} ${className}`}
      />
    </div>
  );
}

function VariantRow({ index, variant, onChange, onRemove, canRemove }) {
  return (
    <div className="p-5 rounded-2xl border border-accent-10 bg-bg group">
      <div className="flex justify-between items-center mb-4">
        <span className="text-xs font-bold uppercase tracking-widest text-heading">
          Variant #{index + 1}
        </span>
        {canRemove && (
          <button
            type="button"
            onClick={() => onRemove(index)}
            className="text-red-500 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-all"
          >
            <FiTrash2 size={16} />
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        {[
          { field: "size", placeholder: "M / L / XL", label: "Size" },
          { field: "color", placeholder: "Red / Black", label: "Color" },
          { field: "stock", placeholder: "50", label: "Stock", type: "number" },
          { field: "price", placeholder: "899", label: "Price (৳)", type: "number" },
          { field: "sku", placeholder: "SKU-001", label: "SKU" },
        ].map(({ field, placeholder, label, type = "text" }) => (
          <div key={field} className="flex flex-col gap-1">
            <label className="text-[10px] font-bold uppercase tracking-widest text-body">{label}</label>
            <input
              type={type}
              value={variant[field] || ""}
              onChange={(e) => onChange(index, field, e.target.value)}
              placeholder={placeholder}
              min={type === "number" ? "0" : undefined}
              step={field === "price" ? "0.01" : undefined}
              className={inputBase()}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function ToggleField({ label, sublabel, checked, onChange }) {
  return (
    <div className="flex items-center justify-between py-3">
      <div>
        <p className="font-medium text-heading">{label}</p>
        <p className="text-xs text-body">{sublabel}</p>
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`text-3xl transition-all ${checked ? "text-green-500" : "text-gray-400"}`}
      >
        {checked ? <FiToggleRight /> : <FiToggleLeft />}
      </button>
    </div>
  );
}

function ImageUploadZone({ field, images, uploading, error, onUpload, onRemove, required = false }) {
  return (
    <div className="space-y-4">
      <label
        htmlFor={`upload-${field}`}
        className={`flex flex-col items-center justify-center w-full py-10 border-2 border-dashed rounded-2xl cursor-pointer transition-all hover:bg-accent/5 ${error ? "border-red-500" : "border-accent-10"
          }`}
      >
        <input
          id={`upload-${field}`}
          type="file"
          accept="image/*"
          onChange={(e) => onUpload(e, field)}
          className="hidden"
        />
        {uploading ? (
          <span className="text-sm font-medium animate-pulse">Uploading...</span>
        ) : (
          <>
            <FiUploadCloud size={32} className="text-accent mb-3" />
            <span className="font-medium text-sm">Click to upload images</span>
            <span className="text-xs text-body mt-1">PNG, JPG, WEBP • Max 10MB</span>
          </>
        )}
      </label>

      {error && (
        <p className="text-red-500 text-xs flex items-center gap-1">
          <FiAlertCircle size={14} /> {error}
        </p>
      )}

      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {images.map((url, i) => (
            <div key={i} className="relative group aspect-square rounded-xl overflow-hidden border border-accent-10">
              <img src={url} alt="" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => onRemove(field, url)}
                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-all"
              >
                <FiX size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Style Helpers ────────────────────────────────────────────────────────────
const inputBase = (error) =>
  `w-full px-4 py-3 rounded-xl border text-sm bg-bg transition-all focus:outline-none focus:ring-2 focus:ring-primary/30 ${error ? "border-red-500" : "border-accent-10 focus:border-primary"
  }`;

const selectClass = (error) =>
  inputBase(error) + " cursor-pointer appearance-none";