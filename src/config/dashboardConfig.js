import {
    Home, Users, Box, ShoppingBag,
    Wallet, LifeBuoy, Settings, Bell, ScanBarcode
} from "lucide-react";

export const DASHBOARD_MENU = {
    admin: [
        { name: "Overview", path: "/dashboard", icon: Home },
        { name: "User Management", path: "/dashboard/admin/users", icon: Users },
        { name: "Purchase Requests", path: "/dashboard/admin/requests", icon: ScanBarcode },
        { name: "Settings", path: "/dashboard/settings", icon: Settings },
    ],
    vendor: [
        { name: "Shop Home", path: "/dashboard", icon: Home },
        { name: "My Products", path: "/dashboard/vendor/products", icon: Box },
        { name: "Orders", path: "/dashboard/vendor/orders", icon: ShoppingBag },
        { name: "Wallet", path: "/dashboard/wallet", icon: Wallet },
    ],
    customer: [
        { name: "My Dashboard", path: "/dashboard/customer", icon: Home },
        { name: "My Orders", path: "/dashboard/customer/orders", icon: ShoppingBag },
        { name: "Subscriptions", path: "/dashboard/customer/subs", icon: Bell },
        { name: "Support", path: "/dashboard/customer/support", icon: LifeBuoy },
    ],

    // ✅ "service" নামে রাখো — backend role এর সাথে match করতে হবে
    service: [
        { name: "Tickets", path: "/dashboard/service", icon: LifeBuoy },
        { name: "Resolved", path: "/dashboard/service/resolved", icon: Box },
    ],
};

// ✅ Role normalize করার helper — যেকোনো spelling mistake handle করবে
export const normalizeRole = (role) => {
    const map = {
        admin: "admin",
        vendor: "vendor",
        customer: "customer",
        service: "service",
        support: "service", // ← backend "support" পাঠালেও কাজ করবে
    };
    return map[role?.toLowerCase()] || "customer";
};