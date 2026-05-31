"use client";

import { useEffect, useState, useCallback } from "react";
import api from "@/app/lib/api";
import {
    MapPin, Plus, Pencil, Trash2, Star, Home, Briefcase,
    User, Phone, AlignLeft, ChevronDown, X, Check,
    Loader2, AlertCircle, ShieldCheck, Navigation,
} from "lucide-react";

// ─── helpers ─────────────────────────────────────────────────────────────────
const LABEL_ICONS = { Home: Home, Work: Briefcase, Other: MapPin };
const LABELS = ["Home", "Work", "Other"];

function LabelIcon({ label, size = 14 }) {
    const Icon = LABEL_ICONS[label] || MapPin;
    return <Icon size={size} />;
}

// ─── Select dropdown ──────────────────────────────────────────────────────────
function Select({ label, value, onChange, options = [], placeholder, disabled, error }) {
    return (
        <div className="flex flex-col gap-1.5">
            <label className="text-heading text-xs font-bold uppercase tracking-wide">{label}</label>
            <div className="relative">
                <select
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    disabled={disabled}
                    className="w-full appearance-none pl-4 pr-10 py-2.5 text-sm rounded-xl border border-accent-10
                               bg-bg text-heading outline-none cursor-pointer
                               focus:border-[var(--color-primary)] disabled:opacity-40 disabled:cursor-not-allowed
                               transition-colors duration-200"
                    style={{ borderColor: error ? "var(--color-danger)" : undefined }}
                >
                    <option value="">{placeholder}</option>
                    {options.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-body pointer-events-none" />
            </div>
            {error && <p className="text-xs font-medium" style={{ color: "var(--color-danger)" }}>{error}</p>}
        </div>
    );
}

// ─── Text input ───────────────────────────────────────────────────────────────
function Input({ label, icon: Icon, value, onChange, placeholder, error, type = "text" }) {
    return (
        <div className="flex flex-col gap-1.5">
            <label className="text-heading text-xs font-bold uppercase tracking-wide">{label}</label>
            <div className="relative">
                {Icon && <Icon size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-body pointer-events-none" />}
                <input
                    type={type}
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    placeholder={placeholder}
                    className="w-full py-2.5 text-sm rounded-xl border border-accent-10 bg-bg text-heading
                               outline-none placeholder:text-body/50
                               focus:border-[var(--color-primary)] transition-colors duration-200"
                    style={{
                        paddingLeft: Icon ? "2.5rem" : "1rem",
                        paddingRight: "1rem",
                        borderColor: error ? "var(--color-danger)" : undefined,
                    }}
                />
            </div>
            {error && <p className="text-xs font-medium" style={{ color: "var(--color-danger)" }}>{error}</p>}
        </div>
    );
}

// ─── Address Form Modal ───────────────────────────────────────────────────────
function AddressForm({ initial, onClose, onSaved }) {
    const isEdit = !!initial?._id;

    const blank = {
        fullName: "", phone: "", addressLine: "",
        division: "", district: "", area: "",
        postalCode: "", label: "Home", isDefault: false,
    };

    const [form, setForm] = useState(initial ? {
        fullName: initial.fullName || "",
        phone: initial.phone || "",
        addressLine: initial.addressLine || "",
        division: initial.division || "",
        district: initial.district || "",
        area: initial.area || "",
        postalCode: initial.postalCode || "",
        label: initial.label || "Home",
        isDefault: initial.isDefault || false,
    } : blank);

    const [divisions, setDivisions] = useState([]);
    const [districts, setDistricts] = useState([]);
    const [upazilas, setUpazilas] = useState([]);
    const [errors, setErrors] = useState({});
    const [saving, setSaving] = useState(false);
    const [apiError, setApiError] = useState("");

    // Load divisions on mount
    useEffect(() => {
        api.get("/api/addresses/location-data")
            .then(r => setDivisions(r.data.data.divisions || []))
            .catch(() => { });
    }, []);

    // Load districts when division changes
    useEffect(() => {
        if (!form.division) { setDistricts([]); setUpazilas([]); return; }
        api.get(`/api/addresses/location-data?division=${form.division}`)
            .then(r => {
                setDistricts(r.data.data.districts || []);
                setUpazilas([]);
            }).catch(() => { });
    }, [form.division]);

    // Load upazilas when district changes
    useEffect(() => {
        if (!form.district) { setUpazilas([]); return; }
        api.get(`/api/addresses/location-data?district=${form.district}`)
            .then(r => setUpazilas(r.data.data.upazilas || []))
            .catch(() => { });
    }, [form.district]);

    const set = (key) => (val) => {
        setForm(f => ({ ...f, [key]: val }));
        setErrors(e => ({ ...e, [key]: "" }));
        if (key === "division") setForm(f => ({ ...f, division: val, district: "", area: "" }));
        if (key === "district") setForm(f => ({ ...f, district: val, area: "" }));
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

    const submit = async () => {
        if (!validate()) return;
        setSaving(true);
        setApiError("");
        try {
            if (isEdit) {
                await api.put(`/api/addresses/${initial._id}`, form);
            } else {
                await api.post("/api/addresses", form);
            }
            onSaved();
        } catch (err) {
            setApiError(err.response?.data?.message || "Something went wrong");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
            style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}>
            <div
                className="w-full sm:max-w-lg bg-card sm:rounded-2xl overflow-hidden
                           flex flex-col max-h-[95vh] sm:max-h-[90vh]"
                style={{ boxShadow: "0 24px 48px rgba(0,0,0,0.2)" }}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-accent-10 flex-shrink-0">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                            style={{ background: "var(--accent-opacity)" }}>
                            <MapPin size={16} style={{ color: "var(--color-primary)" }} />
                        </div>
                        <h2 className="text-heading font-black text-base">
                            {isEdit ? "Edit Address" : "Add New Address"}
                        </h2>
                    </div>
                    <button onClick={onClose}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-body hover:text-heading hover:bg-[var(--accent-opacity)] transition-colors">
                        <X size={16} />
                    </button>
                </div>

                {/* Body */}
                <div className="overflow-y-auto flex-1 p-5 space-y-4">
                    {apiError && (
                        <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-medium"
                            style={{ background: "rgba(214,40,40,0.08)", color: "var(--color-danger)" }}>
                            <AlertCircle size={15} className="flex-shrink-0" />
                            {apiError}
                        </div>
                    )}

                    {/* Label selector */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-heading text-xs font-bold uppercase tracking-wide">Address Label</label>
                        <div className="flex gap-2">
                            {LABELS.map(l => (
                                <button
                                    key={l}
                                    onClick={() => set("label")(l)}
                                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-bold border transition-all duration-200"
                                    style={{
                                        borderColor: form.label === l ? "var(--color-primary)" : "var(--accent-opacity)",
                                        background: form.label === l ? "var(--accent-opacity)" : "transparent",
                                        color: form.label === l ? "var(--color-primary)" : "var(--text-muted)",
                                    }}
                                >
                                    <LabelIcon label={l} />
                                    {l}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Input label="Full Name" icon={User} value={form.fullName}
                            onChange={set("fullName")} placeholder="Arif Rahman" error={errors.fullName} />
                        <Input label="Phone" icon={Phone} value={form.phone} type="tel"
                            onChange={set("phone")} placeholder="01700-000000" error={errors.phone} />
                    </div>

                    <Input label="Address Line" icon={AlignLeft} value={form.addressLine}
                        onChange={set("addressLine")} placeholder="House 12, Road 5, Block C" error={errors.addressLine} />

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <Select label="Division" value={form.division} onChange={(v) => {
                            setForm(f => ({ ...f, division: v, district: "", area: "" }));
                            setErrors(e => ({ ...e, division: "" }));
                        }} options={divisions} placeholder="Select division" error={errors.division} />

                        <Select label="District" value={form.district} onChange={(v) => {
                            setForm(f => ({ ...f, district: v, area: "" }));
                            setErrors(e => ({ ...e, district: "" }));
                        }} options={districts} placeholder="Select district"
                            disabled={!form.division} error={errors.district} />

                        <Select label="Area / Upazila" value={form.area} onChange={set("area")}
                            options={upazilas} placeholder="Select area"
                            disabled={!form.district} error={errors.area} />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <Input label="Postal Code (optional)" value={form.postalCode}
                            onChange={set("postalCode")} placeholder="1216" />

                        {/* Default toggle */}
                        <div className="flex flex-col gap-1.5">
                            <label className="text-heading text-xs font-bold uppercase tracking-wide">Default Address</label>
                            <button
                                onClick={() => setForm(f => ({ ...f, isDefault: !f.isDefault }))}
                                className="flex items-center gap-2 py-2.5 px-4 rounded-xl border text-sm font-semibold transition-all duration-200"
                                style={{
                                    borderColor: form.isDefault ? "var(--color-primary)" : "var(--accent-opacity)",
                                    background: form.isDefault ? "var(--accent-opacity)" : "transparent",
                                    color: form.isDefault ? "var(--color-primary)" : "var(--text-muted)",
                                }}
                            >
                                <div className={`w-4 h-4 rounded flex items-center justify-center border transition-colors`}
                                    style={{
                                        borderColor: form.isDefault ? "var(--color-primary)" : "var(--accent-opacity)",
                                        background: form.isDefault ? "var(--color-primary)" : "transparent",
                                    }}>
                                    {form.isDefault && <Check size={10} className="text-white" />}
                                </div>
                                Set as default
                            </button>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-5 py-4 border-t border-accent-10 flex gap-3 flex-shrink-0">
                    <button onClick={onClose}
                        className="flex-1 py-2.5 rounded-xl text-sm font-bold border border-accent-10 text-body hover:text-heading hover:bg-[var(--accent-opacity)] transition-colors">
                        Cancel
                    </button>
                    <button
                        onClick={submit}
                        disabled={saving}
                        className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-all duration-200 hover:opacity-90 disabled:opacity-60"
                        style={{ background: "var(--color-primary)" }}
                    >
                        {saving ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
                        {saving ? "Saving…" : isEdit ? "Update Address" : "Save Address"}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Address Card ─────────────────────────────────────────────────────────────
function AddressCard({ address, onEdit, onDelete, onSetDefault, loading }) {
    return (
        <div
            className="group bg-card rounded-2xl border overflow-hidden transition-all duration-300 hover:shadow-lg"
            style={{
                borderColor: address.isDefault
                    ? "var(--color-primary)"
                    : "var(--accent-opacity)",
                boxShadow: address.isDefault
                    ? "0 0 0 1px var(--color-primary)"
                    : undefined,
            }}
        >
            {/* Top bar */}
            <div
                className="px-5 py-3 flex items-center justify-between border-b border-accent-10"
                style={{ background: address.isDefault ? "var(--accent-opacity)" : "transparent" }}
            >
                <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                        style={{ background: "var(--accent-opacity)" }}>
                        <LabelIcon label={address.label} size={13} />
                    </div>
                    <span className="text-heading text-xs font-black uppercase tracking-widest">
                        {address.label}
                    </span>
                    {address.isDefault && (
                        <span
                            className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full"
                            style={{ background: "var(--color-primary)", color: "#fff" }}
                        >
                            <Star size={9} fill="currentColor" /> Default
                        </span>
                    )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    {!address.isDefault && (
                        <button
                            onClick={() => onSetDefault(address._id)}
                            disabled={loading}
                            className="p-1.5 rounded-lg text-body hover:text-heading hover:bg-[var(--accent-opacity)] transition-colors"
                            title="Set as default"
                        >
                            <ShieldCheck size={14} />
                        </button>
                    )}
                    <button
                        onClick={() => onEdit(address)}
                        className="p-1.5 rounded-lg text-body hover:text-heading hover:bg-[var(--accent-opacity)] transition-colors"
                        title="Edit"
                    >
                        <Pencil size={14} />
                    </button>
                    <button
                        onClick={() => onDelete(address._id)}
                        className="p-1.5 rounded-lg transition-colors"
                        style={{ color: "var(--color-danger)" }}
                        title="Delete"
                    >
                        <Trash2 size={14} />
                    </button>
                </div>
            </div>

            {/* Body */}
            <div className="p-5 space-y-2.5">
                <div className="flex items-center gap-2.5">
                    <User size={13} className="text-body flex-shrink-0" />
                    <span className="text-heading text-sm font-bold">{address.fullName}</span>
                </div>
                <div className="flex items-center gap-2.5">
                    <Phone size={13} className="text-body flex-shrink-0" />
                    <span className="text-body text-sm">{address.phone}</span>
                </div>
                <div className="flex items-start gap-2.5">
                    <Navigation size={13} className="text-body flex-shrink-0 mt-0.5" />
                    <span className="text-body text-sm leading-relaxed">
                        {address.addressLine}, {address.area}, {address.district}, {address.division}
                        {address.postalCode ? ` - ${address.postalCode}` : ""}
                    </span>
                </div>
            </div>

            {/* Bottom action strip (mobile-friendly) */}
            <div className="px-5 pb-4 flex gap-2 sm:hidden">
                {!address.isDefault && (
                    <button
                        onClick={() => onSetDefault(address._id)}
                        disabled={loading}
                        className="flex-1 py-2 rounded-xl text-xs font-bold border border-accent-10 text-body flex items-center justify-center gap-1.5 hover:bg-[var(--accent-opacity)] transition-colors"
                    >
                        <ShieldCheck size={12} /> Set Default
                    </button>
                )}
                <button
                    onClick={() => onEdit(address)}
                    className="flex-1 py-2 rounded-xl text-xs font-bold border border-accent-10 text-body flex items-center justify-center gap-1.5 hover:bg-[var(--accent-opacity)] transition-colors"
                >
                    <Pencil size={12} /> Edit
                </button>
                <button
                    onClick={() => onDelete(address._id)}
                    className="py-2 px-3 rounded-xl text-xs font-bold border transition-colors flex items-center gap-1.5"
                    style={{
                        borderColor: "rgba(214,40,40,0.2)",
                        color: "var(--color-danger)",
                        background: "rgba(214,40,40,0.05)",
                    }}
                >
                    <Trash2 size={12} />
                </button>
            </div>
        </div>
    );
}

// ─── Delete confirm modal ─────────────────────────────────────────────────────
function ConfirmDelete({ onConfirm, onCancel, loading }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}>
            <div className="bg-card rounded-2xl p-6 w-full max-w-sm border border-accent-10"
                style={{ boxShadow: "0 20px 40px rgba(0,0,0,0.2)" }}>
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
                    style={{ background: "rgba(214,40,40,0.1)" }}>
                    <Trash2 size={22} style={{ color: "var(--color-danger)" }} />
                </div>
                <h3 className="text-heading font-black text-base mb-1.5">Delete Address?</h3>
                <p className="text-body text-sm mb-6">This action cannot be undone.</p>
                <div className="flex gap-3">
                    <button onClick={onCancel}
                        className="flex-1 py-2.5 rounded-xl text-sm font-bold border border-accent-10 text-body hover:bg-[var(--accent-opacity)] transition-colors">
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={loading}
                        className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-all duration-200 hover:opacity-90 disabled:opacity-60"
                        style={{ background: "var(--color-danger)" }}
                    >
                        {loading ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                        {loading ? "Deleting…" : "Delete"}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function Skeleton() {
    return (
        <div className="bg-card rounded-2xl border border-accent-10 overflow-hidden animate-pulse">
            <div className="px-5 py-3 border-b border-accent-10" style={{ background: "var(--accent-opacity)" }}>
                <div className="h-4 w-20 rounded-lg bg-[var(--accent-opacity)]" />
            </div>
            <div className="p-5 space-y-3">
                <div className="h-3.5 w-36 rounded-lg bg-[var(--accent-opacity)]" />
                <div className="h-3 w-28 rounded-lg bg-[var(--accent-opacity)]" />
                <div className="h-3 w-full rounded-lg bg-[var(--accent-opacity)]" />
                <div className="h-3 w-3/4 rounded-lg bg-[var(--accent-opacity)]" />
            </div>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AddressPage() {
    const [addresses, setAddresses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [editTarget, setEditTarget] = useState(null);
    const [deleteId, setDeleteId] = useState(null);

    const loadAddresses = useCallback(async () => {
        try {
            const { data } = await api.get("/api/addresses");
            setAddresses(data.data || []);
        } catch { }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { loadAddresses(); }, [loadAddresses]);

    const handleSaved = () => {
        setShowForm(false);
        setEditTarget(null);
        loadAddresses();
    };

    const handleEdit = (address) => {
        setEditTarget(address);
        setShowForm(true);
    };

    const handleDelete = async () => {
        setActionLoading(true);
        try {
            await api.delete(`/api/addresses/${deleteId}`);
            setDeleteId(null);
            loadAddresses();
        } catch { }
        finally { setActionLoading(false); }
    };

    const handleSetDefault = async (id) => {
        setActionLoading(true);
        try {
            await api.patch(`/api/addresses/${id}/default`);
            loadAddresses();
        } catch { }
        finally { setActionLoading(false); }
    };

    return (
        <main className="min-h-screen bg-bg py-10 px-4">
            <style>{`
                @keyframes fadeUp {
                    from { opacity: 0; transform: translateY(16px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
            `}</style>

            <div className="max-w-7xl mx-auto">

                {/* ── Header ── */}
                <div
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8"
                    style={{ animation: "fadeUp .5s ease both" }}
                >
                    <div className="flex items-center gap-3">
                        <div
                            className="w-11 h-11 rounded-xl flex items-center justify-center"
                            style={{ background: "var(--accent-opacity)" }}
                        >
                            <MapPin size={20} style={{ color: "var(--color-primary)" }} />
                        </div>
                        <div>
                            <h1 className="text-heading font-black text-xl">My Addresses</h1>
                            <p className="text-body text-xs mt-0.5">
                                {loading ? "Loading…" : `${addresses.length} saved address${addresses.length !== 1 ? "es" : ""}`}
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={() => { setEditTarget(null); setShowForm(true); }}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white
                                   transition-all duration-200 hover:opacity-90 hover:-translate-y-0.5"
                        style={{ background: "var(--color-primary)" }}
                    >
                        <Plus size={16} /> Add New Address
                    </button>
                </div>

                {/* ── Content ── */}
                {loading ? (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[...Array(3)].map((_, i) => <Skeleton key={i} />)}
                    </div>
                ) : addresses.length === 0 ? (
                    /* Empty state */
                    <div
                        className="flex flex-col items-center justify-center py-24 text-center"
                        style={{ animation: "fadeUp .5s ease both" }}
                    >
                        <div
                            className="w-20 h-20 rounded-2xl flex items-center justify-center mb-5"
                            style={{ background: "var(--accent-opacity)" }}
                        >
                            <MapPin size={36} style={{ color: "var(--color-primary)", opacity: 0.5 }} />
                        </div>
                        <h2 className="text-heading font-black text-lg mb-2">No addresses yet</h2>
                        <p className="text-body text-sm mb-6 max-w-xs">
                            Add a delivery address to make checkout faster.
                        </p>
                        <button
                            onClick={() => { setEditTarget(null); setShowForm(true); }}
                            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white
                                       transition-all duration-200 hover:opacity-90"
                            style={{ background: "var(--color-primary)" }}
                        >
                            <Plus size={15} /> Add Your First Address
                        </button>
                    </div>
                ) : (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {addresses.map((addr, i) => (
                            <div
                                key={addr._id}
                                style={{ animation: `fadeUp .5s ease ${i * 60}ms both` }}
                            >
                                <AddressCard
                                    address={addr}
                                    onEdit={handleEdit}
                                    onDelete={setDeleteId}
                                    onSetDefault={handleSetDefault}
                                    loading={actionLoading}
                                />
                            </div>
                        ))}

                        {/* Add another tile */}
                        <button
                            onClick={() => { setEditTarget(null); setShowForm(true); }}
                            className="rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-3 py-10
                                       transition-all duration-200 hover:border-[var(--color-primary)]/40 hover:bg-[var(--accent-opacity)]
                                       group min-h-[180px]"
                            style={{
                                borderColor: "var(--accent-opacity)",
                                animation: `fadeUp .5s ease ${addresses.length * 60}ms both`,
                            }}
                        >
                            <div
                                className="w-10 h-10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200"
                                style={{ background: "var(--accent-opacity)" }}
                            >
                                <Plus size={18} style={{ color: "var(--color-primary)" }} />
                            </div>
                            <span className="text-body text-sm font-semibold group-hover:text-heading transition-colors">
                                Add Another Address
                            </span>
                        </button>
                    </div>
                )}
            </div>

            {/* ── Modals ── */}
            {showForm && (
                <AddressForm
                    initial={editTarget}
                    onClose={() => { setShowForm(false); setEditTarget(null); }}
                    onSaved={handleSaved}
                />
            )}
            {deleteId && (
                <ConfirmDelete
                    onConfirm={handleDelete}
                    onCancel={() => setDeleteId(null)}
                    loading={actionLoading}
                />
            )}
        </main>
    );
}