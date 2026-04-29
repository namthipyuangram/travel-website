// src/app/api/set-role/route.ts

import { clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

/**
 * @method POST
 * @description API route to set a user's public metadata role.
 * @param {Request} req - Expected body: { userId: string, role: "admin" | "user" }
 * @returns {NextResponse} - Response indicating success or failure.
 */
export async function POST(req: Request) {
  try {
    // 1. ตรวจสอบว่าผู้เรียก API มี permission หรือไม่ (optional - เพื่อความปลอดภัย)
    const { userId: authUserId } = await auth();
    
    if (!authUserId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // 2. ดึง userId และ role จาก body
    const { userId, role = "user" } = await req.json();

    // 3. ตรวจสอบข้อมูล
    if (!userId) {
      return NextResponse.json(
        { error: "No userId provided" },
        { status: 400 }
      );
    }

    if (!["admin", "user"].includes(role)) {
      return NextResponse.json(
        { error: "Invalid role. Must be 'admin' or 'user'" },
        { status: 400 }
      );
    }

    // 4. ✅ แก้ไข: await clerkClient() ก่อนเรียกใช้ .users
    const client = await clerkClient();
    await client.users.updateUserMetadata(userId, {
      publicMetadata: { role },
    });

    console.log(`✅ Role updated: ${userId} -> ${role}`);

    // 5. ส่ง response กลับเมื่อสำเร็จ
    return NextResponse.json(
      { 
        message: "Role set successfully",
        userId,
        role 
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ Error setting user role:", error);
    
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}