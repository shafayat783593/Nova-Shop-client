"use client";

import { createContext, useContext, useEffect, useReducer, useCallback } from "react";
import api from "@/app/lib/api";
import { useAuth } from "./AuthContext";

const INIT = "INIT";
const SET = "SET";
const CLEAR = "CLEAR";
const ADDING = "ADDING";

const initialState = {
    cart: null,
    loading: true,
    adding: false,
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

// ── Session ID ────────────────────────────────────────────────────────────────
const getSessionId = () => typeof window !== "undefined" ? localStorage.getItem("cart_session_id") : null;
const saveSessionId = (id) => typeof window !== "undefined" && localStorage.setItem("cart_session_id", id);
const clearSessionId = () => typeof window !== "undefined" && localStorage.removeItem("cart_session_id");

function cartHeaders() {
    const sid = getSessionId();
    console.log("Getting cart headers, sessionId:", sid);
    return sid ? { "x-session-id": sid } : {};
}

const CartContext = createContext(null);

export function CartProvider({ children }) {
    const [state, dispatch] = useReducer(reducer, initialState);
    const { user, isAuth } = useAuth();

    // ── fetchCart ─────────────────────────────────────────────────────────────
    const fetchCart = useCallback(async () => {
        try {
            const headers = cartHeaders();
            console.log("=== CART FETCH ===");
            console.log("isAuth:", isAuth);
            console.log("sessionId header:", headers);
            console.log("localStorage session:", localStorage.getItem("cart_session_id"));

            const { data } = await api.get("/api/product/cart", { headers });
            console.log("Cart response:", data);
            dispatch({ type: SET, payload: data.data });
        } catch (err) {
            console.error("Cart fetch error:", err.response?.data || err.message);
            dispatch({ type: INIT });
        }
    }, []);

    // Fetch on mount AND whenever auth state changes
    useEffect(() => {
        fetchCart();
    }, [fetchCart, isAuth]); // ← isAuth যোগ: login/logout এ re-fetch

    // ── Merge guest cart after login ──────────────────────────────────────────
    useEffect(() => {
        if (!isAuth || !user) return;
        const sid = getSessionId();
        if (!sid) return;

        (async () => {
            try {
                await api.post("/api/product/cart/merge", { sessionId: sid });
                clearSessionId();
            } catch {
                // merge fail হলেও cart fetch করো
            }
            await fetchCart();
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAuth]); // fetchCart intentionally omitted — infinite loop এড়াতে

    // ── addToCart ─────────────────────────────────────────────────────────────
    const addToCart = useCallback(async ({ productId, variantId, quantity = 1 }) => {
        dispatch({ type: ADDING, payload: true });
        try {
            const { data } = await api.post(
                "/api/product/cart/add",
                { productId, variantId, quantity },
                { headers: cartHeaders() }
            );
            if (data.sessionId) saveSessionId(data.sessionId);
            dispatch({ type: SET, payload: data.data });
            return { success: true };
        } catch (err) {
            dispatch({ type: ADDING, payload: false });
            return { success: false, message: err.response?.data?.message || "Failed to add" };
        }
    }, []);

    // ── updateQty ─────────────────────────────────────────────────────────────
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

    // ── removeItem ────────────────────────────────────────────────────────────
    const removeItem = useCallback(async (itemId) => {
        try {
            const { data } = await api.delete(
                `/api/product/cart/item/${itemId}`,
                { headers: cartHeaders() }
            );
            dispatch({ type: SET, payload: data.data });
        } catch { }
    }, []);

    // ── clearCart ─────────────────────────────────────────────────────────────
    const clearCart = useCallback(async () => {
        try {
            await api.delete("/api/product/cart", { headers: cartHeaders() });
            dispatch({ type: CLEAR });
        } catch { }
    }, []);

    // ── applyCoupon ───────────────────────────────────────────────────────────
    const applyCoupon = useCallback(async (code) => {
        try {
            const { data } = await api.post(
                "/api/product/cart/coupon",
                { code },
                { headers: cartHeaders() }
            );
            dispatch({ type: SET, payload: data.data });
            return { success: true };
        } catch (err) {
            return { success: false, message: err.response?.data?.message || "Invalid coupon" };
        }
    }, []);

    // ── removeCoupon ──────────────────────────────────────────────────────────
    const removeCoupon = useCallback(async () => {
        try {
            const { data } = await api.delete(
                "/api/product/cart/coupon",
                { headers: cartHeaders() }
            );
            dispatch({ type: SET, payload: data.data });
        } catch { }
    }, []);

    return (
        <CartContext.Provider value={{
            cart: state.cart,
            loading: state.loading,
            adding: state.adding,
            itemCount: state.cart?.totalItems || 0,
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