import { supabaseClient } from "@/lib/supabaseClient";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

/**
 * GET reviews (public)
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const accommodation_id = searchParams.get("accommodation_id");
  const restaurant_id = searchParams.get("restaurant_id");
  const destination_id = searchParams.get("destination_id");

  let query = supabaseClient
    .from("reviews")
    .select("*")
    .order("created_at", { ascending: false });

  if (accommodation_id) {
    query = query.eq("accommodation_id", accommodation_id);
  }
  if (restaurant_id) {
    query = query.eq("restaurant_id", Number(restaurant_id));
  }
  if (destination_id) {
    query = query.eq("destination_id", Number(destination_id));
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(data);
}

/**
 * CREATE review
 */
export async function POST(req: Request) {
  const authContext = await auth();
  const { userId } = authContext;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 },
    );
  }

  const { accommodation_id, restaurant_id, destination_id, rating, comment } =
    body;

  const providedIds = [accommodation_id, restaurant_id, destination_id].filter(
    Boolean,
  );

  if (providedIds.length !== 1) {
    return NextResponse.json(
      { error: "Please provide exactly one target ID." },
      { status: 400 },
    );
  }

  if (!rating) {
    return NextResponse.json({ error: "Rating is required." }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("reviews")
    .insert([
      {
        accommodation_id: accommodation_id || null,
        restaurant_id: restaurant_id ? Number(restaurant_id) : null,
        destination_id: destination_id ? Number(destination_id) : null,
        rating: Number(rating),
        comment,
        created_by: userId,
      },
    ])
    .select();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(data);
}

/**
 * Helper: เช็คว่า user คนนี้เป็น admin หรือไม่ จาก Clerk publicMetadata
 * (ระบบนี้เก็บ role ไว้ใน Clerk ไม่ได้เก็บใน Supabase table "users")
 */
async function checkIsAdmin(userId: string): Promise<boolean> {
  try {
    const client = await clerkClient();
    const clerkUser = await client.users.getUser(userId);
    return clerkUser.publicMetadata?.role === "admin";
  } catch (error) {
    console.error("checkIsAdmin error:", error);
    return false;
  }
}

/**
 * UPDATE review
 */
export async function PUT(req: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ป้องกันเซิร์ฟเวอร์พังกรณีส่ง JSON ผิดฟอร์แมต
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 },
    );
  }

  const { id, rating, comment } = body;

  if (!id) {
    return NextResponse.json(
      { error: "Review ID is required." },
      { status: 400 },
    );
  }

  // ตรวจสอบสถานะ Admin จาก Clerk publicMetadata
  const isAdmin = await checkIsAdmin(userId);

  type ReviewUpdatePayload = {
    rating?: number;
    comment?: string;
  };

  const updatePayload: ReviewUpdatePayload = {};

  if (rating !== undefined && rating !== null) {
    updatePayload.rating = Number(rating);
  }
  if (comment !== undefined) {
    updatePayload.comment = comment;
  }

  // ถ้าไม่ได้ส่งค่าอะไรมาให้อัปเดตเลย
  if (Object.keys(updatePayload).length === 0) {
    return NextResponse.json(
      { error: "No data provided to update." },
      { status: 400 },
    );
  }

  // นำ Payload ไปอัปเดต
  let query = supabaseAdmin.from("reviews").update(updatePayload);

  if (isAdmin) {
    query = query.eq("id", id);
  } else {
    query = query.eq("id", id).eq("created_by", userId);
  }

  const { data, error } = await query.select();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  if (!data || data.length === 0) {
    return NextResponse.json(
      { error: "Review not found or permission denied." },
      { status: 403 },
    );
  }

  return NextResponse.json(data);
}

/**
 * DELETE review
 */
export async function DELETE(req: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json(
      { error: "Review ID is required." },
      { status: 400 },
    );
  }

  // ตรวจสอบสถานะ Admin จาก Clerk publicMetadata
  const isAdmin = await checkIsAdmin(userId);

  let query = supabaseAdmin.from("reviews").delete();

  if (isAdmin) {
    query = query.eq("id", id);
  } else {
    query = query.eq("id", id).eq("created_by", userId);
  }

  const { data, error } = await query.select();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  if (!data || data.length === 0) {
    return NextResponse.json(
      { error: "Review not found or permission denied." },
      { status: 403 },
    );
  }

  return NextResponse.json({
    message: "Review deleted successfully",
    deleted_id: id,
  });
}