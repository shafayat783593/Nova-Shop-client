"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
    FaUsers,
    FaBoxOpen,
    FaShoppingCart,
    FaMoneyBillWave,
    FaMotorcycle,
    FaTags,
    FaClock,
    FaCheckCircle,
    FaCogs,
    FaBoxes,
    FaTruck,
    FaCheckDouble,
    FaTimesCircle,
    FaFire,
    FaReceipt,
    FaArrowUp,
} from "react-icons/fa";
import api from "@/app/lib/api";

// ─── Helpers ────────────────────────────────────────────────────────────────
const formatBDT = (n = 0) =>
    "৳" + Number(n).toLocaleString("en-BD", { maximumFractionDigits: 0 });

const formatDate = (d) =>
    new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

const STATUS_META = {
    pending: { label: "Pending", icon: FaClock, color: "var(--text-muted)" },
    confirmed: { label: "Confirmed", icon: FaCheckCircle, color: "var(--color-secondary)" },
    processing: { label: "Processing", icon: FaCogs, color: "var(--color-accent)" },
    prepared: { label: "Prepared", icon: FaBoxes, color: "var(--color-accent-hover)" },
    shipped: { label: "Shipped", icon: FaTruck, color: "var(--color-primary)" },
    delivered: { label: "Delivered", icon: FaCheckDouble, color: "var(--color-success)" },
    cancelled: { label: "Cancelled", icon: FaTimesCircle, color: "var(--color-danger)" },
};

const PAYMENT_BADGE = {
    paid: { bg: "var(--color-success)", label: "Paid" },
    pending: { bg: "var(--text-muted)", label: "Pending" },
    failed: { bg: "var(--color-danger)", label: "Failed" },
    refunded: { bg: "var(--color-secondary)", label: "Refunded" },
};

// ─── Stat Card ──────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, sub, delay = 0 }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay }}
            className="bg-card border border-accent-10 rounded-2xl p-5 flex items-center gap-4"
        >
            <div
                className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                style={{ backgroundColor: "var(--accent-opacity)" }}
            >
                <Icon size={20} color="var(--color-accent)" />
            </div>
            <div className="min-w-0">
                <p className="text-body text-xs">{label}</p>
                <p className="font-display text-xl font-bold text-heading truncate">{value}</p>
                {sub && <p className="text-body text-[11px] mt-0.5">{sub}</p>}
            </div>
        </motion.div>
    );
}

