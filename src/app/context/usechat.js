"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { io } from "socket.io-client";
import { useAuth } from "@/app/context/AuthContext";
import api from "../lib/api";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

export const useChat = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [conversation, setConversation] = useState(null);
  const [loading, setLoading] = useState(false);
  const socketRef = useRef(null);
  const conversationRef = useRef(null); // ✅ stale closure এড়াতে

  // conversation state আর ref দুটো sync রাখো
  const setConversationSync = (conv) => {
    conversationRef.current = conv;
    setConversation(conv);
  };

  // Socket setup — একবারই connect
  useEffect(() => {
    if (!user) return;

    const socket = io(BACKEND_URL, { withCredentials: true });
    socketRef.current = socket;

    socket.on("newMessage", (msg) => {
      setMessages((prev) => {
        const exists = prev.some(
          (m) => m._id?.toString() === msg._id?.toString()
        );
        if (exists) return prev;
        return [...prev, msg];
      });
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user]);

  // Messages load
  const loadMessages = useCallback(async (conversationId) => {
    try {
      const { data } = await api.get(`/api/chat/messages/${conversationId}`);
      if (data.success) setMessages(data.data);
    } catch (err) {
      console.error("loadMessages error:", err);
    }
  }, []);

  // Initial conversation load (component mount এ একবার)
  const loadConversation = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data } = await api.get("/api/chat/my-conversation");

      if (data.data) {
        setConversationSync(data.data);

        // ✅ socket ready হওয়া পর্যন্ত wait করো তারপর join
        const joinRoom = () => {
          socketRef.current?.emit("joinConversation", data.data._id);
        };

        if (socketRef.current?.connected) {
          joinRoom();
        } else {
          socketRef.current?.once("connect", joinRoom);
        }

        await loadMessages(data.data._id);
      }
    } catch (err) {
      console.error("loadConversation error:", err);
    } finally {
      setLoading(false);
    }
  }, [user, loadMessages]);

  // Message পাঠাও
  const sendMessage = useCallback(async (messageText) => {
    if (!messageText.trim()) return;

    const currentConv = conversationRef.current; // ✅ ref থেকে নাও, stale closure নয়

    try {
      const body = { message: messageText };

      if (currentConv) {
        // admin/owner হলে conversationId পাঠাও
        if (user?.role === "admin" || user?.role === "owner") {
          body.conversationId = currentConv._id;
        }
      }

      const { data } = await api.post("/api/chat/send", body) ;

      if (data.success) {
        if (!currentConv && data.conversationId) {
          // ✅ প্রথম message — conversation set করো এবং room join করো
          const newConv = { _id: data.conversationId };
          setConversationSync(newConv);

          // socket room এ join করো
          if (socketRef.current?.connected) {
            socketRef.current.emit("joinConversation", data.conversationId);
          } else {
            socketRef.current?.once("connect", () => {
              socketRef.current?.emit("joinConversation", data.conversationId);
            });
          }

          // ✅ loadConversation() আর call করছি না — এটাই race condition এর কারণ ছিল
          // শুধু full conversation data fetch করো (optional)
          try {
            const { data: convData } = await api.get("/api/chat/my-conversation");
            if (convData.data) setConversationSync(convData.data);
          } catch (_) {}
        }
      }
    } catch (err) {
      console.error("sendMessage error:", err);
    }
  }, [user]);

  return {
    user,
    messages,
    conversation,
    loading,
    loadConversation,
    sendMessage,
  };
};