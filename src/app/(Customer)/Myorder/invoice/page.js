"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import api from "@/app/lib/api";
import { useAuth } from "@/app/context/AuthContext";
import {
    FileText, Download, Send, Search, RefreshCw,
    ChevronLeft, ChevronRight, Eye, CheckCircle,
    Clock, XCircle, Filter, TrendingUp, DollarSign,
    Calendar, Loader2, ReceiptText
} from "lucide-react";

// ─── Status config ─────────────────────────────────────────────────────────────
const STATUS = {
    paid:    { label: "Paid",    color: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-500", icon: CheckCircle },
    pending: { label: "Pending", color: "bg-amber-100  text-amber-700",   dot: "bg-amber-400",   icon: Clock },
    failed:  { label: "Failed",  color: "bg-red-100    text-red-600",     dot: "bg-red-400",     icon: XCircle },
};

// ─── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, sub, accent }) {
    return (
        <div className="bg-card border border-accent-10 rounded-2xl p-5 flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${accent}`}>
                <Icon size={22} className="text-white" />
            </div>
            <div>
                <p className="text-body text-xs font-semibold uppercase tracking-wider">{label}</p>
                <p className="text-heading text-2xl font-black mt-0.5">{value}</p>
                {sub && <p className="text-body text-xs mt-0.5">{sub}</p>}
            </div>
        </div>
    );
}

// ─── Invoice Row ───────────────────────────────────────────────────────────────
function InvoiceRow({ invoice, isAdmin, onDownload, onResend, onView }) {
    const cfg        = STATUS[invoice.paymentStatus] || STATUS.pending;
    const StatusIcon = cfg.icon;
    const [resending, setResending] = useState(false);
    const [downloading, setDownloading] = useState(false);

    const handleResend = async (e) => {
        e.stopPropagation();
        setResending(true);
        await onResend(invoice.invoiceNo);
        setResending(false);
    };

    const handleDownload = async (e) => {
        e.stopPropagation();
        setDownloading(true);
        await onDownload(invoice.invoiceNo);
        setDownloading(false);
    };

    return (
        <div
            onClick={() => onView(invoice)}
            className="bg-card border border-accent-10 rounded-2xl p-4 sm:p-5 hover:border-[var(--color-primary)]/30 hover:shadow-sm transition-all cursor-pointer group"
        >
            <div className="flex items-start justify-between gap-3 flex-wrap">
                {/* Left */}
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-[var(--color-primary)]/10 flex items-center justify-center flex-shrink-0">
                        <ReceiptText size={18} className="text-[var(--color-primary)]" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-heading font-bold text-sm tracking-wide">#{invoice.invoiceNo}</span>
                            <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full ${cfg.color}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                                {cfg.label}
                            </span>
                        </div>
                        <p className="text-body text-xs mt-1">
                            {new Date(invoice.dateIssued || invoice.createdAt).toLocaleDateString("en-GB", {
                                day: "2-digit", month: "short", year: "numeric",
                            })}
                        </p>
                        {isAdmin && invoice.customerName && (
                            <p className="text-body text-xs mt-0.5">
                                Customer: <span className="text-heading font-semibold">{invoice.customerName}</span>
                            </p>
                        )}
                        {invoice.order?.orderId && (
                            <p className="text-body text-xs mt-0.5">
                                Order: <span className="text-[var(--color-primary)] font-semibold">{invoice.order.orderId}</span>
                            </p>
                        )}
                    </div>
                </div>

                {/* Right */}
                <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="text-right">
                        <p className="text-heading font-black text-lg">৳{Number(invoice.total || 0).toLocaleString()}</p>
                        <p className="text-body text-xs uppercase">{invoice.paymentMethod}</p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                            onClick={handleDownload}
                            title="Download PDF"
                            className="w-8 h-8 rounded-lg bg-[var(--accent-opacity)] hover:bg-[var(--color-primary)]/15 flex items-center justify-center transition-colors"
                        >
                            {downloading
                                ? <Loader2 size={14} className="animate-spin text-[var(--color-primary)]" />
                                : <Download size={14} className="text-[var(--color-primary)]" />
                            }
                        </button>

                        {isAdmin && (
                            <button
                                onClick={handleResend}
                                title="Resend Email"
                                className="w-8 h-8 rounded-lg bg-[var(--accent-opacity)] hover:bg-blue-500/10 flex items-center justify-center transition-colors"
                            >
                                {resending
                                    ? <Loader2 size={14} className="animate-spin text-blue-500" />
                                    : <Send size={14} className="text-blue-500" />
                                }
                            </button>
                        )}

                        <button
                            onClick={(e) => { e.stopPropagation(); onView(invoice); }}
                            title="View Invoice"
                            className="w-8 h-8 rounded-lg bg-[var(--accent-opacity)] hover:bg-[var(--color-primary)]/15 flex items-center justify-center transition-colors"
                        >
                            <Eye size={14} className="text-[var(--color-primary)]" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Email status */}
            <div className="mt-3 pt-3 border-t border-accent-10 flex items-center justify-between">
                <span className={`text-xs flex items-center gap-1.5 ${invoice.emailSentAt ? "text-emerald-600" : "text-body"}`}>
                    <Send size={11} />
                    {invoice.emailSentAt
                        ? `Email sent ${new Date(invoice.emailSentAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}`
                        : "Email not sent"
                    }
                </span>
                <span className="text-xs text-[var(--color-primary)] font-medium group-hover:underline">
                    View Details →
                </span>
            </div>
        </div>
    );
}