// ─── Main Page ──────────────────────────────────────────────────────────────
export default function AdminDashboardPage() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        (async () => {
            try {
              const res = await api.get("/api/admin/overview");
            
                setData(res.data.data);
            } catch (err) {
                setError(err?.response?.data?.message || "Failed to load dashboard");
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    if (loading) {
        return (
            <div className="p-6 space-y-6">
                <div className="h-8 w-56 rounded-lg bg-accent-10 animate-pulse" />
                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="h-24 rounded-2xl bg-accent-10 animate-pulse" />
                    ))}
                </div>
                <div className="h-64 rounded-2xl bg-accent-10 animate-pulse" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6">
                <p className="text-sm" style={{ color: "var(--color-danger)" }}>{error}</p>
            </div>
        );
    }

    const { summary, ordersByStatus, recentOrders, topProducts } = data;
    const maxStatusCount = Math.max(...Object.values(ordersByStatus), 1);

    return (
        <div className="p-4 sm:p-6 space-y-6">
            {/* ── Header ── */}
            <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                    <h1 className="font-display text-2xl sm:text-3xl font-bold text-heading">
                        Dashboard Overview
                    </h1>
                    <p className="text-body text-sm mt-1">
                        {new Date().toLocaleDateString("en-US", {
                            weekday: "long", year: "numeric", month: "long", day: "numeric",
                        })}
                    </p>
                </div>
            </div>

            {/* ── Stat Cards ── */}
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4">
                <StatCard icon={FaMoneyBillWave} label="Total Revenue" value={formatBDT(summary.totalRevenue)} sub={`${formatBDT(summary.monthRevenue)} this month`} delay={0.0} />
                <StatCard icon={FaShoppingCart} label="Total Orders" value={summary.totalOrders} delay={0.05} />
                <StatCard icon={FaUsers} label="Total Users" value={summary.totalUsers} sub={`${summary.totalCustomers} customers`} delay={0.1} />
                <StatCard icon={FaBoxOpen} label="Products" value={summary.totalProducts} sub={`${summary.activeProducts} active`} delay={0.15} />
                <StatCard icon={FaMotorcycle} label="Delivery Boys" value={summary.deliveryBoys.total} sub={`${summary.deliveryBoys.online} online`} delay={0.2} />
                <StatCard icon={FaTags} label="Active Promotions" value={summary.activePromotions} delay={0.25} />
            </div>

            {/* ── Order Status Breakdown ── */}
            <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.1 }}
                className="bg-card border border-accent-10 rounded-2xl p-5"
            >
                <h2 className="text-heading font-semibold mb-4">Order Status Breakdown</h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-7 gap-3">
                    {Object.entries(ordersByStatus).map(([status, count]) => {
                        const meta = STATUS_META[status];
                        const Icon = meta.icon;
                        const pct = Math.round((count / maxStatusCount) * 100);
                        return (
                            <div key={status} className="flex flex-col items-center gap-2 p-3 rounded-xl border border-accent-10">
                                <Icon size={18} color={meta.color} />
                                <span className="font-bold text-heading text-lg">{count}</span>
                                <span className="text-body text-[11px]">{meta.label}</span>
                                <div className="w-full h-1.5 rounded-full bg-accent-10 overflow-hidden">
                                    <motion.div
                                        className="h-full rounded-full"
                                        style={{ backgroundColor: meta.color }}
                                        initial={{ width: 0 }}
                                        animate={{ width: `${pct}%` }}
                                        transition={{ duration: 0.5 }}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </motion.div>

            {/* ── Recent Orders + Top Products ── */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Recent Orders */}
                <motion.div
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: 0.15 }}
                    className="xl:col-span-2 bg-card border border-accent-10 rounded-2xl p-5 overflow-x-auto"
                >
                    <div className="flex items-center gap-2 mb-4">
                        <FaReceipt color="var(--color-accent)" />
                        <h2 className="text-heading font-semibold">Recent Orders</h2>
                    </div>

                    <table className="w-full text-sm min-w-[560px]">
                        <thead>
                            <tr className="text-left text-body border-b border-accent-10">
                                <th className="pb-2 font-medium">Order</th>
                                <th className="pb-2 font-medium">Customer</th>
                                <th className="pb-2 font-medium">Total</th>
                                <th className="pb-2 font-medium">Status</th>
                                <th className="pb-2 font-medium">Payment</th>
                                <th className="pb-2 font-medium">Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recentOrders.map((order) => {
                                const statusMeta = STATUS_META[order.orderStatus];
                                const StatusIcon = statusMeta.icon;
                                const payMeta = PAYMENT_BADGE[order.paymentStatus];
                                return (
                                    <tr key={order._id} className="border-b border-accent-10 last:border-b-0 hover:bg-accent-10/40">
                                        <td className="py-3 font-semibold text-heading">{order.orderId}</td>
                                        <td className="py-3 text-body">
                                            {order.user?.name || order.guestInfo?.name || "Guest"}
                                        </td>
                                        <td className="py-3 text-heading font-medium">{formatBDT(order.total)}</td>
                                        <td className="py-3">
                                            <span className="flex items-center gap-1.5" style={{ color: statusMeta.color }}>
                                                <StatusIcon size={12} /> {statusMeta.label}
                                            </span>
                                        </td>
                                        <td className="py-3">
                                            <span
                                                className="px-2 py-0.5 rounded-full text-[11px] font-semibold text-white"
                                                style={{ backgroundColor: payMeta.bg }}
                                            >
                                                {payMeta.label}
                                            </span>
                                        </td>
                                        <td className="py-3 text-body text-xs">{formatDate(order.createdAt)}</td>
                                    </tr>
                                );
                            })}
                            {recentOrders.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="py-6 text-center text-body">No orders yet</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </motion.div>

                {/* Top Selling Products */}
                <motion.div
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: 0.2 }}
                    className="bg-card border border-accent-10 rounded-2xl p-5"
                >
                    <div className="flex items-center gap-2 mb-4">
                        <FaFire color="var(--color-accent)" />
                        <h2 className="text-heading font-semibold">Top Selling Products</h2>
                    </div>

                    <div className="flex flex-col gap-3">
                        {topProducts.map((p, i) => (
                            <div key={p._id || i} className="flex items-center gap-3">
                                <span className="w-5 text-body text-xs font-semibold">#{i + 1}</span>
                                {p.image ? (
                                    <img src={p.image} alt={p.name} className="w-10 h-10 rounded-lg object-cover" />
                                ) : (
                                    <div className="w-10 h-10 rounded-lg bg-accent-10 flex items-center justify-center">
                                        <FaBoxOpen size={14} className="text-body" />
                                    </div>
                                )}
                                <div className="min-w-0 flex-1">
                                    <p className="text-heading text-sm font-medium truncate">{p.name}</p>
                                    <p className="text-body text-xs">{p.totalSold} sold</p>
                                </div>
                                <span className="text-heading text-sm font-semibold flex items-center gap-1">
                                    <FaArrowUp size={10} color="var(--color-success)" />
                                    {formatBDT(p.revenue)}
                                </span>
                            </div>
                        ))}
                        {topProducts.length === 0 && (
                            <p className="text-body text-sm text-center py-6">No sales data yet</p>
                        )}
                    </div>
                </motion.div>
            </div>
        </div>
    );
}