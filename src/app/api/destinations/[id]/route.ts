// src/app/api/destinations/[id]/route.ts
import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { supabaseAdmin } from "../../../../lib/supabaseAdmin";

/**
 * GET /api/destinations/[id]
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> } // ✅ แก้ Type ให้รองรับ Promise
) {
  try {
    const { id } = await params; // ✅ ต้อง await params ก่อนใช้
    const destinationId = parseInt(id);

    if (isNaN(destinationId)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("destinations")
      .select("*")
      .eq("id", destinationId)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("❌ Error fetching destination:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

/**
 * PUT /api/destinations/[id]
 */
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> } // ✅ แก้ Type
) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await currentUser();
    if (user?.publicMetadata?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden: Admin only" }, { status: 403 });
    }

    const { id } = await params; // ✅ await params
    const destinationId = parseInt(id);
    
    if (isNaN(destinationId)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const body = await req.json();
    const { name, description, category, image_url, min_price, max_price } = body;

    // ✅ Update ข้อมูล
    const { data, error } = await supabaseAdmin
      .from("destinations")
      .update({
        name,
        description,
        category,
        image_url: image_url || null,
        min_price: Number(min_price) || 0,
        max_price: Number(max_price) || 0,
        updated_by: userId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", destinationId)
      .select()
      .single();

    if (error) {
      console.error("❌ Supabase update error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("❌ Error updating destination:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

/**
 * DELETE /api/destinations/[id]
 */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> } // ✅ แก้ Type
) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await currentUser();
    if (user?.publicMetadata?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden: Admin only" }, { status: 403 });
    }

    const { id } = await params; // ✅ await params
    const destinationId = parseInt(id);

    if (isNaN(destinationId)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from("destinations")
      .delete()
      .eq("id", destinationId);

    if (error) {
      console.error("❌ Supabase delete error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: "Deleted successfully" });
  } catch (error) {
    console.error("❌ Error deleting destination:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}