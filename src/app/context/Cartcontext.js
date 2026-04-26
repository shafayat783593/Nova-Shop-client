"use client";

import {
    createContext, useContext, useEffect, useReducer, useCallback, useRef, useState
} from "react";
import api from "@/app/lib/api";
import { useAuth } from "./AuthContext";

const LS_KEY = "guest_cart";
const LS_SELECTED_KEY = "cart_selected_items";

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
function loadSelectedIds() {
    if (typeof window === "undefined") return null;
    try { return JSON.parse(localStorage.getItem(LS_SELECTED_KEY) || "null"); }
    catch { return null; }
}
function saveSelectedIds(ids) {
    if (typeof window !== "undefined") localStorage.setItem(LS_SELECTED_KEY, JSON.stringify(ids));
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
    const { isAuth, loading: authLoading } = useAuth();
    const prevIsAuth = useRef(null);
    const initialized = useRef(false);

    // ── Selection state ────────────────────────────────────────────────────
    // null = "all selected by default" mode, Set = explicit selection
    const [selectedIds, setSelectedIds] = useState(null);

    // When cart changes, sync selectedIds:
    // New items auto-selected, removed items cleaned up
    useEffect(() => {
        if (!state.cart?.items?.length) {
            setSelectedIds(null);
            return;
        }
        const allIds = state.cart.items.map(i => i._id.toString());

        setSelectedIds(prev => {
            if (prev === null) {
                // "all selected" mode — stay in it
                return null;
            }
            // explicit mode — keep only valid ids, add any NEW items as selected
            const prevSet = new Set(prev);
            const newSet = new Set(allIds.filter(id => prevSet.has(id)));
            // auto-select newly added items (ids not in prev)
            allIds.forEach(id => { if (!prevSet.has(id)) newSet.add(id); });
            return [...newSet];
        });
    }, [state.cart]);

    // ── Computed: effective selected ids ──────────────────────────────────
    const getSelectedIds = useCallback(() => {
        if (!state.cart?.items?.length) return new Set();
        if (selectedIds === null) {
            return new Set(state.cart.items.map(i => i._id.toString()));
        }
        return new Set(selectedIds);
    }, [state.cart, selectedIds]);

    // ── Selection helpers ──────────────────────────────────────────────────
    const toggleSelectItem = useCallback((itemId) => {
        const allIds = state.cart?.items?.map(i => i._id.toString()) || [];
        const currentSelected = getSelectedIds();

        if (currentSelected.has(itemId)) {
            currentSelected.delete(itemId);
        } else {
            currentSelected.add(itemId);
        }
        const newArr = [...currentSelected];
        setSelectedIds(newArr);
        saveSelectedIds(newArr);
    }, [state.cart, getSelectedIds]);

    const selectAll = useCallback(() => {
        setSelectedIds(null); // back to "all" mode
        saveSelectedIds(null);
    }, []);

    const deselectAll = useCallback(() => {
        setSelectedIds([]);
        saveSelectedIds([]);
    }, []);

    const isAllSelected = useCallback(() => {
        if (!state.cart?.items?.length) return false;
        if (selectedIds === null) return true;
        const allIds = state.cart.items.map(i => i._id.toString());
        return allIds.every(id => selectedIds.includes(id));
    }, [state.cart, selectedIds]);

    const isItemSelected = useCallback((itemId) => {
        return getSelectedIds().has(itemId.toString());
    }, [getSelectedIds]);

    // ── Computed: selected cart summary ───────────────────────────────────
    const selectedSummary = useCallback(() => {
        if (!state.cart) return { subtotal: 0, discount: 0, shippingFee: 0, total: 0, selectedCount: 0, selectedItemCount: 0 };

        const effectiveIds = getSelectedIds();
        const selectedItems = (state.cart.items || []).filter(i => effectiveIds.has(i._id.toString()));

        const subtotal = selectedItems.reduce((s, i) => s + (i.priceAtAdd || 0) * (i.quantity || 0), 0);
        const discountedSubtotal = selectedItems.reduce((s, i) => s + (i.finalPrice || i.priceAtAdd || 0) * (i.quantity || 0), 0);
        const discount = subtotal - discountedSubtotal;
        const itemDiscount = discount > 0 ? discount : 0;

        // Coupon discount proportional to selection
        let couponDiscount = 0;
        if (state.cart.appliedCoupon?.discountAmount && state.cart.items?.length) {
            const selectionRatio = selectedItems.length / state.cart.items.length;
            couponDiscount = (state.cart.appliedCoupon.discountAmount || 0) * selectionRatio;
        }

        const totalDiscount = itemDiscount + couponDiscount;

        // Free shipping if original cart has free shipping, else 80
        const shippingFee = selectedItems.length === 0 ? 0 : (state.cart.shippingFee === 0 ? 0 : 80);
        const total = Math.max(0, discountedSubtotal - couponDiscount + shippingFee);
        const selectedItemCount = selectedItems.reduce((s, i) => s + (i.quantity || 0), 0);

        return {
            subtotal,
            discount: totalDiscount,
            shippingFee,
            total,
            selectedCount: selectedItems.length,
            selectedItemCount,
            selectedItems,
        };
    }, [state.cart, getSelectedIds]);

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
        if (authLoading) return;
        if (initialized.current) return;
        initialized.current = true;
        fetchCart(isAuth);
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
            mergeGuestToServer().then(() => fetchCart(true));
        } else if (!isAuth && wasAuth) {
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

    // ── removeSelectedItems ────────────────────────────────────────────────
    const removeSelectedItems = useCallback(async () => {
        const effectiveIds = getSelectedIds();
        for (const id of effectiveIds) {
            await removeItem(id);
        }
        setSelectedIds(null);
    }, [getSelectedIds, removeItem]);

    // ── clearCart ──────────────────────────────────────────────────────────
    const clearCart = useCallback(async () => {
        if (isAuth) {
            try { await api.delete("/api/product/cart"); } catch { }
        }
        clearGuestCart();
        dispatch({ type: "CLEAR" });
    }, [isAuth]);

    // ── applyCoupon ────────────────────────────────────────────────────────
    const applyCoupon = useCallback(async (code) => {
        try {
            const { data } = await api.post("/api/product/cart/coupon", { code });
            dispatch({ type: "SET", payload: data.data });
            return { success: true };
        } catch (err) {
            return { success: false, message: err.response?.data?.message || "Invalid coupon" };
        }
    }, []);

    // ── removeCoupon ───────────────────────────────────────────────────────
    const removeCoupon = useCallback(async () => {
        try {
            const { data } = await api.delete("/api/product/cart/coupon");
            dispatch({ type: "SET", payload: data.data });
        } catch { }
    }, []);

    return (
        <CartContext.Provider value={{
            cart: state.cart,
            loading: state.loading || authLoading,
            adding: state.adding,
            itemCount: state.cart?.totalItems || 0,
            // selection
            selectedIds,
            isItemSelected,
            isAllSelected,
            toggleSelectItem,
            selectAll,
            deselectAll,
            selectedSummary,
            // actions
            addToCart,
            updateQty,
            removeItem,
            removeSelectedItems,
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