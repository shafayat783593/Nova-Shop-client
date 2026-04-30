"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/app/lib/api";
import {
    Tag, Plus, Search, Filter, ToggleLeft, ToggleRight,
    Trash2, Pencil, ChevronLeft, ChevronRight, Zap,
    ShoppingCart, Gift, Truck, BarChart3, Clock, CheckCircle, XCircle
} from "lucide-react";
import Loading from "@/app/components/global/Loading";

const TYPE_CONFIG = {
    product: { label: "Product", icon: Tag, color: "text-blue-500", bg: "bg-blue-500/10" },
    cart: { label: "Cart", icon: ShoppingCart, color: "text-purple-500", bg: "bg-purple-500/10" },
    bxgy: { label: "Buy X Get Y", icon: Gift, color: "text-amber-500", bg: "bg-amber-500/10" },
    free_shipping: { label: "Free Shipping", icon: Truck, color: "text-green-500", bg: "bg-green-500/10" },
};

const DISCOUNT_LABEL = {
    percent: (v) => `${v}% OFF`,
    fixed: (v) => `৳${v} OFF`,
    free: () => "FREE",
};

function StatCard({ label, value, icon: Icon, color }) {
    return (
        <div className="bg-card rounded-2xl p-5 flex items-center gap-4 border border-accent-10">
            <div className={`p-3 rounded-xl ${color}`}>
                <Icon size={20} className="text-[var(--text-main)]" />
            </div>
            <div>
                <p className="text-body text-xs font-medium uppercase tracking-wider">{label}</p>
                <p className="text-heading text-2xl font-bold font-display">{value}</p>
            </div>
        </div>
    );
}

