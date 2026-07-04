import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { generalApiRateLimit } from "@/lib/rate-limit";

// ─── Types & Helpers ─────────────────────────────────────────────────────────

type RouteContext = {
  params: Promise<{ id: string }>;
};

interface UpdateRestaurantBody {
  name?: string;
  description?: string;
  image_url?: string;
  location?: string;
  category?: string;
}

const isNumeric = (val: string) => /^\d+$/.test(val);

export const getSessionUser = async () => {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: () => {}, 
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
};

// ─── GET /api/restaurants/[id] (Public) ──────────────────────────────────────

export const GET = async (_req: NextRequest, { params }: RouteContext) => {
  try {
    const { id } = await params;

    if (!isNumeric(id)) {
      return NextResponse.json({ error: "ID ต้องเป็นตัวเลข" }, { status: 400 });
    }

    const numericId = Number(id);

    // ใช้ Public Client สำหรับดึงข้อมูลสาธารณะ
    const { data, error } = await supabaseAdmin
      .from("restaurants")
      .select("*")
      .eq("id", numericId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "ไม่พบร้านอาหารที่ระบุ" }, { status: 404 });
      }
      throw error;
    }

    const formattedData = {
      ...data,
      images: data.image_url ? [data.image_url] : [],
      reviews: [], 
    };

    return NextResponse.json(formattedData, { status: 200 });
  } catch (error: any) {
    console.error("❌ GET Restaurant Error:", error);
    return NextResponse.json(
      { error: error.message || "เกิดข้อผิดพลาดในการดึงข้อมูล" }, 
      { status: 500 }
    );
  }
};

// ─── PUT /api/restaurants/[id] (Owner or Admin) ──────────────────────────────

export const PUT = async (req: NextRequest, { params }: RouteContext) => {
  try {
    const user = await getSessionUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { success } = await generalApiRateLimit.limit(`put_restaurant_${user.id}`);
    if (!success) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const { id } = await params;

    if (!isNumeric(id)) {
      return NextResponse.json({ error: "ID ต้องเป็นตัวเลข" }, { status: 400 });
    }

    const numericId = Number(id);

    let body: UpdateRestaurantBody;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const updateData = {
      name: body.name,
      description: body.description,
      image_url: body.image_url,
      location: body.location,
      category: body.category,
    };

    // 🔥 ลบ key ที่เป็น undefined ออก เพื่อไม่ให้ไปเขียนทับค่าเดิมใน DB เป็น null โดยไม่ได้ตั้งใจ
    Object.keys(updateData).forEach(
      (key) => updateData[key as keyof typeof updateData] === undefined && delete updateData[key as keyof typeof updateData]
    );

    const isAdmin = user.app_metadata?.role === "admin";

    let query = supabaseAdmin.from("restaurants").update(updateData);

    if (isAdmin) {
      query = query.eq("id", numericId);
    } else {
      // ผู้ใช้ทั่วไปแก้ไขได้เฉพาะร้านที่ตัวเองเป็นคนสร้าง
      query = query.eq("id", numericId).eq("created_by", user.id);
    }

    const { data, error } = await query.select().single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "ไม่พบร้านอาหาร หรือคุณไม่มีสิทธิ์แก้ไข" }, { status: 403 });
      }
      throw error;
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    console.error("❌ PUT Restaurant Error:", error);
    return NextResponse.json(
      { error: error.message || "เกิดข้อผิดพลาดในการแก้ไขข้อมูล" }, 
      { status: 500 }
    );
  }
};

// ─── DELETE /api/restaurants/[id] (Owner or Admin) ───────────────────────────

export const DELETE = async (_req: NextRequest, { params }: RouteContext) => {
  try {
    const user = await getSessionUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { success } = await generalApiRateLimit.limit(`delete_restaurant_${user.id}`);
    if (!success) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const { id } = await params;

    if (!isNumeric(id)) {
      return NextResponse.json({ error: "ID ต้องเป็นตัวเลข" }, { status: 400 });
    }

    const numericId = Number(id);
    const isAdmin = user.app_metadata?.role === "admin";

    let query = supabaseAdmin.from("restaurants").delete();

    if (isAdmin) {
      query = query.eq("id", numericId);
    } else {
      query = query.eq("id", numericId).eq("created_by", user.id);
    }

    const { error, data } = await query.select('id');

    if (error) throw error;

    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: "ไม่พบร้านอาหาร หรือคุณไม่มีสิทธิ์ลบ" }, 
        { status: 403 }
      );
    }

    return NextResponse.json({ success: true, message: "ลบข้อมูลสำเร็จ" }, { status: 200 });
  } catch (error: any) {
    console.error("❌ DELETE Restaurant Error:", error);
    return NextResponse.json(
      { error: error.message || "เกิดข้อผิดพลาดในการลบข้อมูล" }, 
      { status: 500 }
    );
  }
};