'use client';
import { createContext, useContext, useEffect, useState, useCallback } from "react";
// ❌ useRouter import করবে না
import api from "../lib/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    // ❌ const router = useRouter();  -- এটা বাদ

    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isAuth, setIsAuth] = useState(false);
    const [sessions, setSessions] = useState([]);
    const [sessionsLoading, setSessionsLoading] = useState(false);
    const [revokingId, setRevokingId] = useState(null);

    const fetchUser = async () => {
        try {
            const { data } = await api.get("/api/auth/me");
            setUser(data.user);
            console.log("Fetched User:", data.user); // ✅ Debugging line
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

    // ✅ logout এ শুধু state clear করো, navigate করবে না
    const logOutUser = async () => {
        try {
            // ✅ আগে current session fetch করো
            const { data } = await api.get("/api/settings/sessions");
            const currentSession = data.sessions?.find(s => s.isCurrent);

            if (currentSession?.sessionId) {
                await api.delete(`/api/settings/sessions/${currentSession.sessionId}`);
            }
        } catch (e) {
            console.error("Logout error:", e);
        }
        setUser(null);
        setIsAuth(false);
        setSessions([]);
    };

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

    const logOutAllDevices = async () => {
        try {
            await api.delete("/api/settings/logout-all");
            setUser(null);
            setIsAuth(false);
            setSessions([]);
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
        <AuthContext.Provider value={{
            user, setUser, isAuth, loading,
            fetchUser, logOutUser, logOutAllDevices,
            sessions, sessionsLoading, revokingId,
            fetchSessions, revokeSession,
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error("useAuth must be used within AuthProvider");
    return context;
};