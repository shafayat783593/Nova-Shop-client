import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// প্রতিটা role শুধু নিজের route এ যেতে পারবে
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const AUTH_ROUTES = ["/login", "/register"];
const PROTECTED_ROUTES = ["/admin", "/vendor", "/customer", "/deliveryboy"];

// Role → নিজের home এবং allowed routes
const ROLE_CONFIG = {
    admin: { home: "/admin", allowed: ["/admin"] },
    // vendor: { home: "/vendor", allowed: ["/vendor"] },
    // customer: { home: "/customer", allowed: ["/customer"] },
    // service: { home: "/customer", allowed: ["/customer"] },
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

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // Token নেই → login এ পাঠাও
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    if (!accessToken) {
        if (isProtected) {
            const url = new URL("/login", request.url);
            url.searchParams.set("returnUrl", pathname);
            return NextResponse.redirect(url);
        }
        return NextResponse.next();
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // Token verify
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    const payload = await verifyToken(accessToken);

    // Expire → api.js refresh করবে
    if (!payload) {
        // token invalid → clear cookie + login
        const res = NextResponse.redirect(new URL("/login", request.url));
        res.cookies.delete("accessToken");
        return res;
    }
    const role = payload.role?.toLowerCase();
    const config = ROLE_CONFIG[role];

    // Unknown role → login
    if (!config) {
        return NextResponse.redirect(new URL("/login", request.url));
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // Login/Register → home এ redirect
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    if (isAuthPage) {
        return NextResponse.redirect(new URL(config.home, request.url));
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // Role check — প্রতিটা role শুধু নিজের route এ যাবে
    //
    // admin  → /customer যাবে? ❌ → /admin এ redirect
    // vendor → /admin যাবে?   ❌ → /vendor এ redirect
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    if (isProtected) {
        const isAllowed = config.allowed.some((prefix) =>
            pathname.startsWith(prefix)
        );

        if (!isAllowed) {
            return NextResponse.redirect(new URL(config.home, request.url));
        }
    }

    // ✅ Pass — header এ role set করো
    const response = NextResponse.next();
    response.headers.set("x-user-role", role);
    response.headers.set("x-user-id", String(payload.sub || payload.id || ""));
    return response;
}

export const config = {
    matcher: [
        "/admin/:path*",
        // "/vendor/:path*",
        // "/customer/:path*",
        "/deliveryboy/:path*",
        "/login",
        "/register",
    ],
};
