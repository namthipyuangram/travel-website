import { createServerClient } from "@supabase/ssr";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { roleChangeRateLimit } from "@/lib/rate-limit";

export const POST = async (req: Request) => {
  try {
    // 1. สร้าง Supabase SSR Client เพื่อตรวจสอบ Session ของผู้เรียก
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll() {
            // ละเว้นการ set cookie ใน API Route เนื่องจากเราแค่อ่านเพื่อ Verify Token
          },
        },
      }
    );

    // ใช้ getUser() ตรวจสอบ Token กับเซิร์ฟเวอร์โดยตรง
    const {
      data: { user: caller },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !caller) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Rate limit: จำกัดจำนวนครั้งที่ผู้เรียกคนนี้ยิง API ได้
    const { success, limit, remaining, reset } = await roleChangeRateLimit.limit(
      caller.id
    );

    if (!success) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": limit.toString(),
            "X-RateLimit-Remaining": remaining.toString(),
            "X-RateLimit-Reset": reset.toString(),
          },
        }
      );
    }

    // 3. ป้องกัน Privilege Escalation: เช็คว่าคนเรียก API เป็น Admin หรือไม่ (เช็คจาก app_metadata)
    const callerRole = caller.app_metadata?.role;
    if (callerRole !== "admin") {
      return NextResponse.json(
        { error: "Forbidden: Only admins can perform this action." },
        { status: 403 }
      );
    }

    // 4. ดึง userId และ role จาก body
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    if (typeof body !== "object" || body === null) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const { userId, role = "user" } = body as { userId?: unknown; role?: unknown };

    // 5. ตรวจสอบข้อมูล
    if (!userId || typeof userId !== "string") {
      return NextResponse.json({ error: "No userId provided" }, { status: 400 });
    }

    if (typeof role !== "string" || !["admin", "user"].includes(role)) {
      return NextResponse.json(
        { error: "Invalid role. Must be 'admin' or 'user'" },
        { status: 400 }
      );
    }

    // 6. กันแอดมินเผลอลดสิทธิ์ตัวเอง
    if (userId === caller.id && role !== "admin") {
      return NextResponse.json(
        { error: "You cannot remove your own admin role." },
        { status: 400 }
      );
    }

    // 7. สร้าง Admin Client ที่มีสิทธิ์แก้ไขข้อมูล Auth ของผู้อื่น
    // คำเตือน: ห้ามส่ง SUPABASE_SERVICE_ROLE_KEY ไปยังฝั่ง Client เด็ดขาด
    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 8. เช็คว่า target user มีอยู่จริง และอัปเดต Role เข้าไปใน app_metadata
    const { data: targetUser, error: getUserError } = await supabaseAdmin.auth.admin.getUserById(userId);
    
    if (getUserError || !targetUser.user) {
      return NextResponse.json({ error: "Target user not found" }, { status: 404 });
    }

    // อัปเดตข้อมูลเป้าหมาย โดยกระจายข้อมูล app_metadata เดิมลงไปด้วยเพื่อป้องกันข้อมูลเก่าหาย
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      app_metadata: { 
        ...targetUser.user.app_metadata, 
        role 
      },
    });

    if (updateError) {
      throw updateError;
    }

    // 9. Audit log
    console.log(
      `✅ Role updated by ${caller.id}: ${userId} -> ${role} at ${new Date().toISOString()}`
    );

    return NextResponse.json(
      { message: "Role set successfully", userId, role },
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ Error setting user role:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
};