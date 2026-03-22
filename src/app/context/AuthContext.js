// context/AuthContext.js
"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "../lib/api";

const AuthContext = createContext(null);

// ✅ QueryClient একবার বানাও context এর বাইরে

    export const AuthProvider = ({ children }) => {
        const router = useRouter();
        const [user, setUser] = useState(null);
        const [loading, setLoading] = useState(true);
        const [isAuth, setIsAuth] = useState(false);

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

        const logOutUser = async () => {
            try {
                await api.post("/api/auth/logout");
                // ✅ Logout এ TanStack cache clear করো
                queryClient.clear();
                router.push("/login");
            } finally {
                setUser(null);
                setIsAuth(false);
            }
        };

        useEffect(() => {
            fetchUser();
        }, []);

    return (
        // ✅ QueryClientProvider এখানে wrap করো
       
            <AuthContext.Provider
                value={{ user, isAuth, loading, logOutUser, fetchUser }}
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