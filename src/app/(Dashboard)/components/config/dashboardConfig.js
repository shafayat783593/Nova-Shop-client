import {
  Home,
  Users,
  Box,
  ShoppingBag,
  Wallet,
  LifeBuoy,
  Settings,
  Bell,
  ScanBarcode,
  PackagePlus,
  Boxes,
  Image,
  Tag,
  Truck,
  ClipboardList,
  MessageCircle
} from "lucide-react";

export const DASHBOARD_MENU = {
  admin: [
    { name: "Overview", path: "/admin", icon: Home },

    // Product related
    { name: "Create Product", path: "/admin/create-product", icon: PackagePlus },
    { name: "Manage Products", path: "/admin/manage-products", icon: Boxes },

    // Banner & promotion
    { name: "Manage Banners", path: "/admin/homeAdmin/managebanner", icon: Image },
    { name: "Manage Promotions", path: "/admin/homeAdmin/managePromotion", icon: Tag },

    // Delivery & Orders
    { name: "Manage DeliveryBoy", path: "/admin/DeliveryBoy", icon: Truck },
    { name: "Manage Orders", path: "/admin/Orders", icon: ClipboardList },
    {name:"manage chat", path: "/admin/admin-chat", icon: MessageCircle },
  ],

  customer: [
    { name: "My Dashboard", path: "/customer", icon: Home },
    { name: "My Orders", path: "/customer/orders", icon: ShoppingBag },
    { name: "Subscriptions", path: "/customer/subs", icon: Bell },
    { name: "Support", path: "/customer/support", icon: LifeBuoy },
  ],

  deliveryboy: [
    { name: "My Dashboard", path: "/deliveryboy", icon: Home },
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