import { supabaseClient } from "@/lib/supabaseClient"; 
import { supabaseAdmin } from "@/lib/supabaseAdmin"; // ✅ นำเข้า Admin Client
import { auth, currentUser } from "@clerk/nextjs/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const accommodation_id = searchParams.get("accommodation_id");
  const restaurant_id = searchParams.get("restaurant_id");
  const destination_id = searchParams.get("destination_id");

  // การอ่านข้อมูลทั่วไป สามารถใช้ supabaseClient ได้ (หากเปิด RLS ให้อ่านได้)
  let query = supabaseClient
    .from("reviews")
    .select("*")
    .order("created_at", { ascending: false });

  if (accommodation_id) query = query.eq("accommodation_id", accommodation_id);
  if (restaurant_id) query = query.eq("restaurant_id", Number(restaurant_id));
  if (destination_id) query = query.eq("destination_id", Number(destination_id));

  const { data, error } = await query;

  if (error) return Response.json({ error: error.message }, { status: 400 });
  return Response.json(data);
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  let body;
  try {
    body = await req.json(); 
  } catch (err) {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }
  
  const { accommodation_id, restaurant_id, destination_id, rating, comment } = body;

  const providedIds = [accommodation_id, restaurant_id, destination_id].filter(Boolean);
  if (providedIds.length !== 1) {
    return Response.json({ error: "Please provide exactly one target ID." }, { status: 400 });
  }

  if (!rating) return Response.json({ error: "Rating is required." }, { status: 400 });

  // ✅ ใช้ supabaseAdmin เพื่อ Bypass RLS ในการ Insert ข้อมูล
  const { data, error } = await supabaseAdmin.from("reviews").insert([
    {
      accommodation_id: accommodation_id || null, 
      restaurant_id: restaurant_id ? Number(restaurant_id) : null, 
      destination_id: destination_id ? Number(destination_id) : null, 
      rating: Number(rating), 
      comment,
      created_by: userId,
    },
  ]).select();

  if (error) return Response.json({ error: error.message }, { status: 400 });
  return Response.json(data);
}

export async function PUT(req: Request) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const user = await currentUser();
  const isAdmin = user?.publicMetadata?.role === "admin";
  
  const body = await req.json();
  const { id, rating, comment } = body;

  if (!id) return Response.json({ error: "Review ID is required." }, { status: 400 });

  // ✅ ใช้ supabaseAdmin เพื่อ Bypass RLS ในการ Update ข้อมูล
  let query = supabaseAdmin.from("reviews").update({ 
    rating: Number(rating), 
    comment 
  });
  
  if (isAdmin) {
    query = query.eq("id", id);
  } else {
    query = query.eq("id", id).eq("created_by", userId);
  }

  const { data, error } = await query.select();

  if (error) return Response.json({ error: error.message }, { status: 400 });
  if (!data || data.length === 0) return Response.json({ error: "Review not found or permission denied." }, { status: 403 });

  return Response.json(data);
}

export async function DELETE(req: Request) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const user = await currentUser();
  const isAdmin = user?.publicMetadata?.role === "admin";

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) return Response.json({ error: "Review ID is required." }, { status: 400 });

  // ✅ ใช้ supabaseAdmin เพื่อ Bypass RLS ในการ Delete ข้อมูล
  let query = supabaseAdmin.from("reviews").delete();

  if (isAdmin) {
    query = query.eq("id", id);
  } else {
    query = query.eq("id", id).eq("created_by", userId);
  }

  const { data, error } = await query.select();

  if (error) return Response.json({ error: error.message }, { status: 400 });
  if (!data || data.length === 0) return Response.json({ error: "Review not found or permission denied." }, { status: 403 });

  return Response.json({ message: "Review deleted successfully", deleted_id: id });
}