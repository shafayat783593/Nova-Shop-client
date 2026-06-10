// app/admin/chat/page.jsx
"use client";
import { useState, useEffect, useRef } from "react";
import { Send, MessageCircle, User, Circle } from "lucide-react";
import { io } from "socket.io-client";
import { useAuth } from "@/app/context/AuthContext";
import api from "@/app/lib/api";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

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
    <div className="flex h-screen bg-gray-950 text-white">
      {/* ── Left: Conversation List ───────────── */}
      <div className="w-72 border-r border-gray-800 flex flex-col">
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
              className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-800 transition-colors text-left ${
                selectedConv?._id === conv._id ? "bg-gray-800" : ""
              }`}
            >
              {/* Avatar */}
              <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                <User className="w-5 h-5 text-white" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
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

      {/* ── Right: Chat Area ──────────────────── */}
      <div className="flex-1 flex flex-col">
        {selectedConv ? (
          <>
            {/* Chat Header */}
            <div className="flex items-center gap-3 px-5 py-3 border-b border-gray-800 bg-gray-900">
              <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="font-medium text-sm">
                  {selectedConv.customerId?.name || "Customer"}
                </p>
                <div className="flex items-center gap-1">
                  <Circle className="w-2 h-2 fill-emerald-400 text-emerald-400" />
                  <span className="text-xs text-emerald-400">Online</span>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              {messages.map((msg) => {
                const isAdmin =
                  msg.senderRole === "admin" || msg.senderRole === "owner";

                return (
                  <div
                    key={msg._id}
                    className={`flex ${isAdmin ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[65%] rounded-2xl px-4 py-2 text-sm ${
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
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-gray-800">
              <div className="flex items-center gap-2 bg-gray-800 rounded-xl px-3 py-2">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type your reply..."
                  className="flex-1 bg-transparent text-sm text-gray-100 placeholder-gray-500 outline-none"
                />
                <button
                  onClick={handleSend}
                  disabled={!inputText.trim()}
                  className="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-40 transition-colors"
                >
                  <Send className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>
          </>
        ) : (
          /* কোনো conversation select না হলে */
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <MessageCircle className="w-12 h-12 text-gray-700 mb-3" />
            <p className="text-gray-400">Select a conversation to start</p>
          </div>
        )}
      </div>
    </div>
  );
}