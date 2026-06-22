import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { generalApiRateLimit } from "@/lib/rate-limit";

// ─── Types ───────────────────────────────────────────────────────────────────

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
        getAll: () => cookieStore.getAll(),
        setAll: () => {}, // ห้าม set cookie ใน API Route
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
};

// ─── GET /api/accommodations/[id] (Public) ───────────────────────────────────

export const GET = async (_req: NextRequest, { params }: RouteParams) => {
  try {
    const { id } = await params;

    // ใช้ Public Client สำหรับดึงข้อมูลสาธารณะ
    const { data, error } = await supabaseAdmin
      .from("accommodations")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error(`❌ GET accommodation ${id} error:`, error.message);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (!data) {
      return NextResponse.json({ error: "Accommodation not found" }, { status: 404 });
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("❌ GET Exception:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
};

// ─── PUT /api/accommodations/[id] (Owner or Admin) ───────────────────────────

export const PUT = async (req: NextRequest, { params }: RouteParams) => {
  try {
    const user = await getSessionUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ป้องกันการสแปมยิง API อัปเดตข้อมูล
    const { success } = await generalApiRateLimit.limit(`put_accommodation_${user.id}`);
    if (!success) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const { id } = await params;

    // ป้องกัน JSON Parse Error
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    if (typeof body !== "object" || body === null) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    // 🔥 ตรวจสอบสิทธิ์ Admin จาก Token
    const isAdmin = user.app_metadata?.role === "admin";

    // ใช้ Admin Client เพื่อทำการอัปเดต โดยควบคุมสิทธิ์ผ่านฝั่ง API Logic
    let query = supabaseAdmin.from("accommodations").update(body as Record<string, any>);

    if (isAdmin) {
      // แอดมินแก้ไขได้ทุกรายการ
      query = query.eq("id", id);
    } else {
      // ผู้ใช้ทั่วไปแก้ไขได้เฉพาะรายการที่ตัวเองสร้าง
      query = query.eq("id", id).eq("created_by", user.id);
    }

    const { data, error } = await query.select().single();

    if (error) {
      console.error(`❌ PUT accommodation ${id} error:`, error.message);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (!data) {
      return NextResponse.json(
        { error: "Accommodation not found or unauthorized to edit" },
        { status: 403 }
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("❌ PUT Exception:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
};

// ─── DELETE /api/accommodations/[id] (Owner or Admin) ────────────────────────

export const DELETE = async (_req: NextRequest, { params }: RouteParams) => {
  try {
    const user = await getSessionUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ป้องกันการยิง API ลบข้อมูลรัวๆ
    const { success } = await generalApiRateLimit.limit(`delete_accommodation_${user.id}`);
    if (!success) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const { id } = await params;

    // 🔥 ตรวจสอบสิทธิ์ Admin 
    const isAdmin = user.app_metadata?.role === "admin";

    let query = supabaseAdmin.from("accommodations").delete();

    if (isAdmin) {
      // แอดมินลบได้ทุกรายการ
      query = query.eq("id", id);
    } else {
      // ผู้ใช้ทั่วไปลบได้เฉพาะของตัวเอง
      query = query.eq("id", id).eq("created_by", user.id);
    }

    const { error, data } = await query.select('id');

    if (error) {
      console.error(`❌ DELETE accommodation ${id} error:`, error.message);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // ถ้า Query ทำงานสำเร็จแต่ไม่มี Record ถูกคืนค่ากลับมา แปลว่าไม่มีสิทธิ์ลบหรือไม่พบข้อมูล
    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: "Accommodation not found or unauthorized to delete" },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Accommodation deleted successfully",
    }, { status: 200 });
  } catch (error) {
    console.error("❌ DELETE Exception:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
};