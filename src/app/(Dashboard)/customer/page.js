'use client';

import React from 'react';
import { useAuth } from '@/app/context/AuthContext';
import {
    User,
    Mail,
    MapPin,
    Phone,
    ShoppingBag,
    Clock,
    ShieldCheck,
    Edit3
} from 'lucide-react';

const InfoItem = ({ icon: Icon, label, value }) => (
    <div className="flex items-center gap-4 p-4 rounded-2xl bg-bg border border-accent-10 transition-all hover:border-primary/30">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <Icon size={20} />
        </div>
        <div>
            <p className="text-[10px] font-bold text-body uppercase tracking-widest">{label}</p>
            <p className="text-sm font-black text-heading">{value || 'Not Provided'}</p>
        </div>
    </div>
);

const StatMiniCard = ({ label, value, color }) => (
    <div className="text-center p-4 rounded-2xl bg-bg border border-accent-10">
        <p className={`text-2xl font-black ${color}`}>{value}</p>
        <p className="text-[10px] font-bold text-body uppercase mt-1">{label}</p>
    </div>
);

export default function CustomerProfilePage() {
    const { user } = useAuth();

    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-700">

            {/* --- Header Section --- */}
            <div className="relative">
                {/* Banner */}
                <div className="h-32 md:h-48 w-full rounded-3xl bg-linear-to-r from-primary/20 via-secondary/20 to-accent/20 border border-accent-10 overflow-hidden">
                    <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                </div>

                {/* Profile Info Overlay */}
                <div className="px-6 -mt-12 md:-mt-16 flex flex-col md:flex-row items-end gap-6">
                    <div className="relative">
                        <div className="w-24 h-24 md:w-32 md:h-32 rounded-3xl bg-card border-4 border-bg shadow-2xl flex items-center justify-center overflow-hidden">
                            <div className="w-full h-full bg-linear-to-br from-primary to-secondary flex items-center justify-center text-white text-4xl font-black">
                                {user?.name?.charAt(0) || <User size={48} />}
                            </div>
                        </div>
                        <button className="absolute bottom-2 -right-2 p-2 bg-primary text-white rounded-xl shadow-lg hover:scale-110 transition-transform">
                            <Edit3 size={16} />
                        </button>
                    </div>

                    <div className="flex-1 pb-2">
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl md:text-3xl font-black text-heading">{user?.name}</h1>
                            <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-black rounded-full uppercase tracking-tighter">
                                Verified {user?.role || 'Customer'}
                            </span>
                        </div>
                        <p className="text-body font-medium flex items-center gap-1 mt-1">
                            <Mail size={14} /> {user?.email}
                        </p>
                    </div>

                    <div className="hidden lg:grid grid-cols-3 gap-3 mb-2">
                        <StatMiniCard label="Total Orders" value="12" color="text-primary" />
                        <StatMiniCard label="Wishlist" value="05" color="text-secondary" />
                        <StatMiniCard label="Reviews" value="02" color="text-accent" />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* --- Left Column: Personal Info --- */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="p-6 bg-card rounded-3xl border border-accent-10 shadow-sm">
                        <h3 className="text-lg font-black text-heading mb-6 flex items-center gap-2">
                            <ShieldCheck className="text-primary" size={20} /> Personal Information
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <InfoItem icon={User} label="Full Name" value={user?.name} />
                            <InfoItem icon={Mail} label="Email Address" value={user?.email} />
                            <InfoItem icon={Phone} label="Phone Number" value="+880 1XXX-XXXXXX" />
                            <InfoItem icon={MapPin} label="Default Address" value="Chittagong, Bangladesh" />
                        </div>
                    </div>

                    {/* Recent Orders Preview */}
                    <div className="p-6 bg-card rounded-3xl border border-accent-10 shadow-sm">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-black text-heading flex items-center gap-2">
                                <ShoppingBag className="text-primary" size={20} /> Recent Orders
                            </h3>
                            <button className="text-xs font-bold text-primary hover:underline uppercase tracking-widest">View All</button>
                        </div>

                        <div className="space-y-4">
                            {/* Demo Order Row */}
                            <div className="flex items-center justify-between p-4 bg-bg rounded-2xl border border-accent-10 hover:shadow-md transition-all">
                                <div className="flex items-center gap-4">
                                    <div className="p-2 bg-secondary/10 text-secondary rounded-lg font-bold text-xs">#TP-9021</div>
                                    <div>
                                        <p className="text-sm font-black text-heading">Premium Wireless Mouse</p>
                                        <p className="text-[10px] text-body flex items-center gap-1"><Clock size={10} /> 2 hours ago</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-black text-primary">$45.00</p>
                                    <span className="text-[9px] font-black text-success uppercase">Delivered</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- Right Column: Settings Quick Links --- */}
                <div className="space-y-6">
                    <div className="p-6 bg-card rounded-3xl border border-accent-10 shadow-sm">
                        <h3 className="text-lg font-black text-heading mb-6">Quick Settings</h3>
                        <div className="space-y-3">
                            <button className="w-full text-left px-4 py-3 rounded-xl hover:bg-primary/5 text-sm font-bold text-body hover:text-primary transition-all flex justify-between items-center border border-transparent hover:border-accent-10">
                                Security & Password <ShieldCheck size={16} />
                            </button>
                            <button className="w-full text-left px-4 py-3 rounded-xl hover:bg-primary/5 text-sm font-bold text-body hover:text-primary transition-all flex justify-between items-center border border-transparent hover:border-accent-10">
                                Manage Addresses <MapPin size={16} />
                            </button>
                            <button className="w-full text-left px-4 py-3 rounded-xl hover:bg-danger/5 text-sm font-bold text-danger transition-all flex justify-between items-center border border-transparent">
                                Deactivate Account <ShieldCheck size={16} />
                            </button>
                        </div>
                    </div>

                    {/* Promotion Card */}
                    <div className="p-6 bg-linear-to-br from-primary to-secondary rounded-3xl text-white shadow-xl shadow-primary/20">
                        <h4 className="text-xl font-black mb-2">TerraShop Premium</h4>
                        <p className="text-xs font-medium opacity-90 leading-relaxed mb-4">Get unlimited free delivery and 10% cashback on every purchase.</p>
                        <button className="w-full py-2.5 bg-white text-primary font-black text-xs rounded-xl hover:scale-105 transition-transform uppercase tracking-widest">
                            Upgrade Now
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
}