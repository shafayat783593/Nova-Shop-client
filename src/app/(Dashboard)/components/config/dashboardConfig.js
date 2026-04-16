import {
    Home, Users, Box, ShoppingBag,
    Wallet, LifeBuoy, Settings, Bell, ScanBarcode
} from "lucide-react";

export const DASHBOARD_MENU = {
    admin: [
        { name: "Overview", path: "/admin", icon: Home },
        { name: "Create Product", path: "/admin/create-product", icon: Users },
        { name: "Manage Products", path: "/admin/manage-products", icon: ScanBarcode },
      
    ],
 
    customer: [
        { name: "My Dashboard", path: "/customer", icon: Home },
        { name: "My Orders", path: "/customer/orders", icon: ShoppingBag },
        { name: "Subscriptions", path: "/customer/subs", icon: Bell },
        { name: "Support", path: "/customer/support", icon: LifeBuoy },
    ],

    // ✅ "service" নামে রাখো — backend role এর সাথে match করতে হবে
    service: [
        { name: "Tickets", path: "/service/service", icon: LifeBuoy },
        { name: "Resolved", path: "/service/resolved", icon: Box },
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