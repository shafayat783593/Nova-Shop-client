'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation'; // ✅ useSearchParams add
import api from '../../lib/api';
import PrimaryButton from '../../components/global/PrimaryButton';
import { useAuth } from '@/app/context/AuthContext';

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

const LoginPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const router = useRouter();
  const searchParams = useSearchParams(); // ✅ এখন সঠিক জায়গায়
  const { fetchUser } = useAuth();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % sliderImages.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const onSubmit = async (data) => {
    console.log("Login Data:", data); // ✅ Debugging line
    try {
      const response = await api.post('/api/auth/login', data);
http//localho
      if (response?.data?.twoFactorRequired) {
        localStorage.setItem('temp_email', data.email);
        toast.success(response.data.message || 'OTP sent to your email!');
        router.push('/verify-otp');
      } else {
        // localStorage.setItem('accessToken', response.data.accessToken);
        // localStorage.setItem('refreshToken', response.data.refreshToken);

        const loggedInUser = await fetchUser();
        toast.success(response.data.message || 'Login successful!');

        const returnUrl = searchParams.get('returnUrl');

        if (returnUrl) {
          // ✅ returnUrl থাকলে সেখানে যাও
          router.push(returnUrl);
        } else {
          // ✅ role অনুযায়ী default redirect
          const roleRedirects = {
            admin: '/admin',
            vendor: '/vendor',
            deliveryboy: '/deliveryboy',
            customer: '/customer',
          };

          const role = loggedInUser?.role;
          const destination = roleRedirects[role] || '/';
          router.push(destination);
        }
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Invalid credentials');
    }
  };
  return (
    <div className="min-h-screen w-full flex bg-bg transition-colors duration-500 overflow-hidden">
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-16 bg-card z-10 shadow-2xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="mb-10 text-center lg:text-left">
            <h1 className="text-4xl font-display font-black text-heading tracking-tight">Welcome Back</h1>
            <p className="text-body mt-2">Access your <span className="text-primary font-bold">NovaShop</span> account.</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-1">
              <label className="text-sm font-bold text-heading ml-1">Email Address</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-body group-focus-within:text-primary transition-colors" size={19} />
                <input
                  {...register('email', { required: 'Email is required' })}
                  type="email"
                  placeholder="name@example.com"
                  className="w-full pl-12 pr-4 py-4 bg-bg border border-accent/20 rounded-2xl outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all text-heading"
                />
                {errors.email && <p className="text-danger text-xs mt-1 ml-1">{errors.email.message}</p>}
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center ml-1">
                <label className="text-sm font-bold text-heading">Password</label>
                <Link href="/Forgot-password" className="text-xs text-primary font-bold hover:underline">Forgot password?</Link>
              </div>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-body group-focus-within:text-primary transition-colors" size={19} />
                <input
                  {...register('password', { required: 'Password is required' })}
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="w-full pl-12 pr-12 py-4 bg-bg border border-accent/20 rounded-2xl outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all text-heading"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-body hover:text-primary">
                  {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                </button>
                {errors.password && <p className="text-danger text-xs mt-1 ml-1">{errors.password.message}</p>}
              </div>
            </div>

            <PrimaryButton
              text={isSubmitting ? 'Verifying...' : 'Sign In'}
              isLoading={isSubmitting}
              className="w-full py-4 rounded-2xl text-lg font-bold shadow-xl shadow-primary/20"
            />

            <p className="text-center text-body text-sm pt-2">
              New here? <Link href="/register" className="text-primary font-black hover:underline">Create Account</Link>
            </p>
          </form>
        </motion.div>
      </div>

      <div className="hidden lg:flex lg:w-1/2 bg-[#0a0a0a] relative items-center justify-center overflow-hidden">
        <AnimatePresence mode='popLayout'>
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 0.4, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
            className="absolute inset-0 z-0"
          >
            <Image src={sliderImages[currentSlide].src} alt="bg" fill className="object-cover blur-sm" />
          </motion.div>
        </AnimatePresence>

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
                <Image src={sliderImages[currentSlide].src} alt="Slider" fill className="object-contain rounded-[2rem]" priority />
              </div>
              <motion.h2 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-4xl font-display font-black text-white mb-3">
                {sliderImages[currentSlide].title}
              </motion.h2>
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="text-white/70 text-lg leading-relaxed">
                {sliderImages[currentSlide].desc}
              </motion.p>
            </motion.div>
          </AnimatePresence>

          <div className="flex justify-center gap-3 mt-10">
            {sliderImages.map((_, index) => (
              <button key={index} onClick={() => setCurrentSlide(index)}
                className={`h-1.5 transition-all duration-500 rounded-full ${currentSlide === index ? "w-10 bg-primary" : "w-4 bg-white/20 hover:bg-white/40"}`}
              />
            ))}
          </div>
        </div>

        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 pointer-events-none" />
      </div>
    </div>
  );
};

export default LoginPage;