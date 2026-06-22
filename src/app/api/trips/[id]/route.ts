import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { generalApiRateLimit } from "@/lib/rate-limit"; 

// ─── Type ─────────────────────────────────────────────────────────────────────

// ใน Next.js 15+ แนะนำให้ params เป็น Promise
interface RouteParams {
  params: Promise<{ id: string }>;
}

// ─── Helper: ดึงข้อมูล User จาก Supabase ──────────────────────────────────────

export const getSessionUser = async () => {
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
          // ไม่เซ็ต Cookie ใหม่ใน API Route (ทำใน Middleware เท่านั้น)
        },
      },
    }
  );

  // ใช้ getUser() เสมอเพื่อยืนยัน Token กับฝั่ง Server
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
};

// ─── Helper: ตรวจสิทธิ์ว่า trip นี้เป็นของ user คนนี้จริง ─────────────────────

export const verifyOwnership = async (tripId: string, userId: string): Promise<boolean> => {
  const { data, error } = await supabaseAdmin
    .from("trips")
    .select("id")
    .eq("id", tripId)
    .eq("user_id", userId)
    .single();

  return !error && !!data;
};

// ─── PATCH /api/trips/[id] ─────────────────────────────────────────────────

export const PATCH = async (req: Request, { params }: RouteParams) => {
  try {
    const user = await getSessionUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ป้องกันรัวยิง API อัปเดตข้อมูล
    const { success } = await generalApiRateLimit.limit(`patch_trip_${user.id}`);
    if (!success) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    // Await params สำหรับ Next.js เวอร์ชันใหม่
    const { id: tripId } = await params;

    const isOwner = await verifyOwnership(tripId, user.id);
    if (!isOwner) {
      return NextResponse.json({ error: "Trip not found or access denied" }, { status: 404 });
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    if (typeof body !== "object" || body === null) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const { name, items } = body as { name?: unknown; items?: unknown };

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "Trip name is required" }, { status: 400 });
    }
    
    if (!Array.isArray(items)) {
      return NextResponse.json({ error: "items must be an array" }, { status: 400 });
    }

    // 1. อัปเดตชื่อทริป
    const { error: updateError } = await supabaseAdmin
      .from("trips")
      .update({ name: name.trim(), updated_at: new Date().toISOString() })
      .eq("id", tripId);

    if (updateError) throw updateError;

    // 2. ลบรายการเก่าทั้งหมดของทริปนี้
    const { error: deleteError } = await supabaseAdmin
      .from("trip_items")
      .delete()
      .eq("trip_id", tripId);

    if (deleteError) throw deleteError;

    // 3. ถ้ายังมีรายการอยู่ ให้ insert รายการใหม่
    if (items.length > 0) {
      const newItems = items.map((item: { id: string | number; type: string }) => ({
        trip_id: tripId,
        item_id: item.id,
        item_type: item.type,
      }));

      const { error: insertError } = await supabaseAdmin
        .from("trip_items")
        .insert(newItems);

      if (insertError) throw insertError;
    }

    return NextResponse.json({
      message: "Trip updated successfully",
      tripId,
    });
  } catch (error: any) {
    console.error(`PATCH /api/trips error:`, error);
    return NextResponse.json(
      { error: "Failed to update trip" },
      { status: 500 }
    );
  }
};

// ─── DELETE /api/trips/[id] ────────────────────────────────────────────────

export const DELETE = async (_req: Request, { params }: RouteParams) => {
  try {
    const user = await getSessionUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ป้องกันรัวยิง API ลบข้อมูล
    const { success } = await generalApiRateLimit.limit(`delete_trip_${user.id}`);
    if (!success) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const { id: tripId } = await params;

    const isOwner = await verifyOwnership(tripId, user.id);
    if (!isOwner) {
      return NextResponse.json({ error: "Trip not found or access denied" }, { status: 404 });
    }

    // ลบ trip_items ก่อน (FK constraint)
    const { error: itemsError } = await supabaseAdmin
      .from("trip_items")
      .delete()
      .eq("trip_id", tripId);

    if (itemsError) throw itemsError;

    // แล้วค่อยลบ trip
    const { error: tripError } = await supabaseAdmin
      .from("trips")
      .delete()
      .eq("id", tripId);

    if (tripError) throw tripError;

    return NextResponse.json({ message: "Trip deleted successfully" });
  } catch (error: any) {
    console.error(`DELETE /api/trips error:`, error);
    return NextResponse.json(
      { error: "Failed to delete trip" },
      { status: 500 }
    );
  }
};