import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { generalApiRateLimit } from "@/lib/rate-limit";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Trip {
  id: string;
  name: string;
  total_budget: number;
  created_at: string;
}

interface TripItem {
  id: string;
  trip_id: string;
  item_id: string | number;
  item_type: "destination" | "restaurant" | "accommodation";
}

interface ItemDetail {
  id: string | number;
  name: string;
  min_price: number;
  image_url?: string;
  images?: string[];
  category?: string;
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

// ─── GET /api/trips ───────────────────────────────────────────────────────────

export const GET = async () => {
  try {
    // 1. ตรวจสอบสิทธิ์
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // (Optional) ป้องกันการสแปมดึงข้อมูล
    const { success } = await generalApiRateLimit.limit(`get_trips_${user.id}`);
    if (!success) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    // 2. ดึงทริปทั้งหมดของ user
    const { data: trips, error: tripsError } = await supabaseAdmin
      .from("trips")
      .select("id, name, total_budget, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (tripsError) throw tripsError;
    
    // ถ้าไม่มีทริปให้คืนค่า Array ว่างทันทีเพื่อประหยัด Resource
    if (!trips || trips.length === 0) {
      return NextResponse.json({ trips: [] });
    }

    // 3. ดึง trip_items ของทุกทริปพร้อมกัน
    const tripIds = trips.map((t: Trip) => t.id);
    const { data: allItems, error: itemsError } = await supabaseAdmin
      .from("trip_items")
      .select("id, trip_id, item_id, item_type")
      .in("trip_id", tripIds);

    if (itemsError) throw itemsError;

    // 4. แยก item_id ตาม type เพื่อ query ข้อมูลรายละเอียด
    const grouped: Record<string, (string | number)[]> = {
      destination: [],
      restaurant: [],
      accommodation: [],
    };

    (allItems as TripItem[] || []).forEach((item) => {
      const type = item.item_type;
      if (grouped[type]) {
        grouped[type].push(item.item_id);
      }
    });

    const tableMap: Record<string, string> = {
      destination: "destinations",
      restaurant: "restaurants",
      accommodation: "accommodations",
    };

    const selectMap: Record<string, string> = {
      destination: "id, name, min_price, image_url, category",
      restaurant: "id, name, min_price, image_url, category",
      accommodation: "id, name, min_price, images, category",
    };

    // 5. Query รายละเอียดทุก type พร้อมกันแบบขนาน
    const detailQueries = Object.entries(grouped)
      .filter(([, ids]) => ids.length > 0)
      .map(async ([type, ids]) => {
        // กรอง ID ซ้ำออกเพื่อลด Payload ของ Database
        const uniqueIds = [...new Set(ids)];

        const result = await supabaseAdmin
          .from(tableMap[type])
          .select(selectMap[type] || "id, name, min_price")
          .in("id", uniqueIds);

        if (result.error) {
          console.error(`🚨 [Supabase Error] ${type}:`, result.error.message);
        }
        
        return { type, data: result.data || [], error: result.error };
      });

    const detailResults = await Promise.all(detailQueries);

    // 6. สร้าง Lookup Map เป็น O(1) Access
    const detailMap: Record<string, ItemDetail> = {};
    for (const result of detailResults) {
      if (Array.isArray(result.data)) {
        for (const row of result.data) {
          if (row && typeof row === "object" && "id" in row) {
            const id = (row as ItemDetail).id;
            detailMap[`${result.type}:${id}`] = row as ItemDetail;
          }
        }
      }
    }

    // 7. นำ Item Details กลับไปประกอบเข้ากับ trip_items
    const itemsByTrip: Record<string, any[]> = {};
    for (const item of (allItems as TripItem[] || [])) {
      if (!itemsByTrip[item.trip_id]) itemsByTrip[item.trip_id] = [];
      
      const detail = detailMap[`${item.item_type}:${item.item_id}`];
      
      itemsByTrip[item.trip_id].push({
        ...item,
        item_detail: detail ?? {
          id: item.item_id,
          name: "ไม่พบข้อมูล หรือถูกลบออกจากระบบ",
          min_price: 0,
        },
      });
    }

    // 8. ประกอบร่างทริปและส่งกลับ
    const enrichedTrips = trips.map((trip: Trip) => ({
      ...trip,
      trip_items: itemsByTrip[trip.id] || [],
    }));

    return NextResponse.json({ trips: enrichedTrips }, { status: 200 });
    
  } catch (error: any) {
    console.error("GET /api/trips error:", error);
    return NextResponse.json(
      { error: "Failed to fetch trips", details: error.message },
      { status: 500 }
    );
  }
};