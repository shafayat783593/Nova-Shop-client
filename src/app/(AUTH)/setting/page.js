"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Shield, Lock, LogOut, Trash2, User, Eye, EyeOff,
    CheckCircle, AlertTriangle, X, Loader2, ShieldCheck,
    ShieldOff, Camera, Bell, Mail, MessageSquare,
    ShoppingBag, Tag, Activity, Upload, Monitor, Smartphone, Tablet,
} from "lucide-react";
import api from "@/app/lib/api";
import useCloudinaryUpload from "@/utils/useCloudinaryUpload";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";


/* ═══════════════════════════════════════════════════
   TOAST
═══════════════════════════════════════════════════ */
function Toast({ toast, onClose }) {
    return (
        <AnimatePresence>
            {toast && (
                <motion.div
                    initial={{ opacity: 0, y: 40, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 20, scale: 0.95 }}
                    className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl px-5 py-4 shadow-2xl text-sm font-semibold font-sans
            ${toast.type === "success"
                            ? "bg-[var(--color-success)] text-white"
                            : "bg-[var(--color-danger)] text-white"}`}
                >
                    {toast.type === "success" ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
                    {toast.message}
                    <button onClick={onClose} className="ml-1 opacity-70 hover:opacity-100">
                        <X size={15} />
                    </button>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

/* ═══════════════════════════════════════════════════
   CONFIRM MODAL
═══════════════════════════════════════════════════ */
function ConfirmModal({ open, title, description, confirmLabel, danger, onConfirm, onCancel, children }) {
    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4"
                >
                    <motion.div
                        initial={{ scale: 0.92, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.92, opacity: 0, y: 20 }}
                        transition={{ type: "spring", stiffness: 320, damping: 28 }}
                        className="bg-card rounded-3xl p-8 w-full max-w-md shadow-2xl border border-[var(--accent-opacity)]"
                    >
                        <h3 className="text-heading font-display text-xl font-bold mb-2">{title}</h3>
                        <p className="text-body text-sm mb-6 leading-relaxed">{description}</p>
                        {children}
                        <div className="flex gap-3 mt-6">
                            <button onClick={onCancel}
                                className="flex-1 py-3 rounded-xl border border-[var(--accent-opacity)] text-body text-sm font-semibold hover:bg-[var(--accent-opacity)] transition-colors">
                                Cancel
                            </button>
                            <button onClick={onConfirm}
                                className={`flex-1 py-3 rounded-xl text-white text-sm font-bold transition-all active:scale-95
                  ${danger ? "bg-[var(--color-danger)] hover:brightness-110" : "bg-[var(--color-primary)] hover:brightness-110"}`}>
                                {confirmLabel}
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

/* ═══════════════════════════════════════════════════
   SECTION CARD
═══════════════════════════════════════════════════ */
function SectionCard({ icon: Icon, title, children, delay = 0 }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="bg-card rounded-3xl border border-[var(--accent-opacity)] overflow-hidden"
        >
            <div className="flex items-center gap-3 px-6 py-5 border-b border-[var(--accent-opacity)]">
                <span className="w-9 h-9 rounded-xl bg-[var(--accent-opacity)] flex items-center justify-center text-[var(--color-primary)] dark:text-[#e2b04a]">
                    <Icon size={18} />
                </span>
                <h2 className="font-display font-bold text-heading text-base">{title}</h2>
            </div>
            <div className="p-6">{children}</div>
        </motion.div>
    );
}

/* ═══════════════════════════════════════════════════
   FIELD
═══════════════════════════════════════════════════ */
function Field({ label, type = "text", value, onChange, placeholder, right }) {
    return (
        <div className="space-y-1.5">
            <label className="text-body text-xs font-semibold uppercase tracking-wider">{label}</label>
            <div className="relative">
                <input
                    type={type} value={value} onChange={onChange} placeholder={placeholder}
                    className="w-full bg-bg border border-[var(--accent-opacity)] rounded-xl px-4 py-3 text-heading text-sm outline-none
                               focus:border-[var(--color-secondary)] focus:ring-2 focus:ring-[var(--color-secondary)]/20
                               transition-all placeholder:text-body/40 pr-10"
                />
                {right && <span className="absolute right-3 top-1/2 -translate-y-1/2">{right}</span>}
            </div>
        </div>
    );
}

function PasswordField({ label, value, onChange, placeholder }) {
    const [show, setShow] = useState(false);
    return (
        <Field
            label={label}
            type={show ? "text" : "password"}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            right={
                <button type="button" onClick={() => setShow(s => !s)}
                    className="text-body hover:text-heading transition-colors">
                    {show ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
            }
        />
    );
}

const Divider = () => <div className="border-t border-[var(--accent-opacity)] my-3" />;

/* ═══════════════════════════════════════════════════
   DEVICE ICON helper
═══════════════════════════════════════════════════ */
function DeviceIcon({ deviceType }) {
    if (deviceType === "Mobile") return <Smartphone size={14} />;
    if (deviceType === "Tablet") return <Tablet size={14} />;
    return <Monitor size={14} />;
}

/* ═══════════════════════════════════════════════════
   AVATAR UPLOAD
═══════════════════════════════════════════════════ */
function AvatarUpload({ currentAvatar, initials, onUploaded }) {
    const fileRef = useRef(null);
    const [preview, setPreview] = useState(currentAvatar || null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const { uploadSingle, cancelUpload, uploading, error } = useCloudinaryUpload();

    async function handleFileChange(e) {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => setPreview(reader.result);
        reader.readAsDataURL(file);
        try {
            setUploadProgress(0);
            const result = await uploadSingle(file, {
                folder: "profiles",
                onProgress: (pct) => setUploadProgress(pct),
            });
            onUploaded(result.url);
        } catch {
            setPreview(currentAvatar || null);
        }
    }

    return (
        <div className="flex flex-col items-center gap-4">
            <div className="relative">
                <motion.div
                    whileHover={{ scale: 1.03 }}
                    onClick={() => !uploading && fileRef.current?.click()}
                    className="w-28 h-28 rounded-3xl overflow-hidden bg-[var(--color-primary)]/15
                               border-2 border-[var(--color-secondary)]/40 flex items-center justify-center
                               cursor-pointer shadow-lg select-none"
                >
                    {preview
                        ? <img src={preview} alt="avatar" className="w-full h-full object-cover" />
                        : <span className="font-display  text-3xl text-[var(--color-primary)] dark:text-[#e2b04a]">
                            {initials}
                        </span>
                    }
                    <AnimatePresence>
                        {uploading && (
                            <motion.div
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                className="absolute inset-0 bg-black/55 flex flex-col items-center justify-center gap-1"
                            >
                                <Loader2 size={20} className="text-white animate-spin" />
                                <span className="text-white text-xs font-bold">{uploadProgress}%</span>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
                <motion.button
                    whileTap={{ scale: 0.85 }}
                    onClick={() => !uploading && fileRef.current?.click()}
                    disabled={uploading}
                    className="absolute -bottom-1.5 -right-1.5 w-9 h-9 rounded-2xl bg-[var(--color-secondary)]
                               text-white flex items-center justify-center shadow-lg
                               hover:brightness-110 transition-all disabled:opacity-50"
                >
                    {uploading ? <Loader2 size={14} className="animate-spin" /> : <Camera size={15} />}
                </motion.button>
                <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/jpg"
                    className="hidden" onChange={handleFileChange} />
            </div>

            <AnimatePresence>
                {uploading && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }} className="w-full"
                    >
                        <div className="w-full h-1.5 bg-[var(--accent-opacity)] rounded-full overflow-hidden">
                            <motion.div className="h-full bg-[var(--color-secondary)] rounded-full"
                                animate={{ width: `${uploadProgress}%` }} transition={{ ease: "linear" }} />
                        </div>
                        <div className="flex items-center justify-between mt-1">
                            <p className="text-body text-xs">Uploading… {uploadProgress}%</p>
                            <button onClick={cancelUpload} className="text-[var(--color-danger)] text-xs font-semibold hover:underline">Cancel</button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {error && (
                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="text-[var(--color-danger)] text-xs text-center font-semibold">
                        {error.message}
                    </motion.p>
                )}
            </AnimatePresence>

            {!uploading && <p className="text-body text-xs text-center">JPG, PNG or WebP · max 4 MB</p>}
        </div>
    );
}

/* ═══════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════ */
export default function SettingsPage() {
    const {
        user: authUser,
        setUser: setAuthUser,
        // Sessions — সব AuthContext থেকে
        sessions,
        sessionsLoading,
        revokingId,
        fetchSessions,
        revokeSession,
        logOutAllDevices,
        loading
    } = useAuth();
    // sessions fetch করো mount এ
    useEffect(() => {
        fetchSessions();
    }, [fetchSessions]);
    const [profileName, setProfileName] = useState(authUser?.name || "");
    const [avatarUrl, setAvatarUrl] = useState(authUser?.avatar || null);
    const [profileLoading, setProfileLoading] = useState(false);

    const [curPw, setCurPw] = useState("");
    const [newPw, setNewPw] = useState("");
    const [confPw, setConfPw] = useState("");
    const [pwLoading, setPwLoading] = useState(false);

    const [twoFa, setTwoFa] = useState(authUser?.twoFactorEnabled || false);
    const [twoFaLoading, setTwoFaLoading] = useState(false);
    const [notifs, setNotifs] = useState({
        emailNotifications: true,
        smsNotifications: false,
        orderUpdates: true,
        promotionalNotifications: false,
    });
    const [notifsLoading, setNotifsLoading] = useState({});


    const [logoutModal, setLogoutModal] = useState(false);
    const [logoutLoading, setLogoutLoading] = useState(false);
    const [deleteModal, setDeleteModal] = useState(false);
    const [deletePw, setDeletePw] = useState("");
    const [deleteLoading, setDeleteLoading] = useState(false);
    const router = useRouter();

   useEffect(() => {
    if (!loading && !authUser) {
        router.push(`/login?redirect=/setting`);
    }
}, [authUser, loading, router]);


    const [toast, setToast] = useState(null);
    const showToast = (message, type = "success") => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 4000);
    };


    // ── Save profile ───────────────────────────────────
    async function handleProfileSave() {
        if (!profileName.trim()) return showToast("Name cannot be empty", "error");
        setProfileLoading(true);
        try {
            const { data } = await api.put("/api/settings/profile", {
                name: profileName.trim(),
                avatar: avatarUrl,
            });
            setAuthUser(data.user);
            showToast("Profile updated successfully");
        } catch (e) {
            showToast(e?.response?.data?.message || "Failed to update profile", "error");
        } finally {
            setProfileLoading(false);
        }
    }

    // ── Change password ────────────────────────────────
    async function handlePasswordChange() {
        if (!curPw || !newPw || !confPw) return showToast("All fields are required", "error");
        if (newPw !== confPw) return showToast("Passwords do not match", "error");
        if (newPw.length < 6) return showToast("Password must be at least 6 characters", "error");
        setPwLoading(true);
        try {
            await api.put("/api/settings/password", { currentPassword: curPw, newPassword: newPw });
            setCurPw(""); setNewPw(""); setConfPw("");
            showToast("Password changed successfully");
        } catch (e) {
            showToast(e?.response?.data?.message || "Failed to change password", "error");
        } finally {
            setPwLoading(false);
        }
    }

    // ── Toggle 2FA ─────────────────────────────────────
    async function handleToggle2FA() {
        setTwoFaLoading(true);
        try {
            const { data } = await api.put("/api/settings/2fa");
            setTwoFa(data.twoFactorEnabled);
            showToast(data.message);
        } catch (e) {
            showToast(e?.response?.data?.message || "Failed to toggle 2FA", "error");
        } finally {
            setTwoFaLoading(false);
        }
    }

    // ── Toggle notification ────────────────────────────
    async function handleToggleNotif(key) {
        setNotifsLoading(l => ({ ...l, [key]: true }));
        const next = !notifs[key];
        try {
            await api.put("/api/settings/notifications", { [key]: next });
            setNotifs(n => ({ ...n, [key]: next }));
        } catch (e) {
            showToast(e?.response?.data?.message || "Failed to update notification", "error");
        } finally {
            setNotifsLoading(l => ({ ...l, [key]: false }));
        }
    }

    // ✅ Revoke ONE session
    async function handleRevokeSession(sessionId) {
        const result = await revokeSession(sessionId);
        if (!result.success) showToast(result.message, "error");
        else showToast("Device logged out");
    }

    // ✅ FIXED: was api.post — now api.delete
    async function handleLogoutAll() {
        setLogoutLoading(true);
        const result = await logOutAllDevices();
        setLogoutLoading(false);
        if (!result.success) {
            showToast(result.message, "error");
        }
        // success হলে AuthContext নিজেই /login এ redirect করবে
    }


    // ── Delete account ─────────────────────────────────
    async function handleDeleteAccount() {
        if (!deletePw) return showToast("Password is required", "error");
        setDeleteLoading(true);
        try {
            await api.delete("/api/settings/account", { data: { password: deletePw } });
            setDeleteModal(false);
            showToast("Account deleted. Goodbye!");
            setTimeout(() => { window.location.href = "/"; }, 1500);
        } catch (e) {
            showToast(e?.response?.data?.message || "Failed to delete account", "error");
        } finally {
            setDeleteLoading(false);
        }
    }

    // ── Helpers ────────────────────────────────────────
    const pwStrength = newPw.length === 0 ? 0 : newPw.length < 4 ? 1 : newPw.length < 8 ? 2 : newPw.length < 12 ? 3 : 4;
    const pwLabels = ["", "Weak", "Fair", "Good", "Strong"];
    const pwColors = ["", "bg-[var(--color-danger)]", "bg-yellow-400", "bg-[var(--color-accent)]", "bg-[var(--color-success)]"];

    const initials = (authUser?.name || profileName || "U")
        .split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);

    function formatLastActive(isoString) {
        if (!isoString) return "Unknown";
        const diff = Date.now() - new Date(isoString).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return "Just now";
        if (mins < 60) return `${mins}m ago`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs}h ago`;
        return `${Math.floor(hrs / 24)}d ago`;
    }

    /* ── render ─────────────────────────────────────── */
    return (
        <div className="min-h-screen bg-bg font-sans">

            <motion.header
                initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}
                className="sticky top-0 z-30 bg-bg/80 backdrop-blur-md border-b border-[var(--accent-opacity)] px-6 py-4"
            >
                <div className="max-w-7xl mx-auto flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-[var(--color-primary)] flex items-center justify-center">
                        <Shield size={16} className="text-white" />
                    </div>
                    <div>
                        <h1 className="font-display font-bold text-heading text-lg leading-none">Account Settings</h1>
                        <p className="text-body text-xs mt-0.5">Manage your profile, security &amp; preferences</p>
                    </div>
                </div>
            </motion.header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

                    {/* ══════════ LEFT — Profile ══════════ */}
                    <div className="space-y-5">
                        <SectionCard icon={User} title="Profile" delay={0.05}>
                            <div className="space-y-5">
                                <AvatarUpload
                                    currentAvatar={avatarUrl}
                                    initials={initials}
                                    onUploaded={(url) => setAvatarUrl(url)}
                                />
                                <div className="text-center -mt-1 space-y-1">
                                    <p className="text-heading font-display font-bold text-base">{authUser?.name}</p>
                                    <p className="text-body text-xs">{authUser?.email}</p>
                                    <span className="inline-block px-3 py-1 rounded-full bg-[var(--accent-opacity)] text-[var(--color-secondary)] dark:text-[#e2b04a] text-xs font-bold capitalize">
                                        {authUser?.role || "customer"}
                                    </span>
                                </div>
                                <Field label="Display Name" value={profileName}
                                    onChange={e => setProfileName(e.target.value)} placeholder="Your name" />
                                <motion.button whileTap={{ scale: 0.97 }} onClick={handleProfileSave}
                                    disabled={profileLoading}
                                    className="w-full py-3 rounded-xl bg-[var(--color-primary)] text-white text-sm font-bold
                                               hover:brightness-110 transition-all flex items-center justify-center gap-2 disabled:opacity-60">
                                    {profileLoading ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
                                    Save Profile
                                </motion.button>
                            </div>
                        </SectionCard>

                        <motion.div
                            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.12, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                            className="bg-card rounded-3xl border border-[var(--accent-opacity)] p-6"
                        >
                            <h3 className="font-display font-bold text-heading text-sm mb-4">Account Overview</h3>
                            <div className="space-y-0">
                                {[
                                    {
                                        label: "Member since",
                                        value: authUser?.createdAt
                                            ? new Date(authUser.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })
                                            : "—",
                                    },
                                    { label: "2FA Status", value: twoFa ? "✓ Enabled" : "Disabled", highlight: twoFa },
                                    { label: "Account type", value: authUser?.role || "customer" },
                                    { label: "Active devices", value: `${sessions.length} / 2` },
                                ].map(({ label, value, highlight }) => (
                                    <div key={label}
                                        className="flex items-center justify-between text-sm py-3 border-b border-[var(--accent-opacity)] last:border-0">
                                        <span className="text-body">{label}</span>
                                        <span className={`font-semibold capitalize ${highlight ? "text-[var(--color-success)]" : "text-heading"}`}>
                                            {value}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    </div>

                    {/* ══════════ RIGHT 2/3 ══════════ */}
                    <div className="lg:col-span-2 space-y-5">

                        <SectionCard icon={Shield} title="Security Settings" delay={0.1}>
                            <div className="space-y-1">

                                {/* 2FA */}
                                <div className="flex items-center justify-between gap-4 py-2">
                                    <div className="flex items-start gap-3">
                                        <span className="mt-0.5 w-8 h-8 rounded-xl bg-[var(--accent-opacity)] flex items-center justify-center text-[var(--color-secondary)] dark:text-[#e2b04a] shrink-0">
                                            <ShieldCheck size={15} />
                                        </span>
                                        <div>
                                            <p className="text-heading text-sm font-bold">Two-Factor Authentication (2FA)</p>
                                            <p className="text-body text-xs mt-0.5">Require a one-time code on every login.</p>
                                        </div>
                                    </div>
                                    <button onClick={handleToggle2FA} disabled={twoFaLoading}
                                        className={`relative w-12 h-6 rounded-full transition-all duration-300 shrink-0
                            ${twoFa ? "bg-[var(--color-secondary)]" : "bg-[var(--accent-opacity)]"}
                            ${twoFaLoading ? "opacity-50 cursor-wait" : "cursor-pointer"}`}
                                    >
                                        <motion.span layout
                                            className="absolute top-1 w-4 h-4 rounded-full bg-white shadow"
                                            animate={{ left: twoFa ? "calc(100% - 20px)" : "4px" }}
                                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                        />
                                    </button>
                                </div>

                                <AnimatePresence mode="wait">
                                    <motion.div key={twoFa ? "on" : "off"}
                                        initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }}
                                        className={`inline-flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-xl mb-1
                            ${twoFa ? "bg-[var(--color-success)]/15 text-[var(--color-success)]" : "bg-[var(--color-danger)]/10 text-[var(--color-danger)]"}`}
                                    >
                                        {twoFa ? <><ShieldCheck size={13} /> Account is protected</> : <><ShieldOff size={13} /> Account is vulnerable</>}
                                    </motion.div>
                                </AnimatePresence>

                                <Divider />

                                {/* Change Password */}
                                <div className="pt-1 space-y-4">
                                    <div className="flex items-center gap-2">
                                        <Lock size={15} className="text-[var(--color-secondary)]" />
                                        <span className="text-heading text-sm font-bold">Change Password</span>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                        <PasswordField label="Current" value={curPw} onChange={e => setCurPw(e.target.value)} placeholder="••••••••" />
                                        <PasswordField label="New Password" value={newPw} onChange={e => setNewPw(e.target.value)} placeholder="Min. 6 chars" />
                                        <PasswordField label="Confirm New" value={confPw} onChange={e => setConfPw(e.target.value)} placeholder="Repeat" />
                                    </div>
                                    <AnimatePresence>
                                        {newPw.length > 0 && (
                                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="space-y-1">
                                                <div className="flex gap-1">
                                                    {[1, 2, 3, 4].map(i => (
                                                        <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors duration-300
                                                ${pwStrength >= i ? pwColors[pwStrength] : "bg-[var(--accent-opacity)]"}`} />
                                                    ))}
                                                </div>
                                                <p className="text-body text-xs">{pwLabels[pwStrength]} password</p>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                    <motion.button whileTap={{ scale: 0.97 }} onClick={handlePasswordChange} disabled={pwLoading}
                                        className="px-6 py-2.5 rounded-xl bg-[var(--color-secondary)] text-white text-sm font-bold
                                                   hover:brightness-110 transition-all flex items-center gap-2 disabled:opacity-60">
                                        {pwLoading && <Loader2 size={14} className="animate-spin" />}
                                        Update Password
                                    </motion.button>
                                </div>

                                <Divider />

                                {/* ✅ Login Activity — Real API data */}
                                <div className="pt-1 space-y-3">
                                    <div className="flex items-center gap-2">
                                        <Activity size={15} className="text-[var(--color-secondary)]" />
                                        <span className="text-heading text-sm font-bold">Login Activity</span>
                                    </div>

                                    {sessionsLoading ? (
                                        <div className="flex items-center gap-2 text-body text-xs py-2">
                                            <Loader2 size={14} className="animate-spin" /> Loading devices…
                                        </div>
                                    ) : sessions.length === 0 ? (
                                        <p className="text-body text-xs py-2">No active sessions found.</p>
                                    ) : (
                                        <div className="space-y-2">
                                            {sessions.map((s, i) => (
                                                <motion.div key={s.sessionId}
                                                    initial={{ opacity: 0, x: -10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    exit={{ opacity: 0, x: 10 }}
                                                    transition={{ delay: 0.05 * i }}
                                                    className="flex items-center justify-between bg-bg rounded-xl px-4 py-3 border border-[var(--accent-opacity)]"
                                                >
                                                    <div className="flex items-start gap-3">
                                                        <span className="mt-0.5 w-7 h-7 rounded-lg bg-[var(--accent-opacity)] flex items-center justify-center text-[var(--color-secondary)] shrink-0">
                                                            <DeviceIcon deviceType={s.deviceType} />
                                                        </span>
                                                        <div>
                                                            <p className="text-heading text-xs font-semibold">
                                                                {s.browser} · {s.os}
                                                                {s.isCurrent && (
                                                                    <span className="ml-2 text-[10px] bg-[var(--color-success)]/15 text-[var(--color-success)] px-2 py-0.5 rounded-full font-semibold">
                                                                        Current
                                                                    </span>
                                                                )}
                                                            </p>
                                                            <p className="text-body text-xs mt-0.5">
                                                                {s.ip} · {formatLastActive(s.lastActivity)}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    {!s.isCurrent && (
                                                        <button
                                                            onClick={() => handleRevokeSession(s.sessionId)}
                                                            disabled={revokingId === s.sessionId}
                                                            className="text-xs text-[var(--color-danger)] hover:underline font-semibold disabled:opacity-50 flex items-center gap-1"
                                                        >
                                                            {revokingId === s.sessionId
                                                                ? <Loader2 size={12} className="animate-spin" />
                                                                : "Revoke"}
                                                        </button>
                                                    )}
                                                </motion.div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <Divider />

                                {/* Logout all */}
                                <div className="pt-1 flex items-center justify-between gap-4">
                                    <div className="flex items-start gap-3">
                                        <span className="mt-0.5 w-8 h-8 rounded-xl bg-[var(--accent-opacity)] flex items-center justify-center text-[var(--color-secondary)] dark:text-[#e2b04a] shrink-0">
                                            <LogOut size={15} />
                                        </span>
                                        <div>
                                            <p className="text-heading text-sm font-bold">Logout From All Devices</p>
                                            <p className="text-body text-xs mt-0.5">Terminate all sessions immediately.</p>
                                        </div>
                                    </div>
                                    <button onClick={() => setLogoutModal(true)}
                                        className="shrink-0 px-4 py-2 rounded-xl border border-[var(--color-danger)]/40 text-[var(--color-danger)] text-xs font-bold hover:bg-[var(--color-danger)]/10 transition-all active:scale-95">
                                        Log Out All
                                    </button>
                                </div>
                            </div>
                        </SectionCard>

                        {/* Notifications */}
                        <SectionCard icon={Bell} title="Notification Settings" delay={0.15}>
                            <div className="divide-y divide-[var(--accent-opacity)]">
                                {[
                                    { key: "emailNotifications", icon: Mail, label: "Email Notifications", description: "Receive updates and alerts via email." },
                                    { key: "smsNotifications", icon: MessageSquare, label: "SMS Notifications", description: "Get text messages for important account events." },
                                    { key: "orderUpdates", icon: ShoppingBag, label: "Order Updates", description: "Confirmation, shipping, and delivery tracking." },
                                    { key: "promotionalNotifications", icon: Tag, label: "Promotional Notifications", description: "Deals, discounts and personalised offers." },
                                ].map(({ key, icon: Icon, label, description }, i) => (
                                    <motion.div key={key}
                                        initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.2 + i * 0.06 }}
                                        className="flex items-center justify-between gap-4 py-4"
                                    >
                                        <div className="flex items-start gap-3">
                                            <span className="mt-0.5 w-8 h-8 rounded-xl bg-[var(--accent-opacity)] flex items-center justify-center text-[var(--color-secondary)] dark:text-[#e2b04a] shrink-0">
                                                <Icon size={14} />
                                            </span>
                                            <div>
                                                <p className="text-heading text-sm font-semibold">{label}</p>
                                                <p className="text-body text-xs mt-0.5">{description}</p>
                                            </div>
                                        </div>
                                        <button onClick={() => handleToggleNotif(key)} disabled={!!notifsLoading[key]}
                                            className={`relative w-12 h-6 rounded-full transition-all duration-300 shrink-0
                                ${notifs[key] ? "bg-[var(--color-secondary)]" : "bg-[var(--accent-opacity)]"}
                                ${notifsLoading[key] ? "opacity-50 cursor-wait" : "cursor-pointer"}`}
                                        >
                                            <motion.span layout className="absolute top-1 w-4 h-4 rounded-full bg-white shadow"
                                                animate={{ left: notifs[key] ? "calc(100% - 20px)" : "4px" }}
                                                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                            />
                                        </button>
                                    </motion.div>
                                ))}
                            </div>
                        </SectionCard>

                        {/* Danger Zone */}
                        <SectionCard icon={AlertTriangle} title="Danger Zone" delay={0.2}>
                            <div className="flex items-start gap-4 p-4 rounded-2xl bg-[var(--color-danger)]/5 border border-[var(--color-danger)]/20">
                                <Trash2 size={18} className="text-[var(--color-danger)] mt-0.5 shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-heading text-sm font-bold">Delete Account</p>
                                    <p className="text-body text-xs mt-1 leading-relaxed">
                                        Permanently remove your account and all associated data. This cannot be undone.
                                    </p>
                                </div>
                                <button onClick={() => setDeleteModal(true)}
                                    className="shrink-0 px-4 py-2 rounded-xl bg-[var(--color-danger)] text-white text-xs font-bold hover:brightness-110 transition-all active:scale-95">
                                    Delete
                                </button>
                            </div>
                        </SectionCard>
                    </div>
                </div>
            </main>

            {/* Modals */}
            <ConfirmModal
                open={logoutModal}
                title="Log out all devices?"
                description="All active sessions will be terminated immediately."
                confirmLabel={logoutLoading ? "Logging out…" : "Yes, log out all"}
                onConfirm={handleLogoutAll}
                onCancel={() => setLogoutModal(false)}
            />

            <ConfirmModal
                open={deleteModal}
                title="Delete your account?"
                description="Permanent and irreversible. All your data will be erased forever."
                confirmLabel={deleteLoading ? "Deleting…" : "Yes, delete my account"}
                danger
                onConfirm={handleDeleteAccount}
                onCancel={() => { setDeleteModal(false); setDeletePw(""); }}
            >
                <PasswordField
                    label="Confirm with your password"
                    value={deletePw}
                    onChange={e => setDeletePw(e.target.value)}
                    placeholder="Enter your password"
                />
            </ConfirmModal>

            <Toast toast={toast} onClose={() => setToast(null)} />
        </div>
    );
}