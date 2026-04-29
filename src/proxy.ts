// src/middleware.ts
import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth();
  const path = req.nextUrl.pathname;

  console.log("🛣️ Path:", path, "| User:", userId ? "✅" : "❌");

  // ✅ Public routes - ไม่ต้องเช็ค auth
  const publicRoutes = ["/sign-in", "/sign-up", "/auth-redirect", "/"];
  if (publicRoutes.some(route => path.startsWith(route))) {
    console.log("✅ Public route, allowing access");
    return NextResponse.next();
  }

  // ✅ Protected routes
  const protectedRoutes = ["/dashboard", "/profile", "/api/protected", "/admin"];
  const isProtected = protectedRoutes.some(route => path.startsWith(route));

  if (isProtected && !userId) {
    console.log("🚫 Protected route without auth, redirecting to sign-in");
    const signInUrl = new URL("/sign-in", req.url);
    signInUrl.searchParams.set("redirect_url", req.url);
    return NextResponse.redirect(signInUrl);
  }

  console.log("✅ Allowing access to:", path);
  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next|.*\\..*|favicon.ico).*)", // ✅ รวมทุกหน้า ยกเว้น assets
  ],
};