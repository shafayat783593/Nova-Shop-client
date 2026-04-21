"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import api from '@/app/lib/api'; // Ensure this points to your axios instance
import Loading from '../loading';

export default function HeroSection() {
    const [slides, setSlides] = useState([]);
    const [index, setIndex] = useState(0);
    const [loading, setLoading] = useState(true);

    // Fetch Banners from API
    useEffect(() => {
        const fetchBanners = async () => {
            try {
                const response = await api.get("/api/banners");
                // Filter to only show active banners
                const activeBanners = response.data.filter(b => b.isActive);
                setSlides(activeBanners);
            } catch (error) {
                console.error("Error fetching banners:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchBanners();
    }, []);

    // Auto-slide effect
    useEffect(() => {
        if (slides.length === 0) return;
        const timer = setInterval(() => {
            setIndex((prev) => (prev + 1) % slides.length);
        }, 5000);
        return () => clearInterval(timer);
    }, [slides]);

    if (loading) return <Loading/>
    if (slides.length === 0) return null;

    const nextSlide = () => setIndex((prev) => (prev + 1) % slides.length);
    const prevSlide = () => setIndex((prev) => (prev - 1 + slides.length) % slides.length);

    return (
        <main className="bg-bg min-h-screen">
            <section className="relative h-[600px] w-full overflow-hidden flex items-center justify-center bg-card border-b border-accent-10">
                <AnimatePresence mode='popLayout'>
                    <motion.div
                        key={slides[index]._id}
                        // স্লাইডটি ডান দিক থেকে আসবে (100% থেকে শুরু)
                        initial={{ x: '100%' }}
                        // সেন্টারে এসে স্থির হবে
                        animate={{ x: 0 }}
                        // এবং বাম দিকে চলে যাবে (-100% এ শেষ হবে)
                        exit={{ x: '-100%' }}
                        // ট্রানজিশন স্মুথ করার জন্য 'easeInOut' ব্যবহার করুন
                        transition={{ duration: 0.7, ease: "easeInOut" }}
                        // 'mode=popLayout' এর জন্য 'h-[600px]' নির্দিষ্ট করে দেওয়া হয়েছে
                        className="absolute inset-0 w-full h-[600px] flex flex-col items-center justify-center text-center px-6 bg-cover bg-center"
                        style={{ backgroundImage: `url(${slides[index].imageUrl})` }}
                    >
                        {/* ইমেজের উপর টেক্সট স্পষ্ট করার জন্য overlay (ঐচ্ছিক) */}
                        <div className="absolute inset-0 bg-black/40"></div>

                        <div className="relative z-10 text-white">
                            <h1 className="font-display text-5xl md:text-7xl mb-6">
                                {slides[index].title}
                            </h1>
                            <p className="text-xl mb-8 max-w-lg mx-auto">
                                {slides[index].description}
                            </p>
                            <a href={slides[index].link} className="bg-primary hover:bg-secondary text-white px-8 py-3 rounded-full font-bold transition-all">
                                Shop Now
                            </a>
                        </div>
                    </motion.div>
                </AnimatePresence>

                <button onClick={prevSlide} className="absolute left-4 p-2 bg-bg border border-accent-10 rounded-full text-heading hover:bg-accent-opacity">
                    <ChevronLeft />
                </button>
                <button onClick={nextSlide} className="absolute right-4 p-2 bg-bg border border-accent-10 rounded-full text-heading hover:bg-accent-opacity">
                    <ChevronRight />
                </button>
            </section>
        </main>
    );
}