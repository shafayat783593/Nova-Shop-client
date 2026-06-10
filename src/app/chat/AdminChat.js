"use client";
import { useState, useEffect, useRef } from "react";
import { Send, Loader2 } from "lucide-react";
import { useChat } from "@/hooks/useChat";

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
    await sendMessage(inputText);
    setInputText("");
  };

  // Enter চাপলে send হবে
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-700">
        <p className="text-sm text-gray-400">
          {conversation
            ? "Connected with support"
            : "Send a message to start chatting"}
        </p>
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

          return (
            <div
              key={msg._id}
              className={`flex ${isMe ? "justify-end" : "justify-start"}`}
            >
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