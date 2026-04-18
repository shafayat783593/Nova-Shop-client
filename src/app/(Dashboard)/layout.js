'use client';
import { useState, useEffect } from 'react';
import DashboardSidebar from './components/DashboardSidebar';
import DashboardHeader from './components/DashboardHeader';
import { useRouter, usePathname } from 'next/navigation'; // ✅ useRouter
import { useAuth } from '../context/AuthContext';
import Loading from '../components/global/Loading';

export default function DashboardLayout({ children }) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isExpanded, setIsExpanded] = useState(true);

    const { loading, isAuth } = useAuth();
    const pathname = usePathname();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !isAuth && pathname !== '/login') {
            router.replace(`/login?returnUrl=${encodeURIComponent(pathname)}`);
        }
    }, [loading, isAuth, pathname, router]);

    if (loading) return <Loading/>;

    // ✅ isAuth না হলে কিছু render করবে না (useEffect redirect করবে)
    if (!isAuth) return null;

    return (
        <div key={pathname} className="flex w-full min-h-screen bg-bg">
            <DashboardSidebar
                key={`sidebar-${pathname}`}
                isSidebarOpen={isSidebarOpen}
                setIsSidebarOpen={setIsSidebarOpen}
                isExpanded={isExpanded}
                setIsExpanded={setIsExpanded}
            />
            <div className="flex-1 flex flex-col min-w-0 transition-all duration-300">
                <DashboardHeader
                    key={pathname}
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
