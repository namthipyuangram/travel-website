import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabaseAdmin";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; // ⭐ ต้อง await ก่อน
  const body = await req.json();
  const { name, description, image_url, location, category } = body;

  const { data, error } = await supabaseAdmin
    .from("restaurants")
    .update({ name, description, image_url, location, category })
    .eq("id", id)
    .select();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data[0]);
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; // ⭐ ต้อง await ก่อน
  
  const { error } = await supabaseAdmin
    .from("restaurants")
    .delete()
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}