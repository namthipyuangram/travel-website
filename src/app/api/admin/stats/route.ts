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

// ─── GET /api/admin/stats ────────────────────────────────────────────────────

export const GET = async () => {
  try {
    const user = await getSessionUser();

    // 1. ตรวจสอบการเข้าสู่ระบบ
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // 2. ป้องกันผู้ใช้ทั่วไปเข้าถึงข้อมูลสถิติของระบบ (อุดช่องโหว่)
    const isAdmin = user.app_metadata?.role === "admin";
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: "Forbidden: Admin access required" },
        { status: 403 }
      );
    }

    // 3. ป้องกันการยิง API รัวๆ เพื่อดึงข้อมูลหนักๆ
    const { success: rateLimitSuccess } = await generalApiRateLimit.limit(`admin_stats_${user.id}`);
    if (!rateLimitSuccess) {
      return NextResponse.json(
        { success: false, error: "Too many requests" },
        { status: 429 }
      );
    }

    // 4. ดึงข้อมูลทั้งหมดแบบขนาน (Concurrent Requests) เพื่อประสิทธิภาพสูงสุด
    const [
      destinationsCount,
      restaurantsCount,
      accommodationsCount,
      reviewsCount,
      recentReviews,
      categoryBreakdown,
      allRatings,
    ] = await Promise.all([
      supabaseAdmin.from("destinations").select("id", { count: "exact", head: true }),
      supabaseAdmin.from("restaurants").select("id", { count: "exact", head: true }),
      supabaseAdmin.from("accommodations").select("id", { count: "exact", head: true }),
      supabaseAdmin.from("reviews").select("id", { count: "exact", head: true }),
      supabaseAdmin
        .from("reviews")
        .select(`
          id,
          comment,
          rating,
          created_at,
          destination_id,
          restaurant_id,
          accommodation_id
        `)
        .order("created_at", { ascending: false })
        .limit(5),
      supabaseAdmin.from("destinations").select("category"),
      supabaseAdmin.from("reviews").select("rating"),
    ]);

    // 5. ตรวจสอบ Error จากการดึงข้อมูล
    const firstError =
      destinationsCount.error ||
      restaurantsCount.error ||
      accommodationsCount.error ||
      reviewsCount.error ||
      recentReviews.error ||
      categoryBreakdown.error ||
      allRatings.error;

    if (firstError) throw firstError;

    // 6. ประมวลผลข้อมูล
    const destinationCategoryCounts: Record<string, number> = {};
    for (const item of categoryBreakdown.data ?? []) {
      const category = item.category?.trim() || "ไม่ระบุ";
      destinationCategoryCounts[category] = (destinationCategoryCounts[category] ?? 0) + 1;
    }

    const ratings = allRatings.data ?? [];
    const averageRating =
      ratings.length === 0
        ? 0
        : ratings.reduce((sum, item) => sum + Number(item.rating ?? 0), 0) / ratings.length;

    // 7. ส่งคืนข้อมูลที่จัดรูปแบบแล้ว
    return NextResponse.json({
      success: true,
      data: {
        totals: {
          destinations: destinationsCount.count ?? 0,
          restaurants: restaurantsCount.count ?? 0,
          accommodations: accommodationsCount.count ?? 0,
          reviews: reviewsCount.count ?? 0,
        },
        averageRating: Number(averageRating.toFixed(2)),
        destinationCategoryCounts,
        recentReviews: recentReviews.data ?? [],
      },
    }, { status: 200 });

  } catch (error) {
    console.error("[ADMIN_STATS_API_ERROR]", error);

    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
};