import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// ─── Type สำหรับ Payload ของ Supabase Database Webhook ────────────────────────
interface WebhookPayload {
  type: "INSERT" | "UPDATE" | "DELETE";
  table: string;
  schema: string;
  record: Record<string, any>;
  old_record: Record<string, any> | null;
}

// ─── POST /api/webhooks/supabase ──────────────────────────────────────────
export const POST = async (req: Request) => {
  try {
    // 1. ดึง Webhook Secret จาก Environment Variable (ตั้งค่าเองได้เลย)
    const WEBHOOK_SECRET = process.env.SUPABASE_WEBHOOK_SECRET;

    if (!WEBHOOK_SECRET) {
      throw new Error("Please add SUPABASE_WEBHOOK_SECRET to .env.local");
    }

    // 2. ตรวจสอบ Authorization Header เพื่อยืนยันว่า Request มาจาก Supabase จริง
    const headerPayload = await headers();
    const authHeader = headerPayload.get("authorization");

    if (authHeader !== `Bearer ${WEBHOOK_SECRET}`) {
      console.error("❌ Unauthorized webhook attempt");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 3. ดึงและตรวจสอบข้อมูลที่ส่งมาจาก Webhook
    let payload: WebhookPayload;
    try {
      payload = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { type, table, schema, record } = payload;
    console.log(`📩 Webhook received: [${type}] on ${schema}.${table}`);

    // 4. จัดการเฉพาะ Event: สร้าง User ใหม่
    if (schema === "auth" && table === "users" && type === "INSERT") {
      const id = record.id;
      const email = record.email;

      console.log(`👤 New user created: ${id} (${email})`);

      // 5. กำหนด Role อัตโนมัติ
      let role = "user"; // Default role

      const adminEmails = ["admin@example.com", "boss@example.com"];
      if (email && adminEmails.includes(email)) {
        role = "admin";
      }

      // 6. อัปเดต app_metadata โดยใช้ Supabase Admin Client
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(id, {
        app_metadata: { 
          ...record.app_metadata, // กระจายข้อมูลเดิมลงไปเพื่อไม่ให้ข้อมูลอื่นหาย
          role 
        },
      });

      if (updateError) {
        throw updateError;
      }

      console.log(`✅ Role assigned: ${id} -> ${role}`);

      return NextResponse.json(
        { message: "User role assigned successfully", userId: id, role },
        { status: 200 }
      );
    }

    // กรณีมี Event อื่นๆ ให้เพิกเฉยและตอบกลับ 200 OK
    return NextResponse.json({ message: "Webhook processed but ignored" }, { status: 200 });

  } catch (error: any) {
    console.error("❌ Error processing webhook:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
};