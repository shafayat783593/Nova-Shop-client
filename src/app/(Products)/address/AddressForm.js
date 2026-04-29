"use client";

import { useState, useEffect } from "react";
import { MapPin, User, Phone, Home, Building2, MoreHorizontal, Loader2, Check } from "lucide-react";
import api from "@/app/lib/api";

// ─── Field wrapper ────────────────────────────────────────────────────────────
function Field({ label, error, required, children }) {
    return (
        <div className="space-y-1.5">
            <label className="text-heading text-sm font-semibold">
                {label}
                {required && <span className="text-[var(--color-danger)] ml-1">*</span>}
            </label>
            {children}
            {error && (
                <p className="text-[var(--color-danger)] text-xs flex items-center gap-1">
                    {error}
                </p>
            )}
        </div>
    );
}

// ─── Input style ──────────────────────────────────────────────────────────────
const inputCls =
    "w-full px-3.5 py-2.5 text-sm bg-bg border border-accent-10 rounded-xl " +
    "text-heading placeholder:text-body outline-none " +
    "focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/10 " +
    "transition-all disabled:opacity-50 disabled:cursor-not-allowed";

const LABELS = [
    { value: "Home", icon: Home, label: "Home" },
    { value: "Office", icon: Building2, label: "Office" },
    { value: "Other", icon: MoreHorizontal, label: "Other" },
];