function TypeBadge({ type }) {
    const cfg = TYPE_CONFIG[type] || {};
    const Icon = cfg.icon || Tag;
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.color}`}>
            <Icon size={12} /> {cfg.label}
        </span>
    );
}

function StatusDot({ isActive, endDate }) {
    const expired = endDate && new Date(endDate) < new Date();
    if (expired) return (
        <span className="inline-flex items-center gap-1.5 text-xs text-amber-500 font-medium">
            <Clock size={12} /> Expired
        </span>
    );
    return isActive ? (
        <span className="inline-flex items-center gap-1.5 text-xs text-[var(--color-success)] font-medium">
            <CheckCircle size={12} /> Active
        </span>
    ) : (
        <span className="inline-flex items-center gap-1.5 text-xs text-[var(--color-danger)] font-medium">
            <XCircle size={12} /> Inactive
        </span>
    );
}

export default function ManagePromotions() {
    const router = useRouter();
    const [promotions, setPromotions] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [typeFilter, setTypeFilter] = useState("");
    const [activeFilter, setActiveFilter] = useState("");
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({});
    const [deleting, setDeleting] = useState(null);
    const [toggling, setToggling] = useState(null);

    const fetchStats = async () => {
        try {
            const { data } = await api.get("/api/promotions/stats");
            setStats(data.data);
        } catch { }
    };

    const fetchPromotions = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ page, limit: 8 });
            if (search) params.set("search", search);
            if (typeFilter) params.set("type", typeFilter);
            if (activeFilter !== "") params.set("isActive", activeFilter);

            const { data } = await api.get(`/api/promotions?${params}`);
            setPromotions(data.data);
            setPagination(data.pagination);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchStats(); }, []);
    useEffect(() => { fetchPromotions(); }, [page, search, typeFilter, activeFilter]);

    const handleToggle = async (id) => {
        setToggling(id);
        try {
            await api.patch(`/api/promotions/${id}/toggle`);
            fetchPromotions();
            fetchStats();
        } catch { }
        setToggling(null);
    };

    const handleDelete = async (id) => {
        if (!confirm("Delete this promotion?")) return;
        setDeleting(id);
        try {
            await api.delete(`/api/promotions/${id}`);
            fetchPromotions();
            fetchStats();
        } catch { }
        setDeleting(null);
    };

    const formatDate = (d) => d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—";

    return (
        <div className="min-h-screen bg-bg p-6 lg:p-8">
            <div className="max-w-7xl mx-auto space-y-8">

                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-heading text-3xl font-bold font-display flex items-center gap-3">
                            <Zap className="text-[var(--color-primary)]" size={28} />
                            Promotions
                        </h1>
                        <p className="text-body text-sm mt-1">Manage discounts, offers, and campaigns</p>
                    </div>
                    <button
                        onClick={() => router.push("/admin/homeAdmin/managePromotion/createPromotion")}
                        className="flex items-center gap-2 px-5 py-2.5 bg-[var(--color-primary)] hover:bg-[var(--color-secondary)] text-white rounded-xl font-semibold text-sm transition-colors"
                    >
                        <Plus size={16} /> New Promotion
                    </button>
                </div>

                {/* Stats */}
                {stats && (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <StatCard label="Total" value={stats.total} icon={Tag} color="bg-[var(--color-accent)]/20" />
                        <StatCard label="Active" value={stats.active} icon={CheckCircle} color="bg-[var(--color-success)]/20" />
                        <StatCard label="Expired" value={stats.expired} icon={Clock} color="bg-amber-500/20" />
                        <StatCard label="Types" value={stats.byType?.length ?? 0} icon={BarChart3} color="bg-purple-500/20" />
                    </div>
                )}

                {/* Filters */}
                <div className="bg-card border border-accent-10 rounded-2xl p-4 flex flex-wrap gap-3">
                    <div className="flex-1 min-w-[200px] relative">
                        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-body" />
                        <input
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                            placeholder="Search promotions…"
                            className="w-full pl-9 pr-4 py-2 text-sm bg-bg border border-accent-10 rounded-xl text-heading placeholder:text-body outline-none focus:border-[var(--color-primary)]"
                        />
                    </div>

                    <select
                        value={typeFilter}
                        onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
                        className="px-3 py-2 text-sm bg-bg border border-accent-10 rounded-xl text-heading outline-none focus:border-[var(--color-primary)]"
                    >
                        <option value="">All Types</option>
                        {Object.entries(TYPE_CONFIG).map(([k, v]) => (
                            <option key={k} value={k}>{v.label}</option>
                        ))}
                    </select>

                    <select
                        value={activeFilter}
                        onChange={(e) => { setActiveFilter(e.target.value); setPage(1); }}
                        className="px-3 py-2 text-sm bg-bg border border-accent-10 rounded-xl text-heading outline-none focus:border-[var(--color-primary)]"
                    >
                        <option value="">All Status</option>
                        <option value="true">Active</option>
                        <option value="false">Inactive</option>
                    </select>
                </div>

                {/* Table */}
                <div className="bg-card border border-accent-10 rounded-2xl overflow-hidden">
                    {loading ? (
                        <Loading/>
                    ) : promotions.length === 0 ? (
                        <div className="text-center py-20 text-body">
                            <Tag size={40} className="mx-auto mb-3 opacity-30" />
                            <p>No promotions found</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-accent-10">
                                        <th className="text-left px-5 py-3.5 text-body font-semibold uppercase text-xs tracking-wider">Name</th>
                                        <th className="text-left px-5 py-3.5 text-body font-semibold uppercase text-xs tracking-wider">Type</th>
                                        <th className="text-left px-5 py-3.5 text-body font-semibold uppercase text-xs tracking-wider">Discount</th>
                                        <th className="text-left px-5 py-3.5 text-body font-semibold uppercase text-xs tracking-wider">Usage</th>
                                        <th className="text-left px-5 py-3.5 text-body font-semibold uppercase text-xs tracking-wider">Schedule</th>
                                        <th className="text-left px-5 py-3.5 text-body font-semibold uppercase text-xs tracking-wider">Status</th>
                                        <th className="text-right px-5 py-3.5 text-body font-semibold uppercase text-xs tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[var(--accent-opacity)]">
                                    {promotions.map((p) => (
                                        <tr key={p._id} className="hover:bg-[var(--accent-opacity)] transition-colors">
                                            <td className="px-5 py-4">
                                                <p className="text-heading font-semibold">{p.name}</p>
                                                {p.description && <p className="text-body text-xs mt-0.5 line-clamp-1">{p.description}</p>}
                                            </td>
                                            <td className="px-5 py-4"><TypeBadge type={p.type} /></td>
                                            <td className="px-5 py-4">
                                                {p.discountType && p.value !== undefined ? (
                                                    <span className="font-bold text-[var(--color-primary)]">
                                                        {DISCOUNT_LABEL[p.discountType]?.(p.value) ?? "—"}
                                                    </span>
                                                ) : <span className="text-body">—</span>}
                                            </td>
                                            <td className="px-5 py-4 text-heading">
                                                {p.usageLimit
                                                    ? <span>{p.usedCount ?? 0} / {p.usageLimit}</span>
                                                    : <span className="text-body">Unlimited</span>}
                                            </td>
                                            <td className="px-5 py-4 text-body text-xs">
                                                <div>{formatDate(p.startDate)}</div>
                                                <div>→ {formatDate(p.endDate)}</div>
                                            </td>
                                            <td className="px-5 py-4">
                                                <StatusDot isActive={p.isActive} endDate={p.endDate} />
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="flex items-center justify-end gap-2">
                                                    {/* Toggle */}
                                                    <button
                                                        onClick={() => handleToggle(p._id)}
                                                        disabled={toggling === p._id}
                                                        title={p.isActive ? "Deactivate" : "Activate"}
                                                        className="p-1.5 rounded-lg hover:bg-[var(--accent-opacity)] transition-colors"
                                                    >
                                                        {p.isActive
                                                            ? <ToggleRight size={18} className="text-[var(--color-success)]" />
                                                            : <ToggleLeft size={18} className="text-body" />}
                                                    </button>

                                                    {/* Edit */}
                                                    <button
                                                        onClick={() => router.push(`/admin/homeAdmin/managePromotion/${p._id}`)}
                                                        className="p-1.5 rounded-lg hover:bg-[var(--accent-opacity)] transition-colors text-[var(--color-primary)]"
                                                    >
                                                        <Pencil size={15} />
                                                    </button>

                                                    {/* Delete */}
                                                    <button
                                                        onClick={() => handleDelete(p._id)}
                                                        disabled={deleting === p._id}
                                                        className="p-1.5 rounded-lg hover:bg-red-500/10 transition-colors text-[var(--color-danger)]"
                                                    >
                                                        <Trash2 size={15} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                    <div className="flex items-center justify-between">
                        <p className="text-body text-sm">
                            Showing {(page - 1) * 8 + 1}–{Math.min(page * 8, pagination.total)} of {pagination.total}
                        </p>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="p-2 rounded-xl border border-accent-10 disabled:opacity-40 hover:bg-[var(--accent-opacity)] transition-colors"
                            >
                                <ChevronLeft size={16} className="text-heading" />
                            </button>
                            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((n) => (
                                <button
                                    key={n}
                                    onClick={() => setPage(n)}
                                    className={`w-9 h-9 rounded-xl text-sm font-medium transition-colors ${n === page
                                            ? "bg-[var(--color-primary)] text-white"
                                            : "border border-accent-10 text-heading hover:bg-[var(--accent-opacity)]"
                                        }`}
                                >
                                    {n}
                                </button>
                            ))}
                            <button
                                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                                disabled={page === pagination.totalPages}
                                className="p-2 rounded-xl border border-accent-10 disabled:opacity-40 hover:bg-[var(--accent-opacity)] transition-colors"
                            >
                                <ChevronRight size={16} className="text-heading" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}