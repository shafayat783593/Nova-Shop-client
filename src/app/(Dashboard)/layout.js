'use client';
import { useState, useEffect } from 'react';
import DashboardSidebar from './components/DashboardSidebar';
import DashboardHeader from './components/DashboardHeader';
import { useRouter, usePathname } from 'next/navigation'; // ✅ useRouter
import { useAuth } from '../context/AuthContext';

export default function DashboardLayout({ children }) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isExpanded, setIsExpanded] = useState(true);

    const { loading, isAuth } = useAuth();
    const pathname = usePathname();
    const router = useRouter();

    useEffect(() => {
        // ✅ loading শেষ হলে তারপর check করো
        if (!loading && !isAuth) {
            router.replace(`/login?returnUrl=${encodeURIComponent(pathname)}`);
        }
    }, [loading, isAuth, pathname, router]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-bg">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    // ✅ isAuth না হলে কিছু render করবে না (useEffect redirect করবে)
    if (!isAuth) return null;

    return (
        <div className="flex w-full min-h-screen bg-bg">
            <DashboardSidebar
                isSidebarOpen={isSidebarOpen}
                setIsSidebarOpen={setIsSidebarOpen}
                isExpanded={isExpanded}
                setIsExpanded={setIsExpanded}
            />
            <div className="flex-1 flex flex-col min-w-0 transition-all duration-300">
                <DashboardHeader
                    isSidebarOpen={isSidebarOpen}
                    setIsSidebarOpen={setIsSidebarOpen}
                />
                <main className="flex-1 p-4 md:p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}