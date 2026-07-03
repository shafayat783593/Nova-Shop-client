"use client";

import { useCallback, useEffect, useState } from "react";
import {
    Users,
    Search,
    Smartphone,
    Tablet,
    Monitor,
    LogOut,
    X,
    RefreshCw,
    Shield,
    MapPin,
    Clock,
    ChevronLeft,
    ChevronRight,
    AlertTriangle,
    WifiOff,
} from "lucide-react";
import api from "../../../lib/api"; // ✅ path adjust করুন আপনার project structure অনুযায়ী

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────
const timeAgo = (dateStr) => {
    if (!dateStr) return "—";
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
};

const DeviceIcon = ({ type, className = "w-5 h-5" }) => {
    if (type === "Mobile") return <Smartphone className={className} />;
    if (type === "Tablet") return <Tablet className={className} />;
    return <Monitor className={className} />;
};

const RoleBadge = ({ role }) => {
    const styles = {
        admin: "bg-danger/10 text-danger",
        vendor: "bg-primary/10 text-primary",
        deliveryboy: "bg-secondary/10 text-secondary",
        user: "bg-accent-opacity text-heading",
    };
    return (
        <span
            className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${
                styles[role] || "bg-accent-opacity text-heading"
            }`}
        >
            {role}
        </span>
    );
};

// ─────────────────────────────────────────────────────────────
// Skeleton row for loading state
// ─────────────────────────────────────────────────────────────
const UserRowSkeleton = () => (
    <tr className="border-b border-accent-10">
        <td className="p-4">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-accent-opacity animate-pulse" />
                <div className="space-y-2">
                    <div className="h-3 w-32 bg-accent-opacity rounded animate-pulse" />
                    <div className="h-2.5 w-40 bg-accent-opacity rounded animate-pulse" />
                </div>
            </div>
        </td>
        <td className="p-4"><div className="h-5 w-16 bg-accent-opacity rounded-full animate-pulse" /></td>
        <td className="p-4"><div className="h-5 w-10 bg-accent-opacity rounded-full animate-pulse mx-auto" /></td>
        <td className="p-4"><div className="h-8 w-24 bg-accent-opacity rounded-lg animate-pulse ml-auto" /></td>
    </tr>
);

const DeviceCardSkeleton = () => (
    <div className="p-4 rounded-xl border border-accent-10 bg-bg animate-pulse">
        <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-lg bg-accent-opacity" />
            <div className="space-y-2 flex-1">
                <div className="h-3 w-28 bg-accent-opacity rounded" />
                <div className="h-2.5 w-20 bg-accent-opacity rounded" />
            </div>
        </div>
        <div className="h-2.5 w-full bg-accent-opacity rounded mb-2" />
        <div className="h-2.5 w-2/3 bg-accent-opacity rounded" />
    </div>
);

// ─────────────────────────────────────────────────────────────
// Session / Device Modal
// ─────────────────────────────────────────────────────────────
const DevicesModal = ({ userId, onClose }) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [revokingId, setRevokingId] = useState(null);
    const [loggingAll, setLoggingAll] = useState(false);
    const [error, setError] = useState("");

    const fetchSessions = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const { data } = await api.get(`/api/admin/users/${userId}/sessions`);
            setData(data);
        } catch {
            setError("Failed to load devices");
        } finally {
            setLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        fetchSessions();
    }, [fetchSessions]);

    const handleRevoke = async (sessionId) => {
        setRevokingId(sessionId);
        try {
            await api.delete(`/api/admin/users/${userId}/sessions/${sessionId}`);
            setData((prev) => ({
                ...prev,
                sessions: prev.sessions.filter((s) => s.sessionId !== sessionId),
            }));
        } catch {
            setError("Failed to logout device");
        } finally {
            setRevokingId(null);
        }
    };

    const handleLogoutAll = async () => {
        if (!confirm("Logout this user from ALL devices?")) return;
        setLoggingAll(true);
        try {
            await api.delete(`/api/admin/users/${userId}/sessions`);
            setData((prev) => ({ ...prev, sessions: [] }));
        } catch {
            setError("Failed to logout all devices");
        } finally {
            setLoggingAll(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-fade-in">
            <div className="bg-card w-full max-w-2xl max-h-[85vh] rounded-2xl shadow-2xl flex flex-col animate-slide-up">
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-accent-10">
                    <div>
                        <h2 className="font-display text-lg text-heading font-bold">
                            {loading ? "Loading…" : data?.user?.name}
                        </h2>
                        <p className="text-sm text-body">
                            {loading ? "" : data?.user?.email}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-accent-opacity text-body transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-5 overflow-y-auto flex-1">
                    {error && (
                        <div className="mb-4 flex items-center gap-2 text-sm text-danger bg-danger/10 p-3 rounded-lg">
                            <AlertTriangle className="w-4 h-4 shrink-0" />
                            {error}
                        </div>
                    )}

                    {loading ? (
                        <div className="grid sm:grid-cols-2 gap-3">
                            {[...Array(4)].map((_, i) => <DeviceCardSkeleton key={i} />)}
                        </div>
                    ) : data.sessions.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-body">
                            <WifiOff className="w-10 h-10 mb-3 opacity-40" />
                            <p className="text-sm">No active devices</p>
                        </div>
                    ) : (
                        <div className="grid sm:grid-cols-2 gap-3">
                            {data.sessions.map((s) => (
                                <div
                                    key={s.sessionId}
                                    className="p-4 rounded-xl border border-accent-10 bg-bg"
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                                                <DeviceIcon type={s.deviceType} className="w-4.5 h-4.5" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-heading">
                                                    {s.browser} · {s.os}
                                                </p>
                                                <p className="text-xs text-body">{s.deviceType}</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleRevoke(s.sessionId)}
                                            disabled={revokingId === s.sessionId}
                                            title="Logout this device"
                                            className="p-1.5 rounded-lg text-danger hover:bg-danger/10 transition-colors disabled:opacity-50"
                                        >
                                            {revokingId === s.sessionId ? (
                                                <RefreshCw className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <LogOut className="w-4 h-4" />
                                            )}
                                        </button>
                                    </div>

                                    <div className="space-y-1.5 text-xs text-body">
                                        <div className="flex items-center gap-1.5">
                                            <MapPin className="w-3.5 h-3.5 shrink-0" />
                                            <span>{s.ip}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <Clock className="w-3.5 h-3.5 shrink-0" />
                                            <span>Active {timeAgo(s.lastActivity)}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <Shield className="w-3.5 h-3.5 shrink-0" />
                                            <span>Logged in {timeAgo(s.createdAt)}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                {!loading && data?.sessions?.length > 0 && (
                    <div className="p-5 border-t border-accent-10">
                        <button
                            onClick={handleLogoutAll}
                            disabled={loggingAll}
                            className="w-full flex items-center justify-center gap-2 bg-danger text-white font-semibold py-2.5 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
                        >
                            {loggingAll ? (
                                <RefreshCw className="w-4 h-4 animate-spin" />
                            ) : (
                                <LogOut className="w-4 h-4" />
                            )}
                            Logout from all devices
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

// ─────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────
export default function AdminUsersPage() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [pages, setPages] = useState(1);
    const [selectedUserId, setSelectedUserId] = useState(null);
    const [error, setError] = useState("");

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const { data } = await api.get("/api/admin/users", {
                params: { search, page, limit: 10 },
            });
            setUsers(data.users);
            setPages(data.pages);
        } catch {
            setError("Failed to load users");
        } finally {
            setLoading(false);
        }
    }, [search, page]);

    // debounce search
    useEffect(() => {
        const t = setTimeout(() => {
            setPage(1);
            fetchUsers();
        }, 400);
        return () => clearTimeout(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search]);

    useEffect(() => {
        fetchUsers();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page]);

    return (
        <div className="min-h-screen bg-bg p-4 sm:p-8">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                        <Users className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="font-display text-xl font-bold text-heading">
                            User Management
                        </h1>
                        <p className="text-sm text-body">
                            View users and manage their logged-in devices
                        </p>
                    </div>
                </div>

                {/* Search */}
                <div className="relative mb-5">
                    <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-body" />
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search by name or email..."
                        className="w-full bg-card border border-accent-10 rounded-xl py-3 pl-11 pr-4 text-sm text-heading placeholder:text-body outline-none focus:border-[var(--color-secondary)] transition-colors"
                    />
                </div>

                {error && (
                    <div className="mb-4 flex items-center gap-2 text-sm text-danger bg-danger/10 p-3 rounded-lg">
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                        {error}
                    </div>
                )}

                {/* Table */}
                <div className="bg-card rounded-2xl border border-accent-10 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-accent-10 bg-accent-opacity/30">
                                    <th className="text-left p-4 text-xs font-semibold text-body uppercase tracking-wide">
                                        User
                                    </th>
                                    <th className="text-left p-4 text-xs font-semibold text-body uppercase tracking-wide">
                                        Role
                                    </th>
                                    <th className="text-center p-4 text-xs font-semibold text-body uppercase tracking-wide">
                                        Devices
                                    </th>
                                    <th className="text-right p-4 text-xs font-semibold text-body uppercase tracking-wide">
                                        Action
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    [...Array(6)].map((_, i) => <UserRowSkeleton key={i} />)
                                ) : users.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="p-10 text-center text-body text-sm">
                                            No users found
                                        </td>
                                    </tr>
                                ) : (
                                    users.map((u) => (
                                        <tr
                                            key={u._id}
                                            className="border-b border-accent-10 last:border-0 hover:bg-accent-opacity/20"
                                        >
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-display font-bold text-sm shrink-0">
                                                        {u.name?.charAt(0)?.toUpperCase() || "?"}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-semibold text-heading truncate">
                                                            {u.name}
                                                        </p>
                                                        <p className="text-xs text-body truncate">{u.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <RoleBadge role={u.role} />
                                            </td>
                                            <td className="p-4 text-center">
                                                <span
                                                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                                                        u.activeDevices > 0
                                                            ? "bg-success/10 text-success"
                                                            : "bg-accent-opacity text-body"
                                                    }`}
                                                >
                                                    <span
                                                        className={`w-1.5 h-1.5 rounded-full ${
                                                            u.activeDevices > 0 ? "bg-success animate-ping-slow" : "bg-body"
                                                        }`}
                                                    />
                                                    {u.activeDevices}
                                                </span>
                                            </td>
                                            <td className="p-4 text-right">
                                                <button
                                                    onClick={() => setSelectedUserId(u._id)}
                                                    className="inline-flex items-center gap-1.5 bg-primary text-white text-xs font-semibold px-3.5 py-2 rounded-lg hover:bg-secondary transition-colors"
                                                >
                                                    <Monitor className="w-3.5 h-3.5" />
                                                    View Devices
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {!loading && pages > 1 && (
                        <div className="flex items-center justify-between p-4 border-t border-accent-10">
                            <button
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="flex items-center gap-1 text-sm text-body disabled:opacity-30 hover:text-heading"
                            >
                                <ChevronLeft className="w-4 h-4" /> Prev
                            </button>
                            <span className="text-xs text-body">
                                Page {page} of {pages}
                            </span>
                            <button
                                onClick={() => setPage((p) => Math.min(pages, p + 1))}
                                disabled={page === pages}
                                className="flex items-center gap-1 text-sm text-body disabled:opacity-30 hover:text-heading"
                            >
                                Next <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {selectedUserId && (
                <DevicesModal
                    userId={selectedUserId}
                    onClose={() => setSelectedUserId(null)}
                />
            )}
        </div>
    );
}