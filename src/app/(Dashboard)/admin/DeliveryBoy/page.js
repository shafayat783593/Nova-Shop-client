"use client";

import { useState, useEffect, useCallback } from "react";
import api from "@/app/lib/api";
import {
    Loader2, UserPlus, Search, MoreVertical, Phone,
    MapPin, Package, Star, ToggleLeft, ToggleRight,
    Trash2, X, Check, ChevronDown, Mail, Shield
} from "lucide-react";
import Loading from "@/app/components/global/Loading";

// ─── Invite Modal ─────────────────────────────────────────────────────────────
function InviteModal({ onClose, onSuccess }) {
    const [form, setForm] = useState({ name: "", email: "", phone: "", zones: "" });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        if (!form.name || !form.email) { setError("Name and email required"); return; }

        setLoading(true);
        try {
            await api.post("/api/deliveryboys/admin/delivery-boys/invite", {
                ...form,
                zones: form.zones ? form.zones.split(",").map(z => z.trim()).filter(Boolean) : [],
            });
            onSuccess?.();
            onClose();
        } catch (err) {
            setError(err.response?.data?.message || "Failed to send invite");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}>
            <div className="bg-card border border-accent-10 rounded-2xl w-full max-w-md p-6 shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-heading font-black text-lg">Invite Delivery Boy</h2>
                        <p className="text-body text-xs mt-0.5">They'll receive a setup link via email</p>
                    </div>
                    <button onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-accent-10 transition-colors text-body">
                        <X size={16} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-heading text-xs font-semibold block mb-1.5">Full Name *</label>
                            <input
                                type="text"
                                value={form.name}
                                onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                                placeholder="Rahim Uddin"
                                className="w-full px-3 py-2.5 bg-bg border border-accent-10 rounded-xl text-heading text-sm outline-none focus:border-[var(--color-primary)] transition-all"
                            />
                        </div>
                        <div>
                            <label className="text-heading text-xs font-semibold block mb-1.5">Phone</label>
                            <input
                                type="text"
                                value={form.phone}
                                onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                                placeholder="01XXXXXXXXX"
                                className="w-full px-3 py-2.5 bg-bg border border-accent-10 rounded-xl text-heading text-sm outline-none focus:border-[var(--color-primary)] transition-all"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="text-heading text-xs font-semibold block mb-1.5">Email *</label>
                        <input
                            type="email"
                            value={form.email}
                            onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                            placeholder="rahim@example.com"
                            className="w-full px-3 py-2.5 bg-bg border border-accent-10 rounded-xl text-heading text-sm outline-none focus:border-[var(--color-primary)] transition-all"
                        />
                    </div>

                    <div>
                        <label className="text-heading text-xs font-semibold block mb-1.5">Zones (comma separated)</label>
                        <input
                            type="text"
                            value={form.zones}
                            onChange={e => setForm(p => ({ ...p, zones: e.target.value }))}
                            placeholder="Dhanmondi, Mirpur, Uttara"
                            className="w-full px-3 py-2.5 bg-bg border border-accent-10 rounded-xl text-heading text-sm outline-none focus:border-[var(--color-primary)] transition-all"
                        />
                    </div>

                    {error && (
                        <p className="text-[var(--color-danger)] text-xs font-medium bg-red-500/10 px-3 py-2 rounded-lg">
                            {error}
                        </p>
                    )}

                    <div className="flex gap-3 pt-1">
                        <button type="button" onClick={onClose}
                            className="flex-1 py-2.5 border border-accent-10 rounded-xl text-body text-sm font-semibold hover:bg-accent-10 transition-colors">
                            Cancel
                        </button>
                        <button type="submit" disabled={loading}
                            className="flex-1 py-2.5 bg-[var(--color-primary)] hover:bg-[var(--color-secondary)] text-white text-sm font-bold rounded-xl transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
                            {loading ? <Loader2 size={14} className="animate-spin" /> : <Mail size={14} />}
                            {loading ? "Sending..." : "Send Invite"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ─── Delivery Boy Card ────────────────────────────────────────────────────────
function DeliveryBoyCard({ boy, onToggle, onDelete, onUpdate }) {
    const [menuOpen, setMenuOpen] = useState(false);
    const [toggling, setToggling] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const handleToggle = async () => {
        setToggling(true);
        try {
            await api.patch(`/api/deliveryboys/admin/delivery-boys/${boy._id}/toggle-active`);
            onToggle(boy._id);
        } catch (err) {
            console.error(err);
        } finally {
            setToggling(false);
            setMenuOpen(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm(`Remove ${boy.name}?`)) return;
        setDeleting(true);
        try {
            await api.delete(`/api/deliveryboys/admin/delivery-boys/${boy._id}`);
            onDelete(boy._id);
        } catch (err) {
            alert(err.response?.data?.message || "Cannot delete");
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div className={`bg-card border rounded-2xl p-5 relative transition-all hover:shadow-lg ${boy.isActive ? "border-accent-10" : "border-red-500/20 opacity-70"}`}>
            {/* Status dot */}
            <div className={`absolute top-4 right-4 w-2.5 h-2.5 rounded-full ${boy.isAvailable && boy.isActive ? "bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)]" : "bg-gray-400"}`} />

            {/* Avatar + name */}
            <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-secondary)] flex items-center justify-center text-white font-black text-lg uppercase select-none">
                    {boy.name?.[0] || "?"}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-heading font-bold text-sm truncate">{boy.name}</p>
                    <p className="text-body text-xs truncate">{boy.email}</p>
                </div>
                {/* Menu */}
                <div className="relative">
                    <button onClick={() => setMenuOpen(v => !v)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-accent-10 transition-colors text-body">
                        <MoreVertical size={15} />
                    </button>
                    {menuOpen && (
                        <div className="absolute right-0 top-9 w-44 bg-card border border-accent-10 rounded-xl shadow-xl z-20 overflow-hidden py-1">
                            <button onClick={handleToggle} disabled={toggling}
                                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-heading hover:bg-accent-10 transition-colors">
                                {toggling ? <Loader2 size={12} className="animate-spin" /> : boy.isActive ? <ToggleRight size={12} className="text-emerald-400" /> : <ToggleLeft size={12} />}
                                {boy.isActive ? "Deactivate" : "Activate"}
                            </button>
                            <button onClick={handleDelete} disabled={deleting}
                                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-red-400 hover:bg-red-500/10 transition-colors">
                                {deleting ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                                Remove
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="bg-bg rounded-xl p-2.5 text-center">
                    <Package size={12} className="text-[var(--color-primary)] mx-auto mb-1" />
                    <p className="text-heading font-black text-sm">{boy.currentOrders || 0}</p>
                    <p className="text-body text-[10px]">Active</p>
                </div>
                <div className="bg-bg rounded-xl p-2.5 text-center">
                    <Check size={12} className="text-emerald-400 mx-auto mb-1" />
                    <p className="text-heading font-black text-sm">{boy.totalDelivered || 0}</p>
                    <p className="text-body text-[10px]">Done</p>
                </div>
                <div className="bg-bg rounded-xl p-2.5 text-center">
                    <Star size={12} className="text-yellow-400 mx-auto mb-1" />
                    <p className="text-heading font-black text-sm">{(boy.rating || 5).toFixed(1)}</p>
                    <p className="text-body text-[10px]">Rating</p>
                </div>
            </div>

            {/* Info */}
            <div className="space-y-1.5">
                {boy.phone && (
                    <div className="flex items-center gap-2 text-xs text-body">
                        <Phone size={11} className="text-[var(--color-primary)] flex-shrink-0" />
                        <span>{boy.phone}</span>
                    </div>
                )}
                {boy.zones?.length > 0 && (
                    <div className="flex items-start gap-2 text-xs text-body">
                        <MapPin size={11} className="text-[var(--color-primary)] flex-shrink-0 mt-0.5" />
                        <span className="truncate">{boy.zones.join(", ")}</span>
                    </div>
                )}
            </div>

            {/* Status badge */}
            <div className="mt-3 flex gap-2">
                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${boy.isActive ? "bg-emerald-400/10 text-emerald-400" : "bg-red-400/10 text-red-400"}`}>
                    {boy.isActive ? "Active" : "Inactive"}
                </span>
                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${boy.isAvailable ? "bg-blue-400/10 text-blue-400" : "bg-gray-400/10 text-gray-400"}`}>
                    {boy.isAvailable ? "Available" : "Offline"}
                </span>
            </div>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AdminDeliveryBoysPage() {
    const [boys, setBoys] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [filterActive, setFilterActive] = useState("");
    const [showInvite, setShowInvite] = useState(false);
    const [toast, setToast] = useState("");

    const fetchBoys = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (search) params.set("search", search);
            if (filterActive !== "") params.set("isActive", filterActive);

            const { data } = await api.get(`/api/deliveryboys/admin/delivery-boys?${params}`);
            setBoys(data.data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [search, filterActive]);

    useEffect(() => {
        const t = setTimeout(fetchBoys, 300);
        return () => clearTimeout(t);
    }, [fetchBoys]);

    const showToast = (msg) => {
        setToast(msg);
        setTimeout(() => setToast(""), 3000);
    };

    const handleToggle = (id) => {
        setBoys(prev => prev.map(b => b._id === id ? { ...b, isActive: !b.isActive } : b));
        showToast("Status updated ✅");
    };

    const handleDelete = (id) => {
        setBoys(prev => prev.filter(b => b._id !== id));
        showToast("Delivery boy removed");
    };

    const activeCount = boys.filter(b => b.isActive).length;
    const availableCount = boys.filter(b => b.isAvailable && b.isActive).length;

    return (
        <div className="min-h-screen bg-bg p-6">
            <div className="max-w-7xl mx-auto">

                {/* Header */}
                <div className="flex items-start justify-between mb-8">
                    <div>
                        <h1 className="text-heading font-black text-2xl mb-1">Delivery Team</h1>
                        <p className="text-body text-sm">Manage and monitor your delivery partners</p>
                    </div>
                    <button onClick={() => setShowInvite(true)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-[var(--color-primary)] hover:bg-[var(--color-secondary)] text-white font-bold rounded-xl transition-colors text-sm shadow-lg shadow-[var(--color-primary)]/20">
                        <UserPlus size={16} />
                        Invite Partner
                    </button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                    {[
                        { label: "Total Partners", value: boys.length, icon: Shield, color: "text-[var(--color-primary)]", bg: "bg-[var(--color-primary)]/10" },
                        { label: "Active", value: activeCount, icon: ToggleRight, color: "text-emerald-400", bg: "bg-emerald-400/10" },
                        { label: "Available Now", value: availableCount, icon: MapPin, color: "text-blue-400", bg: "bg-blue-400/10" },
                    ].map(({ label, value, icon: Icon, color, bg }) => (
                        <div key={label} className="bg-card border border-accent-10 rounded-2xl p-5 flex items-center gap-4">
                            <div className={`w-12 h-12 ${bg} rounded-xl flex items-center justify-center`}>
                                <Icon size={20} className={color} />
                            </div>
                            <div>
                                <p className="text-heading font-black text-2xl">{value}</p>
                                <p className="text-body text-xs">{label}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Filters */}
                <div className="flex gap-3 mb-6">
                    <div className="flex-1 relative">
                        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-body" />
                        <input
                            type="text"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search by name or email..."
                            className="w-full pl-10 pr-4 py-2.5 bg-card border border-accent-10 rounded-xl text-heading text-sm outline-none focus:border-[var(--color-primary)] transition-all"
                        />
                    </div>
                    <select
                        value={filterActive}
                        onChange={e => setFilterActive(e.target.value)}
                        className="px-4 py-2.5 bg-card border border-accent-10 rounded-xl text-heading text-sm outline-none focus:border-[var(--color-primary)] transition-all cursor-pointer">
                        <option value="">All Status</option>
                        <option value="true">Active</option>
                        <option value="false">Inactive</option>
                    </select>
                </div>

                {/* Grid */}
                {loading ? (
                   <Loading/>
                ) : boys.length === 0 ? (
                    <div className="text-center py-24">
                        <div className="w-16 h-16 bg-accent-10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <Package size={28} className="text-body" />
                        </div>
                        <p className="text-heading font-bold text-lg mb-1">No delivery partners yet</p>
                        <p className="text-body text-sm mb-6">Invite someone to get started</p>
                        <button onClick={() => setShowInvite(true)}
                            className="px-5 py-2.5 bg-[var(--color-primary)] text-white font-bold rounded-xl text-sm hover:bg-[var(--color-secondary)] transition-colors">
                            + Invite Partner
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {boys.map(boy => (
                            <DeliveryBoyCard
                                key={boy._id}
                                boy={boy}
                                onToggle={handleToggle}
                                onDelete={handleDelete}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Invite Modal */}
            {showInvite && (
                <InviteModal
                    onClose={() => setShowInvite(false)}
                    onSuccess={() => { fetchBoys(); showToast("Invitation sent! ✅"); }}
                />
            )}

            {/* Toast */}
            {toast && (
                <div className="fixed bottom-6 right-6 bg-card border border-accent-10 text-heading text-sm font-semibold px-5 py-3 rounded-2xl shadow-xl z-50 flex items-center gap-2">
                    <Check size={14} className="text-emerald-400" />
                    {toast}
                </div>
            )}
        </div>
    );
}