// ─── Invoice Detail Modal ──────────────────────────────────────────────────────
function InvoiceDetailModal({ invoice, isAdmin, onClose, onDownload, onResend }) {
    const cfg = STATUS[invoice.paymentStatus] || STATUS.pending;
    const [downloading, setDownloading] = useState(false);
    const [resending,   setResending]   = useState(false);

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-card w-full sm:max-w-2xl rounded-t-3xl sm:rounded-3xl shadow-2xl z-10 max-h-[90vh] overflow-y-auto">

                {/* Header */}
                <div className="sticky top-0 bg-card rounded-t-3xl px-6 pt-6 pb-4 border-b border-accent-10 z-10">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="flex items-center gap-3">
                                <h2 className="text-heading font-black text-xl">#{invoice.invoiceNo}</h2>
                                <span className={`text-xs font-bold px-3 py-1 rounded-full ${cfg.color}`}>
                                    {cfg.label}
                                </span>
                            </div>
                            <p className="text-body text-xs mt-1">
                                {new Date(invoice.dateIssued || invoice.createdAt).toLocaleDateString("en-GB", {
                                    day: "2-digit", month: "long", year: "numeric",
                                })}
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={async () => { setDownloading(true); await onDownload(invoice.invoiceNo); setDownloading(false); }}
                                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[var(--color-primary)] hover:bg-[var(--color-secondary)] text-white text-xs font-bold transition-colors"
                            >
                                {downloading ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
                                Download PDF
                            </button>
                            {isAdmin && (
                                <button
                                    onClick={async () => { setResending(true); await onResend(invoice.invoiceNo); setResending(false); }}
                                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-accent-10 text-heading text-xs font-bold hover:bg-[var(--accent-opacity)] transition-colors"
                                >
                                    {resending ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                                    Resend Email
                                </button>
                            )}
                            <button onClick={onClose}
                                className="w-8 h-8 rounded-full bg-[var(--accent-opacity)] flex items-center justify-center hover:bg-[var(--color-danger)]/10 transition-colors">
                                <svg className="w-4 h-4 text-heading" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>

                <div className="px-6 pb-6 space-y-5 pt-5">

                    {/* Customer & Payment */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="bg-bg rounded-2xl p-4 border border-accent-10">
                            <p className="text-body text-xs font-bold uppercase tracking-wider mb-3">Customer</p>
                            <p className="text-heading font-bold text-sm">{invoice.customerName || "—"}</p>
                            {invoice.customerPhone && <p className="text-body text-xs mt-1">📞 {invoice.customerPhone}</p>}
                            {invoice.customerEmail && <p className="text-body text-xs mt-0.5">✉️ {invoice.customerEmail}</p>}
                        </div>
                        <div className="bg-bg rounded-2xl p-4 border border-accent-10">
                            <p className="text-body text-xs font-bold uppercase tracking-wider mb-3">Payment Details</p>
                            <div className="space-y-1.5 text-xs">
                                <div className="flex justify-between">
                                    <span className="text-body">Method</span>
                                    <span className="text-heading font-semibold uppercase">{invoice.paymentMethod}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-body">Status</span>
                                    <span className={`font-semibold ${cfg.color.split(" ")[1]}`}>{cfg.label}</span>
                                </div>
                                {invoice.transactionId && (
                                    <div className="flex justify-between">
                                        <span className="text-body">TxnID</span>
                                        <span className="text-heading font-mono text-xs truncate max-w-[120px]">{invoice.transactionId}</span>
                                    </div>
                                )}
                                {invoice.paidAt && (
                                    <div className="flex justify-between">
                                        <span className="text-body">Paid At</span>
                                        <span className="text-heading font-semibold">
                                            {new Date(invoice.paidAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Items */}
                    <div>
                        <p className="text-body text-xs font-bold uppercase tracking-wider mb-3">Items</p>
                        <div className="border border-accent-10 rounded-2xl overflow-hidden">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-bg">
                                        <th className="text-left px-4 py-3 text-body text-xs font-semibold uppercase tracking-wider">Description</th>
                                        <th className="text-center px-4 py-3 text-body text-xs font-semibold uppercase tracking-wider">Qty</th>
                                        <th className="text-right px-4 py-3 text-body text-xs font-semibold uppercase tracking-wider">Price</th>
                                        <th className="text-right px-4 py-3 text-body text-xs font-semibold uppercase tracking-wider">Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {invoice.items?.map((item, i) => (
                                        <tr key={i} className="border-t border-accent-10">
                                            <td className="px-4 py-3 text-heading font-medium">{item.name}</td>
                                            <td className="px-4 py-3 text-center text-body">{item.quantity}</td>
                                            <td className="px-4 py-3 text-right text-body">৳{Number(item.unitPrice).toLocaleString()}</td>
                                            <td className="px-4 py-3 text-right text-heading font-bold">৳{Number(item.amount).toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Totals */}
                    <div className="flex justify-end">
                        <div className="w-64 space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-body">Subtotal</span>
                                <span className="text-heading font-semibold">৳{Number(invoice.subtotal || 0).toLocaleString()}</span>
                            </div>
                            {invoice.discount > 0 && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-emerald-600">Discount</span>
                                    <span className="text-emerald-600 font-semibold">-৳{Number(invoice.discount).toLocaleString()}</span>
                                </div>
                            )}
                            <div className="flex justify-between text-sm">
                                <span className="text-body">Shipping</span>
                                <span className={invoice.shippingFee === 0 ? "text-emerald-600 font-semibold" : "text-heading font-semibold"}>
                                    {invoice.shippingFee === 0 ? "Free" : `৳${Number(invoice.shippingFee).toLocaleString()}`}
                                </span>
                            </div>
                            <div className="flex justify-between text-base font-black pt-2 border-t border-accent-10">
                                <span className="text-heading">Total</span>
                                <span className="text-[var(--color-primary)] text-lg">৳{Number(invoice.total || 0).toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Main Invoice Page ─────────────────────────────────────────────────────────
export default function InvoicePage() {
    const router        = useRouter();
    const { user, isAuth, loading: authLoading } = useAuth();
    const isAdmin       = user?.role === "admin";

    const [invoices,    setInvoices]    = useState([]);
    const [stats,       setStats]       = useState(null);
    const [loading,     setLoading]     = useState(true);
    const [search,      setSearch]      = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [page,        setPage]        = useState(1);
    const [pagination,  setPagination]  = useState(null);
    const [selected,    setSelected]    = useState(null);
    const [toast,       setToast]       = useState(null);

    const showToast = (msg, type = "success") => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    const fetchInvoices = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ page, limit: 15 });
            if (search)                    params.set("search", search);
            if (statusFilter !== "all")    params.set("paymentStatus", statusFilter);

            const endpoint = isAdmin ? `/api/invoices/admin/all?${params}` : `/api/invoices/my?${params}`;
            const { data } = await api.get(endpoint);
            setInvoices(data.data || []);
            setPagination(data.pagination);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [isAdmin, page, search, statusFilter]);

    const fetchStats = useCallback(async () => {
        if (!isAdmin) return;
        try {
            const { data } = await api.get("/api/invoices/admin/stats");
            setStats(data.data);
        } catch { }
    }, [isAdmin]);

    useEffect(() => {
        if (authLoading) return;
        if (!isAuth) { router.push("/login"); return; }
        fetchInvoices();
        fetchStats();
    }, [isAuth, authLoading, fetchInvoices, fetchStats]);

    const handleDownload = async (invoiceNo) => {
        try {
            const response = await api.get(`/api/invoices/${invoiceNo}/download`, { responseType: "blob" });
            const url  = URL.createObjectURL(new Blob([response.data], { type: "application/pdf" }));
            const link = document.createElement("a");
            link.href  = url;
            link.download = `invoice-${invoiceNo}.pdf`;
            link.click();
            URL.revokeObjectURL(url);
            showToast("PDF downloaded!");
        } catch {
            showToast("Download failed", "error");
        }
    };

    const handleResend = async (invoiceNo) => {
        try {
            await api.post(`/api/invoices/${invoiceNo}/resend`);
            showToast("Invoice email resent!");
            fetchInvoices();
        } catch (err) {
            showToast(err.response?.data?.message || "Resend failed", "error");
        }
    };

    return (
        <div className="min-h-screen bg-bg">
            {/* Toast */}
            {toast && (
                <div className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-2xl text-sm font-semibold shadow-xl transition-all
                    ${toast.type === "error" ? "bg-red-500 text-white" : "bg-emerald-500 text-white"}`}>
                    {toast.msg}
                </div>
            )}

            <div className="max-w-5xl mx-auto px-4 lg:px-8 py-8">

                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <button onClick={() => router.back()} className="text-body hover:text-heading transition-colors">
                            <ChevronLeft size={20} />
                        </button>
                        <div>
                            <h1 className="text-heading text-2xl font-black flex items-center gap-2">
                                <ReceiptText className="text-[var(--color-primary)]" size={24} />
                                {isAdmin ? "Invoice Management" : "My Invoices"}
                            </h1>
                            <p className="text-body text-sm mt-0.5">
                                {pagination?.total || 0} invoice{pagination?.total !== 1 ? "s" : ""} total
                            </p>
                        </div>
                    </div>
                    <button onClick={() => { fetchInvoices(); fetchStats(); }}
                        className="w-9 h-9 rounded-xl border border-accent-10 flex items-center justify-center text-body hover:text-[var(--color-primary)] hover:border-[var(--color-primary)]/30 transition-all">
                        <RefreshCw size={15} />
                    </button>
                </div>

                {/* Admin Stats */}
                {isAdmin && stats && (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                        <StatCard icon={ReceiptText}  label="Total Invoices"  value={stats.total}                         sub="All time"          accent="bg-[var(--color-primary)]" />
                        <StatCard icon={Calendar}     label="This Month"      value={stats.thisMonth}                     sub="New invoices"       accent="bg-blue-500" />
                        <StatCard icon={CheckCircle}  label="Paid"            value={stats.byStatus?.paid || 0}           sub="Confirmed"          accent="bg-emerald-500" />
                        <StatCard icon={DollarSign}   label="Total Revenue"   value={`৳${Number(stats.totalRevenue || 0).toLocaleString()}`} sub="From paid invoices" accent="bg-violet-500" />
                    </div>
                )}

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-3 mb-6">
                    <div className="relative flex-1">
                        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-body" />
                        <input
                            type="text"
                            value={search}
                            onChange={e => { setSearch(e.target.value); setPage(1); }}
                            placeholder={isAdmin ? "Search by invoice no, customer..." : "Search invoices..."}
                            className="w-full pl-10 pr-4 py-2.5 bg-card border border-accent-10 rounded-xl text-heading text-sm placeholder:text-body outline-none focus:border-[var(--color-primary)] transition-all"
                        />
                    </div>
                    <div className="flex gap-2">
                        {["all", "paid", "pending", "failed"].map(s => (
                            <button
                                key={s}
                                onClick={() => { setStatusFilter(s); setPage(1); }}
                                className={`px-3 py-2.5 rounded-xl text-sm font-semibold border transition-all capitalize
                                    ${statusFilter === s
                                        ? "bg-[var(--color-primary)] text-white border-[var(--color-primary)]"
                                        : "bg-card border-accent-10 text-body hover:border-[var(--color-primary)]/30"
                                    }`}
                            >
                                {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Invoice List */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-3">
                        <Loader2 size={28} className="animate-spin text-[var(--color-primary)]" />
                        <p className="text-body text-sm">Loading invoices...</p>
                    </div>
                ) : invoices.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <ReceiptText size={48} className="text-body opacity-20 mb-4" />
                        <h3 className="text-heading font-bold text-lg mb-2">No invoices found</h3>
                        <p className="text-body text-sm">
                            {search ? "Try a different search term" : "Invoices will appear here after orders are placed"}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {invoices.map(inv => (
                            <InvoiceRow
                                key={inv._id}
                                invoice={inv}
                                isAdmin={isAdmin}
                                onDownload={handleDownload}
                                onResend={handleResend}
                                onView={setSelected}
                            />
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {pagination && pagination.totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-8">
                        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                            className="w-10 h-10 rounded-full bg-card border border-accent-10 flex items-center justify-center text-body hover:border-[var(--color-primary)]/30 hover:text-[var(--color-primary)] transition-all disabled:opacity-40">
                            <ChevronLeft size={16} />
                        </button>
                        {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).slice(
                            Math.max(0, page - 3), Math.min(pagination.totalPages, page + 2)
                        ).map(pg => (
                            <button key={pg} onClick={() => setPage(pg)}
                                className={`w-10 h-10 rounded-full text-sm font-bold transition-all
                                    ${pg === page ? "bg-[var(--color-primary)] text-white shadow-lg shadow-[var(--color-primary)]/25" : "bg-card border border-accent-10 text-body hover:border-[var(--color-primary)]/30"}`}>
                                {pg}
                            </button>
                        ))}
                        <button onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))} disabled={page === pagination.totalPages}
                            className="w-10 h-10 rounded-full bg-card border border-accent-10 flex items-center justify-center text-body hover:border-[var(--color-primary)]/30 hover:text-[var(--color-primary)] transition-all disabled:opacity-40">
                            <ChevronRight size={16} />
                        </button>
                    </div>
                )}
            </div>

            {/* Detail Modal */}
            {selected && (
                <InvoiceDetailModal
                    invoice={selected}
                    isAdmin={isAdmin}
                    onClose={() => setSelected(null)}
                    onDownload={handleDownload}
                    onResend={handleResend}
                />
            )}
        </div>
    );
}