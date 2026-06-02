// src/app/api/destinations/route.ts
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "../../../lib/supabaseAdmin";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const minBudget = searchParams.get("minBudget");
    const maxBudget = searchParams.get("maxBudget");

    let query = supabaseAdmin
      .from("destinations")
      .select("*")
      .order("created_at", { ascending: false });

    // ✅ กรองราคา (Filter Logic)
    if (minBudget) {
      const minVal = parseFloat(minBudget);
      if (!isNaN(minVal)) query = query.gte("max_price", minVal);
    }
    if (maxBudget) {
      const maxVal = parseFloat(maxBudget);
      if (!isNaN(maxVal)) query = query.lte("min_price", maxVal);
    }

    const { data, error } = await query;

    if (error) {
      console.error("❌ Supabase GET error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(data || []);
  } catch (error) {
    console.error("❌ GET Internal error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 🔥 ดึง role จาก Supabase แทน Clerk
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("users")
      .select("role")
      .eq("id", userId)
      .single();

    if (profileError || profile?.role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden: Admin only" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { name, description, category, image_url, min_price, max_price } = body;

    if (!name || !description || !category) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const minPriceNum = Number(min_price) || 0;
    const maxPriceNum = Number(max_price) || 0;

    if (minPriceNum > maxPriceNum) {
      return NextResponse.json({ error: "Invalid price range" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("destinations")
      .insert([
        {
          name,
          description,
          category,
          image_url: image_url || null,
          min_price: minPriceNum,
          max_price: maxPriceNum,
          created_by: userId,
        },
      ])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}