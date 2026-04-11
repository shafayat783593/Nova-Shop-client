"use client";

import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast, { Toaster } from "react-hot-toast";
import { useAuth } from "@/app/context/AuthContext";
import api from "@/app/lib/api";
import useCloudinaryUpload from "@/utils/useCloudinaryUpload";

// ─────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────

const UPLOAD_FOLDER = "vendor-shop-info";

const CATEGORIES = [
    "Electronics", "Fashion", "Home & Living", "Food & Grocery",
    "Beauty & Health", "Sports & Outdoors", "Books & Stationery",
    "Toys & Kids", "Automotive", "Other",
];

const EMPTY_FORM = {
    shopName: "", category: "", logo: "",
    businessEmail: "", businessPhone: "", pickupAddress: "", city: "", area: "",
    nidNumber: "", tradeLicense: "", nidFront: "", nidBack: "",
    payoutMethod: "bank",
    bankName: "", accountHolder: "", accountNumber: "", routingNumber: "",
    mfsNumber: "",
};

// Shop status config — color + label for each status
const STATUS_CONFIG = {
    pending: { label: "Pending Review", bg: "rgba(234,179,8,0.15)", color: "#ca8a04", icon: "⏳" },
    approved: { label: "Approved", bg: "rgba(34,197,94,0.15)", color: "#16a34a", icon: "✅" },
    rejected: { label: "Rejected", bg: "rgba(239,68,68,0.15)", color: "#dc2626", icon: "❌" },
    suspended: { label: "Suspended", bg: "rgba(107,114,128,0.15)", color: "#4b5563", icon: "⛔" },
};

// ─────────────────────────────────────────────────────────────
// SHARED INPUT STYLE (dark + light mode safe)
// ─────────────────────────────────────────────────────────────

const inputStyle = {
    background: "var(--card-bg)",
    color: "var(--text-main)",
    border: "1.5px solid var(--input-border, rgba(45,106,79,0.25))",
};

// ─────────────────────────────────────────────────────────────
// VALIDATION
// ─────────────────────────────────────────────────────────────

function validateForm(form) {
    const errs = {};

    if (!form.shopName || form.shopName.length < 3)
        errs.shopName = "Shop name must be at least 3 characters";
    if (!form.category)
        errs.category = "Please select a category";
    if (!form.businessEmail || !/\S+@\S+\.\S+/.test(form.businessEmail))
        errs.businessEmail = "Invalid email address";
    if (!form.businessPhone || !/^(?:\+88|88)?(01[3-9]\d{8})$/.test(form.businessPhone))
        errs.businessPhone = "Invalid BD phone (01XXXXXXXXX)";
    if (!form.pickupAddress || form.pickupAddress.length < 10)
        errs.pickupAddress = "Full address is required";
    if (!form.city) errs.city = "City is required";
    if (!form.area) errs.area = "Area is required";
    if (!form.nidNumber || form.nidNumber.length < 10)
        errs.nidNumber = "NID must be at least 10 digits";
    if (!form.nidFront) errs.nidFront = "NID front photo is required";
    if (!form.nidBack) errs.nidBack = "NID back photo is required";

    if (form.payoutMethod === "bank") {
        if (!form.bankName) errs.bankName = "Bank name is required";
        if (!form.accountHolder) errs.accountHolder = "Account holder is required";
        if (!form.accountNumber) errs.accountNumber = "Account number is required";
    }
    if (form.payoutMethod === "bkash" || form.payoutMethod === "nagad") {
        if (!form.mfsNumber || !/^(?:\+88|88)?(01[3-9]\d{8})$/.test(form.mfsNumber))
            errs.mfsNumber = "Valid mobile number required";
    }

    return errs;
}

// ─────────────────────────────────────────────────────────────
// SMALL UI COMPONENTS
// ─────────────────────────────────────────────────────────────

