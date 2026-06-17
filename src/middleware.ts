// src/middleware.ts

import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// หน้าที่ "ตั้งใจ" ให้คนยังไม่ล็อกอินดูเท่านั้น
// ถ้าล็อกอินแล้วเข้ามา จะถูกเด้งไป dashboard ที่ถูกต้องตาม role
const isGuestOnlyRoute = createRouteMatcher(["/"]);

// หน้า auth ของ Clerk เอง (sign-in/sign-up) ต้องให้คนที่ยังไม่ล็อกอินเข้าได้เสมอ
const isAuthRoute = createRouteMatcher(["/sign-in(.*)", "/sign-up(.*)"]);

// หน้าที่ต้อง "ล็อกอินแล้ว" เท่านั้น (ไม่ว่า role ไหน)
const isUserDashboardRoute = createRouteMatcher(["/dashboard(.*)"]);

// หน้าที่ต้องเป็น admin เท่านั้น
const isAdminRoute = createRouteMatcher(["/admin(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  const { userId, sessionClaims } = await auth();
  const role = sessionClaims?.metadata?.role;

  const isLoggedIn = !!userId;

  // helper: ส่งกลับไปหน้าที่ตรงกับ role ของผู้ใช้
  const redirectToOwnDashboard = () => {
    const target = role === "admin" ? "/admin/dashboard" : "/dashboard";
    return NextResponse.redirect(new URL(target, req.url));
  };

  // 1) คนล็อกอินแล้ว แต่หลงมาหน้า guest-only ("/") หรือหน้า sign-in/sign-up
  //    -> เด้งไป dashboard ของตัวเอง (นี่คือ bug ที่คุณเจอ จะถูกแก้ตรงนี้)
  if (isLoggedIn && (isGuestOnlyRoute(req) || isAuthRoute(req))) {
    return redirectToOwnDashboard();
  }

  // 2) ยังไม่ล็อกอิน แต่พยายามเข้าหน้าที่ต้องล็อกอิน (/dashboard, /admin/*)
  //    -> เด้งไป sign-in
  if (!isLoggedIn && (isUserDashboardRoute(req) || isAdminRoute(req))) {
    const signInUrl = new URL("/sign-in", req.url);
    signInUrl.searchParams.set("redirect_url", req.url);
    return NextResponse.redirect(signInUrl);
  }

  // 3) ล็อกอินแล้ว แต่ "ไม่ใช่ admin" พยายามเข้าหน้า /admin/*
  //    -> เด้งกลับ /dashboard ของ user ปกติ
  if (isLoggedIn && isAdminRoute(req) && role !== "admin") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // 4) เป็น admin แต่หลงเข้าหน้า /dashboard (ของ user ทั่วไป)
  //    -> เด้งไป /admin/dashboard (กันแอดมินใช้หน้าผิด)
  if (isLoggedIn && isUserDashboardRoute(req) && role === "admin") {
    return NextResponse.redirect(new URL("/admin/dashboard", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Skip Next.js internals และไฟล์ static ทั้งหมด ยกเว้นเจอใน search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // รันเสมอสำหรับ API routes
    "/(api|trpc)(.*)",
  ],
};