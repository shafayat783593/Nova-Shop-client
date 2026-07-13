"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import api from '@/app/lib/api';
import Loading from '../components/global/Loading';

export default function HeroSection() {
    const [slides, setSlides] = useState([]);
    const [index, setIndex] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBanners = async () => {
            try {
                const response = await api.get("/api/banners");
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
        <main className="bg-bg">
            <section className="relative h-[280px] sm:h-[380px] md:h-[480px] lg:h-[600px] w-full overflow-hidden flex items-center justify-center bg-card border-b border-accent-10">
                <AnimatePresence mode='popLayout'>
                    <motion.div
                        key={slides[index]._id}
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '-100%' }}
                        transition={{ duration: 0.7, ease: "easeInOut" }}
                        className="absolute inset-0 w-full h-full flex flex-col items-center justify-center text-center px-4 sm:px-6 bg-cover bg-center"
                        style={{ backgroundImage: `url(${slides[index].imageUrl})` }}
                    >
                        <div className="absolute inset-0 bg-black/40"></div>

                        <div className="relative z-10 text-white max-w-[90%] sm:max-w-lg">
                            <h1 className="font-display text-2xl sm:text-4xl md:text-6xl lg:text-7xl mb-2 sm:mb-4 md:mb-6 leading-tight">
                                {slides[index].title}
                            </h1>
                            <p className="text-xs sm:text-base md:text-lg lg:text-xl mb-4 sm:mb-6 md:mb-8 mx-auto line-clamp-2 sm:line-clamp-none">
                                {slides[index].description}
                            </p>
                            <a href="/products" className="inline-block bg-primary hover:bg-secondary text-white px-4 py-2 sm:px-6 sm:py-2.5 md:px-8 md:py-3 rounded-full text-xs sm:text-sm md:text-base font-bold transition-all">
                                Shop Now
                            </a>
                        </div>
                    </motion.div>
                </AnimatePresence>

                <button
                    onClick={prevSlide}
                    className="absolute left-2 sm:left-4 z-20 p-1.5 sm:p-2 bg-bg border border-accent-10 rounded-full text-heading hover:bg-accent-opacity"
                >
                    <ChevronLeft size={18} className="sm:w-6 sm:h-6" />
                </button>
                <button
                    onClick={nextSlide}
                    className="absolute right-2 sm:right-4 z-20 p-1.5 sm:p-2 bg-bg border border-accent-10 rounded-full text-heading hover:bg-accent-opacity"
                >
                    <ChevronRight size={18} className="sm:w-6 sm:h-6" />
                </button>
            </section>
        </main>
    );
}