// ─── AddressForm ──────────────────────────────────────────────────────────────
// Used for both Add and Edit
// defaultValues — pass existing address to pre-fill for edit
export default function AddressForm({ defaultValues = null, onSuccess, onCancel }) {
    const isEdit = !!defaultValues?._id;

    const [form, setForm] = useState({
        fullName: defaultValues?.fullName || "",
        phone: defaultValues?.phone || "",
        addressLine: defaultValues?.addressLine || "",
        label: defaultValues?.label || "Home",
        division: defaultValues?.division || "",
        district: defaultValues?.district || "",
        area: defaultValues?.area || "",
        postalCode: defaultValues?.postalCode || "",
        isDefault: defaultValues?.isDefault ?? false,
    });

    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    // ── Location data ──────────────────────────────────────────────────────
    const [divisions, setDivisions] = useState([]);
    const [districts, setDistricts] = useState([]);
    const [upazilas, setUpazilas] = useState([]);
    const [locLoading, setLocLoading] = useState(false);

    // Load divisions on mount
    useEffect(() => {
        api.get("/api/addresses/location-data")
            .then(({ data }) => setDivisions(data.data.divisions))
            .catch(console.error);
    }, []);

    // Load districts when division changes
    useEffect(() => {
        if (!form.division) { setDistricts([]); setUpazilas([]); return; }
        setLocLoading(true);
        api.get(`/api/addresses/location-data?division=${form.division}`)
            .then(({ data }) => {
                setDistricts(data.data.districts);
                setUpazilas([]);
            })
            .catch(console.error)
            .finally(() => setLocLoading(false));
    }, [form.division]);

    // Load upazilas when district changes
    useEffect(() => {
        if (!form.district) { setUpazilas([]); return; }
        setLocLoading(true);
        api.get(`/api/addresses/location-data?district=${form.district}`)
            .then(({ data }) => setUpazilas(data.data.upazilas))
            .catch(console.error)
            .finally(() => setLocLoading(false));
    }, [form.district]);

    // ── Handlers ──────────────────────────────────────────────────────────
    const set = (key, value) => {
        setForm(prev => {
            const next = { ...prev, [key]: value };
            // Reset dependent fields on location change
            if (key === "division") { next.district = ""; next.area = ""; }
            if (key === "district") { next.area = ""; }
            return next;
        });
        if (errors[key]) setErrors(prev => ({ ...prev, [key]: "" }));
    };

    const validate = () => {
        const e = {};
        if (!form.fullName.trim()) e.fullName = "Full name is required";
        if (!form.phone.trim()) e.phone = "Phone number is required";
        if (!form.addressLine.trim()) e.addressLine = "Address is required";
        if (!form.division) e.division = "Select a division";
        if (!form.district) e.district = "Select a district";
        if (!form.area) e.area = "Select an area";
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSubmit = async () => {
        if (!validate()) return;
        setLoading(true);
        try {
            const url = isEdit
                ? `/api/addresses/${defaultValues._id}`
                : "/api/addresses";
            const method = isEdit ? "put" : "post";
            const { data } = await api[method](url, form);
            onSuccess?.(data.data);
        } catch (err) {
            setErrors({ submit: err.response?.data?.message || "Something went wrong" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-5">

            {/* Label selector */}
            <div className="flex gap-2">
                {LABELS.map(({ value, icon: Icon, label }) => (
                    <button
                        key={value}
                        type="button"
                        onClick={() => set("label", value)}
                        className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-sm font-semibold transition-all
                            ${form.label === value
                                ? "border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
                                : "border-accent-10 text-body hover:border-[var(--color-primary)]/40"
                            }`}
                    >
                        <Icon size={14} />
                        {label}
                    </button>
                ))}
            </div>

            {/* Name + Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Full Name" required error={errors.fullName}>
                    <div className="relative">
                        <User size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-body" />
                        <input
                            value={form.fullName}
                            onChange={e => set("fullName", e.target.value)}
                            placeholder="Your full name"
                            className={`${inputCls} pl-10`}
                        />
                    </div>
                </Field>
                <Field label="Phone Number" required error={errors.phone}>
                    <div className="relative">
                        <Phone size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-body" />
                        <input
                            value={form.phone}
                            onChange={e => set("phone", e.target.value)}
                            placeholder="01XXXXXXXXX"
                            className={`${inputCls} pl-10`}
                        />
                    </div>
                </Field>
            </div>

            {/* Address Line */}
            <Field label="Address (House, Road, Block)" required error={errors.addressLine}>
                <div className="relative">
                    <MapPin size={14} className="absolute left-3.5 top-3.5 text-body" />
                    <textarea
                        value={form.addressLine}
                        onChange={e => set("addressLine", e.target.value)}
                        placeholder="e.g. House 12, Road 5, Block B, Mirpur-10"
                        rows={2}
                        className={`${inputCls} pl-10 resize-none`}
                    />
                </div>
            </Field>

            {/* Division → District → Upazila (cascading) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

                <Field label="Division" required error={errors.division}>
                    <div className="relative">
                        <select
                            value={form.division}
                            onChange={e => set("division", e.target.value)}
                            className={inputCls}
                        >
                            <option value="">Select Division</option>
                            {divisions.map(d => (
                                <option key={d} value={d}>{d}</option>
                            ))}
                        </select>
                        {locLoading && (
                            <Loader2 size={13} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-body" />
                        )}
                    </div>
                </Field>

                <Field label="District" required error={errors.district}>
                    <select
                        value={form.district}
                        onChange={e => set("district", e.target.value)}
                        disabled={!form.division || districts.length === 0}
                        className={inputCls}
                    >
                        <option value="">Select District</option>
                        {districts.map(d => (
                            <option key={d} value={d}>{d}</option>
                        ))}
                    </select>
                </Field>

                <Field label="Area / Upazila" required error={errors.area}>
                    <select
                        value={form.area}
                        onChange={e => set("area", e.target.value)}
                        disabled={!form.district || upazilas.length === 0}
                        className={inputCls}
                    >
                        <option value="">Select Area</option>
                        {upazilas.map(u => (
                            <option key={u} value={u}>{u}</option>
                        ))}
                    </select>
                </Field>

            </div>

            {/* Postal Code */}
            <Field label="Postal Code" error={errors.postalCode}>
                <input
                    value={form.postalCode}
                    onChange={e => set("postalCode", e.target.value)}
                    placeholder="e.g. 1216"
                    className={inputCls}
                />
            </Field>

            {/* Set as default */}
            <label className="flex items-center gap-2.5 cursor-pointer group">
                <div
                    onClick={() => set("isDefault", !form.isDefault)}
                    className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all flex-shrink-0
                        ${form.isDefault
                            ? "bg-[var(--color-primary)] border-[var(--color-primary)]"
                            : "border-accent-10 group-hover:border-[var(--color-primary)]/50"
                        }`}
                >
                    {form.isDefault && <Check size={12} className="text-white" />}
                </div>
                <span className="text-heading text-sm">Set as default address</span>
            </label>

            {/* Submit error */}
            {errors.submit && (
                <p className="text-[var(--color-danger)] text-sm bg-[var(--color-danger)]/8 px-4 py-3 rounded-xl">
                    {errors.submit}
                </p>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-1">
                {onCancel && (
                    <button
                        type="button"
                        onClick={onCancel}
                        className="flex-1 py-2.5 rounded-xl border border-accent-10 text-heading text-sm font-semibold hover:bg-[var(--accent-opacity)] transition-colors"
                    >
                        Cancel
                    </button>
                )}
                <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={loading}
                    className="flex-1 py-2.5 rounded-xl bg-[var(--color-primary)] hover:bg-[var(--color-secondary)] text-white text-sm font-semibold transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                >
                    {loading && <Loader2 size={14} className="animate-spin" />}
                    {isEdit ? "Save Changes" : "Add Address"}
                </button>
            </div>
        </div>
    );
}