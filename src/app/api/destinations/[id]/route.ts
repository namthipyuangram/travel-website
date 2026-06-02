import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "../../../../lib/supabaseAdmin";

/**
 * GET /api/destinations/[id]
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const destinationId = Number(id);

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
  } catch {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

/**
 * helper
 */
async function checkAdmin(userId: string) {
  const { data: profile, error } = await supabaseAdmin
    .from("users")
    .select("role")
    .eq("id", userId)
    .single();

  return !error && profile?.role === "admin";
}

/**
 * PUT /api/destinations/[id]
 */
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!(await checkAdmin(userId))) {
      return NextResponse.json(
        { error: "Forbidden: Admin only" },
        { status: 403 }
      );
    }

    const { id } = await context.params;
    const destinationId = Number(id);

    if (isNaN(destinationId)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const body = await request.json();
    const { name, description, category, image_url, min_price, max_price } =
      body;

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
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/destinations/[id]
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!(await checkAdmin(userId))) {
      return NextResponse.json(
        { error: "Forbidden: Admin only" },
        { status: 403 }
      );
    }

    const { id } = await context.params;
    const destinationId = Number(id);

    if (isNaN(destinationId)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from("destinations")
      .delete()
      .eq("id", destinationId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: "Deleted successfully" });
  } catch {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}