function FieldGroup({ label, error, hint, children, fullWidth }) {
    return (
        <div className={`flex flex-col gap-1.5 ${fullWidth ? "md:col-span-2" : ""}`}>
            <label className="text-sm font-semibold" style={{ color: "var(--text-main)" }}>
                {label}
            </label>
            {children}
            {hint && !error && (
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>{hint}</p>
            )}
            {error && (
                <p className="text-xs font-medium" style={{ color: "var(--color-danger)" }}>{error}</p>
            )}
        </div>
    );
}

function Input({ error, ...props }) {
    return (
        <input
            className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all
                focus:ring-2 focus:ring-[var(--color-accent)] placeholder:opacity-40"
            style={{ ...inputStyle, borderColor: error ? "var(--color-danger)" : undefined }}
            {...props}
        />
    );
}

// Blocks any non-digit character (keyboard + paste)
function NumberInput({ error, onChange, ...props }) {
    const handleKeyDown = (e) => {
        const allowed = ["Backspace", "Delete", "Tab", "Escape", "Enter",
            "ArrowLeft", "ArrowRight", "Home", "End"];
        if (allowed.includes(e.key) || e.ctrlKey || e.metaKey) return;
        if (!/^\d$/.test(e.key)) e.preventDefault();
    };

    const handleChange = (e) => {
        const numericOnly = e.target.value.replace(/\D/g, "");
        onChange({ target: { value: numericOnly } });
    };

    return (
        <input
            inputMode="numeric"
            pattern="[0-9]*"
            className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all
                focus:ring-2 focus:ring-[var(--color-accent)] placeholder:opacity-40"
            style={{ ...inputStyle, borderColor: error ? "var(--color-danger)" : undefined }}
            onKeyDown={handleKeyDown}
            onChange={handleChange}
            {...props}
        />
    );
}

function Select({ error, children, ...props }) {
    return (
        <select
            className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all
                focus:ring-2 focus:ring-[var(--color-accent)]"
            style={{ ...inputStyle, borderColor: error ? "var(--color-danger)" : undefined }}
            {...props}
        >
            {children}
        </select>
    );
}

function Section({ icon, title, children }) {
    return (
        <div
            className="rounded-2xl p-6 flex flex-col gap-5"
            style={{
                background: "var(--card-bg)",
                border: "1px solid var(--input-border, rgba(45,106,79,0.15))",
                boxShadow: "0 2px 16px rgba(0,0,0,0.06)",
            }}
        >
            <div
                className="flex items-center gap-3 pb-4 border-b"
                style={{ borderColor: "var(--input-border, rgba(45,106,79,0.15))" }}
            >
                <span className="text-2xl">{icon}</span>
                <h2 className="text-lg font-bold font-display" style={{ color: "var(--text-main)" }}>
                    {title}
                </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {children}
            </div>
        </div>
    );
}

