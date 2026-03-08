"use client";

import { useEffect, useState, useRef, use } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import api from "@/app/lib/api";

const VerifyPage = ({ params }) => {
    // Unwrap the dynamic 'id' parameter from the URL path
    const { id } = use(params);
    const router = useRouter();
    const hasFetched = useRef(false);

    const [status, setStatus] = useState("verifying");
    const [message, setMessage] = useState("We are verifying your email address...");

    useEffect(() => {
        const verifyEmail = async () => {
            if (!id) {
                setStatus("error");
                setMessage("Missing verification token.");
                return;
            }

            if (hasFetched.current) return;
            hasFetched.current = true;

            try {
                // Using the 'id' (token) from the URL path
                const res = await api.post(`/api/auth/verify/${id}`);

                if (res.status === 200 || res.status === 201) {
                    setStatus("success");
                    setMessage("Email verified successfully! You can now access your account.");
                    setTimeout(() => router.push("/login"), 3000);
                }
            } catch (error) {
                setStatus("error");
                setMessage(error.response?.data?.message || "Verification link expired or invalid.");
            }
        };

        verifyEmail();
    }, [id, router]);

    return (
        <main className="min-h-screen flex items-center justify-center bg-bg p-4 font-sans">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-md w-full bg-card p-8 rounded-2xl shadow-xl border border-accent-10 text-center"
            >
                <AnimatePresence mode="wait">
                    {status === "verifying" && (
                        <motion.div
                            key="verifying"
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="flex flex-col items-center"
                        >
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                                className="w-12 h-12 border-4 border-accent rounded-full border-t-transparent mb-6"
                            />
                            <h1 className="text-2xl font-display font-bold text-heading mb-2">Verifying...</h1>
                            <p className="text-body">{message}</p>
                        </motion.div>
                    )}

                    {status === "success" && (
                        <motion.div
                            key="success"
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="flex flex-col items-center"
                        >
                            <div className="w-16 h-16 bg-success/20 rounded-full flex items-center justify-center mb-6">
                                <svg className="w-8 h-8 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <h1 className="text-2xl font-display font-bold text-heading mb-2">Success!</h1>
                            <p className="text-body mb-6">{message}</p>
                            <div className="w-full bg-accent-opacity h-1 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: "100%" }}
                                    transition={{ duration: 3 }}
                                    className="h-full bg-primary"
                                />
                            </div>
                            <p className="text-xs text-body mt-4 italic">Redirecting to login...</p>
                        </motion.div>
                    )}

                    {status === "error" && (
                        <motion.div
                            key="error"
                            initial={{ x: 20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            className="flex flex-col items-center"
                        >
                            <div className="w-16 h-16 bg-danger/20 rounded-full flex items-center justify-center mb-6">
                                <svg className="w-8 h-8 text-danger" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </div>
                            <h1 className="text-2xl font-display font-bold text-heading mb-2">Oops!</h1>
                            <p className="text-body mb-8">{message}</p>
                            <button
                                onClick={() => router.push("/resend-verification")}
                                className="w-full py-3 px-6 bg-primary hover:bg-secondary text-white font-bold rounded-lg transition-colors shadow-lg active:scale-95"
                            >
                                Get New Link
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </main>
    );
};

export default VerifyPage;