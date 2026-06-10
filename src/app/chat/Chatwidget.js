"use client";

import { useState } from "react";
import { MessageCircle, X, Bot, Headphones, Sparkles, Zap } from "lucide-react";
import { useAuth } from "@/app/context/AuthContext";
import AdminChat from "./AdminChat";
import AiChat from "./AiChat";

const TABS = [
  { id: "admin", label: "Admin Chat", icon: Headphones },
  { id: "ai", label: "AI Chat", icon: Bot },
];

export default function ChatWidget() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("admin");

  if (!user) return null;

  return (
    <div className="fixed bottom-0 right-0 z-50">
      {/* Chat Modal */}
      {isOpen && (
        <div className="absolute bottom-24 right-6 w-[360px] h-[560px] bg-card rounded-2xl shadow-2xl border border-accent/30 flex flex-col overflow-hidden animate-slide-up">
          
          {/* Header - Elegant Gradient */}
          <div className="relative bg-gradient-to-br from-primary via-primary to-secondary px-5 py-4 overflow-hidden">
            {/* Decorative Blobs */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-white/5 rounded-full blur-2xl" />
            
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg border border-white/30">
                    <MessageCircle size={18} className="text-white" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-success rounded-full border-2 border-white animate-pulse" />
                </div>
                <div>
                  <p className="text-white font-display font-semibold text-[15px] flex items-center gap-2">
                    Live Support
                    <span className="text-[9px] bg-white/20 px-2 py-0.5 rounded-full font-normal">24/7</span>
                  </p>
                  <p className="text-white/75 text-[11px]">We're here to help! ✨</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-xl hover:bg-white/15 transition-all duration-300 flex items-center justify-center text-white/70 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Tab Switcher - Glass Morphism */}
          <div className="relative flex gap-1 px-4 pt-3 pb-0 bg-card/50 backdrop-blur-sm border-b border-accent/15">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    relative flex-1 flex items-center justify-center gap-2.5 py-2.5 px-3 rounded-t-xl font-medium text-sm transition-all duration-300
                    ${isActive 
                      ? "text-primary bg-card shadow-sm" 
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/5"
                    }
                  `}
                >
                  <Icon size={15} className={`transition-all duration-300 ${isActive ? "text-primary scale-110" : ""}`} />
                  <span className="text-xs font-medium">{tab.label}</span>
                  {isActive && (
                    <div className="absolute -bottom-px left-2 right-2 h-0.5 bg-gradient-to-r from-primary/0 via-primary to-primary/0 rounded-full" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-hidden bg-card/30">
            {activeTab === "admin" ? <AdminChat /> : <AiChat />}
          </div>

          {/* Footer */}
          <div className="px-4 py-2.5 bg-gradient-to-r from-primary/5 to-secondary/5 border-t border-accent/10 text-center">
            <p className="text-[10px] text-muted-foreground/70 flex items-center justify-center gap-1.5">
              <Zap size={10} className="text-primary" />
              Secure encrypted chat
              <Sparkles size={10} className="text-primary" />
            </p>
          </div>
        </div>
      )}

      {/* Floating Button - Modern Design */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="group relative m-6 w-14 h-14 rounded-full bg-gradient-to-br from-primary to-secondary shadow-xl hover:shadow-2xl transition-all duration-500 flex items-center justify-center cursor-pointer"
      >
        {/* Outer Ring Animation */}
        <div className="absolute inset-0 rounded-full bg-primary/40 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        {/* Pulse Effect */}
        {!isOpen && (
          <div className="absolute inset-0 rounded-full bg-primary/50 animate-ping-slow" />
        )}
        
        {/* Inner Gradient Overlay */}
        <div className="absolute inset-[2px] rounded-full bg-gradient-to-br from-primary to-secondary opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        {/* Icon Container */}
        <div className="relative z-10 transition-transform duration-500 group-hover:scale-110">
          {isOpen ? (
            <X size={24} className="text-white drop-shadow-md" />
          ) : (
            <>
              <MessageCircle size={24} className="text-white drop-shadow-md" />
              {/* Notification Dot */}
              <span className="absolute -top-2 -right-2 w-3.5 h-3.5 bg-danger rounded-full border-2 border-white animate-bounce">
                <span className="absolute inset-0 rounded-full bg-danger animate-ping" />
              </span>
            </>
          )}
        </div>

        {/* Tooltip on Hover */}
        {!isOpen && (
          <div className="absolute right-full mr-3 px-3 py-1.5 bg-card/95 backdrop-blur-sm text-foreground text-xs font-medium rounded-lg shadow-lg border border-accent/20 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0 pointer-events-none">
            💬 Need help?
          </div>
        )}
      </button>
    </div>
  );
}