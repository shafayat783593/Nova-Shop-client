'use client';
import { useState } from "react";
import DashboardSidebar from "./DashboardSidebar";
import DashboardHeader from "./DashboardHeader";

export default function DashboardUIWrapper({ children }) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isExpanded, setIsExpanded] = useState(true);

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
                <main className="flex-1 p-4 md:p-8">{children}</main>
            </div>
        </div>
    );
}