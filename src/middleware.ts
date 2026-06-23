import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";


export async function middleware(request: NextRequest) {
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
   * แก้ไข: ใช้ getUser() แทน getSession() 
   * เพื่อความปลอดภัยสูงสุดและให้ Supabase แนบ Auth Header ไปดึงตาราง profiles ได้ถูกต้อง
   */
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  const isLoggedIn = !!user && !authError;

  const pathname = request.nextUrl.pathname;

  const isGuestOnlyRoute = pathname === "/";
  const isAuthRoute =
    pathname.startsWith("/sign-in") || pathname.startsWith("/sign-up");

  const isUserDashboardRoute = pathname.startsWith("/dashboard");
  const isAdminRoute = pathname.startsWith("/admin");

  // ดึง Role จากฐานข้อมูลเฉพาะเมื่อ Login แล้วเท่านั้น
  let role = "user"; 

  if (isLoggedIn) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role) {
      role = profile.role;
    }
  }

  /**
   * Login แล้วห้ามกลับหน้า Login/Register/Home
   */
  if (isLoggedIn && (isGuestOnlyRoute || isAuthRoute)) {
    return NextResponse.redirect(
      new URL(role === "admin" ? "/admin/dashboard" : "/dashboard", request.url)
    );
  }

  /**
   * ยังไม่ Login พยายามเข้าหน้าล็อก
   */
  if (!isLoggedIn && (isUserDashboardRoute || isAdminRoute)) {
    const signInUrl = new URL("/sign-in", request.url);
    signInUrl.searchParams.set("redirect_url", request.url);
    return NextResponse.redirect(signInUrl);
  }

  /**
   * User ธรรมดา พยายามเข้าหน้า Admin
   */
  if (isLoggedIn && isAdminRoute && role !== "admin") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  /**
   * Admin พยายามเข้าหน้า Dashboard ธรรมดา
   * (หากระบบของคุณแอดมินมีสิทธิ์ดูหน้า /dashboard ได้ด้วย ให้คอมเมนต์ block นี้ทิ้งครับ)
   */
  if (isLoggedIn && isUserDashboardRoute && role === "admin") {
    return NextResponse.redirect(new URL("/admin/dashboard", request.url));
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