// Shop status badge shown after shop exists
function StatusBadge({ status }) {
    const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
    return (
        <div
            className="flex items-center gap-3 rounded-2xl px-5 py-4"
            style={{ background: cfg.bg, border: `1px solid ${cfg.color}30` }}
        >
            <span className="text-2xl">{cfg.icon}</span>
            <div>
                <p className="text-xs font-semibold uppercase tracking-widest"
                    style={{ color: cfg.color, opacity: 0.7 }}>
                    Shop Status
                </p>
                <p className="text-base font-bold" style={{ color: cfg.color }}>
                    {cfg.label}
                </p>
                {status === "pending" && (
                    <p className="text-xs mt-0.5" style={{ color: cfg.color, opacity: 0.7 }}>
                        Your shop is under review. We'll notify you soon.
                    </p>
                )}
                {status === "rejected" && (
                    <p className="text-xs mt-0.5" style={{ color: cfg.color, opacity: 0.7 }}>
                        Your shop was rejected. Please update your info and resubmit.
                    </p>
                )}
                {status === "suspended" && (
                    <p className="text-xs mt-0.5" style={{ color: cfg.color, opacity: 0.7 }}>
                        Your shop is suspended. Contact support for more info.
                    </p>
                )}
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────
// LOGO UPLOADER
// ─────────────────────────────────────────────────────────────

function LogoUploader({ currentUrl, onUploadDone, disabled }) {
    const { uploadSingle, uploading } = useCloudinaryUpload();
    const [progress, setProgress] = useState(0);
    const fileInputRef = useRef(null);

    const handleFile = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setProgress(0);
        const toastId = toast.loading("Uploading logo…");
        try {
            const result = await uploadSingle(file, {
                folder: UPLOAD_FOLDER,
                onProgress: (pct) => setProgress(pct),
            });
            onUploadDone(result.url);
            toast.success("Logo uploaded!", { id: toastId });
        } catch (err) {
            toast.error(err.message || "Logo upload failed", { id: toastId });
        }
    };

    return (
        <div className="md:col-span-2 flex flex-col gap-2">
            <label className="text-sm font-semibold" style={{ color: "var(--text-main)" }}>
                Shop Logo
            </label>

            <div className="flex items-center gap-5 flex-wrap">
                {/* Preview */}
                <div
                    className="w-24 h-24 rounded-2xl flex items-center justify-center overflow-hidden shrink-0"
                    style={{
                        background: "var(--bg)",
                        border: "2px dashed var(--input-border, rgba(45,106,79,0.3))",
                    }}
                >
                    {currentUrl
                        ? <img src={currentUrl} alt="logo" className="w-full h-full object-cover" />
                        : <span className="text-4xl">🏪</span>
                    }
                </div>

                <div className="flex flex-col gap-2">
                    <button
                        type="button"
                        disabled={disabled || uploading}
                        onClick={() => fileInputRef.current?.click()}
                        className="px-4 py-2 rounded-xl text-sm font-semibold transition-all"
                        style={{
                            background: disabled || uploading ? "var(--accent-opacity)" : "var(--color-primary)",
                            color: disabled || uploading ? "var(--text-muted)" : "#fff",
                            cursor: disabled || uploading ? "not-allowed" : "pointer",
                        }}
                    >
                        {uploading ? `Uploading ${progress}%` : currentUrl ? "Change Logo" : "Upload Logo"}
                    </button>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                        JPG, PNG, WEBP — max 4MB
                    </p>
                    {uploading && (
                        <div className="w-48 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--accent-opacity)" }}>
                            <div
                                className="h-full rounded-full transition-all duration-300"
                                style={{ width: `${progress}%`, background: "var(--color-primary)" }}
                            />
                        </div>
                    )}
                </div>
            </div>

            <input ref={fileInputRef} type="file"
                accept="image/jpeg,image/png,image/webp,image/jpg"
                className="hidden" onChange={handleFile} />
        </div>
    );
}

// ─────────────────────────────────────────────────────────────
// NID IMAGE UPLOADER
// ─────────────────────────────────────────────────────────────

