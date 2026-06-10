"use client";
import { useState } from "react";
import { MessageCircle, X, Bot, Headphones } from "lucide-react";
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
    // পুরো widget টা একটা portal-like div এ রাখো
    <div style={{ position: "fixed", bottom: 0, right: 0, zIndex: 9999 }}>

      {/* ── Chat Modal ── */}
      {isOpen && (
        <div
          style={{
            position: "absolute",
            bottom: "80px",
            right: "24px",
            width: "320px",
            height: "520px",
            backgroundColor: "#111827", // gray-900
            border: "1px solid #374151", // gray-700
            borderRadius: "16px",
            boxShadow: "0 25px 50px rgba(0,0,0,0.8)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            zIndex: 9999,
          }}
        >
          {/* Header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "12px 16px",
              backgroundColor: "#1f2937", // gray-800
              borderBottom: "1px solid #374151",
              flexShrink: 0,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  backgroundColor: "#2563eb",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <MessageCircle size={16} color="white" />
              </div>
              <div>
                <p style={{ color: "white", fontSize: "14px", fontWeight: 600, margin: 0 }}>
                  Live Support
                </p>
                <p style={{ color: "#9ca3af", fontSize: "12px", margin: 0 }}>
                  We're here to help!
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              style={{
                width: "28px",
                height: "28px",
                borderRadius: "8px",
                border: "none",
                backgroundColor: "transparent",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <X size={16} color="#9ca3af" />
            </button>
          </div>

          {/* Tab Switcher */}
          <div
            style={{
              display: "flex",
              backgroundColor: "#1f2937",
              padding: "8px 8px 0",
              gap: "4px",
              flexShrink: 0,
            }}
          >
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    padding: "8px 12px",
                    borderRadius: "8px 8px 0 0",
                    border: "none",
                    cursor: "pointer",
                    fontSize: "12px",
                    fontWeight: 500,
                    backgroundColor: isActive ? "#111827" : "transparent",
                    color: isActive ? "white" : "#9ca3af",
                  }}
                >
                  <Icon size={14} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Tab Content */}
          <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
            {activeTab === "admin" ? <AdminChat /> : <AiChat />}
          </div>
        </div>
      )}

      {/* ── Floating Button ── */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        style={{
          position: "absolute",
          bottom: "24px",
          right: "24px",
          width: "56px",
          height: "56px",
          borderRadius: "50%",
          backgroundColor: "#2563eb",
          border: "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 10px 25px rgba(37,99,235,0.5)",
          zIndex: 9999,
        }}
      >
        {isOpen ? (
          <X size={24} color="white" />
        ) : (
          <MessageCircle size={24} color="white" />
        )}
      </button>
    </div>
  );
}