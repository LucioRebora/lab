import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";

export async function proxy(req: NextRequest) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const { pathname } = req.nextUrl;

    // If accessing /admin routes without a session, redirect to /login
    if (pathname.startsWith("/admin") && !token) {
        return NextResponse.redirect(new URL("/login", req.url));
    }

    // If already logged in and visiting /login, redirect to /admin
    if (pathname === "/login" && token) {
        return NextResponse.redirect(new URL("/admin", req.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/admin/:path*", "/login"],
};
