// src/app/admin/layout.tsx
"use client";

import { useUser } from "@clerk/nextjs";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "../../component/Admin/Sidebar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded) {
      const role = user?.publicMetadata?.role as string | undefined;
      if (role !== "admin") {
        router.push("/dashboard");
      }
    }
  }, [isLoaded, user, router]);

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-200 border-t-emerald-600" />
          <p className="text-sm text-slate-500">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  const role = user?.publicMetadata?.role as string | undefined;
  if (role !== "admin") {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-slate-50 lg:flex-row flex-col">
      <Sidebar />
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  );
}