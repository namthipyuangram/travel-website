// src/proxy.ts

import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

export const proxy = async (request: NextRequest) => {
  let response = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );

          response = NextResponse.next({
            request,
          });

          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  /**
   * ใช้ Session จาก Cookie
   * เร็วกว่า getUser()
   */
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const user = session?.user ?? null;
  const isLoggedIn = !!user;

  const pathname = request.nextUrl.pathname;

  const isGuestOnlyRoute = pathname === "/";
  const isAuthRoute =
    pathname.startsWith("/sign-in") ||
    pathname.startsWith("/sign-up");

  const isUserDashboardRoute =
    pathname.startsWith("/dashboard");

  const isAdminRoute =
    pathname.startsWith("/admin");

  const role =
    (user?.app_metadata?.role as string | undefined) ??
    (user?.user_metadata?.role as string | undefined);

  /**
   * Login แล้วห้ามกลับหน้า Login/Register/Home
   */
  if (
    isLoggedIn &&
    (isGuestOnlyRoute || isAuthRoute)
  ) {
    return NextResponse.redirect(
      new URL(
        role === "admin"
          ? "/admin/dashboard"
          : "/dashboard",
        request.url
      )
    );
  }

  /**
   * ยังไม่ Login
   */
  if (
    !isLoggedIn &&
    (isUserDashboardRoute || isAdminRoute)
  ) {
    const signInUrl = new URL(
      "/sign-in",
      request.url
    );

    signInUrl.searchParams.set(
      "redirect_url",
      request.url
    );

    return NextResponse.redirect(signInUrl);
  }

  /**
   * User เข้า Admin
   */
  if (
    isLoggedIn &&
    isAdminRoute &&
    role !== "admin"
  ) {
    return NextResponse.redirect(
      new URL("/dashboard", request.url)
    );
  }

  /**
   * Admin เข้า Dashboard User
   */
  if (
    isLoggedIn &&
    isUserDashboardRoute &&
    role === "admin"
  ) {
    return NextResponse.redirect(
      new URL(
        "/admin/dashboard",
        request.url
      )
    );
  }

  return response;
};

export const config = {
  matcher: [
    "/",
    "/sign-in",
    "/sign-up",
    "/dashboard/:path*",
    "/admin/:path*",
  ],
};