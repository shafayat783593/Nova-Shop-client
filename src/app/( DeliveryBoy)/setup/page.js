"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import api from "@/app/lib/api";
import { Loader2, Eye, EyeOff, CheckCircle } from "lucide-react";

export default function DeliverySetupPage() {
    const searchParams = useSearchParams();
    const router       = useRouter();
    const token        = searchParams.get("token");

    const [info,     setInfo]     = useState(null);
    const [password, setPassword] = useState("");
    const [confirm,  setConfirm]  = useState("");
    const [showPw,   setShowPw]   = useState(false);
    const [loading,  setLoading]  = useState(true);
    const [saving,   setSaving]   = useState(false);
    const [done,     setDone]     = useState(false);
    const [error,    setError]    = useState("");

    // Token validate করো
    useEffect(() => {
        if (!token) { setError("Invalid link"); setLoading(false); return; }

        api.get(`/api/delivery/setup/${token}`)
            .then(({ data }) => setInfo(data.data))
            .catch(() => setError("This invitation has expired or is invalid."))
            .finally(() => setLoading(false));
    }, [token]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (password !== confirm) { setError("Passwords do not match"); return; }
        if (password.length < 6)  { setError("Minimum 6 characters"); return; }

        setSaving(true); setError("");
        try {
            await api.post("/api/delivery/setup", { token, password });
            setDone(true);
            setTimeout(() => router.push("/login"), 2500);
        } catch (err) {
            setError(err.response?.data?.message || "Something went wrong");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-bg flex items-center justify-center">
            <Loader2 size={28} className="animate-spin text-[var(--color-primary)]" />
        </div>
    );

    if (error && !info) return (
        <div className="min-h-screen bg-bg flex items-center justify-center px-4">
            <div className="bg-card border border-accent-10 rounded-2xl p-8 max-w-sm w-full text-center">
                <p className="text-2xl mb-3">❌</p>
                <h2 className="text-heading font-bold text-lg mb-2">Invalid Invitation</h2>
                <p className="text-body text-sm">{error}</p>
            </div>
        </div>
    );

    if (done) return (
        <div className="min-h-screen bg-bg flex items-center justify-center px-4">
            <div className="bg-card border border-accent-10 rounded-2xl p-8 max-w-sm w-full text-center">
                <CheckCircle size={48} className="text-emerald-500 mx-auto mb-4" />
                <h2 className="text-heading font-bold text-lg mb-2">Account Created! 🎉</h2>
                <p className="text-body text-sm">Redirecting to login...</p>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-bg flex items-center justify-center px-4">
            <div className="bg-card border border-accent-10 rounded-2xl p-8 max-w-sm w-full">
                {/* Header */}
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-[var(--color-primary)] rounded-xl flex items-center justify-center text-white font-black text-lg">N</div>
                    <div>
                        <p className="text-heading font-black">Nova Shop</p>
                        <p className="text-body text-xs">Delivery Partner Setup</p>
                    </div>
                </div>

                <h1 className="text-heading font-black text-xl mb-1">Welcome, {info?.name}! 👋</h1>
                <p className="text-body text-sm mb-6">Set a password to complete your account setup.</p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Email (readonly) */}
                    <div>
                        <label className="text-heading text-xs font-semibold block mb-1.5">Email</label>
                        <input
                            type="email"
                            value={info?.email || ""}
                            readOnly
                            className="w-full px-4 py-2.5 bg-bg border border-accent-10 rounded-xl text-body text-sm outline-none cursor-not-allowed"
                        />
                    </div>

                    {/* Password */}
                    <div>
                        <label className="text-heading text-xs font-semibold block mb-1.5">Password</label>
                        <div className="relative">
                            <input
                                type={showPw ? "text" : "password"}
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                placeholder="Min. 6 characters"
                                className="w-full px-4 py-2.5 bg-bg border border-accent-10 rounded-xl text-heading text-sm outline-none focus:border-[var(--color-primary)] transition-all pr-10"
                            />
                            <button type="button" onClick={() => setShowPw(v => !v)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-body hover:text-heading transition-colors">
                                {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                            </button>
                        </div>
                    </div>

                    {/* Confirm Password */}
                    <div>
                        <label className="text-heading text-xs font-semibold block mb-1.5">Confirm Password</label>
                        <input
                            type="password"
                            value={confirm}
                            onChange={e => setConfirm(e.target.value)}
                            placeholder="Re-enter password"
                            className="w-full px-4 py-2.5 bg-bg border border-accent-10 rounded-xl text-heading text-sm outline-none focus:border-[var(--color-primary)] transition-all"
                        />
                    </div>

                    {error && <p className="text-[var(--color-danger)] text-xs font-medium">{error}</p>}

                    <button
                        type="submit"
                        disabled={saving}
                        className="w-full py-3 bg-[var(--color-primary)] hover:bg-[var(--color-secondary)] text-white font-bold rounded-xl transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                    >
                        {saving ? <><Loader2 size={15} className="animate-spin" /> Creating...</> : "Create Account →"}
                    </button>
                </form>
            </div>
        </div>
    );
}