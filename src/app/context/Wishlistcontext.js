"use client";

import {
    createContext, useContext, useEffect, useReducer, useCallback, useRef
} from "react";
import api from "@/app/lib/api";
import { useAuth } from "./AuthContext";

// ─── localStorage helpers ─────────────────────────────────────────────────────
const LS_KEY = "guest_wishlist";

function loadGuestWishlist() {
    if (typeof window === "undefined") return [];
    try { return JSON.parse(localStorage.getItem(LS_KEY) || "[]"); }
    catch { return []; }
}
function saveGuestWishlist(items) {
    if (typeof window !== "undefined") localStorage.setItem(LS_KEY, JSON.stringify(items));
}
function clearGuestWishlist() {
    if (typeof window !== "undefined") localStorage.removeItem(LS_KEY);
}
function buildGuestWishlistObject(items) {
    return { items, totalItems: items.length, isGuest: true };
}

// ─── Reducer ──────────────────────────────────────────────────────────────────
const initialState = { wishlist: null, loading: true };

function reducer(state, action) {
    switch (action.type) {
        case "SET": return { ...state, wishlist: action.payload, loading: false };
        case "CLEAR": return { ...state, wishlist: null, loading: false };
        case "INIT": return { ...state, loading: false };
        default: return state;
    }
}

const WishlistContext = createContext(null);

export function WishlistProvider({ children }) {
    const [state, dispatch] = useReducer(reducer, initialState);
    const { isAuth, loading: authLoading } = useAuth();
    const prevIsAuth = useRef(null);
    const initialized = useRef(false);

    // ── fetchWishlist ──────────────────────────────────────────────────────────
    const fetchWishlist = useCallback(async (forceLoggedIn) => {
        const loggedIn = forceLoggedIn !== undefined ? forceLoggedIn : isAuth;

        if (loggedIn) {
            try {
                const { data } = await api.get("/api/wishlist");
                dispatch({ type: "SET", payload: data.data });
            } catch {
                dispatch({ type: "INIT" });
            }
        } else {
            const items = loadGuestWishlist();
            items.length
                ? dispatch({ type: "SET", payload: buildGuestWishlistObject(items) })
                : dispatch({ type: "INIT" });
        }
    }, [isAuth]);

    // ── Auth load শেষ হলে initial fetch ───────────────────────────────────────
    useEffect(() => {
        if (authLoading) return;
        if (initialized.current) return;
        initialized.current = true;
        fetchWishlist(isAuth);
    }, [authLoading, isAuth, fetchWishlist]);

    // ── Login/logout detect ────────────────────────────────────────────────────
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
            mergeGuestToServer().then(() => fetchWishlist(true));
        } else if (!isAuth && wasAuth) {
            const items = loadGuestWishlist();
            items.length
                ? dispatch({ type: "SET", payload: buildGuestWishlistObject(items) })
                : dispatch({ type: "CLEAR" });
        }
    }, [isAuth, authLoading, fetchWishlist]);

    // ── Merge guest wishlist → server ──────────────────────────────────────────
    async function mergeGuestToServer() {
        const guestItems = loadGuestWishlist();
        if (!guestItems.length) return;
        try {
            for (const item of guestItems) {
                await api.post("/api/wishlist/add", {
                    productId: item.productId,
                    variantId: item.variantId || undefined,
                    note: item.note || "",
                    priority: item.priority || 1,
                });
            }
            clearGuestWishlist();
        } catch (err) {
            console.error("Wishlist merge failed:", err);
        }
    }

    // ── toggleWishlist ─────────────────────────────────────────────────────────
    const toggleWishlist = useCallback(async ({ productId, variantId, product }) => {
        if (isAuth) {
            try {
                const { data } = await api.post("/api/wishlist/toggle", { productId, variantId });
                dispatch({ type: "SET", payload: data.data });
                return { success: true, wishlisted: data.wishlisted };
            } catch (err) {
                return { success: false, message: err.response?.data?.message || "Failed" };
            }
        } else {
            const items = loadGuestWishlist();
            const idx = items.findIndex(i =>
                i.productId === productId &&
                (variantId ? i.variantId === variantId : !i.variantId)
            );
            let wishlisted;
            if (idx > -1) {
                items.splice(idx, 1);
                wishlisted = false;
            } else {
                items.push({
                    productId,
                    variantId: variantId || null,
                    nameSnapshot: product?.name || "Product",
                    imageSnapshot: product?.images?.[0] || "",
                    priceAtAdd: product?.discountedPrice ?? product?.basePrice ?? 0,
                    note: "",
                    priority: 1,
                    addedAt: new Date().toISOString(),
                    // full product object for UI display
                    product: product || null,
                });
                wishlisted = true;
            }
            saveGuestWishlist(items);
            items.length
                ? dispatch({ type: "SET", payload: buildGuestWishlistObject(items) })
                : dispatch({ type: "CLEAR" });
            return { success: true, wishlisted };
        }
    }, [isAuth]);

    // ── isWishlisted check ─────────────────────────────────────────────────────
    const isWishlisted = useCallback((productId, variantId) => {
        if (!state.wishlist?.items) return false;
        return state.wishlist.items.some(i => {
            const idMatch = isAuth
                ? i.product?._id?.toString() === productId || i.product?.toString() === productId
                : i.productId === productId;
            const variantMatch = variantId
                ? (i.variant?.toString() === variantId || i.variantId === variantId)
                : true;
            return idMatch && variantMatch;
        });
    }, [state.wishlist, isAuth]);

    // ── removeFromWishlist ─────────────────────────────────────────────────────
    const removeFromWishlist = useCallback(async (productId) => {
        if (isAuth) {
            try {
                await api.delete(`/api/wishlist/${productId}`);
                await fetchWishlist(true);
            } catch { }
        } else {
            const items = loadGuestWishlist().filter(i => i.productId !== productId);
            saveGuestWishlist(items);
            items.length
                ? dispatch({ type: "SET", payload: buildGuestWishlistObject(items) })
                : dispatch({ type: "CLEAR" });
        }
    }, [isAuth, fetchWishlist]);

    // ── clearWishlist ──────────────────────────────────────────────────────────
    const clearWishlist = useCallback(async () => {
        if (isAuth) {
            try { await api.delete("/api/wishlist"); } catch { }
        }
        clearGuestWishlist();
        dispatch({ type: "CLEAR" });
    }, [isAuth]);

    return (
        <WishlistContext.Provider value={{
            wishlist: state.wishlist,
            loading: state.loading || authLoading,
            itemCount: state.wishlist?.totalItems || 0,
            toggleWishlist,
            isWishlisted,
            removeFromWishlist,
            clearWishlist,
            refetch: fetchWishlist,
        }}>
            {children}
        </WishlistContext.Provider>
    );
}


export function useWishlist() {
    const ctx = useContext(WishlistContext);
    if (!ctx) throw new Error('useWishlist must be used within <WishlistProvider>');
    return ctx;
}