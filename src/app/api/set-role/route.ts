import { clerkClient, auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    // 1. ตรวจสอบการล็อกอิน
    const { userId: authUserId } = await auth();
    
    if (!authUserId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // 2. เริ่มต้น Clerk Client
    const client = await clerkClient();

    // 3. ป้องกัน Privilege Escalation: เช็คว่าคนเรียก API เป็น Admin ตัวจริงหรือไม่
    const caller = await client.users.getUser(authUserId);
    if (caller.publicMetadata.role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden: Only admins can perform this action." },
        { status: 403 }
      );
    }

    // 4. ดึง userId และ role จาก body
    const { userId, role = "user" } = await req.json();

    // 5. ตรวจสอบข้อมูล (เหมือนที่คุณเขียนไว้)
    if (!userId) {
      return NextResponse.json({ error: "No userId provided" }, { status: 400 });
    }

    if (!["admin", "user"].includes(role)) {
      return NextResponse.json({ error: "Invalid role. Must be 'admin' or 'user'" }, { status: 400 });
    }

    // 6. อัปเดตข้อมูลเป้าหมาย
    await client.users.updateUserMetadata(userId, {
      publicMetadata: { role },
    });

    console.log(`✅ Role updated: ${userId} -> ${role}`);

    return NextResponse.json({ message: "Role set successfully", userId, role }, { status: 200 });
    
  } catch (error) {
    console.error("❌ Error setting user role:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}