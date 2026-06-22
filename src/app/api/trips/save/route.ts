import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { authRateLimit } from "@/lib/rate-limit";

// ─── Helper: ดึงข้อมูล User จาก Supabase ──────────────────────────────────────
export const getSessionUser = async () => {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: () => {}, // ไม่เซ็ต Cookie ใน API Route
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
};

// ─── POST /api/trips ────────────────────────────────────────────────────────
export const POST = async (req: Request) => {
  try {
    // 1. ตรวจสอบสิทธิ์ด้วย Supabase Auth
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. ป้องกันสแปมการสร้างทริป
    const { success } = await authRateLimit.limit(`post_trip_${user.id}`);
    if (!success) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    // 3. รับและตรวจสอบข้อมูลจาก Client อย่างรัดกุม
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    if (typeof body !== "object" || body === null) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const { name, totalBudget, items } = body as { 
      name?: unknown; 
      totalBudget?: unknown; 
      items?: unknown 
    };

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "Trip name is required" }, { status: 400 });
    }
    
    if (!Array.isArray(items)) {
      return NextResponse.json({ error: "Items must be an array" }, { status: 400 });
    }

    // 4. บันทึกหัวทริป
    const { data: trip, error: tripError } = await supabaseAdmin
      .from("trips")
      .insert([{ 
        user_id: user.id, 
        name: name.trim(), 
        total_budget: typeof totalBudget === "number" ? totalBudget : 0 
      }])
      .select()
      .single();

    if (tripError || !trip) {
      throw new Error(`Failed to create trip: ${tripError?.message}`);
    }

    // 5. บันทึกรายการสถานที่ลงในทริป
    if (items.length > 0) {
      const itemsToInsert = items.map((item: { id: string | number; type: string }) => ({
        trip_id: trip.id,
        item_id: item.id,
        item_type: item.type,
      }));

      const { error: itemsError } = await supabaseAdmin
        .from("trip_items")
        .insert(itemsToInsert);

      // ⚠️ Data Integrity: ถ้ายัดไอเทมไม่เข้า ต้อง Rollback (ลบหัวทริปที่เพิ่งสร้างทิ้ง)
      if (itemsError) {
        await supabaseAdmin.from("trips").delete().eq("id", trip.id);
        throw new Error(`Failed to insert trip items: ${itemsError.message}`);
      }
    }

    return NextResponse.json(
      { message: "Trip saved successfully", tripId: trip.id },
      { status: 201 }
    );

  } catch (error: any) {
    console.error("POST /api/trips error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
};