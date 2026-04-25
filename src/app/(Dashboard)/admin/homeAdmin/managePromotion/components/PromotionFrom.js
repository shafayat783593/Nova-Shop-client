"use client";

// ─── Shared PromotionForm ─────────────────────────────────────────────────────
// Updated: scope products / bxgy products use ProductPicker (searchable multi-select)

import { useForm, Controller } from "react-hook-form";
import {
    Tag, ShoppingCart, Gift, Truck,
} from "lucide-react";
import ProductPicker from "./ProductPicker";
import CategoryPicker from "./CategoryPicker";

const TYPES = [
    { value: "product", label: "Product Discount", icon: Tag, desc: "Apply to specific products or categories" },
    { value: "cart", label: "Cart Discount", icon: ShoppingCart, desc: "Apply when cart meets conditions" },
    { value: "bxgy", label: "Buy X Get Y", icon: Gift, desc: "Buy X items, get Y free" },
    { value: "free_shipping", label: "Free Shipping", icon: Truck, desc: "Waive shipping costs" },
];

const DISCOUNT_TYPES = [
    { value: "percent", label: "Percentage (%)" },
    { value: "fixed", label: "Fixed Amount (৳)" },
    { value: "free", label: "Free (no value needed)" },
];

const USER_ROLES = ["customer", "vip", "admin"];

function SectionTitle({ children }) {
    return (
        <h3 className="text-heading text-sm font-bold uppercase tracking-widest border-b border-accent-10 pb-2 mb-4">
            {children}
        </h3>
    );
}

function Field({ label, error, children, hint }) {
    return (
        <div className="space-y-1.5">
            {label && <label className="text-heading text-sm font-semibold">{label}</label>}
            {children}
            {hint && <p className="text-body text-xs">{hint}</p>}
            {error && <p className="text-[var(--color-danger)] text-xs">{error}</p>}
        </div>
    );
}

const inputClass =
    "w-full px-3.5 py-2.5 text-sm bg-bg border border-accent-10 rounded-xl text-heading placeholder:text-body outline-none focus:border-[var(--color-primary)] transition-colors";

