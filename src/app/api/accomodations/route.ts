import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { generalApiRateLimit } from "@/lib/rate-limit";

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

// ─── GET /api/accommodations (Public) ────────────────────────────────────────

export const GET = async () => {
  try {
    // ใช้ Public Client สำหรับการอ่านข้อมูลสาธารณะ
    const { data, error } = await supabaseAdmin
      .from("accommodations")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("❌ GET Accommodations Error:", error.message);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(data, { status: 200 });
  } catch (err) {
    console.error("❌ GET Accommodations Exception:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
};

// ─── POST /api/accommodations (Authenticated Users) ──────────────────────────

export const POST = async (req: Request) => {
  try {
    const user = await getSessionUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ป้องกันการสแปมสร้างข้อมูลด้วย Rate Limit ที่เราเพิ่งตกลงกัน
    const { success } = await generalApiRateLimit.limit(`post_accommodation_${user.id}`);
    if (!success) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    // ป้องกัน JSON Parse Error แบบ Safe-catch
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    if (typeof body !== "object" || body === null) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const {
      name,
      description,
      address,
      min_price,
      max_price,
      price_range,
      category,
      contact_phone,
      contact_line,
      contact_facebook,
      images,
    } = body as Record<string, any>;

    // Validate required fields
    if (!name || !category) {
      return NextResponse.json(
        { error: "Name and category are required" },
        { status: 400 }
      );
    }

    // ใช้ Admin Client เพื่อทำการ Insert ข้อมูล ป้องกันปัญหา RLS
    // ใช้ .single() เพื่อให้ Supabase คืนค่ามาเป็น Object เดี่ยวๆ แทน Array
    const { data, error } = await supabaseAdmin
      .from("accommodations")
      .insert([
        {
          name,
          description,
          address,
          min_price: Number(min_price) || 0,
          max_price: Number(max_price) || 0,
          price_range,
          category,
          contact_phone,
          contact_line,
          contact_facebook,
          images: Array.isArray(images) ? images : [],
          created_by: user.id,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("❌ Insert Accommodations Error:", error.message);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    console.error("❌ POST Accommodations Exception:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
};