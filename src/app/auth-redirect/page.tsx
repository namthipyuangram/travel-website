"use client";

import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AuthRedirectPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded) return; // รอจนข้อมูล user โหลดเสร็จ

    console.log("🔍 Full user object:", user);

    if (!user) {
      console.log("❌ No user found, redirecting to sign-in");
      router.push("/sign-in");
      return;
    }

    let role = user.publicMetadata?.role as string | undefined;

    console.log("📋 publicMetadata:", user.publicMetadata);
    console.log("🎭 Current role:", role);
    console.log("📧 Email:", user.emailAddresses[0]?.emailAddress);

    // ✅ fallback: ถ้าไม่มี role ให้เช็คจาก email
    if (!role && user.emailAddresses[0]?.emailAddress === "admin@example.com") {
      role = "admin";
      console.log("✅ Set role to admin via email fallback");
    } else if (!role) {
      role = "user";
      console.log("✅ Set role to user as default");
    }

    console.log("🔎 Final role:", role);

    // ✅ ใช้ replace แทน push เพื่อไม่ให้กลับมาหน้านี้ได้
    if (role === "admin") {
      console.log("🚀 Redirecting to /admin/dashboard");
      router.replace("/admin/dashboard");
    } else {
      console.log("🚀 Redirecting to /dashboard");
      router.replace("/dashboard");
    }
  }, [user, isLoaded, router]);

  // ✅ แสดง loading ระหว่างรอ redirect
  return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">กำลังนำทางไปยังหน้าหลัก...</p>
      </div>
    </div>
  );
}