'use client';

import { motion } from 'framer-motion';
import { Home, MoveLeft } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image'; // Next.js Image ইম্পোর্ট
import PrimaryButton from './components/global/PrimaryButton';

export default function NotFound() {
    return (
        <div className="min-h-screen w-full bg-bg flex items-center justify-center p-6 transition-colors duration-500">
            <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

                {/* Left Side: 3D Illustration */}
                <motion.div
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8 }}
                    className="relative flex justify-center"
                >
                    {/* Decorative Circle */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-primary/10 dark:bg-accent/10 rounded-full blur-3xl transition-colors duration-500" />

                    <motion.div
                        animate={{ y: [0, -20, 0] }}
                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                        className="relative z-10 w-full max-w-[500px] aspect-square" // aspect-square ইমেজ রেশিও ঠিক রাখবে
                    >
                        {/* Next.js Image Component */}
                        <Image
                            src="https://img.freepik.com/free-vector/404-error-with-person-looking-concept-illustration_114360-7912.jpg"
                            alt="404 Not Found"
                            width={500}
                            height={500}
                            priority // এই ইমেজটি যেহেতু প্রধান, তাই দ্রুত লোড হওয়ার জন্য priority ব্যবহার করা হয়েছে
                            className="w-full h-auto object-contain mix-blend-multiply dark:mix-blend-normal dark:filter dark:brightness-90 transition-all duration-500"
                        />
                    </motion.div>
                </motion.div>

                {/* Right Side: Professional Content */}
                <div className="text-center lg:text-left">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <h1 className="text-primary dark:text-accent text-2xl font-bold tracking-widest uppercase mb-2">
                            Error 404
                        </h1>
                        <h2 className="text-4xl md:text-6xl font-extrabold text-heading mb-6 leading-tight transition-colors duration-500">
                            Oops! Page <br /> <span className="text-primary dark:text-accent">Not Found.</span>
                        </h2>
                        <p className="text-body text-lg mb-10 max-w-md mx-auto lg:mx-0">
                            The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-5 justify-center lg:justify-start items-center">
                            <PrimaryButton
                                text="Back to Homepage"
                                url="/"
                                icon={Home}
                                size="xl"
                                className="shadow-2xl shadow-primary/20 dark:shadow-accent/10"
                            />

                            <Link
                                href="/shop"
                                className="flex items-center gap-2 font-bold text-heading hover:text-primary dark:hover:text-accent transition-all group"
                            >
                                <MoveLeft className="group-hover:-translate-x-2 transition-transform" size={20} />
                                Continue Shopping
                            </Link>
                        </div>
                    </motion.div>

                    {/* Useful Links */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="mt-16 grid grid-cols-2 gap-4 border-t border-slate-200 dark:border-slate-800 pt-8"
                    >
                        <div>
                            <h4 className="font-bold text-heading mb-2">Need Help?</h4>
                            <Link href="/contact" className="text-sm text-body hover:text-primary dark:hover:text-accent transition-colors">
                                Contact Support
                            </Link>
                        </div>
                        <div>
                            <h4 className="font-bold text-heading mb-2">My Account</h4>
                            <Link href="/cart" className="text-sm text-body hover:text-primary dark:hover:text-accent transition-colors">
                                View Cart
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}