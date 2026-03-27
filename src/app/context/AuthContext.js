"use client";
import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import api from "../lib/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isAuth, setIsAuth] = useState(false);

    // ── Sessions state ─────────────────────────────
    const [sessions, setSessions] = useState([]);
    const [sessionsLoading, setSessionsLoading] = useState(false);
    const [revokingId, setRevokingId] = useState(null);

    // ── Fetch current user ─────────────────────────
    const fetchUser = async () => {
        try {
            const { data } = await api.get("/api/auth/me");
            setUser(data.user);
            setIsAuth(true);
            return data.user;
        } catch {
            setUser(null);
            setIsAuth(false);
            return null;
        } finally {
            setLoading(false);
        }
    };

    // ── Fetch all sessions ─────────────────────────
    const fetchSessions = useCallback(async () => {
        setSessionsLoading(true);
        try {
            const { data } = await api.get("/api/settings/sessions");
            setSessions(data.sessions || []);
        } catch {
            setSessions([]);
        } finally {
            setSessionsLoading(false);
        }
    }, []);

    // ── Logout current session (single device) ─────
    const logOutUser = async () => {
        // current session এর sessionId বের করো
        const currentSession = sessions.find(s => s.isCurrent);
        try {
            if (currentSession?.sessionId) {
                await api.delete(`/api/settings/sessions/${currentSession.sessionId}`);
            }
        } finally {
            setUser(null);
            setIsAuth(false);
            setSessions([]);
            router.push("/login");
        }
    };

    // ── Revoke a specific session ──────────────────
    const revokeSession = async (sessionId) => {
        setRevokingId(sessionId);
        try {
            await api.delete(`/api/settings/sessions/${sessionId}`);
            setSessions(prev => prev.filter(s => s.sessionId !== sessionId));
            return { success: true };
        } catch (e) {
            return {
                success: false,
                message: e?.response?.data?.message || "Failed to revoke session"
            };
        } finally {
            setRevokingId(null);
        }
    };

    // ── Logout from ALL devices ────────────────────
    const logOutAllDevices = async () => {
        try {
            await api.delete("/api/settings/logout-all");
            setUser(null);
            setIsAuth(false);
            setSessions([]);
            router.push("/login");
            return { success: true };
        } catch (e) {
            return {
                success: false,
                message: e?.response?.data?.message || "Failed to logout"
            };
        }
    };

    useEffect(() => {
        fetchUser();
    }, []);

    return (
        <AuthContext.Provider
            value={{
                // ── Auth ──────────────────────────
                user,
                setUser,
                isAuth,
                loading,
                fetchUser,
                logOutUser,
                logOutAllDevices,
                // ── Sessions ─────────────────────
                sessions,
                sessionsLoading,
                revokingId,
                fetchSessions,
                revokeSession,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error("useAuth must be used within AuthProvider");
    return context;
};