"use client";

// ─── CartContext ──────────────────────────────────────────────────────────────
// Wrap your app with <CartProvider>
// Use the useCart() hook anywhere

import { createContext, useContext, useEffect, useReducer, useCallback } from "react";
import api from "@/app/lib/api";
import { useAuth } from "./AuthContext";

// ── Types ──────────────────────────────────────────────────────────────────
const INIT = "INIT";
const SET = "SET";
const CLEAR = "CLEAR";
const ADDING = "ADDING";

const initialState = {
    cart: null,
    loading: true,
    adding: false,   // item being added (show spinner on button)
};

function reducer(state, action) {
    switch (action.type) {
        case INIT: return { ...state, loading: false };
        case SET: return { ...state, cart: action.payload, loading: false, adding: false };
        case CLEAR: return { ...state, cart: null, loading: false };
        case ADDING: return { ...state, adding: action.payload };
        default: return state;
    }
}

// ── Session ID helpers ────────────────────────────────────────────────────
function getSessionId() {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("cart_session_id");
}
function saveSessionId(id) {
    if (typeof window !== "undefined") localStorage.setItem("cart_session_id", id);
}
function clearSessionId() {
    if (typeof window !== "undefined") localStorage.removeItem("cart_session_id");
}

// ── Axios header helper ────────────────────────────────────────────────────
function cartHeaders() {
    const sid = getSessionId();
    return sid ? { "x-session-id": sid } : {};
}

// ── Context ────────────────────────────────────────────────────────────────
const CartContext = createContext(null);

export function CartProvider({ children }) {
    const [state, dispatch] = useReducer(reducer, initialState);
    const { user, isAuth } = useAuth()
    // Fetch cart on mount
    const fetchCart = useCallback(async () => {
        try {
            const { data } = await api.get("/api/product/cart", { headers: cartHeaders() });
            dispatch({ type: SET, payload: data.data });
        } catch {
            dispatch({ type: INIT });
        }
    }, []);

    useEffect(() => { fetchCart(); }, [fetchCart]);

    // Merge guest cart after login
    useEffect(() => {
        if (!isAuth || !user) return;
        const sid = getSessionId();
        if (!sid) return;
        (async () => {
            await api.post("/api/product/cart/merge", { sessionId: sid });
            clearSessionId();
            await fetchCart();
        })();
    }, [isAuth]);

    // ── addToCart ────────────────────────────────────────────────────────
    const addToCart = useCallback(async ({ productId, variantId, quantity = 1 }) => {
        dispatch({ type: ADDING, payload: true });
        try {
            const { data } = await api.post(
                "/api/product/cart/add",
                { productId, variantId, quantity },
                { headers: cartHeaders() }
            );
            // Save new sessionId if backend created one
            if (data.sessionId) saveSessionId(data.sessionId);
            dispatch({ type: SET, payload: data.data });
            return { success: true };
        } catch (err) {
            dispatch({ type: ADDING, payload: false });
            return { success: false, message: err.response?.data?.message || "Failed to add" };
        }
    }, []);

    // ── updateQty ────────────────────────────────────────────────────────
    const updateQty = useCallback(async (itemId, quantity) => {
        try {
            const { data } = await api.patch(
                `/api/product/cart/item/${itemId}`,
                { quantity },
                { headers: cartHeaders() }
            );
            dispatch({ type: SET, payload: data.data });
        } catch { }
    }, []);

    // ── removeItem ───────────────────────────────────────────────────────
    const removeItem = useCallback(async (itemId) => {
        try {
            const { data } = await api.delete(`/api/product/cart/item/${itemId}`, { headers: cartHeaders() });
            dispatch({ type: SET, payload: data.data });
        } catch { }
    }, []);

    // ── clearCart ────────────────────────────────────────────────────────
    const clearCart = useCallback(async () => {
        try {
            await api.delete("/api/product/cart", { headers: cartHeaders() });
            dispatch({ type: CLEAR });
        } catch { }
    }, []);

    // ── applyCoupon ──────────────────────────────────────────────────────
    const applyCoupon = useCallback(async (code) => {
        try {
            const { data } = await api.post("/api/product/cart/coupon", { code }, { headers: cartHeaders() });
            dispatch({ type: SET, payload: data.data });
            return { success: true };
        } catch (err) {
            return { success: false, message: err.response?.data?.message || "Invalid coupon" };
        }
    }, []);

    // ── removeCoupon ─────────────────────────────────────────────────────
    const removeCoupon = useCallback(async () => {
        try {
            const { data } = await api.delete("/api/product/cart/coupon", { headers: cartHeaders() });
            dispatch({ type: SET, payload: data.data });
        } catch { }
    }, []);

    const itemCount = state.cart?.totalItems || 0;

    return (
        <CartContext.Provider value={{
            cart: state.cart,
            loading: state.loading,
            adding: state.adding,
            itemCount,
            addToCart,
            updateQty,
            removeItem,
            clearCart,
            applyCoupon,
            removeCoupon,
            refetch: fetchCart,
        }}>
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const ctx = useContext(CartContext);
    if (!ctx) throw new Error("useCart must be used within <CartProvider>");
    return ctx;
}