function NidUploader({ label, currentUrl, onUploadDone, disabled, error }) {
    const { uploadSingle, uploading } = useCloudinaryUpload();
    const [progress, setProgress] = useState(0);
    const fileInputRef = useRef(null);

    const handleFile = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setProgress(0);
        const toastId = toast.loading(`Uploading ${label}…`);
        try {
            const result = await uploadSingle(file, {
                folder: UPLOAD_FOLDER,
                onProgress: (pct) => setProgress(pct),
            });
            onUploadDone(result.url);
            toast.success(`${label} uploaded!`, { id: toastId });
        } catch (err) {
            toast.error(err.message || "Upload failed", { id: toastId });
        }
    };

    return (
        <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold" style={{ color: "var(--text-main)" }}>
                {label}
            </label>

            <div
                className="relative w-full rounded-xl overflow-hidden transition-all"
                style={{
                    border: `2px dashed ${error ? "var(--color-danger)" : "var(--input-border, rgba(45,106,79,0.3))"}`,
                    background: "var(--bg)",
                    minHeight: "130px",
                    cursor: disabled || uploading ? "not-allowed" : "pointer",
                }}
                onClick={() => !disabled && !uploading && fileInputRef.current?.click()}
            >
                {currentUrl ? (
                    <div className="relative w-full h-32">
                        <img src={currentUrl} alt={label} className="w-full h-full object-cover" />
                        {!disabled && (
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
                                style={{ background: "rgba(0,0,0,0.5)" }}>
                                <p className="text-white text-sm font-semibold">Click to change</p>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center gap-2 py-8">
                        <span className="text-3xl">🪪</span>
                        <p className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>
                            {disabled ? "No image uploaded" : "Click to upload"}
                        </p>
                        {!disabled && (
                            <p className="text-xs" style={{ color: "var(--text-muted)" }}>JPG, PNG — max 4MB</p>
                        )}
                    </div>
                )}

                {uploading && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2"
                        style={{ background: "rgba(0,0,0,0.6)" }}>
                        <p className="text-white text-sm font-bold">Uploading {progress}%</p>
                        <div className="w-32 h-1.5 rounded-full overflow-hidden bg-white/30">
                            <div className="h-full rounded-full transition-all"
                                style={{ width: `${progress}%`, background: "#fff" }} />
                        </div>
                    </div>
                )}
            </div>

            {error && (
                <p className="text-xs font-medium" style={{ color: "var(--color-danger)" }}>{error}</p>
            )}

            <input ref={fileInputRef} type="file"
                accept="image/jpeg,image/png,image/webp,image/jpg"
                className="hidden" onChange={handleFile} />
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════

export default function ShopSetupPage() {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    const [form, setForm] = useState(EMPTY_FORM);
    const [errors, setErrors] = useState({});
    const [editMode, setEditMode] = useState(false);

    // ── Fetch shop with TanStack Query ──────────────────────────
    const { data: shopData, isLoading } = useQuery({
        queryKey: ["my-shop"],
        queryFn: async () => {
            const { data } = await api.get("/api/shop/my");
            return data.data;
        },
        retry: false,
    });
    

    // ✅ shopData আসলে form pre-fill করো
    useEffect(() => {
        if (!shopData) return;

        const isMfs = ["bkash", "nagad"].includes(shopData.payoutDetails?.bankName);

        setForm({
            shopName: shopData.shopName || "",
            category: shopData.category || "",
            logo: shopData.logo || "",
            businessEmail: shopData.contact?.businessEmail || "",
            businessPhone: shopData.contact?.businessPhone || "",
            pickupAddress: shopData.contact?.pickupAddress || "",
            city: shopData.contact?.city || "",
            area: shopData.contact?.area || "",
            nidNumber: shopData.legalInfo?.nidNumber || "",
            tradeLicense: shopData.legalInfo?.tradeLicense || "",
            nidFront: shopData.legalInfo?.nidFront || "",
            nidBack: shopData.legalInfo?.nidBack || "",
            payoutMethod: isMfs ? shopData.payoutDetails.bankName : "bank",
            bankName: isMfs ? "" : (shopData.payoutDetails?.bankName || ""),
            accountHolder: shopData.payoutDetails?.accountHolder || "",
            accountNumber: isMfs ? "" : (shopData.payoutDetails?.accountNumber || ""),
            routingNumber: shopData.payoutDetails?.routingNumber || "",
            mfsNumber: isMfs ? shopData.payoutDetails.accountNumber : "",
        });
    }, [shopData]);

    const isEdit = !!shopData;             // shop exists in DB
    const viewOnly = isEdit && !editMode;  // viewing but not editing

    // ── Create mutation ─────────────────────────────────────────
    const createMutation = useMutation({
        mutationFn: (payload) => api.post("/api/shop/shop-info", payload),
        onSuccess: () => {
            toast.success("🎉 Shop created successfully!");
            queryClient.invalidateQueries({ queryKey: ["my-shop"] });
        },
        onError: (err) => {
            handleServerError(err);
        },
    });

    // ── Update mutation ─────────────────────────────────────────
    const updateMutation = useMutation({
        mutationFn: (payload) => api.put("/api/shop/shop-info", payload),
        onSuccess: () => {
            toast.success("✅ Shop updated successfully!");
            queryClient.invalidateQueries({ queryKey: ["my-shop"] });
            setEditMode(false);
        },
        onError: (err) => {
            handleServerError(err);
        },
    });

    const isSaving = createMutation.isPending || updateMutation.isPending;

    // ── Handle server errors ────────────────────────────────────
    function handleServerError(err) {
        const serverErrs = err?.response?.data?.errors;
        if (serverErrs) {
            // Flatten field errors from server
            const flat = {};
            Object.entries(serverErrs).forEach(([k, v]) => {
                flat[k] = Array.isArray(v) ? v[0] : v;
            });
            setErrors(flat);
            toast.error("Please fix the errors below.");
        } else {
            toast.error(err?.response?.data?.message || "Something went wrong.");
        }
    }

    // ── Field helpers ───────────────────────────────────────────
    const setField = (field) => (e) => setForm((p) => ({ ...p, [field]: e.target.value }));
    const setDirect = (field) => (value) => setForm((p) => ({ ...p, [field]: value }));

    const handleToggleEdit = () => {
        setEditMode((p) => !p);
        setErrors({});
    };

    // ── Submit ──────────────────────────────────────────────────
    const handleSubmit = (e) => {
        e.preventDefault();

        const errs = validateForm(form);
        if (Object.keys(errs).length > 0) {
            setErrors(errs);
            toast.error("Please fill in all required fields.");
            return;
        }
        setErrors({});

        if (isEdit) {
            updateMutation.mutate(form);
        } else {
            createMutation.mutate(form);
        }
    };

    // ── Loading state ───────────────────────────────────────────
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg)" }}>
                <div className="flex flex-col items-center gap-4">
                    <div
                        className="w-12 h-12 rounded-full border-4 animate-spin"
                        style={{ borderColor: "var(--color-accent)", borderTopColor: "var(--color-primary)" }}
                    />
                    <p className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>
                        Loading your shop…
                    </p>
                </div>
            </div>
        );
    }

    // ══════════════════════════════════════════════════════════════
    return (
        <>
            {/* Toast container — place once at top level */}
            <Toaster
                position="top-right"
                toastOptions={{
                    style: {
                        background: "var(--card-bg)",
                        color: "var(--text-main)",
                        border: "1px solid var(--input-border, rgba(45,106,79,0.2))",
                        fontSize: "14px",
                        fontWeight: "600",
                    },
                    success: { iconTheme: { primary: "var(--color-primary)", secondary: "#fff" } },
                    error: { iconTheme: { primary: "var(--color-danger)", secondary: "#fff" } },
                }}
            />

            <div className="w-full min-h-screen py-10 px-4 md:px-8" style={{ background: "var(--bg)" }}>
                <div className="w-full max-w-5xl mx-auto flex flex-col gap-6">

                    {/* ── Header ── */}
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-widest mb-1"
                                style={{ color: "var(--text-muted)" }}>
                                Vendor Dashboard
                            </p>
                            <h1 className="font-display text-3xl md:text-4xl font-bold"
                                style={{ color: "var(--text-main)" }}>
                                {isEdit ? "Your Shop" : "Setup Your Shop"}
                            </h1>
                            {isEdit && (
                                <span
                                    className="inline-block mt-2 px-3 py-1 text-xs font-bold rounded-full"
                                    style={{ background: "var(--accent-opacity)", color: "var(--color-primary)" }}
                                >
                                    {viewOnly ? "👁 View Mode" : "✏️ Edit Mode"}
                                </span>
                            )}
                        </div>

                        {isEdit && (
                            <button
                                type="button"
                                onClick={handleToggleEdit}
                                className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all"
                                style={
                                    editMode
                                        ? { background: "var(--accent-opacity)", color: "var(--text-main)", border: "1.5px solid var(--input-border, rgba(45,106,79,0.2))" }
                                        : { background: "var(--color-primary)", color: "#fff" }
                                }
                            >
                                {editMode ? "✕ Cancel" : "✎ Edit Shop"}
                            </button>
                        )}
                    </div>

                    {/* ── Shop Status Badge ── */}
                    {isEdit && shopData?.status && (
                        <StatusBadge status={shopData.status} />
                    )}

                    {/* ── Form ── */}
                    <form onSubmit={handleSubmit} className="flex flex-col gap-6">

                        {/* 1. Basic Profile */}
                        <Section icon="🏪" title="Basic Profile">
                            <LogoUploader
                                currentUrl={form.logo}
                                disabled={viewOnly}
                                onUploadDone={setDirect("logo")}
                            />
                            <FieldGroup label="Shop Name *" error={errors.shopName}>
                                <Input value={form.shopName} onChange={setField("shopName")}
                                    placeholder="e.g. Rahim Electronics"
                                    disabled={viewOnly} error={errors.shopName} />
                            </FieldGroup>
                            <FieldGroup label="Category *" error={errors.category}>
                                <Select value={form.category} onChange={setField("category")}
                                    disabled={viewOnly} error={errors.category}>
                                    <option value="">Select category…</option>
                                    {CATEGORIES.map((c) => (
                                        <option key={c} value={c}>{c}</option>
                                    ))}
                                </Select>
                            </FieldGroup>
                        </Section>

                        {/* 2. Contact & Logistics */}
                        <Section icon="📍" title="Contact & Logistics">
                            <FieldGroup label="Business Email *" error={errors.businessEmail}>
                                <Input type="email" value={form.businessEmail}
                                    onChange={setField("businessEmail")}
                                    placeholder="shop@example.com"
                                    disabled={viewOnly} error={errors.businessEmail} />
                            </FieldGroup>

                            <FieldGroup label="Business Phone *" error={errors.businessPhone} hint="BD: 01XXXXXXXXX">
                                <NumberInput value={form.businessPhone}
                                    onChange={setField("businessPhone")}
                                    placeholder="01XXXXXXXXX" maxLength={11}
                                    disabled={viewOnly} error={errors.businessPhone} />
                            </FieldGroup>

                            <FieldGroup label="Pickup Address *" error={errors.pickupAddress} fullWidth>
                                <Input value={form.pickupAddress} onChange={setField("pickupAddress")}
                                    placeholder="Full pickup address"
                                    disabled={viewOnly} error={errors.pickupAddress} />
                            </FieldGroup>

                            <FieldGroup label="City *" error={errors.city}>
                                <Input value={form.city} onChange={setField("city")}
                                    placeholder="Dhaka" disabled={viewOnly} error={errors.city} />
                            </FieldGroup>

                            <FieldGroup label="Area *" error={errors.area}>
                                <Input value={form.area} onChange={setField("area")}
                                    placeholder="Gulshan" disabled={viewOnly} error={errors.area} />
                            </FieldGroup>
                        </Section>

                        {/* 3. KYC */}
                        <Section icon="🪪" title="Legal & Verification (KYC)">
                            <FieldGroup label="NID Number *" error={errors.nidNumber}>
                                <NumberInput value={form.nidNumber} onChange={setField("nidNumber")}
                                    placeholder="10–17 digit NID" maxLength={17}
                                    disabled={viewOnly} error={errors.nidNumber} />
                            </FieldGroup>

                            <FieldGroup label="Trade License" error={errors.tradeLicense} hint="Optional for small vendors">
                                <NumberInput value={form.tradeLicense} onChange={setField("tradeLicense")}
                                    placeholder="License number" disabled={viewOnly} />
                            </FieldGroup>

                            <NidUploader
                                label="NID Front Photo *"
                                currentUrl={form.nidFront}
                                disabled={viewOnly}
                                error={errors.nidFront}
                                onUploadDone={setDirect("nidFront")}
                            />
                            <NidUploader
                                label="NID Back Photo *"
                                currentUrl={form.nidBack}
                                disabled={viewOnly}
                                error={errors.nidBack}
                                onUploadDone={setDirect("nidBack")}
                            />
                        </Section>

                        {/* 4. Payout */}
                        <Section icon="💳" title="Payment & Settlement">
                            <FieldGroup label="Payout Method *" error={errors.payoutMethod} fullWidth>
                                <div className="flex flex-wrap gap-2">
                                    {[
                                        { value: "bank", label: "🏦 Bank" },
                                        { value: "bkash", label: "📱 bKash" },
                                        { value: "nagad", label: "📱 Nagad" },
                                    ].map(({ value, label }) => (
                                        <button
                                            key={value}
                                            type="button"
                                            disabled={viewOnly}
                                            onClick={() => setForm((p) => ({ ...p, payoutMethod: value }))}
                                            className="px-5 py-2 rounded-xl text-sm font-bold transition-all"
                                            style={
                                                form.payoutMethod === value
                                                    ? { background: "var(--color-primary)", color: "#fff" }
                                                    : { background: "var(--accent-opacity)", color: "var(--text-main)", border: "1.5px solid var(--input-border, rgba(45,106,79,0.2))" }
                                            }
                                        >
                                            {label}
                                        </button>
                                    ))}
                                </div>
                            </FieldGroup>

                            {form.payoutMethod === "bank" && (
                                <>
                                    <FieldGroup label="Bank Name *" error={errors.bankName}>
                                        <Input value={form.bankName} onChange={setField("bankName")}
                                            placeholder="e.g. Dutch-Bangla Bank"
                                            disabled={viewOnly} error={errors.bankName} />
                                    </FieldGroup>
                                    <FieldGroup label="Account Holder *" error={errors.accountHolder}>
                                        <Input value={form.accountHolder} onChange={setField("accountHolder")}
                                            placeholder="Full name"
                                            disabled={viewOnly} error={errors.accountHolder} />
                                    </FieldGroup>
                                    <FieldGroup label="Account Number *" error={errors.accountNumber}>
                                        <NumberInput value={form.accountNumber} onChange={setField("accountNumber")}
                                            placeholder="Account number"
                                            disabled={viewOnly} error={errors.accountNumber} />
                                    </FieldGroup>
                                    <FieldGroup label="Routing Number" error={errors.routingNumber}>
                                        <NumberInput value={form.routingNumber} onChange={setField("routingNumber")}
                                            placeholder="9 digit routing" maxLength={9} disabled={viewOnly} />
                                    </FieldGroup>
                                </>
                            )}

                            {(form.payoutMethod === "bkash" || form.payoutMethod === "nagad") && (
                                <FieldGroup
                                    label={`${form.payoutMethod === "bkash" ? "bKash" : "Nagad"} Number *`}
                                    error={errors.mfsNumber} fullWidth
                                >
                                    <NumberInput value={form.mfsNumber} onChange={setField("mfsNumber")}
                                        placeholder="01XXXXXXXXX" maxLength={11}
                                        disabled={viewOnly} error={errors.mfsNumber} />
                                </FieldGroup>
                            )}
                        </Section>

                        {/* Submit button — hidden in view mode */}
                        {!viewOnly && (
                            <button
                                type="submit"
                                disabled={isSaving}
                                className="w-full py-4 rounded-2xl font-display font-bold text-lg text-white transition-all active:scale-[0.98]"
                                style={{
                                    background: isSaving
                                        ? "var(--color-secondary)"
                                        : "linear-gradient(135deg, var(--color-primary), var(--color-secondary))",
                                    boxShadow: "0 4px 24px rgba(45,106,79,0.3)",
                                    cursor: isSaving ? "not-allowed" : "pointer",
                                }}
                            >
                                {isSaving ? "Saving…" : isEdit ? "Save Changes" : "Create My Shop"}
                            </button>
                        )}

                    </form>
                </div>
            </div>
        </>
    );
}