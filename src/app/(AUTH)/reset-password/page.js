'use client';
import React, { useState, useEffect, Suspense, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '@/app/lib/api';
import {
    Lock, ShieldCheck, ArrowLeft, ArrowRight,
    AlertCircle, CheckCircle2, Eye, EyeOff,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

function ResetPasswordContent() {
    const [showPass, setShowPass] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [otp, setOtp] = useState(new Array(6).fill(''));
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const inputRefs = useRef([]);

    const router = useRouter();
    const searchParams = useSearchParams();
    const email = searchParams.get('email') || '';

    const {
        register,
        handleSubmit,
        watch,
        setValue,
        trigger,
        formState: { errors },
    } = useForm({
        mode: 'onTouched',
        defaultValues: { email, otp: '', newPassword: '', confirmPassword: '' },
    });

    const newPassword = watch('newPassword');

    // Redirect if no email is found in URL
    useEffect(() => {
        if (!email) {
            router.replace('/forgot-password');
        } else {
            // Focus first OTP field on load
            inputRefs.current[0]?.focus();
        }
    }, [email, router]);

    // ── OTP Handlers ─────────────────────────────────────────
    const handleOtpChange = (value, index) => {
        if (isNaN(value)) return;

        const newOtp = [...otp];
        newOtp[index] = value.slice(-1);
        setOtp(newOtp);

        const combinedOtp = newOtp.join('');
        setValue('otp', combinedOtp, { shouldValidate: true });

        // Auto-focus next input
        if (value !== '' && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (e, index) => {
        if (e.key === 'Backspace') {
            if (!otp[index] && index > 0) {
                const newOtp = [...otp];
                newOtp[index - 1] = '';
                setOtp(newOtp);
                setValue('otp', newOtp.join(''));
                inputRefs.current[index - 1]?.focus();
            }
        }
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        if (!pasted) return;

        const newOtp = pasted.split('').concat(new Array(6).fill('')).slice(0, 6);
        setOtp(newOtp);
        setValue('otp', newOtp.join(''), { shouldValidate: true });

        // Focus the last filled input or the first empty one
        const nextFocus = Math.min(pasted.length, 5);
        inputRefs.current[nextFocus]?.focus();
    };

    // ── Form Submission ──────────────────────────────────────
    const onSubmit = async (data) => {
        if (data.otp.length < 6) {
            setError('Please enter the full 6-digit code.');
            return;
        }

        setError('');
        setSuccessMessage('');
        setLoading(true);

        try {
            const res = await api.post('/api/auth/reset-password', {
                email: data.email,
                otp: data.otp,
                newPassword: data.newPassword,
            });

            setSuccessMessage(res.data.message || 'Password updated successfully!');
            setTimeout(() => router.push('/login'), 2500);
        } catch (err) {
            setError(err?.response?.data?.message || 'Invalid code or session expired.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col md:flex-row h-screen w-full overflow-hidden bg-white">
            {/* ── Left Decorative Panel ── */}
            <section className="hidden md:flex w-full md:w-[40%] lg:w-[60%] relative overflow-hidden items-center justify-center">
                <div
                    className="absolute inset-0 z-0"
                    style={{ background: 'linear-gradient(135deg, #1b4332 0%, #2d6a4f 100%)' }}
                />
                <div className="relative z-10 p-12 text-center text-white">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5 }}
                    >
                        <div className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-3xl flex items-center justify-center mx-auto mb-6 border border-white/20">
                            <ShieldCheck size={40} className="text-emerald-400" />
                        </div>
                        <h2 className="text-4xl font-black uppercase tracking-tight mb-4">Secure Reset</h2>
                        <p className="opacity-70 max-w-xs mx-auto text-sm leading-relaxed">
                            Protecting your data is our priority. Enter your OTP and choose a strong new password.
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* ── Right Form Panel ── */}
            <main className="flex-1 h-full flex flex-col items-center justify-center p-6 md:p-12 overflow-y-auto bg-slate-50">
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="w-full max-w-[400px]"
                >
                    <Link
                        href="/Forgot-password"
                        className="inline-flex items-center gap-2 text-[11px] font-bold text-slate-400 uppercase tracking-widest hover:text-emerald-600 transition-colors mb-8"
                    >
                        <ArrowLeft size={14} /> Back to entry
                    </Link>

                    <header className="mb-10 text-center md:text-left">
                        <h1 className="text-3xl font-black text-slate-800 uppercase tracking-tight">New Password</h1>
                        <p className="text-xs font-bold text-slate-500 mt-2 uppercase">Resetting for: <span className="text-emerald-600 lowercase">{email}</span></p>
                    </header>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        {/* OTP Input Section */}
                        <div className="space-y-3">
                            <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest block px-1">Verification Code</label>
                            <div className="flex justify-between gap-2" onPaste={handlePaste}>
                                {otp.map((digit, index) => (
                                    <input
                                        key={index}
                                        type="text"
                                        inputMode="numeric"
                                        ref={(el) => (inputRefs.current[index] = el)}
                                        value={digit}
                                        onChange={(e) => handleOtpChange(e.target.value, index)}
                                        onKeyDown={(e) => handleKeyDown(e, index)}
                                        className={`w-full h-14 text-center text-xl font-bold rounded-xl border-2 transition-all outline-none 
                                            ${digit ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-white'}`}
                                    />
                                ))}
                            </div>
                            <input type="hidden" {...register('otp', { required: true, minLength: 6 })} />
                        </div>

                        {/* Password Fields */}
                        <div className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest block px-1">New Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input
                                        {...register('newPassword', {
                                            required: 'Required',
                                            minLength: { value: 8, message: 'Too short (min 8)' }
                                        })}
                                        type={showPass ? 'text' : 'password'}
                                        placeholder="••••••••"
                                        className="w-full pl-12 pr-12 py-4 bg-white border-2 border-slate-100 rounded-2xl outline-none focus:border-emerald-500 transition-all text-sm font-semibold"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPass(!showPass)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                    >
                                        {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                                {errors.newPassword && <p className="text-[10px] text-red-500 font-bold mt-1 px-1">{errors.newPassword.message}</p>}
                            </div>

                            <div className="space-y-1">
                                <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest block px-1">Confirm Password</label>
                                <div className="relative">
                                    <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input
                                        {...register('confirmPassword', {
                                            required: 'Please confirm',
                                            validate: v => v === newPassword || "Passwords don't match"
                                        })}
                                        type={showConfirm ? 'text' : 'password'}
                                        placeholder="••••••••"
                                        className="w-full pl-12 pr-12 py-4 bg-white border-2 border-slate-100 rounded-2xl outline-none focus:border-emerald-500 transition-all text-sm font-semibold"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirm(!showConfirm)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                    >
                                        {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                                {errors.confirmPassword && <p className="text-[10px] text-red-500 font-bold mt-1 px-1">{errors.confirmPassword.message}</p>}
                            </div>
                        </div>

                        {/* Notifications */}
                        <AnimatePresence mode="wait">
                            {error && (
                                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl flex items-center gap-3 text-xs font-bold uppercase">
                                    <AlertCircle size={16} /> {error}
                                </motion.div>
                            )}
                            {successMessage && (
                                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-xl flex items-center gap-3 text-xs font-bold uppercase">
                                    <CheckCircle2 size={16} /> {successMessage}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full h-14 bg-gradient-to-r from-emerald-700 to-emerald-500 text-white rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 shadow-lg shadow-emerald-900/20 active:scale-[0.98] transition-all disabled:opacity-50"
                        >
                            {loading ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <>Update Password <ArrowRight size={18} /></>}
                        </button>
                    </form>
                </motion.div>
            </main>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={<div className="h-screen w-full flex items-center justify-center bg-slate-50"><span className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" /></div>}>
            <ResetPasswordContent />
        </Suspense>
    );
}