import {
    Home, Users, Box, ShoppingBag,
    Wallet, LifeBuoy, Settings, Bell, ScanBarcode
} from "lucide-react";

export const DASHBOARD_MENU = {
    admin: [
        { name: "Overview", path: "/admin", icon: Home },
        { name: "Create Product", path: "/admin/create-product", icon: Users },
        { name: "Manage Products", path: "/admin/manage-products", icon: ScanBarcode },
        { name: "Manage Banners", path: "/admin/homeAdmin/managebanner", icon: ScanBarcode },
        { name: "Manage Promotions", path: "/admin/homeAdmin/managePromotion", icon: ScanBarcode },
        { name: "Manage DeliveryBoy", path: "/admin/DeliveryBoy", icon: ScanBarcode },
        { name: "Manage Orders", path: "/admin/Orders", icon: ScanBarcode },


    ],

    customer: [
        { name: "My Dashboard", path: "/customer", icon: Home },
        { name: "My Orders", path: "/customer/orders", icon: ShoppingBag },
        { name: "Subscriptions", path: "/customer/subs", icon: Bell },
        { name: "Support", path: "/customer/support", icon: LifeBuoy },
    ],

    // ✅ "deliveryboy" নামে রাখো — backend role এর সাথে match করতে হবে
    deliveryboy: [
        { name: "My Dashboard", path: "/deliveryboy", icon: LifeBuoy },
        { name: "Resolved", path: "/deliveryboy/resolved", icon: Box },
    ],
};

// ✅ Role normalize করার helper — যেকোনো spelling mistake handle করবে
export const normalizeRole = (role) => {
    const map = {
        admin: "admin",
        vendor: "vendor",
        customer: "customer",
        deliveryboy: "deliveryboy",
        support: "service", 
    };
    return map[role?.toLowerCase()] || "customer";
};