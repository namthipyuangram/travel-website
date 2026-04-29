// ===== api/accommodations/route.ts =====
import { supabaseClient } from "@/lib/supabaseClient";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const { data, error } = await supabaseClient
      .from("accommodations")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("GET Error:", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("GET Exception:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      name,
      description,
      address,
      min_price,
      max_price,
      price_range,
      category,
      contact_phone,
      contact_line,
      contact_facebook,
      images,
    } = body;

    // Validate required fields
    if (!name || !category) {
      return NextResponse.json(
        { error: "Name and category are required" },
        { status: 400 }
      );
    }

    // ✅ เพิ่ม .select() เพื่อ return ข้อมูลที่ insert
    const { data, error } = await supabaseClient
      .from("accommodations")
      .insert([
        {
          name,
          description,
          address,
          min_price,
          max_price,
          price_range,
          category,
          contact_phone,
          contact_line,
          contact_facebook,
          images,
          created_by: userId,
        },
      ])
      .select(); // ✅ สำคัญมาก!

    if (error) {
      console.error("Insert Error:", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(data[0], { status: 201 });
  } catch (err) {
    console.error("POST Exception:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}