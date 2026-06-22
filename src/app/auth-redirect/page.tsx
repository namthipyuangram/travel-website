"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { Loader2 } from "lucide-react";

export const AuthRedirectPage = () => {
  const router = useRouter();

  useEffect(() => {
    // 1. สร้าง Supabase Client สำหรับฝั่ง Browser
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const checkUserRoleAndRedirect = async () => {
      try {
        // 2. ดึงข้อมูล User ล่าสุดจาก Local Session / Server
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();

        console.log("🔍 Full user object:", user);

        if (error || !user) {
          console.log("❌ No user found or error, redirecting to sign-in");
          router.replace("/sign-in");
          return;
        }

        // 3. อ่าน Role จาก app_metadata (ข้อมูลที่แก้ไขได้เฉพาะฝั่ง Server)
        let role = user.app_metadata?.role as string | undefined;

        console.log("📋 app_metadata:", user.app_metadata);
        console.log("🎭 Current role:", role);
        console.log("📧 Email:", user.email);

        // 4. Fallback: ถ้าไม่มี Role ให้เช็คจาก Email
        if (!role && user.email === "admin@example.com") {
          role = "admin";
          console.log("✅ Set role to admin via email fallback");
        } else if (!role) {
          role = "user";
          console.log("✅ Set role to user as default");
        }

        console.log("🔎 Final role:", role);

        // 5. นำทางผู้ใช้ด้วย replace เพื่อไม่ให้กด Back กลับมาหน้าจอนี้ได้
        if (role === "admin") {
          console.log("🚀 Redirecting to /admin/dashboard");
          router.replace("/admin/dashboard");
        } else {
          console.log("🚀 Redirecting to /dashboard");
          router.replace("/dashboard");
        }
      } catch (err) {
        console.error("❌ Unexpected error during auth check:", err);
        router.replace("/sign-in");
      }
    };

    checkUserRoleAndRedirect();
  }, [router]);

  // UI หน้า Loading แบบมินิมอลและสะอาดตา
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 font-sans text-zinc-900">
      <div className="flex flex-col items-center gap-4 animate-in fade-in duration-500">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-900" />
        <p className="text-sm font-medium tracking-tight text-zinc-500">
          Authenticating...
        </p>
      </div>
    </div>
  );
};