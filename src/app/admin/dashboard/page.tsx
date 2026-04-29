"use client";

import { useUser } from "@clerk/nextjs";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../../../component/Admin/Navbar";
import Link from "next/link";

export default function AdminDashboardPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  // ✅ ตรวจสอบสิทธิ์ admin
  useEffect(() => {
    if (isLoaded) {
      const role = user?.publicMetadata?.role as string | undefined;
      if (role !== "admin") {
        router.push("/dashboard");
      }
    }
  }, [isLoaded, user, router]);

  if (!isLoaded) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <Navbar />

        <h1 className="text-3xl font-bold text-gray-800 mt-6 mb-4">👑 Admin Dashboard</h1>
        <p className="text-gray-600 mb-8">
          ยินดีต้อนรับสู่หน้าแดชบอร์ดผู้ดูแลระบบ คุณสามารถจัดการข้อมูลต่าง ๆ ได้ที่นี่
        </p>

        {/* ตัวอย่างเมนู */}
        <div className="grid sm:grid-cols-2 gap-6">
          <Link
            href="/admin/destinations"
            className="bg-white shadow hover:shadow-lg rounded-xl p-6 flex flex-col items-center text-center transition"
          >
            <span className="text-4xl">🌏</span>
            <h2 className="text-xl font-semibold text-emerald-700 mt-3">
              จัดการสถานที่ท่องเที่ยว
            </h2>
            <p className="text-gray-600 mt-1 text-sm">เพิ่ม แก้ไข หรือลบสถานที่ในระบบ</p>
          </Link>

          {/* คุณสามารถเพิ่มเมนูอื่นๆ ได้ภายหลัง เช่น ผู้ใช้ / การจอง / รีวิว */}
          <div className="bg-gray-100 rounded-xl p-6 text-gray-400 flex flex-col items-center justify-center text-center">
            <span className="text-4xl">🧑‍💼</span>
            <h2 className="text-lg font-medium mt-2">เมนูอื่น ๆ (กำลังพัฒนา)</h2>
          </div>
        </div>
      </div>
    </div>
  );
}