export default function PromotionForm({
    defaultValues = {},
    onSubmit,
    submitLabel = "Save",
    loading = false,
}) {
    const {
        register,
        handleSubmit,
        watch,
        control,
        formState: { errors },
    } = useForm({
        defaultValues: {
            name: "",
            description: "",
            type: "cart",
            discountType: "percent",
            value: "",
            conditions: {
                minCartValue: "",
                userRoles: [],
                firstOrderOnly: false,
                paymentMethod: "",
            },
            // scope.products / excludeProducts are now string[] of ObjectIds
            scope: {
                categories: "",
                products: [],
                excludeProducts: [],
            },
            bxgy: {
                buy: "",
                get: "",
                productIds: [],   // now array of ObjectIds
            },
            usageLimit: "",
            perUserLimit: "",
            priority: 0,
            stackable: false,
            startDate: "",
            endDate: "",
            isActive: true,
            ...defaultValues,
        },
    });

    const selectedType = watch("type");
    const selectedDiscountType = watch("discountType");

    const submit = (data) => {
        const clean = {
            ...data,
            scope: {
                // categories stays comma-separated string → split
                categories: data.scope.categories
                    ? data.scope.categories.split(",").map((s) => s.trim()).filter(Boolean)
                    : [],
                // products & excludeProducts are already arrays from ProductPicker
                products: data.scope.products || [],
                excludeProducts: data.scope.excludeProducts || [],
            },
            bxgy: {
                buy: data.bxgy.buy !== "" ? Number(data.bxgy.buy) : undefined,
                get: data.bxgy.get !== "" ? Number(data.bxgy.get) : undefined,
                productIds: data.bxgy.productIds || [],
            },
            value: data.value !== "" ? Number(data.value) : undefined,
            usageLimit: data.usageLimit !== "" ? Number(data.usageLimit) : undefined,
            perUserLimit: data.perUserLimit !== "" ? Number(data.perUserLimit) : undefined,
            priority: Number(data.priority) || 0,
            conditions: {
                ...data.conditions,
                minCartValue:
                    data.conditions.minCartValue !== ""
                        ? Number(data.conditions.minCartValue)
                        : undefined,
            },
            startDate: data.startDate || undefined,
            endDate: data.endDate || undefined,
        };
        onSubmit(clean);
    };

    return (
        <form onSubmit={handleSubmit(submit)} className="space-y-8">

            {/* ── Basic Info ────────────────────────────────────────────────── */}
            <div className="bg-card border border-accent-10 rounded-2xl p-6 space-y-5">
                <SectionTitle>Basic Information</SectionTitle>

                <Field label="Promotion Name *" error={errors.name?.message}>
                    <input
                        {...register("name", { required: "Name is required" })}
                        placeholder="e.g. Summer Sale 20% Off"
                        className={inputClass}
                    />
                </Field>

                <Field label="Description">
                    <textarea
                        {...register("description")}
                        rows={2}
                        placeholder="Short description for internal reference"
                        className={inputClass}
                    />
                </Field>

                <Field label="Promotion Type *">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                        {TYPES.map(({ value, label, icon: Icon, desc }) => (
                            <label
                                key={value}
                                className={`cursor-pointer p-3.5 rounded-xl border transition-all ${selectedType === value
                                        ? "border-[var(--color-primary)] bg-[var(--color-primary)]/10"
                                        : "border-accent-10 hover:border-[var(--color-accent)]"
                                    }`}
                            >
                                <input type="radio" value={value} {...register("type")} className="sr-only" />
                                <Icon
                                    size={18}
                                    className={selectedType === value ? "text-[var(--color-primary)]" : "text-body"}
                                />
                                <p className={`text-sm font-semibold mt-2 ${selectedType === value ? "text-[var(--color-primary)]" : "text-heading"
                                    }`}>
                                    {label}
                                </p>
                                <p className="text-body text-xs mt-0.5">{desc}</p>
                            </label>
                        ))}
                    </div>
                </Field>
            </div>

            {/* ── Discount ─────────────────────────────────────────────────── */}
            {selectedType !== "free_shipping" && (
                <div className="bg-card border border-accent-10 rounded-2xl p-6 space-y-5">
                    <SectionTitle>Discount Configuration</SectionTitle>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <Field label="Discount Type">
                            <select {...register("discountType")} className={inputClass}>
                                {DISCOUNT_TYPES.map((dt) => (
                                    <option key={dt.value} value={dt.value}>{dt.label}</option>
                                ))}
                            </select>
                        </Field>

                        {selectedDiscountType !== "free" && (
                            <Field
                                label={selectedDiscountType === "percent" ? "Percentage Value" : "Fixed Amount (৳)"}
                                error={errors.value?.message}
                            >
                                <input
                                    type="number"
                                    min={0}
                                    {...register("value", { min: { value: 0, message: "Must be positive" } })}
                                    placeholder={selectedDiscountType === "percent" ? "e.g. 20" : "e.g. 150"}
                                    className={inputClass}
                                />
                            </Field>
                        )}
                    </div>
                </div>
            )}

            {/* ── BXGY ─────────────────────────────────────────────────────── */}
            {selectedType === "bxgy" && (
                <div className="bg-card border border-accent-10 rounded-2xl p-6 space-y-5">
                    <SectionTitle>Buy X Get Y Settings</SectionTitle>
                    <div className="grid grid-cols-2 gap-5">
                        <Field label="Buy (X)">
                            <input
                                type="number"
                                min={1}
                                {...register("bxgy.buy")}
                                placeholder="e.g. 2"
                                className={inputClass}
                            />
                        </Field>
                        <Field label="Get (Y) free">
                            <input
                                type="number"
                                min={1}
                                {...register("bxgy.get")}
                                placeholder="e.g. 1"
                                className={inputClass}
                            />
                        </Field>
                    </div>

                    {/* ── ProductPicker for bxgy ── */}
                    <Controller
                        control={control}
                        name="bxgy.productIds"
                        render={({ field }) => (
                            <ProductPicker
                                label="Eligible Products"
                                value={field.value || []}
                                onChange={field.onChange}
                                placeholder="Search and select products…"
                            />
                        )}
                    />
                </div>
            )}

            {/* ── Scope ────────────────────────────────────────────────────── */}
            {(selectedType === "product" || selectedType === "bxgy") && (
                <div className="bg-card border border-accent-10 rounded-2xl p-6 space-y-5">
                    <SectionTitle>Scope</SectionTitle>

                    <Controller
                        control={control}
                        name="scope.categories"
                        render={({ field }) => (
                            <CategoryPicker
                                label="Categories"
                                value={field.value || []}
                                onChange={field.onChange}
                                placeholder="Search and select categories…"
                            />
                        )}
                    />

                    {/* ── ProductPicker for scope.products ── */}
                    <Controller
                        control={control}
                        name="scope.products"
                        render={({ field }) => (
                            <ProductPicker
                                label="Include Products"
                                value={field.value || []}
                                onChange={field.onChange}
                                placeholder="Search and select products to include…"
                            />
                        )}
                    />

                    {/* ── ProductPicker for scope.excludeProducts ── */}
                    <Controller
                        control={control}
                        name="scope.excludeProducts"
                        render={({ field }) => (
                            <ProductPicker
                                label="Exclude Products"
                                value={field.value || []}
                                onChange={field.onChange}
                                placeholder="Search and select products to exclude…"
                            />
                        )}
                    />
                </div>
            )}

            {/* ── Conditions ───────────────────────────────────────────────── */}
            <div className="bg-card border border-accent-10 rounded-2xl p-6 space-y-5">
                <SectionTitle>Conditions</SectionTitle>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <Field label="Min Cart Value (৳)">
                        <input
                            type="number"
                            min={0}
                            {...register("conditions.minCartValue")}
                            placeholder="e.g. 500"
                            className={inputClass}
                        />
                    </Field>
                    <Field label="Payment Method">
                        <input
                            {...register("conditions.paymentMethod")}
                            placeholder="e.g. bkash, card"
                            className={inputClass}
                        />
                    </Field>
                </div>

                <Field label="Eligible User Roles">
                    <div className="flex flex-wrap gap-3 mt-1">
                        {USER_ROLES.map((role) => (
                            <label key={role} className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    value={role}
                                    {...register("conditions.userRoles")}
                                    className="accent-[var(--color-primary)] w-4 h-4"
                                />
                                <span className="text-heading text-sm capitalize">{role}</span>
                            </label>
                        ))}
                    </div>
                </Field>

                <label className="flex items-center gap-2 cursor-pointer">
                    <input
                        type="checkbox"
                        {...register("conditions.firstOrderOnly")}
                        className="accent-[var(--color-primary)] w-4 h-4"
                    />
                    <span className="text-heading text-sm">First Order Only</span>
                </label>
            </div>

            {/* ── Usage & Priority ─────────────────────────────────────────── */}
            <div className="bg-card border border-accent-10 rounded-2xl p-6 space-y-5">
                <SectionTitle>Usage & Priority</SectionTitle>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                    <Field label="Global Usage Limit" hint="Blank = unlimited">
                        <input type="number" min={1} {...register("usageLimit")} placeholder="e.g. 100" className={inputClass} />
                    </Field>
                    <Field label="Per User Limit" hint="Blank = unlimited">
                        <input type="number" min={1} {...register("perUserLimit")} placeholder="e.g. 1" className={inputClass} />
                    </Field>
                    <Field label="Priority" hint="Higher = applied first">
                        <input type="number" {...register("priority")} placeholder="0" className={inputClass} />
                    </Field>
                </div>

                <label className="flex items-center gap-2 cursor-pointer">
                    <input
                        type="checkbox"
                        {...register("stackable")}
                        className="accent-[var(--color-primary)] w-4 h-4"
                    />
                    <span className="text-heading text-sm">
                        Stackable (can combine with other promotions)
                    </span>
                </label>
            </div>

            {/* ── Schedule ─────────────────────────────────────────────────── */}
            <div className="bg-card border border-accent-10 rounded-2xl p-6 space-y-5">
                <SectionTitle>Schedule</SectionTitle>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <Field label="Start Date">
                        <input type="datetime-local" {...register("startDate")} className={inputClass} />
                    </Field>
                    <Field label="End Date">
                        <input type="datetime-local" {...register("endDate")} className={inputClass} />
                    </Field>
                </div>
            </div>

            {/* ── Status ───────────────────────────────────────────────────── */}
            <div className="bg-card border border-accent-10 rounded-2xl p-6">
                <label className="flex items-center gap-3 cursor-pointer">
                    <input
                        type="checkbox"
                        {...register("isActive")}
                        className="accent-[var(--color-primary)] w-5 h-5"
                    />
                    <div>
                        <p className="text-heading font-semibold">Active</p>
                        <p className="text-body text-xs">Promotion will be live immediately after saving</p>
                    </div>
                </label>
            </div>

            {/* ── Submit ───────────────────────────────────────────────────── */}
            <div className="flex justify-end gap-3">
                <button
                    type="button"
                    onClick={() => window.history.back()}
                    className="px-6 py-2.5 rounded-xl border border-accent-10 text-heading text-sm font-semibold hover:bg-[var(--accent-opacity)] transition-colors"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={loading}
                    className="px-8 py-2.5 rounded-xl bg-[var(--color-primary)] hover:bg-[var(--color-secondary)] text-white text-sm font-semibold transition-colors disabled:opacity-60 flex items-center gap-2"
                >
                    {loading && (
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    )}
                    {submitLabel}
                </button>
            </div>
        </form>
    );
}