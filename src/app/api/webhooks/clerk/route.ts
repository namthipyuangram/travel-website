// src/app/api/webhooks/clerk/route.ts

import { Webhook } from "svix";
import { headers } from "next/headers";
import { WebhookEvent } from "@clerk/nextjs/server";
import { clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

/**
 * @description Clerk Webhook Handler
 * รับ event จาก Clerk เมื่อมี user สร้างใหม่ แล้ว auto-assign role
 */
export async function POST(req: Request) {
  // 1. ดึง webhook secret จาก environment variable
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    throw new Error("Please add CLERK_WEBHOOK_SECRET to .env.local");
  }

  // 2. ดึง headers สำหรับ verify signature
  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  // 3. ตรวจสอบว่ามี headers ครบหรือไม่
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return NextResponse.json(
      { error: "Missing svix headers" },
      { status: 400 }
    );
  }

  // 4. ดึง body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // 5. สร้าง Svix instance เพื่อ verify webhook
  const wh = new Webhook(WEBHOOK_SECRET);

  let evt: WebhookEvent;

  // 6. Verify webhook signature
  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error("❌ Error verifying webhook:", err);
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 400 }
    );
  }

  // 7. จัดการ event ตามประเภท
  const eventType = evt.type;
  console.log(`📩 Webhook received: ${eventType}`);

  if (eventType === "user.created") {
    const { id, email_addresses } = evt.data;
    const email = email_addresses[0]?.email_address;

    console.log(`👤 New user created: ${id} (${email})`);

    try {
      // 8. ✅ ตั้ง role อัตโนมัติ
      let role = "user"; // default role

      // ✅ ถ้า email ตรงกับ admin list ให้เป็น admin
      const adminEmails = ["admin@example.com", "boss@example.com"];
      if (email && adminEmails.includes(email)) {
        role = "admin";
      }

      // 9. อัปเดต metadata
      const client = await clerkClient();
      await client.users.updateUserMetadata(id, {
        publicMetadata: { role },
      });

      console.log(`✅ Role assigned: ${id} -> ${role}`);

      return NextResponse.json(
        { message: "User role assigned", userId: id, role },
        { status: 200 }
      );
    } catch (error) {
      console.error("❌ Error assigning role:", error);
      return NextResponse.json(
        { error: "Failed to assign role" },
        { status: 500 }
      );
    }
  }

  // 10. จัดการ event อื่นๆ (optional)
  if (eventType === "user.updated") {
    console.log("🔄 User updated:", evt.data.id);
  }

  if (eventType === "user.deleted") {
    console.log("🗑️ User deleted:", evt.data.id);
  }

  return NextResponse.json({ message: "Webhook processed" }, { status: 200 });
}