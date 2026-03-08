"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "../lib/api";

const AuthContext = createContext(null);

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
        } catch {
            setUser(null);
            setIsAuth(false);
        } finally {
            setLoading(false);
        }
    };

    const logOutUser = async () => {
        try {
            await api.post("/api/auth/logout");
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
        <AuthContext.Provider
            value={{ user, isAuth, loading, logOutUser, fetchUser }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within AuthProvider");
    }
    return context;
};