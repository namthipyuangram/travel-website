import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { NextResponse } from "next/server";

// ─── GET /api/trips ───────────────────────────────────────────────────────────
// ดึงทริปทั้งหมดของผู้ใช้ พร้อมรายละเอียด item แต่ละชิ้น

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // 1. ดึงทริปทั้งหมดของ user
    const { data: trips, error: tripsError } = await supabaseAdmin
      .from("trips")
      .select("id, name, total_budget, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (tripsError) throw tripsError;
    if (!trips || trips.length === 0) {
      return NextResponse.json({ trips: [] });
    }

    // 2. ดึง trip_items ของทุกทริปพร้อมกัน
    const tripIds = trips.map((t) => t.id);
    const { data: allItems, error: itemsError } = await supabaseAdmin
      .from("trip_items")
      .select("id, trip_id, item_id, item_type")
      .in("trip_id", tripIds);

    if (itemsError) throw itemsError;

    // 3. แยก item_id ตาม type เพื่อ query ข้อมูลรายละเอียดจากแต่ละ table
    const grouped: Record<string, (string | number)[]> = {
      destination: [],
      restaurant: [],
      accommodation: [],
    };

    (allItems || []).forEach((item) => {
      const type = item.item_type;
      if (grouped[type]) {
        // เก็บค่า item_id ไว้ตามจริง (ไม่จำเป็นต้อง cast เป็น string ทันที)
        grouped[type].push(item.item_id);
      }
    });

    // Map table name ตาม type
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

    // 4. Query รายละเอียดทุก type พร้อมกัน (เฉพาะที่มี id)
    const detailQueries = Object.entries(grouped)
      .filter(([, ids]) => ids.length > 0)
      .map(([type, ids]) => {
        // ใช้ Array ที่เป็น unique values เพื่อประหยัด Query
        const uniqueIds = [...new Set(ids)];

        return supabaseAdmin
          .from(tableMap[type])
          .select(selectMap[type] || "id, name, min_price")
          .in("id", uniqueIds)
          .then((result) => {
            if (result.error) {
              console.error(`🚨 [Supabase Error] ${type}:`, result.error.message);
            }
            return { type, data: result.data || [], error: result.error };
          });
      });

    const detailResults = await Promise.all(detailQueries);

    // 5. สร้าง lookup map: { "destination:123": {...detail} }
    const detailMap: Record<string, any> = {};
    for (const result of detailResults) {
      if (result.data && Array.isArray(result.data)) {
        for (const row of result.data) {
          if (row && typeof row === 'object' && 'id' in row) {
            const id = (row as any).id;
            detailMap[`${result.type}:${id}`] = row;
          }
        }
      }
    }

    // 6. รวม trip_items เข้ากับ detail
    const itemsByTrip: Record<string, any[]> = {};
    for (const item of allItems || []) {
      if (!itemsByTrip[item.trip_id]) itemsByTrip[item.trip_id] = [];
      
      const detail = detailMap[`${item.item_type}:${item.item_id}`];
      
      itemsByTrip[item.trip_id].push({
        ...item,
        item_detail: detail ?? {
          id: item.item_id,
          name: "ไม่พบข้อมูล",
          min_price: 0,
        },
      });
    }

    // 7. Assemble final result
    const enrichedTrips = trips.map((trip) => ({
      ...trip,
      trip_items: itemsByTrip[trip.id] || [],
    }));

    return NextResponse.json({ trips: enrichedTrips });
  } catch (error: any) {
    console.error("GET /api/trips error:", error);
    return NextResponse.json(
      { error: "Failed to fetch trips", details: error.message },
      { status: 500 }
    );
  }
}