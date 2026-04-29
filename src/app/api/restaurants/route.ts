// src/app/api/restaurants/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../lib/supabaseAdmin";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q");
  const category = searchParams.get("category");

  let query = supabaseAdmin.from("restaurants").select("*").order("id", { ascending: true });

  // 🔍 ถ้ามีค้นหา (q)
  if (q) {
    query = query.or(
      `name.ilike.%${q}%,description.ilike.%${q}%,location.ilike.%${q}%`
    );
  }

  // 🍱 ถ้ามีกรองหมวดหมู่
  if (category && category !== "") {
    query = query.eq("category", category);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const body = await req.json();
  const { name, description, image_url, location, category } = body;

  const { data, error } = await supabaseAdmin
    .from("restaurants")
    .insert({ name, description, image_url, location, category })
    .select();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data[0]);
}
