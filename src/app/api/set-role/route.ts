import { clerkClient, auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { roleChangeRateLimit } from "@/lib/rate-limit";

export async function POST(req: Request) {
  try {
    // 1. ตรวจสอบการล็อกอิน
    const { userId: authUserId } = await auth();

    if (!authUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Rate limit: จำกัดจำนวนครั้งที่ "ผู้เรียก" คนนี้ยิง API นี้ได้
    //    เช็คก่อนเช็ค admin เพื่อกัน DoS / brute-force ตั้งแต่ต้น
    const { success, limit, remaining, reset } = await roleChangeRateLimit.limit(
      authUserId
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

    // 3. เริ่มต้น Clerk Client
    const client = await clerkClient();

    // 4. ป้องกัน Privilege Escalation: เช็คว่าคนเรียก API เป็น Admin ตัวจริงหรือไม่
    const caller = await client.users.getUser(authUserId);
    if (caller.publicMetadata.role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden: Only admins can perform this action." },
        { status: 403 }
      );
    }

    // 5. ดึง userId และ role จาก body (กัน body ไม่ใช่ JSON / parse พัง)
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

    // 6. ตรวจสอบข้อมูล
    if (!userId || typeof userId !== "string") {
      return NextResponse.json({ error: "No userId provided" }, { status: 400 });
    }

    if (typeof role !== "string" || !["admin", "user"].includes(role)) {
      return NextResponse.json(
        { error: "Invalid role. Must be 'admin' or 'user'" },
        { status: 400 }
      );
    }

    // 7. กันแอดมินเผลอลดสิทธิ์ตัวเอง (ป้องกัน lock-out จากระบบ)
    if (userId === authUserId && role !== "admin") {
      return NextResponse.json(
        { error: "You cannot remove your own admin role." },
        { status: 400 }
      );
    }

    // 8. เช็คว่า target user มีอยู่จริง ก่อน update (แยก error ให้ชัดเจนกว่าปล่อยให้ throw)
    try {
      await client.users.getUser(userId);
    } catch {
      return NextResponse.json({ error: "Target user not found" }, { status: 404 });
    }

    // 9. อัปเดตข้อมูลเป้าหมาย
    await client.users.updateUserMetadata(userId, {
      publicMetadata: { role },
    });

    // 10. Audit log: บันทึกว่า "ใคร" เปลี่ยน role ของ "ใคร" เป็นอะไร
    console.log(
      `✅ Role updated by ${authUserId}: ${userId} -> ${role} at ${new Date().toISOString()}`
    );

    return NextResponse.json(
      { message: "Role set successfully", userId, role },
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ Error setting user role:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}