"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { io } from "socket.io-client";
import { useAuth } from "@/app/context/AuthContext";
import api from "@/lib/api";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export const useChat = () => {
  const { user } = useAuth(); // AuthContext থেকে user নাও
  const [messages, setMessages] = useState([]);
  const [conversation, setConversation] = useState(null);
  const [loading, setLoading] = useState(false);
  const socketRef = useRef(null);

  // Socket connect করো
  useEffect(() => {
    if (!user) return;

    socketRef.current = io(BACKEND_URL, { withCredentials: true });

    return () => {
      socketRef.current?.disconnect();
    };
  }, [user]);

  // Conversation load করো এবং socket room এ join করো
  const loadConversation = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data } = await api.get("/chat/my-conversation");

      if (data.data) {
        setConversation(data.data);

        // Socket room এ join করো
        socketRef.current?.emit("joinConversation", data.data._id);

        // এই conversation এর messages load করো
        await loadMessages(data.data._id);
      }
    } catch (err) {
      console.error("loadConversation error:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Messages load করো
  const loadMessages = async (conversationId) => {
    try {
      const { data } = await api.get(`/chat/messages/${conversationId}`);
      if (data.success) setMessages(data.data);
    } catch (err) {
      console.error("loadMessages error:", err);
    }
  };

  // Real-time নতুন message listen করো
  useEffect(() => {
    if (!socketRef.current) return;

    socketRef.current.on("newMessage", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    return () => {
      socketRef.current?.off("newMessage");
    };
  }, []);

  // Message পাঠাও
  const sendMessage = async (messageText) => {
    if (!messageText.trim()) return;

    try {
      const body = { message: messageText };

      // Admin হলে conversationId পাঠাতে হবে
      if (conversation && (user?.role === "admin" || user?.role === "owner")) {
        body.conversationId = conversation._id;
      }

      const { data } = await api.post("/chat/send", body);

      // প্রথম message হলে conversation set করো
      if (data.success && !conversation) {
        await loadConversation();
      }
    } catch (err) {
      console.error("sendMessage error:", err);
    }
  };

  return {
    user,
    messages,
    conversation,
    loading,
    loadConversation,
    sendMessage,
  };
};