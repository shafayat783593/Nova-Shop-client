'use client';
import { useState } from 'react';
import DashboardSidebar from './components/DashboardSidebar';
import DashboardHeader from './components/DashboardHeader';
import { redirect } from 'next/navigation';
import { useAuth } from '../context/AuthContext';

export default function DashboardLayout({ children }) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isExpanded, setIsExpanded] = useState(true);

    // ✅ তোমার context থেকে user ও role নাও
    const { user, loading, isAuth } = useAuth();

    // Loading state
    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-bg">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    // Auth check
    if (!isAuth) {
        redirect('/login');
    }

    return (
        <div className="flex w-full min-h-screen bg-bg">
            <DashboardSidebar
                isSidebarOpen={isSidebarOpen}
                setIsSidebarOpen={setIsSidebarOpen}
                isExpanded={isExpanded}
                setIsExpanded={setIsExpanded}
                role={user?.role}   // ✅ role পাঠাও
                user={user}         // ✅ user পাঠাও
            />
            <div className="flex-1 flex flex-col min-w-0 transition-all duration-300">
                <DashboardHeader
                    isSidebarOpen={isSidebarOpen}
                    setIsSidebarOpen={setIsSidebarOpen}
                    user={user}     // ✅ header-এও পাঠাও
                />
                <main className="flex-1 p-4 md:p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}