"use client";
import { useState, useEffect, useRef } from "react";
import { Send, Loader2, Headphones, User } from "lucide-react";
import { useChat } from "../context/usechat";
import Image from "next/image";

// ── ছোট্ট reusable Avatar — messenger এর মতো প্রোফাইল ছবি দেখানোর জন্য ──
// আসল avatar থাকলে ছবি দেখাবে, না থাকলে বা load fail করলে সুন্দর gradient icon fallback দেখাবে
function ChatAvatar({ src, name, fallbackIcon: FallbackIcon = User, size = "w-7 h-7" }) {
  const [imgError, setImgError] = useState(false);

if (src && !imgError) {
  return (
    <Image
      src={src}
      alt={name || "User"}
      width={48}
      height={48}
      onError={() => setImgError(true)}
      className={`${size} rounded-full object-cover flex-shrink-0 border border-white/10 shadow-sm`}
    />
  );
}

  return (
    <div
      className={`${size} rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center flex-shrink-0 shadow-sm`}
    >
      <FallbackIcon className="w-1/2 h-1/2 text-white" />
    </div>
  );
}

export default function AdminChat() {
  const [inputText, setInputText] = useState("");
  const bottomRef = useRef(null);

  // useChat এর ভেতরেই useAuth আছে, তাই বাইরে থেকে user পাঠাতে হবে না
  const { user, messages, conversation, loading, loadConversation, sendMessage } =
    useChat();

  // Component mount হলে conversation load করো
  useEffect(() => {
    loadConversation();
  }, [loadConversation]);

  // নতুন message আসলে নিচে scroll করো
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!inputText.trim()) return;
    const text = inputText;
    setInputText(""); // ✅ আগে ইনপুট ক্লিয়ার করো — instant feel এর জন্য
    await sendMessage(text);
  };

  // Enter চাপলে send হবে
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Support agent এর তথ্য (conversation.adminId এখন populate করা, name+avatar সহ)
  const agentName = conversation?.adminId?.name || "Support";
  const agentAvatar = conversation?.adminId?.avatar || null;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-700 flex items-center gap-2.5">
        <ChatAvatar
          src={agentAvatar}
          name={agentName}
          fallbackIcon={Headphones}
          size="w-8 h-8"
        />
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">{agentName}</p>
          <p className="text-xs text-gray-400 truncate">
            {conversation ? "Connected with support" : "Send a message to start chatting"}
          </p>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading && (
          <div className="flex justify-center pt-4">
            <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
          </div>
        )}

        {/* কোনো message না থাকলে */}
        {!loading && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center py-8">
            <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center mb-3">
              <Send className="w-5 h-5 text-blue-400" />
            </div>
            <p className="text-gray-400 text-sm">No messages yet</p>
            <p className="text-gray-500 text-xs mt-1">
              Send a message to get started
            </p>
          </div>
        )}

        {/* Message List */}
        {messages.map((msg) => {
          const isMe = msg.senderRole === user?.role;

          // isMe হলে নিজের avatar দেখাও, না হলে support agent এর avatar
          const avatarSrc = isMe ? user?.avatar : msg.sender?.avatar || agentAvatar;
          const avatarName = isMe ? user?.name : msg.sender?.name || agentName;

          return (
            <div
              key={msg._id}
              className={`flex items-end gap-2 ${isMe ? "justify-end" : "justify-start"}`}
            >
              {/* Support/Admin এর message এর বাম পাশে avatar */}
              {!isMe && (
                <ChatAvatar
                  src={avatarSrc}
                  name={avatarName}
                  fallbackIcon={Headphones}
                />
              )}

              <div
                className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${
                  isMe
                    ? "bg-blue-600 text-white rounded-br-sm"
                    : "bg-gray-700 text-gray-100 rounded-bl-sm"
                }`}
              >
                <p>{msg.message}</p>
                <p
                  className={`text-xs mt-1 ${
                    isMe ? "text-blue-200" : "text-gray-400"
                  }`}
                >
                  {new Date(msg.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>

              {/* নিজের message এর ডান পাশে avatar */}
              {isMe && (
                <ChatAvatar src={avatarSrc} name={avatarName} fallbackIcon={User} />
              )}
            </div>
          );
        })}

        {/* Auto scroll anchor */}
        <div ref={bottomRef} />
      </div>

      {/* Input Area */}
      <div className="p-3 border-t border-gray-700">
        <div className="flex items-center gap-2 bg-gray-700/50 rounded-xl px-3 py-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            className="flex-1 bg-transparent text-sm text-gray-100 placeholder-gray-500 outline-none"
          />
          <button
            onClick={handleSend}
            disabled={!inputText.trim()}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}