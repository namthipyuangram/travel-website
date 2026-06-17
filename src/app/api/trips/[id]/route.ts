import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { NextResponse } from "next/server";

// ─── Type ─────────────────────────────────────────────────────────────────────

interface RouteParams {
  params: { id: string };
}

// ─── Helper: ตรวจสิทธิ์ว่า trip นี้เป็นของ user คนนี้จริง ─────────────────────

async function verifyOwnership(tripId: string, userId: string): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .from("trips")
    .select("id")
    .eq("id", tripId)
    .eq("user_id", userId)
    .single();
  return !error && !!data;
}

// ─── PATCH /api/trips/[id] ─────────────────────────────────────────────────
// อัปเดตชื่อทริป + รายการสถานที่ (replace ทั้งหมด)

export async function PATCH(req: Request, { params }: RouteParams) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tripId = params.id;

  // ตรวจว่า trip เป็นของ user นี้จริง
  const isOwner = await verifyOwnership(tripId, userId);
  if (!isOwner) {
    return NextResponse.json({ error: "Trip not found or access denied" }, { status: 404 });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { name, items } = body;

  // Validate
  if (!name || typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ error: "Trip name is required" }, { status: 400 });
  }
  if (!Array.isArray(items)) {
    return NextResponse.json({ error: "items must be an array" }, { status: 400 });
  }

  try {
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
    console.error(`PATCH /api/trips/${tripId} error:`, error);
    return NextResponse.json(
      { error: "Failed to update trip", details: error.message },
      { status: 500 }
    );
  }
}

// ─── DELETE /api/trips/[id] ────────────────────────────────────────────────
// ลบทริป + รายการทั้งหมดของทริปนั้น

export async function DELETE(_req: Request, { params }: RouteParams) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tripId = params.id;

  // ตรวจว่า trip เป็นของ user นี้จริง
  const isOwner = await verifyOwnership(tripId, userId);
  if (!isOwner) {
    return NextResponse.json({ error: "Trip not found or access denied" }, { status: 404 });
  }

  try {
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
    console.error(`DELETE /api/trips/${tripId} error:`, error);
    return NextResponse.json(
      { error: "Failed to delete trip", details: error.message },
      { status: 500 }
    );
  }
}