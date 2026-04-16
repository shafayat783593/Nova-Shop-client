'use client';

import React, { useEffect } from "react";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogOut, ChevronLeft, ChevronRight } from 'lucide-react';
import { DASHBOARD_MENU, normalizeRole } from '@/app/(Dashboard)/components/config/dashboardConfig';
import { useAuth } from '@/app/context/AuthContext';
import Loading from "@/app/components/global/Loading";

export default function DashboardSidebar({
    isSidebarOpen,
    setIsSidebarOpen,
    isExpanded,
    setIsExpanded
}) {
    const pathname = usePathname();
    const { user, loading, logOutUser } = useAuth();
    if (loading) return <Loading/>;

    // ✅ loading শেষে role নাও — default দিও না
    const role = normalizeRole(user?.role);
    const menuItems = DASHBOARD_MENU[role] || [];

    const isOpen = isExpanded || isSidebarOpen;
    const sidebarWidth = isOpen ? "280px" : "85px";

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 1024) setIsSidebarOpen(false);
        };
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, [setIsSidebarOpen]);

    return (
        <>
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            <aside
                style={{ width: sidebarWidth }}
                className={`fixed lg:sticky top-0 left-0 z-50 h-screen bg-card 
                    border-r border-accent-10 transition-all duration-300 ease-in-out 
                    shadow-sm flex flex-col
                    ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
            >
                <div className="flex flex-col h-full overflow-hidden">

                    {/* Logo + Toggle */}
                    <div className="p-6 flex items-center justify-between min-h-[90px]">
                        {isOpen ? (
                            <div className="text-2xl font-display font-black text-primary 
                                dark:text-accent truncate">
                                TerraShop
                            </div>
                        ) : (
                            <div className="text-2xl font-black text-primary mx-auto">T.</div>
                        )}
                        <button
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="hidden lg:flex p-2 rounded-xl bg-primary/10 text-primary 
                                hover:bg-primary hover:text-white transition-all active:scale-90"
                        >
                            {isExpanded ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
                        </button>
                    </div>

                    {/* ✅ Role Badge */}
                    {isOpen && user && (
                        <div className="px-4 pb-3">
                            <div className="flex items-center gap-2 bg-primary/5 rounded-xl px-3 py-2">
                                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center 
                                    justify-center text-primary font-bold text-sm uppercase">
                                    {user?.name?.[0] || "?"}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-heading truncate">
                                        {user?.name}
                                    </p>
                                    <span className={`text-xs font-semibold px-2 py-0.5 
                                        rounded-full capitalize
                                        ${role === 'admin' ? 'bg-red-100 text-red-600' : ''}
                                        ${role === 'vendor' ? 'bg-amber-100 text-amber-600' : ''}
                                        ${role === 'customer' ? 'bg-blue-100 text-blue-600' : ''}
                                        ${role === 'service' ? 'bg-green-100 text-green-600' : ''}
                                    `}>
                                        {role}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Navigation */}
                    <nav className="flex-1 px-3 space-y-1 mt-2 overflow-y-auto">
                        {menuItems.map((item, index) => {
                            const Icon = item.icon;
                            const isActive = pathname === item.path;

                            return (
                                <Link
                                    key={index}
                                    href={item.path}
                                    onClick={() => window.innerWidth < 1024 && setIsSidebarOpen(false)}
                                    className={`relative flex items-center gap-3 rounded-2xl 
                                        font-bold transition-all duration-200 group
                                        ${isOpen ? 'px-4 py-3' : 'px-3 py-3 justify-center'}
                                        ${isActive
                                            ? 'bg-primary text-white shadow-lg shadow-primary/20'
                                            : 'text-body hover:bg-primary/5 hover:text-primary'
                                        }`}
                                >
                                    <Icon size={22} className={`shrink-0
                                        ${isActive
                                            ? 'text-white'
                                            : 'text-body group-hover:text-primary'}`}
                                    />
                                    {isOpen && (
                                        <span className="truncate">{item.name}</span>
                                    )}
                                    {!isOpen && (
                                        <span className="absolute left-[70px] bg-heading text-white
                                            px-3 py-1.5 rounded-lg text-xs whitespace-nowrap
                                            opacity-0 group-hover:opacity-100 pointer-events-none 
                                            transition-opacity z-50 shadow-xl">
                                            {item.name}
                                        </span>
                                    )}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Logout */}
                    <div className="p-4 border-t border-accent-10">
                        <button
                            onClick={logOutUser}
                            className={`flex items-center gap-3 w-full rounded-2xl font-black
                                text-danger hover:bg-danger/10 transition-all
                                ${isOpen ? 'px-4 py-3' : 'px-3 py-3 justify-center'}`}
                        >
                            <LogOut size={22} />
                            {isOpen && <span>Logout</span>}
                        </button>
                    </div>
                </div>
            </aside>
        </>
    );
}