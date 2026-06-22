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
        setAll: () => {}, // ไม่เซ็ต Cookie ใน API Route เพื่อป้องกัน Error ฝั่ง Server
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
};

// ─── GET /api/destinations (Public) ──────────────────────────────────────────

export const GET = async (req: Request) => {
  try {
    const { searchParams } = new URL(req.url);
    const minBudget = searchParams.get("minBudget");
    const maxBudget = searchParams.get("maxBudget");

    // 🔥 ควบรวมการ Query แบบ Join Table เพื่อแก้ปัญหา N+1 Query ที่หน้าบ้าน
    let query = supabaseAdmin
      .from("destinations")
      .select(`
        *,
        reviews ( rating )
      `)
      .order("created_at", { ascending: false });

    // ปรับลอจิกการกรองราคาให้เช็คจาก min_price เป็นหลักเพื่อให้ตรงกับ UX การกรองงบ
    if (minBudget) {
      const minVal = parseFloat(minBudget);
      if (!isNaN(minVal)) query = query.gte("min_price", minVal);
    }
    if (maxBudget) {
      const maxVal = parseFloat(maxBudget);
      if (!isNaN(maxVal)) query = query.lte("min_price", maxVal);
    }

    const { data, error } = await query;

    if (error) {
      console.error("❌ Supabase GET error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 🔥 คำนวณ Rating ให้เสร็จสรรพจากหลังบ้าน ลดภาระฝั่ง Client
    const formattedData = (data || []).map((dest) => {
      const reviews = dest.reviews || [];
      const count = reviews.length;
      const avg = count > 0 
        ? reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / count 
        : 0;

      // นำ reviews array ออกจาก Response เพื่อลดขนาด Payload
      const { reviews: _, ...restDest } = dest; 

      return {
        ...restDest,
        rating: {
          avg: Math.round(avg * 10) / 10,
          count,
        },
      };
    });
    
    return NextResponse.json(formattedData, { status: 200 });
  } catch (error) {
    console.error("❌ GET Internal error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
};

// ─── POST /api/destinations (Admin Only) ─────────────────────────────────────

export const POST = async (req: Request) => {
  try {
    const user = await getSessionUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 🔥 ป้องกันรัวยิง API (Rate Limiting)
    const { success } = await generalApiRateLimit.limit(`post_destination_${user.id}`);
    if (!success) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    // 🔥 ตรวจสอบสิทธิ์แบบ Zero-Latency
    const isAdmin = user.app_metadata?.role === "admin";

    if (!isAdmin) {
      return NextResponse.json(
        { error: "Forbidden: Admin only" },
        { status: 403 }
      );
    }

    // ป้องกัน Server Crash กรณีส่ง Body มาผิดฟอร์แมต
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    if (typeof body !== "object" || body === null) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const { name, description, category, image_url, min_price, max_price } = body as Record<string, any>;

    if (!name || !description || !category) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const minPriceNum = Number(min_price) || 0;
    const maxPriceNum = Number(max_price) || 0;

    if (minPriceNum > maxPriceNum) {
      return NextResponse.json({ error: "Invalid price range" }, { status: 400 });
    }

    // Insert ข้อมูลด้วย Admin Client
    const { data, error } = await supabaseAdmin
      .from("destinations")
      .insert([
        {
          name,
          description,
          category,
          image_url: image_url || null,
          min_price: minPriceNum,
          max_price: maxPriceNum,
          created_by: user.id,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("❌ Supabase POST error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("❌ POST Internal error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
};