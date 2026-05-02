"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import api from "@/app/lib/api";
import { Loader2, Eye, EyeOff, CheckCircle2, AlertCircle, Lock, Mail, User } from "lucide-react";

export default function DeliverySetupPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams.get("token");

    const [info, setInfo] = useState(null);   // { name, email, zones }
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [showPw, setShowPw] = useState(false);
    const [showCon, setShowCon] = useState(false);
    const [pageState, setPageState] = useState("loading"); // loading | valid | invalid | success
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    // ── Token validate করো ────────────────────────────────────────
    useEffect(() => {
        if (!token) {
            setPageState("invalid");
            return;
        }

        api.get(`/api/deliveryboys/setup/${token}`)
            .then(({ data }) => {
                setInfo(data.data);
                setPageState("valid");
            })
            .catch(() => setPageState("invalid"));
    }, [token]);

    // ── Password submit ───────────────────────────────────────────
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (password.length < 6) {
            setError("Password must be at least 6 characters");
            return;
        }
        if (password !== confirm) {
            setError("Passwords do not match");
            return;
        }

        setSaving(true);
        try {
            await api.post("/api/deliveryboys/setup", { token, password });
            setPageState("success");
        } catch (err) {
            setError(err.response?.data?.message || "Something went wrong. Try again.");
        } finally {
            setSaving(false);
        }
    };

    // ── Loading ───────────────────────────────────────────────────
    if (pageState === "loading") return (
        <div className="min-h-screen flex items-center justify-center bg-bg">
            <div className="flex flex-col items-center gap-3">
                <Loader2 size={32} className="animate-spin text-[var(--color-primary)]" />
                <p className="text-body text-sm">Validating invitation...</p>
            </div>
        </div>
    );

    // ── Invalid token ─────────────────────────────────────────────
    if (pageState === "invalid") return (
        <div className="min-h-screen flex items-center justify-center bg-bg px-4">
            <div className="bg-card border border-accent-10 rounded-3xl p-10 max-w-sm w-full text-center shadow-xl">
                <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-5">
                    <AlertCircle size={30} className="text-red-400" />
                </div>
                <h2 className="text-heading font-black text-xl mb-2">Invalid Invitation</h2>
                <p className="text-body text-sm leading-relaxed">
                    This invitation link has expired or is invalid.<br />
                    Please contact your admin to resend the invitation.
                </p>
            </div>
        </div>
    );

    // ── Success ───────────────────────────────────────────────────
    if (pageState === "success") return (
        <div className="min-h-screen flex items-center justify-center bg-bg px-4">
            <div className="bg-card border border-accent-10 rounded-3xl p-10 max-w-sm w-full text-center shadow-xl">
                <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto mb-5">
                    <CheckCircle2 size={32} className="text-emerald-400" />
                </div>
                <h2 className="text-heading font-black text-xl mb-2">Account Ready! 🎉</h2>
                <p className="text-body text-sm mb-6 leading-relaxed">
                    Your delivery partner account has been created successfully.
                    You can now login and start delivering.
                </p>
                <button
                    onClick={() => router.push("/login")}
                    className="w-full py-3 bg-[var(--color-primary)] hover:bg-[var(--color-secondary)] text-white font-bold rounded-xl transition-colors"
                >
                    Go to Login →
                </button>
            </div>
        </div>
    );

    // ── Setup form ────────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-bg flex items-center justify-center px-4">
            <div className="bg-card border border-accent-10 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">

                {/* Header */}
                <div className="bg-gradient-to-br from-slate-900 to-slate-800 px-8 py-8">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-9 h-9 bg-gradient-to-br from-[var(--color-primary)] to-rose-600 rounded-xl flex items-center justify-center font-black text-white text-lg">
                            N
                        </div>
                        <span className="text-white font-black text-lg">Nova Shop</span>
                    </div>
                    <h1 className="text-white font-black text-2xl mb-1">Welcome aboard! 🚴</h1>
                    <p className="text-slate-400 text-sm">Set up your delivery partner account</p>
                </div>

                {/* Body */}
                <div className="px-8 py-7">

                    {/* User info */}
                    <div className="flex items-center gap-3 bg-bg rounded-2xl p-4 border border-accent-10 mb-6">
                        <div className="w-11 h-11 bg-[var(--color-primary)]/15 rounded-xl flex items-center justify-center font-black text-[var(--color-primary)] text-lg uppercase">
                            {info?.name?.[0] || "D"}
                        </div>
                        <div>
                            <div className="flex items-center gap-1.5">
                                <User size={12} className="text-body" />
                                <p className="text-heading font-bold text-sm">{info?.name}</p>
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                                <Mail size={11} className="text-body" />
                                <p className="text-body text-xs">{info?.email}</p>
                            </div>
                        </div>
                        {info?.zones?.length > 0 && (
                            <div className="ml-auto flex flex-wrap gap-1 justify-end max-w-[120px]">
                                {info.zones.slice(0, 2).map(z => (
                                    <span key={z} className="text-[10px] bg-[var(--color-primary)]/10 text-[var(--color-primary)] px-2 py-0.5 rounded-full font-semibold">
                                        {z}
                                    </span>
                                ))}
                                {info.zones.length > 2 && (
                                    <span className="text-[10px] text-body">+{info.zones.length - 2}</span>
                                )}
                            </div>
                        )}
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">

                        {/* Password */}
                        <div>
                            <label className="text-heading text-xs font-bold block mb-1.5 flex items-center gap-1.5">
                                <Lock size={11} /> Create Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showPw ? "text" : "password"}
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    placeholder="Min. 6 characters"
                                    required
                                    className="w-full px-4 py-3 bg-bg border border-accent-10 rounded-xl text-heading text-sm outline-none focus:border-[var(--color-primary)] transition-all pr-11"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPw(v => !v)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-body hover:text-heading transition-colors p-1"
                                >
                                    {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                                </button>
                            </div>
                        </div>

                        {/* Confirm Password */}
                        <div>
                            <label className="text-heading text-xs font-bold block mb-1.5 flex items-center gap-1.5">
                                <Lock size={11} /> Confirm Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showCon ? "text" : "password"}
                                    value={confirm}
                                    onChange={e => setConfirm(e.target.value)}
                                    placeholder="Re-enter your password"
                                    required
                                    className={`w-full px-4 py-3 bg-bg border rounded-xl text-heading text-sm outline-none transition-all pr-11
                                        ${confirm && password !== confirm
                                            ? "border-red-400 focus:border-red-400"
                                            : confirm && password === confirm
                                                ? "border-emerald-400 focus:border-emerald-400"
                                                : "border-accent-10 focus:border-[var(--color-primary)]"
                                        }`}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowCon(v => !v)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-body hover:text-heading transition-colors p-1"
                                >
                                    {showCon ? <EyeOff size={15} /> : <Eye size={15} />}
                                </button>
                                {/* Match indicator */}
                                {confirm && (
                                    <div className="absolute right-9 top-1/2 -translate-y-1/2">
                                        {password === confirm
                                            ? <CheckCircle2 size={14} className="text-emerald-400" />
                                            : <AlertCircle size={14} className="text-red-400" />
                                        }
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Password strength indicator */}
                        {password && (
                            <div className="space-y-1">
                                <div className="flex gap-1">
                                    {[...Array(4)].map((_, i) => {
                                        const strength = Math.min(Math.floor(password.length / 3), 4);
                                        return (
                                            <div key={i}
                                                className={`h-1 flex-1 rounded-full transition-all duration-300 ${i < strength
                                                    ? strength <= 1 ? "bg-red-400"
                                                        : strength <= 2 ? "bg-yellow-400"
                                                            : strength <= 3 ? "bg-blue-400"
                                                                : "bg-emerald-400"
                                                    : "bg-accent-10"}`}
                                            />
                                        );
                                    })}
                                </div>
                                <p className="text-body text-xs">
                                    {password.length < 6 ? "Too short" :
                                        password.length < 9 ? "Weak" :
                                            password.length < 12 ? "Good" : "Strong"}
                                </p>
                            </div>
                        )}

                        {/* Error */}
                        {error && (
                            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                                <AlertCircle size={14} className="text-red-400 flex-shrink-0" />
                                <p className="text-red-400 text-xs font-medium">{error}</p>
                            </div>
                        )}

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={saving || !password || !confirm}
                            className="w-full py-3.5 bg-[var(--color-primary)] hover:bg-[var(--color-secondary)] text-white font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-[var(--color-primary)]/20 mt-2"
                        >
                            {saving
                                ? <><Loader2 size={16} className="animate-spin" /> Creating Account...</>
                                : "Create My Account →"
                            }
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}