import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

const AUTH_ROUTES = ["/login", "/register"];
const PROTECTED_ROUTES = ["/admin", "/vendor", "/deliveryboy"]; // ✅ /customer সরানো

const ROLE_CONFIG = {
    admin: { home: "/admin", allowed: ["/admin"] },
    vendor: { home: "/vendor", allowed: ["/vendor"] },
    customer: { home: "/", allowed: [] },         // ✅ home = "/", allowed খালি
    deliveryboy: { home: "/deliveryboy", allowed: ["/deliveryboy"] },
};

async function verifyToken(token) {
    try {
        const secret = new TextEncoder().encode(process.env.JWT_SECRET);
        const { payload } = await jwtVerify(token, secret);
        return payload;
    } catch {
        return null;
    }
}

export async function middleware(request) {
    const { pathname } = request.nextUrl;

    const accessToken = request.cookies.get("accessToken")?.value;
    const isProtected = PROTECTED_ROUTES.some((r) => pathname.startsWith(r));
    const isAuthPage = AUTH_ROUTES.some((r) => pathname.startsWith(r));

    if (!accessToken) {
        if (isProtected) {
            const url = new URL("/login", request.url);
            url.searchParams.set("returnUrl", pathname);
            return NextResponse.redirect(url);
        }
        return NextResponse.next();
    }

    const payload = await verifyToken(accessToken);

    if (!payload) {
        // ✅ expire হলে public page-এ pass করো, protected হলে login
        if (isProtected) {
            const url = new URL("/login", request.url);
            url.searchParams.set("returnUrl", pathname);
            const res = NextResponse.redirect(url);
            res.cookies.delete("accessToken");
            return res;
        }
        return NextResponse.next(); // ✅ login/register page-এ pass করো
    }

    const role = payload.role?.toLowerCase();
    const config = ROLE_CONFIG[role];

    // ✅ Unknown role → pass করো, login-এ না পাঠাও
    if (!config) {
        return NextResponse.next();
    }

    // Already logged in → auth page-এ গেলে home-এ redirect
    if (isAuthPage) {
        return NextResponse.redirect(new URL(config.home, request.url));
    }

    if (isProtected) {
        const isAllowed = config.allowed.some((prefix) =>
            pathname.startsWith(prefix)
        );
        if (!isAllowed) {
            return NextResponse.redirect(new URL(config.home, request.url));
        }
    }

    const response = NextResponse.next();
    response.headers.set("x-user-role", role);
    response.headers.set("x-user-id", String(payload.sub || payload.id || ""));
    return response;
}

export const config = {
    matcher: [
        "/admin/:path*",
        "/vendor/:path*",
        "/deliveryboy/:path*", // ✅ /customer/:path* সরানো
        "/login",
        "/register",
    ],
};