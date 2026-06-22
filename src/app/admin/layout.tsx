// src/app/admin/layout.tsx
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { Sidebar } from "../../component/Admin/Sidebar"; // ✅ ใช้ Named Export ตามที่เราได้ Refactor ไว้

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  
  // สร้าง Supabase Client สำหรับฝั่ง Server
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: () => {}, // Layout ไม่ควร set cookie โดยตรง ปล่อยให้ Middleware/Actions จัดการ
      },
    }
  );

  // ดึงข้อมูล User ปัจจุบัน (Zero-Trust Check)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // ตรวจสอบ Role จาก app_metadata
  const role = user?.app_metadata?.role as string | undefined;

  // หากไม่ใช่ Admin ให้เตะกลับไปหน้า Dashboard อัตโนมัติ (ไม่ต้องมีจังหวะกระพริบโหลด)
  // *ถึงแม้ Middleware จะดักไว้แล้ว แต่การดักระดับ Layout ไว้ด้วยคือ Best Practice ด้านความปลอดภัย
  if (!user || role !== "admin") {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen bg-slate-50 lg:flex-row flex-col">
      <Sidebar />
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  );
}