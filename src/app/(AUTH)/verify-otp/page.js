'use client';

import React, { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { ShieldCheck, ArrowLeft, RefreshCw, Lock } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import api from '@/app/lib/api';
import PrimaryButton from '@/app/components/global/PrimaryButton';

const sliderImages = [
    {
        id: 1,
        src: "https://i.ibb.co.com/NdcKgHJb/images-q-tbn-ANd9-Gc-Ra-Yh-NYzm-BLw-O35-Q6j-te9-Gm-TCS7xps-Vw-Q3-Q-s.jpg",
        title: "Seamless Access",
        desc: "Experience the fastest way to manage your orders."
    },
    {
        id: 2,
        src: "https://i.ibb.co.com/chvNm6z7/images-q-tbn-ANd9-Gc-T0-YA0m-y3-Ytl-Xc-BVUYq-Me5-Fp3-x-RRQ0gd-MWQ-s.png",
        title: "Secure Shopping",
        desc: "Your data protection is our top priority."
    },
    {
        id: 3,
        src: "https://i.ibb.co.com/s9HxN91r/5147.jpg",
        title: "Fast Delivery",
        desc: "Get your products delivered in record time."
    }
];
const VerifyOTPPage = () => {
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [email, setEmail] = useState('');
    const [timer, setTimer] = useState(60);
    const [isVerifying, setIsVerifying] = useState(false);
    const [currentSlide, setCurrentSlide] = useState(0);

    const inputRefs = useRef([]);
    const router = useRouter();

    const handlePaste = (e) => {
        e.preventDefault();

        const pasteData = e.clipboardData.getData("text").trim();

        // শুধু number allow
        if (!/^\d+$/.test(pasteData)) return;

        const pasteArray = pasteData.slice(0, 6).split("");

        const newOtp = [...otp];

        pasteArray.forEach((num, i) => {
            newOtp[i] = num;
        });

        setOtp(newOtp);

        // last filled input এ focus
        const lastIndex = pasteArray.length - 1;
        if (inputRefs.current[lastIndex]) {
            inputRefs.current[lastIndex].focus();
        }
    };

    // ১. লোকাল স্টোরেজ থেকে ইমেইল রিড করা
    useEffect(() => {
        const storedEmail = localStorage.getItem('temp_email');
        if (!storedEmail) {
            toast.error("Session expired. Please login again.");
            router.push('/login');
        } else {
            setEmail(storedEmail);
        }
    }, [router]);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % sliderImages.length);
        }, 5000); // ৫ সেকেন্ড পর পর পাল্টাবে
        return () => clearInterval(timer);
    }, []);

    // ২. কাউন্টডাউন টাইমার
    useEffect(() => {
        if (timer > 0) {
            const interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
            return () => clearInterval(interval);
        }
    }, [timer]);

    // ৩. ইনপুট হ্যান্ডলিং লজিক
    const handleChange = (index, value) => {
        if (isNaN(value)) return;
        const newOtp = [...otp];
        newOtp[index] = value.substring(value.length - 1);
        setOtp(newOtp);

        if (value && index < 5) {
            inputRefs.current[index + 1].focus();
        }
    };

    const handleKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            inputRefs.current[index - 1].focus();
        }
    };

    const handleVerify = async (e) => {
        e.preventDefault();
        const otpString = otp.join('');
        if (otpString.length < 6) return toast.error("Please enter all 6 digits");

        setIsVerifying(true);
        try {
            await api.post('/api/auth/verify-otp', { email, otp: otpString });
            toast.success("Identity verified successfully!");
            localStorage.removeItem('temp_email');
            router.push('/');
        } catch (error) {
            toast.error(error?.response?.data?.message || "Invalid OTP code");
        } finally {
            setIsVerifying(false);
        }
    };

    const resendOTP = async () => {
        setTimer(60);
        try {
            await api.post('/api/auth/resend-otp', { email });
            toast.success("New code sent to your email");
        } catch (error) {
            toast.error("Failed to resend code");
        }
    };

    return (
        <div className="min-h-screen w-full flex bg-bg transition-colors duration-300">

            {/* --- Left Side: Image & Branding --- */}
            <div className="hidden lg:flex lg:w-1/2 bg-[#0a0a0a] relative items-center justify-center overflow-hidden">
                {/* Background Crossfade Animation */}
                <AnimatePresence mode='popLayout'>
                    <motion.div
                        key={currentSlide}
                        initial={{ opacity: 0, scale: 1.1 }}
                        animate={{ opacity: 0.4, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 1.5, ease: "easeInOut" }}
                        className="absolute inset-0 z-0"
                    >
                        <Image
                            src={sliderImages[currentSlide].src}
                            alt="bg"
                            fill
                            className="object-cover blur-sm"
                        />
                    </motion.div>
                </AnimatePresence>

                {/* Foreground Content */}
                <div className="relative z-10 w-full max-w-lg text-center px-10">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentSlide}
                            initial={{ opacity: 0, y: 30, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -30, scale: 1.05 }}
                            transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
                        >
                            <div className="relative w-full h-[380px] mb-8 drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                                <Image
                                    src={sliderImages[currentSlide].src}
                                    alt="Slider"
                                    fill
                                    className="object-contain rounded-[2rem]"
                                    priority
                                />
                            </div>

                            <motion.h2
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="text-4xl font-display font-black text-white mb-3"
                            >
                                {sliderImages[currentSlide].title}
                            </motion.h2>

                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.4 }}
                                className="text-white/70 text-lg leading-relaxed"
                            >
                                {sliderImages[currentSlide].desc}
                            </motion.p>
                        </motion.div>
                    </AnimatePresence>

                    {/* Indicators */}
                    <div className="flex justify-center gap-3 mt-10">
                        {sliderImages.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => setCurrentSlide(index)}
                                className={`h-1.5 transition-all duration-500 rounded-full ${currentSlide === index ? "w-10 bg-primary" : "w-4 bg-white/20 hover:bg-white/40"
                                    }`}
                            />
                        ))}
                    </div>
                </div>

                {/* Decorative Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 pointer-events-none" />
            </div>

            {/* --- Right Side: OTP Form --- */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-16 bg-card">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-full max-w-md"
                >
                    <div className="mb-10 text-center lg:text-left">
                        <div className="inline-flex p-3 bg-primary/10 rounded-2xl text-primary mb-4">
                            <ShieldCheck size={32} />
                        </div>
                        <h1 className="text-4xl font-display font-black text-heading tracking-tight">Two-Step Verification</h1>
                        <p className="text-body mt-3">
                            Enter the 6-digit code sent to <br />
                            <span className="text-primary font-bold">{email}</span>
                        </p>
                    </div>

                    <form onSubmit={handleVerify} className="space-y-8">
                        {/* OTP Input Grid */}
                        <div className="flex justify-between gap-2 md:gap-3">
                            {otp.map((digit, index) => (
                                <input
                                    key={index}
                                    ref={(el) => (inputRefs.current[index] = el)}
                                    type="text"
                                    maxLength={1}
                                    value={digit}
                                    onChange={(e) => handleChange(index, e.target.value)}
                                    onKeyDown={(e) => handleKeyDown(index, e)}
                                    onPaste={handlePaste} // 🔥 ADD THIS
                                    className="w-full h-14 md:h-16 text-center text-2xl font-black bg-bg border-2 border-accent/10 rounded-2xl outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all text-heading"
                                />
                            ))}
                        </div>

                        {/* Timer & Resend */}
                        <div className="flex justify-center">
                            {timer > 0 ? (
                                <p className="text-sm font-medium text-body">
                                    Resend code in <span className="text-primary font-bold">{timer}s</span>
                                </p>
                            ) : (
                                <button
                                    type="button"
                                    onClick={resendOTP}
                                    className="flex items-center gap-2 text-sm font-black text-primary hover:underline"
                                >
                                    <RefreshCw size={16} /> Resend Verification Code
                                </button>
                            )}
                        </div>

                        <div className="space-y-4 pt-2">
                            <PrimaryButton
                                text={isVerifying ? "Verifying..." : "Confirm Code"}
                                isLoading={isVerifying}
                                className="w-full py-4 rounded-2xl text-lg font-bold shadow-xl shadow-primary/20"
                            />

                            <Link
                                href="/login"
                                className="flex items-center justify-center gap-2 text-sm font-bold text-body hover:text-heading transition-colors"
                            >
                                <ArrowLeft size={16} /> Back to Login
                            </Link>
                        </div>
                    </form>
                </motion.div>
            </div>
        </div>
    );
};

export default VerifyOTPPage;