'use client';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import api from '@/app/lib/api';
import { Mail, ArrowLeft, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

export default function ForgotPasswordPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm({ mode: 'onTouched' });

    const onSubmit = async (data) => {
        setError('');
        setSuccessMessage('');
        setLoading(true);
        try {
            const res = await api.post('/api/auth/forgot-password', { email: data.email });
            setSuccessMessage(res.data.message);
            setTimeout(() => {
                router.push(`/reset-password?email=${encodeURIComponent(data.email)}`);
            }, 2000);
        } catch (err) {
            setError(err?.response?.data?.message || 'Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            className="flex items-center justify-center min-h-screen w-full p-4"
            style={{ background: 'var(--bg)', fontFamily: 'var(--font-sans)' }}
        >
            {/* Main Card Container */}
            <main
                className="w-full max-w-[450px] rounded-[30px] shadow-2xl flex flex-col items-center p-8 md:p-12 overflow-hidden"
                style={{ background: 'var(--card-bg)', border: '1px solid rgba(0,0,0,0.05)' }}
            >
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="w-full flex flex-col items-center"
                >
                    {/* Back link */}
                    <div className="w-full mb-6">
                        <Link
                            href="/login"
                            className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest transition-colors"
                            style={{ color: 'var(--text-muted)' }}
                        >
                            <ArrowLeft size={13} /> Back to Login
                        </Link>
                    </div>

                    {/* Title & Icon */}
                    <div className="mb-8 text-center">
                        <div
                            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                            style={{
                                background: 'var(--accent-opacity)',
                                border: '1.5px solid rgba(149,213,178,0.4)',
                            }}
                        >
                            <Mail size={26} color="var(--color-primary)" />
                        </div>
                        <h1
                            className="text-2xl md:text-3xl font-black uppercase leading-none"
                            style={{ color: 'var(--text-main)', fontFamily: 'var(--font-display)' }}
                        >
                            Recover Password
                        </h1>
                        <p className="text-[12px] font-medium mt-3 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                            Enter your email and we'll send you a 6-digit verification code.
                        </p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit(onSubmit)} className="w-full space-y-5" noValidate>
                        <div className="space-y-1">
                            <label
                                className="text-[11px] font-bold px-1 uppercase tracking-widest"
                                style={{ color: 'var(--text-muted)' }}
                            >
                                Email Address
                            </label>
                            <div className="relative group">
                                <div
                                    className="absolute left-4 top-1/2 -translate-y-1/2"
                                    style={{ color: 'var(--text-muted)' }}
                                >
                                    <Mail size={17} />
                                </div>
                                <input
                                    {...register('email', {
                                        required: 'Email is required',
                                        pattern: {
                                            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                            message: 'Invalid email address',
                                        },
                                    })}
                                    type="email"
                                    placeholder="name@company.com"
                                    className="w-full pl-11 pr-4 py-4 rounded-2xl text-sm font-semibold outline-none transition-all duration-300"
                                    style={{
                                        background: 'var(--bg)',
                                        border: `1.5px solid ${errors.email ? 'var(--color-danger)' : 'var(--accent-opacity)'}`,
                                        color: 'var(--text-main)',
                                    }}
                                />
                            </div>
                            <AnimatePresence>
                                {errors.email && (
                                    <motion.p
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="text-[10px] font-bold mt-1 ml-1 flex items-center gap-1 text-red-500"
                                    >
                                        <AlertCircle size={11} /> {errors.email.message}
                                    </motion.p>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full text-white font-black py-4 rounded-2xl text-[14px] flex items-center justify-center gap-2 active:scale-95 transition-all uppercase tracking-widest"
                            style={{
                                background: loading
                                    ? 'var(--color-secondary)'
                                    : 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%)',
                                boxShadow: '0 6px 20px rgba(45,106,79,0.25)',
                            }}
                        >
                            {loading ? (
                                <span className="animate-pulse">Sending...</span>
                            ) : (
                                <>
                                    <span>Send Code</span>
                                    <ArrowRight size={17} />
                                </>
                            )}
                        </button>

                        {/* Success/Error Feedback */}
                        <AnimatePresence mode="wait">
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="p-3 rounded-xl flex items-center gap-2 text-[11px] font-bold bg-red-50 text-red-600 border border-red-100"
                                >
                                    <AlertCircle size={13} /> {error}
                                </motion.div>
                            )}
                            {successMessage && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="p-3 rounded-xl flex items-center gap-2 text-[11px] font-bold bg-green-50 text-green-600 border border-green-100"
                                >
                                    <CheckCircle2 size={13} /> {successMessage}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </form>
                </motion.div>

                {/* Footer */}
                <div className="mt-8 text-center opacity-50">
                    <p className="text-[10px] font-bold uppercase tracking-widest">
                        Powered by Your App
                    </p>
                </div>
            </main>
        </div>
    );
}