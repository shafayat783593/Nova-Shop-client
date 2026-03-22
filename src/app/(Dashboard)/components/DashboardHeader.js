'use client';

import { useState, useEffect } from 'react';
import {
    Menu,
    Search,
    Bell,
    HelpCircle,
    User,
    LogOut,
    Settings,
    X,
    FileText,
    Shield,
} from 'lucide-react';
import { useAuth } from '@/app/context/AuthContext';
import Link from 'next/link';

export default function DashboardHeader({ isSidebarOpen, setIsSidebarOpen }) {
    // মেনু ওপেন/ক্লোজ স্টেট
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const { user, logOutUser } = useAuth();

    // বাইরে ক্লিক করলে মেনু ক্লোজ করার লজিক
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (!e.target.closest('.user-menu')) setIsUserMenuOpen(false);
            if (!e.target.closest('.notification-menu')) setIsNotificationsOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <header className="sticky top-0 z-40 bg-card border-b border-accent-10 px-4 py-3 lg:px-8 transition-colors duration-500">
            <div className="flex justify-between items-center gap-4">

                {/* --- বাম পাশ: মোবাইল মেনু বাটন এবং সার্চবার --- */}
                <div className="flex items-center gap-3 flex-1">
                    <button
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="p-2 rounded-xl text-heading hover:bg-primary/10 transition-colors lg:hidden cursor-pointer"
                    >
                        <Menu size={22} />
                    </button>

                    <div className="relative flex-1 max-w-md hidden md:block">
                        <Search
                            size={18}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-body"
                        />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search anything..."
                            className="w-full pl-10 pr-4 py-2.5 text-sm bg-bg border border-accent-10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/40 text-heading transition-all"
                        />
                    </div>
                </div>

                {/* --- ডান পাশ: নোটিফিকেশন এবং প্রোফাইল --- */}
                <div className="flex items-center gap-2 md:gap-4">

                    {/* নোটিফিকেশন আইকন (সিম্পল ডেমো) */}
                    <div className="relative notification-menu">
                        <button
                            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                            className="relative p-2.5 rounded-xl text-body hover:bg-primary/10 hover:text-primary transition-all cursor-pointer"
                        >
                            <Bell size={20} />
                            <span className="absolute top-2 right-2 w-2 h-2 bg-danger rounded-full border-2 border-card"></span>
                        </button>

                        {isNotificationsOpen && (
                            <div className="absolute right-0 mt-3 w-72 bg-card rounded-2xl shadow-2xl border border-accent-10 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                                <div className="p-4 border-b border-accent-10 bg-primary/5">
                                    <h3 className="font-bold text-heading text-sm">Recent Alerts</h3>
                                </div>
                                <div className="p-4 text-center text-xs text-body italic">
                                    No new notifications
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ইউজার প্রোফাইল ড্রপডাউন */}
                    <div className="relative user-menu ml-2">
                        <button
                            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                            className="flex items-center gap-3 p-1 rounded-full hover:bg-primary/5 transition-all cursor-pointer"
                        >
                            <div className="w-10 h-10 rounded-full bg-linear-to-br from-primary to-secondary flex items-center justify-center shadow-lg border-2 border-card">
                                <User size={18} className="text-white" />
                            </div>
                            <div className="hidden lg:block text-left">
                                <p className="text-sm font-black text-heading leading-none">
                                    {user?.name || 'User'}
                                </p>
                                <p className="text-[10px] text-body mt-1 font-bold uppercase tracking-tighter">
                                    {user?.role || 'Member'}
                                </p>
                            </div>
                        </button>

                        {isUserMenuOpen && (
                            <div className="absolute right-0 mt-3 w-60 bg-card border border-accent-10 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2">
                                <div className="px-4 py-3 border-b border-accent-10 mb-2">
                                    <p className="text-xs font-bold text-body uppercase tracking-widest mb-1">Account Info</p>
                                    <p className="text-sm font-black text-heading truncate">{user?.email}</p>
                                </div>

                                <Link href="/setting" onClick={() => setIsUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-heading hover:bg-primary/10 rounded-xl transition-all">
                                    <Settings size={18} className="text-body" /> Settings
                                </Link>

                                <button
                                    onClick={() => { logOutUser?.(); setIsUserMenuOpen(false); }}
                                    className="w-full flex items-center gap-3 px-4 py-2.5 mt-2 text-sm font-black text-danger hover:bg-danger/10 rounded-xl transition-all"
                                >
                                    <LogOut size={18} /> Sign Out
                                </button>
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </header>
    );
}