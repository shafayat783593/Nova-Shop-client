'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import api from "../lib/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const pathname = usePathname();
    const hasInitialized = useRef(false);

    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isAuth, setIsAuth] = useState(false);
    const [sessions, setSessions] = useState([]);
    const [sessionsLoading, setSessionsLoading] = useState(false);
    const [revokingId, setRevokingId] = useState(null);

    const fetchUser = useCallback(async ({ withLoading = false } = {}) => {
        if (withLoading) {
            setLoading(true);
        }

        
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
    }, []);

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

    const logOutUser = async () => {
        try {
            const { data } = await api.get("/api/settings/sessions");
            const currentSession = data.sessions?.find((session) => session.isCurrent);

            if (currentSession?.sessionId) {
                await api.delete(`/api/settings/sessions/${currentSession.sessionId}`);
            }
        } catch (error) {
            console.error("Logout error:", error);
        }

        setUser(null);
        setIsAuth(false);
        setSessions([]);
    };

    const revokeSession = async (sessionId) => {
        setRevokingId(sessionId);
        try {
            await api.delete(`/api/settings/sessions/${sessionId}`);
            setSessions((prev) => prev.filter((session) => session.sessionId !== sessionId));
            return { success: true };
        } catch (error) {
            return {
                success: false,
                message: error?.response?.data?.message || "Failed to revoke session",
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
        } catch (error) {
            return {
                success: false,
                message: error?.response?.data?.message || "Failed to logout",
            };
        }
    };

    useEffect(() => {
        fetchUser({ withLoading: !hasInitialized.current });
        hasInitialized.current = true;
    }, [fetchUser, pathname]);


    // existing useEffect-এর নিচে add করো
useEffect(() => {
    const handleForceLogout = () => {
        setUser(null);
        setIsAuth(false);
        setSessions([]);
    };
    window.addEventListener("auth:logout", handleForceLogout);
    return () => window.removeEventListener("auth:logout", handleForceLogout);
}, []);
    
    

    return (
        <AuthContext.Provider
            value={{
                user,
                setUser,
                isAuth,
                loading,
                fetchUser,
                logOutUser,
                logOutAllDevices,
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
