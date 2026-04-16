'use client';

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
    User, Mail, Lock, Truck, Store,
    CheckCircle2, Eye, EyeOff, ArrowRight
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import api from '../../lib/api';
import PrimaryButton from '../../components/global/PrimaryButton';


const sliderImages = [
    {
        id: 1,
        src: "https://cdn.ignitingbusiness.com/images/easyblog_images/489/6-must-have-pages-for-your-ecommerce-website.jpeg",
        title: "Seamless Access",
        desc: "Experience the fastest way to manage your orders."
    },
    {
        id: 2,
        src: "https://img.freepik.com/free-photo/online-fashion-shopping-with-laptop_23-2148896971.jpg",
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
const RegisterPage = () => {
    const [showPassword, setShowPassword] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors, isSubmitting },
    } = useForm({
        defaultValues: { role: 'user' },
    });

    const selectedRole = watch('role');

 useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % sliderImages.length);
    }, 5000); // ৫ সেকেন্ড পর পর পাল্টাবে
    return () => clearInterval(timer);
  }, []);

    const onSubmit = async (data) => {
        try {
            console.log(data)
            await api.post('/api/auth/register', data);
            toast.success('If you email is valid, you will receive a verification link has been sent. it will be expire in 5 minutes');
            reset();
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Registration failed');
        }
    };

    const roles = [
        { id: 'user', label: 'Customer', icon: User },
        { id: 'owner', label: 'Vendor', icon: Store },
        { id: 'deliveryboy', label: 'Courier', icon: Truck },
    ];

    return (
        <div className="min-h-screen w-full flex bg-bg transition-colors duration-300">

            {/* --- Left Side: Branding & Image --- */}
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

            {/* --- Right Side: Form --- */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-16 bg-card">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full max-w-md"
                >
                    <div className="mb-10 text-center lg:text-left">
                        <h1 className="text-4xl font-display font-black text-heading tracking-tight">
                            Create Account
                        </h1>
                        <p className="text-body mt-2">Enter your details to get started with <span className="text-primary font-bold">NovaShop</span></p>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

                        {/* Name Input */}
                        <div className="space-y-1">
                            <div className="relative group">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-body group-focus-within:text-primary transition-colors" size={19} />
                                <input
                                    {...register('name', { required: 'Full name is required' })}
                                    type="text"
                                    placeholder="Full Name"
                                    className="w-full pl-12 pr-4 py-4 bg-bg border border-accent/20 rounded-2xl outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all text-heading"
                                />
                            </div>
                            {errors.name && <span className="text-xs text-danger font-medium ml-1">{errors.name.message}</span>}
                        </div>

                        {/* Email Input */}
                        <div className="space-y-1">
                            <div className="relative group">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-body group-focus-within:text-primary transition-colors" size={19} />
                                <input
                                    {...register('email', {
                                        required: 'Email is required',
                                        pattern: { value: /^\S+@\S+$/i, message: 'Invalid email' }
                                    })}
                                    type="email"
                                    placeholder="Email Address"
                                    className="w-full pl-12 pr-4 py-4 bg-bg border border-accent/20 rounded-2xl outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all text-heading"
                                />
                            </div>
                            {errors.email && <span className="text-xs text-danger font-medium ml-1">{errors.email.message}</span>}
                        </div>

                        {/* Password Input with Show/Hide */}
                        <div className="space-y-1">
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-body group-focus-within:text-primary transition-colors" size={19} />
                                <input
                                    {...register('password', { required: 'Password required', minLength: 6 })}
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Password"
                                    className="w-full pl-12 pr-12 py-4 bg-bg border border-accent/20 rounded-2xl outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all text-heading"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-body hover:text-primary transition-colors bg-transparent border-none cursor-pointer"
                                >
                                    {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                                </button>
                            </div>
                            {errors.password && <span className="text-xs text-danger font-medium ml-1">Min 6 characters required</span>}
                        </div>

                        {/* Role Selection */}
                        <div className="space-y-3 pt-2">
                            <label className="text-sm font-bold text-heading ml-1">Join as a</label>
                            <div className="grid grid-cols-3 gap-3">
                                {roles.map((role) => (
                                    <label key={role.id} className="relative cursor-pointer group">
                                        <input {...register('role')} type="radio" value={role.id} className="hidden" />
                                        <div className={`flex flex-col items-center p-4 rounded-2xl border-2 transition-all duration-300 ${selectedRole === role.id
                                                ? 'border-primary bg-primary/10 text-primary shadow-sm'
                                                : 'border-accent/10 text-body hover:border-accent/30'
                                            }`}>
                                            <role.icon size={22} className="mb-2" />
                                            <span className="text-[10px] font-black uppercase tracking-wider">{role.label}</span>

                                            <AnimatePresence>
                                                {selectedRole === role.id && (
                                                    <motion.div
                                                        initial={{ scale: 0 }}
                                                        animate={{ scale: 1 }}
                                                        exit={{ scale: 0 }}
                                                        className="absolute -top-2 -right-2 text-primary bg-card rounded-full"
                                                    >
                                                        <CheckCircle2 size={20} className="fill-card" />
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Submit Button */}
                        <div className="pt-4">
                            <PrimaryButton
                                text={isSubmitting ? 'Creating Account...' : 'Register Now'}
                                isLoading={isSubmitting}
                                className="w-full py-4 rounded-2xl text-lg font-bold shadow-xl shadow-primary/20 flex items-center justify-center gap-2"
                            >
                                {!isSubmitting && <ArrowRight size={20} />}
                            </PrimaryButton>
                        </div>

                        <p className="text-center text-body text-sm pt-4">
                            Already a member? <Link href="/login" className="text-primary font-black hover:underline underline-offset-4">Sign In</Link>
                        </p>
                    </form>
                </motion.div>
            </div>
        </div>
    );
};

export default RegisterPage;