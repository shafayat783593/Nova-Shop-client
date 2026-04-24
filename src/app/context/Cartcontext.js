"use client";

import {
    createContext, useContext, useEffect, useReducer, useCallback, useRef
} from "react";
import api from "@/app/lib/api";
import { useAuth } from "./AuthContext";

const LS_KEY = "guest_cart";

function loadGuestCart() {
    if (typeof window === "undefined") return [];
    try { return JSON.parse(localStorage.getItem(LS_KEY) || "[]"); }
    catch { return []; }
}
function saveGuestCart(items) {
    if (typeof window !== "undefined") localStorage.setItem(LS_KEY, JSON.stringify(items));
}
function clearGuestCart() {
    if (typeof window !== "undefined") localStorage.removeItem(LS_KEY);
}
function buildGuestCartObject(items) {
    const subtotal = items.reduce((s, i) => s + i.priceAtAdd * i.quantity, 0);
    return {
        items, subtotal, discount: 0,
        shippingFee: items.length ? 80 : 0,
        total: items.length ? subtotal + 80 : 0,
        totalItems: items.reduce((s, i) => s + i.quantity, 0),
        isGuest: true,
    };
}

const initialState = { cart: null, loading: true, adding: false };

function reducer(state, action) {
    switch (action.type) {
        case "SET": return { ...state, cart: action.payload, loading: false, adding: false };
        case "CLEAR": return { ...state, cart: null, loading: false };
        case "INIT": return { ...state, loading: false };
        case "ADDING": return { ...state, adding: action.payload };
        default: return state;
    }
}

const CartContext = createContext(null);

export function CartProvider({ children }) {
    const [state, dispatch] = useReducer(reducer, initialState);
    const { isAuth, loading: authLoading } = useAuth(); // ← authLoading নাও
    const prevIsAuth = useRef(null);
    const initialized = useRef(false);

    // ── fetchCart ──────────────────────────────────────────────────────────
    const fetchCart = useCallback(async (forceLoggedIn) => {
        const loggedIn = forceLoggedIn !== undefined ? forceLoggedIn : isAuth;

        if (loggedIn) {
            try {
                const { data } = await api.get("/api/product/cart");
                dispatch({ type: "SET", payload: data.data });
            } catch {
                dispatch({ type: "INIT" });
            }
        } else {
            const items = loadGuestCart();
            items.length
                ? dispatch({ type: "SET", payload: buildGuestCartObject(items) })
                : dispatch({ type: "INIT" });
        }
    }, [isAuth]);

    // ── authLoading শেষ হলে একবার fetch করো ──────────────────────────────
    useEffect(() => {
        if (authLoading) return;           // auth এখনো load হচ্ছে → wait
        if (initialized.current) return;   // already done → skip
        initialized.current = true;
        fetchCart(isAuth);                 // isAuth এর সঠিক value দিয়ে call
    }, [authLoading, isAuth, fetchCart]);

    // ── login/logout হলে ───────────────────────────────────────────────────
    useEffect(() => {
        if (authLoading) return;
        if (prevIsAuth.current === null) {
            prevIsAuth.current = isAuth;
            return;
        }
        if (prevIsAuth.current === isAuth) return;

        const wasAuth = prevIsAuth.current;
        prevIsAuth.current = isAuth;

        if (isAuth && !wasAuth) {
            // Login হলো → merge করে DB cart আনো
            mergeGuestToServer().then(() => fetchCart(true));
        } else if (!isAuth && wasAuth) {
            // Logout হলো → guest cart দেখাও
            const items = loadGuestCart();
            items.length
                ? dispatch({ type: "SET", payload: buildGuestCartObject(items) })
                : dispatch({ type: "CLEAR" });
        }
    }, [isAuth, authLoading, fetchCart]);

    // ── merge guest → server ───────────────────────────────────────────────
    async function mergeGuestToServer() {
        const guestItems = loadGuestCart();
        if (!guestItems.length) return;
        try {
            for (const item of guestItems) {
                await api.post("/api/product/cart/add", {
                    productId: item.productId,
                    variantId: item.variantId || undefined,
                    quantity: item.quantity,
                });
            }
            clearGuestCart();
        } catch (err) {
            console.error("Cart merge failed:", err);
        }
    }

    // ── addToCart ──────────────────────────────────────────────────────────
    const addToCart = useCallback(async ({ productId, variantId, quantity = 1, product }) => {
        dispatch({ type: "ADDING", payload: true });

        if (isAuth) {
            try {
                const { data } = await api.post("/api/product/cart/add", { productId, variantId, quantity });
                dispatch({ type: "SET", payload: data.data });
                return { success: true };
            } catch (err) {
                dispatch({ type: "ADDING", payload: false });
                return { success: false, message: err.response?.data?.message || "Failed" };
            }
        } else {
            const items = loadGuestCart();
            const idx = items.findIndex(i =>
                i.productId === productId &&
                (variantId ? i.variantId === variantId : !i.variantId)
            );
            if (idx > -1) {
                items[idx].quantity += quantity;
            } else {
                items.push({
                    _id: Date.now().toString(),
                    productId,
                    variantId: variantId || null,
                    nameSnapshot: product?.name || "Product",
                    imageSnapshot: product?.images?.[0] || "",
                    priceAtAdd: product?.price || 0,
                    finalPrice: product?.price || 0,
                    quantity,
                    isAvailable: true,
                });
            }
            saveGuestCart(items);
            dispatch({ type: "SET", payload: buildGuestCartObject(items) });
            dispatch({ type: "ADDING", payload: false });
            return { success: true };
        }
    }, [isAuth]);

    // ── updateQty ──────────────────────────────────────────────────────────
    const updateQty = useCallback(async (itemId, quantity) => {
        if (isAuth) {
            try {
                const { data } = await api.patch(`/api/product/cart/item/${itemId}`, { quantity });
                dispatch({ type: "SET", payload: data.data });
            } catch { }
        } else {
            const items = loadGuestCart().map(i => i._id === itemId ? { ...i, quantity } : i);
            saveGuestCart(items);
            dispatch({ type: "SET", payload: buildGuestCartObject(items) });
        }
    }, [isAuth]);

    // ── removeItem ─────────────────────────────────────────────────────────
    const removeItem = useCallback(async (itemId) => {
        if (isAuth) {
            try {
                const { data } = await api.delete(`/api/product/cart/item/${itemId}`);
                dispatch({ type: "SET", payload: data.data });
            } catch { }
        } else {
            const items = loadGuestCart().filter(i => i._id !== itemId);
            saveGuestCart(items);
            items.length
                ? dispatch({ type: "SET", payload: buildGuestCartObject(items) })
                : dispatch({ type: "CLEAR" });
        }
    }, [isAuth]);

    // ── clearCart ──────────────────────────────────────────────────────────
    const clearCart = useCallback(async () => {
        if (isAuth) {
            try { await api.delete("/api/product/cart"); } catch { }
        }
        clearGuestCart();
        dispatch({ type: "CLEAR" });
    }, [isAuth]);

    return (
        <CartContext.Provider value={{
            cart: state.cart,
            loading: state.loading || authLoading, // auth load হওয়া পর্যন্ত cart loading দেখাও
            adding: state.adding,
            itemCount: state.cart?.totalItems || 0,
            addToCart,
            updateQty,
            removeItem,
            clearCart,
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