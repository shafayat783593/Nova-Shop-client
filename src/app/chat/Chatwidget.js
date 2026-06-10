"use client";
import { useState } from "react";
import { MessageCircle, X, Bot, Headphones } from "lucide-react";
import { useAuth } from "@/app/context/AuthContext";
import AdminChat from "./AdminChat";
import AiChat from "./AiChat";

// Tab গুলো define করা
const TABS = [
  { id: "admin", label: "Admin Chat", icon: Headphones },
  { id: "ai", label: "AI Chat", icon: Bot },
];

export default function ChatWidget() {
  const { user } = useAuth(); // AuthContext থেকে user নাও
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("admin");

  // Login না থাকলে widget দেখাবে না
  if (!user) return null;

  return (
    <>
      {/* ── Chat Modal ──────────────────────────── */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-80 h-[520px] bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-gray-800 border-b border-gray-700">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
                <MessageCircle className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">
                  Live Support
                </h3>
                <p className="text-xs text-gray-400">We're here to help!</p>
              </div>
            </div>

            {/* Close Button */}
            <button
              onClick={() => setIsOpen(false)}
              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-700 transition-colors"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </div>

          {/* Tab Switcher */}
          <div className="flex bg-gray-800 px-2 pt-2 gap-1">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-t-lg text-xs font-medium transition-colors ${
                    isActive
                      ? "bg-gray-900 text-white"
                      : "text-gray-400 hover:text-gray-200 hover:bg-gray-700/50"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-hidden">
            {/* AdminChat ও AiChat এর ভেতরে নিজেরাই useAuth/useChat ব্যবহার করে */}
            {activeTab === "admin" ? <AdminChat /> : <AiChat />}
          </div>
        </div>
      )}

      {/* ── Floating Button ──────────────────────── */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-blue-600 hover:bg-blue-500 rounded-full shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95"
      >
        {isOpen ? (
          <X className="w-6 h-6 text-white" />
        ) : (
          <MessageCircle className="w-6 h-6 text-white" />
        )}
      </button>
    </>
  );
}