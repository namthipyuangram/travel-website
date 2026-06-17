import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin"; // ใช้ Admin เพื่อจัดการสิทธิ์
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, totalBudget, items } = await req.json(); // items คือ array ของ {id, type}

  // 1. บันทึกหัวทริป
  const { data: trip, error: tripError } = await supabaseAdmin
    .from("trips")
    .insert([{ user_id: userId, name, total_budget: totalBudget }])
    .select()
    .single();

  if (tripError) return NextResponse.json({ error: tripError.message }, { status: 400 });

  // 2. บันทึกรายการสถานที่ลงในทริป
  const itemsToInsert = items.map((item: any) => ({
    trip_id: trip.id,
    item_id: item.id,
    item_type: item.type,
  }));

  const { error: itemsError } = await supabaseAdmin.from("trip_items").insert(itemsToInsert);

  if (itemsError) return NextResponse.json({ error: itemsError.message }, { status: 400 });

  return NextResponse.json({ message: "Trip saved successfully", tripId: trip.id });
}