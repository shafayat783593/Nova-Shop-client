// app/admin/chat/page.jsx
"use client";
import { useState, useEffect, useRef } from "react";
import { Send, MessageCircle, User, Circle, ArrowLeft } from "lucide-react";
import { io } from "socket.io-client";
import { useAuth } from "@/app/context/AuthContext";
import api from "@/app/lib/api";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

// ── ছোট্ট reusable Avatar component ──────────────
// avatar image থাকলে সেটা দেখাবে, না থাকলে fallback icon দেখাবে
function Avatar({ src, name, size = "w-10 h-10", iconSize = "w-5 h-5" }) {
  const [imgError, setImgError] = useState(false);

  if (src && !imgError) {
    return (
      <img
        src={src}
        alt={name || "User"}
        onError={() => setImgError(true)}
        className={`${size} rounded-full object-cover flex-shrink-0 bg-gray-700`}
      />
    );
  }

  return (
    <div
      className={`${size} rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0`}
    >
      <User className={`${iconSize} text-white`} />
    </div>
  );
}

export default function AdminChatPage() {
  const { user } = useAuth(); // AuthContext থেকে admin user নাও
  const [conversations, setConversations] = useState([]);
  const [selectedConv, setSelectedConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const socketRef = useRef(null);
  const bottomRef = useRef(null);

  // Socket setup
  useEffect(() => {
    if (!user) return;

    socketRef.current = io(BACKEND_URL, { withCredentials: true });

    // Admin room এ join করো
    socketRef.current.emit("joinAdminRoom");

    // নতুন customer message এলে conversations update করো
    socketRef.current.on("newCustomerMessage", ({ conversationId }) => {
      setConversations((prev) =>
        prev.map((c) =>
          c._id === conversationId
            ? { ...c, unreadCount: (c.unreadCount || 0) + 1 }
            : c
        )
      );
    });

    // Real-time messages
    socketRef.current.on("newMessage", (msg) => {
      // ✅ শুধু selected conversation এর message নাও
      setMessages((prev) => {
        if (!msg._id) return prev;
        const exists = prev.some(
          (m) => m._id?.toString() === msg._id?.toString()
        );
        if (exists) return prev;
        return [...prev, msg];
      });
    });

    return () => socketRef.current?.disconnect();
  }, [user]);

  // Scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // সব conversations load করো
  useEffect(() => {
    if (!user) return;
    const load = async () => {
      try {
        const { data } = await api.get("/api/chat/admin/conversations");
        if (data.success) setConversations(data.data);
      } catch (err) {
        console.error("load conversations error:", err);
      }
    };
    load();
  }, [user]);

  // একটি conversation select করো
  const selectConversation = async (conv) => {
    setSelectedConv(conv);

    // Socket room এ join
    socketRef.current?.emit("joinConversationAsAdmin", conv._id);

    try {
      // Messages load করো
      const { data } = await api.get(`/api/chat/messages/${conv._id}`);
      if (data.success) setMessages(data.data);

      // Read mark করো
      await api.patch(`/api/chat/admin/read/${conv._id}`);

      // Local state update
      setConversations((prev) =>
        prev.map((c) => (c._id === conv._id ? { ...c, unreadCount: 0 } : c))
      );
    } catch (err) {
      console.error("selectConversation error:", err);
    }
  };

  // মোবাইলে "back" button — conversation list এ ফিরে যাওয়ার জন্য
  const handleBack = () => {
    setSelectedConv(null);
    socketRef.current?.emit("leaveConversationAsAdmin", selectedConv?._id);
  };

  // Admin reply পাঠাও
  const handleSend = async () => {
    if (!inputText.trim() || !selectedConv) return;
    try {
      await api.post("/api/chat/send", {
        message: inputText,
        conversationId: selectedConv._id,
      });
      setInputText("");
    } catch (err) {
      console.error("handleSend error:", err);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex h-[100dvh] bg-gray-950 text-white overflow-hidden">
      {/* ── Left: Conversation List ─────────────────────
          মোবাইলে: conversation select না হলে পুরো width নিয়ে দেখাবে,
          select হলে সম্পূর্ণ hide হয়ে যাবে (md এ সবসময় visible) */}
      <div
        className={`${
          selectedConv ? "hidden md:flex" : "flex"
        } w-full md:w-72 lg:w-80 border-r border-gray-800 flex-col flex-shrink-0`}
      >
        <div className="p-4 border-b border-gray-800">
          <h2 className="font-semibold flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-blue-400" />
            Customer Chats
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 && (
            <p className="text-gray-500 text-sm text-center mt-8">
              No conversations yet
            </p>
          )}

          {conversations.map((conv) => (
            <button
              key={conv._id}
              onClick={() => selectConversation(conv)}
              className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-800 active:bg-gray-800 transition-colors text-left ${
                selectedConv?._id === conv._id ? "bg-gray-800" : ""
              }`}
            >
              {/* Avatar - customer এর profile image */}
              <Avatar
                src={conv.customerId?.avatar}
                name={conv.customerId?.name}
                size="w-11 h-11 md:w-10 md:h-10"
              />

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium truncate">
                    {conv.customerId?.name || "Customer"}
                  </span>
                  {/* Unread badge */}
                  {conv.unreadCount > 0 && (
                    <span className="w-5 h-5 bg-blue-600 rounded-full text-xs flex items-center justify-center flex-shrink-0">
                      {conv.unreadCount}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-400 truncate">
                  {conv.lastMessage || "No messages"}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ── Right: Chat Area ────────────────────────────
          মোবাইলে: conversation select হলেই শুধু দেখাবে */}
      <div
        className={`${
          selectedConv ? "flex" : "hidden md:flex"
        } flex-1 flex-col min-w-0`}
      >
        {selectedConv ? (
          <>
            {/* Chat Header */}
            <div className="flex items-center gap-2 md:gap-3 px-3 md:px-5 py-3 border-b border-gray-800 bg-gray-900 flex-shrink-0">
              {/* Back button — মোবাইল only */}
              <button
                onClick={handleBack}
                className="md:hidden p-1 -ml-1 rounded-lg hover:bg-gray-800 transition-colors flex-shrink-0"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>

              <Avatar
                src={selectedConv.customerId?.avatar}
                name={selectedConv.customerId?.name}
                size="w-9 h-9"
                iconSize="w-4 h-4"
              />

              <div className="min-w-0">
                <p className="font-medium text-sm truncate">
                  {selectedConv.customerId?.name || "Customer"}
                </p>
                <div className="flex items-center gap-1">
                  <Circle className="w-2 h-2 fill-emerald-400 text-emerald-400" />
                  <span className="text-xs text-emerald-400">Online</span>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 md:p-5 space-y-3">
              {messages.map((msg) => {
                const isAdmin =
                  msg.senderRole === "admin" || msg.senderRole === "owner";

                // মেসেজ কার পাঠানো তার উপর ভিত্তি করে avatar বাছাই
                const avatarSrc = isAdmin
                  ? msg.sender?.avatar || user?.avatar
                  : msg.sender?.avatar || selectedConv.customerId?.avatar;
                const avatarName = isAdmin
                  ? user?.name || "Admin"
                  : selectedConv.customerId?.name || "Customer";

                return (
                  <div
                    key={msg._id}
                    className={`flex items-end gap-2 ${
                      isAdmin ? "justify-end" : "justify-start"
                    }`}
                  >
                    {/* Customer এর message এর পাশে বাম দিকে ছোট avatar */}
                    {!isAdmin && (
                      <Avatar
                        src={avatarSrc}
                        name={avatarName}
                        size="w-6 h-6 md:w-7 md:h-7"
                        iconSize="w-3 h-3 md:w-4 md:h-4"
                      />
                    )}

                    <div
                      className={`max-w-[78%] sm:max-w-[65%] rounded-2xl px-4 py-2 text-sm break-words ${
                        isAdmin
                          ? "bg-blue-600 text-white rounded-br-sm"
                          : "bg-gray-800 text-gray-100 rounded-bl-sm"
                      }`}
                    >
                      <p>{msg.message}</p>
                      <p
                        className={`text-xs mt-1 ${
                          isAdmin ? "text-blue-200" : "text-gray-500"
                        }`}
                      >
                        {new Date(msg.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>

                    {/* Admin এর message এর পাশে ডান দিকে ছোট avatar */}
                    {isAdmin && (
                      <Avatar
                        src={avatarSrc}
                        name={avatarName}
                        size="w-6 h-6 md:w-7 md:h-7"
                        iconSize="w-3 h-3 md:w-4 md:h-4"
                      />
                    )}
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="p-3 md:p-4 border-t border-gray-800 flex-shrink-0 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] md:pb-4">
              <div className="flex items-center gap-2 bg-gray-800 rounded-xl px-3 py-2">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type your reply..."
                  className="flex-1 bg-transparent text-sm text-gray-100 placeholder-gray-500 outline-none min-w-0"
                />
                <button
                  onClick={handleSend}
                  disabled={!inputText.trim()}
                  className="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-40 transition-colors flex-shrink-0"
                >
                  <Send className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>
          </>
        ) : (
          /* কোনো conversation select না হলে (শুধু md+ স্ক্রিনে দেখাবে) */
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <MessageCircle className="w-12 h-12 text-gray-700 mb-3" />
            <p className="text-gray-400">Select a conversation to start</p>
          </div>
        )}
      </div>
    </div>
  );
}