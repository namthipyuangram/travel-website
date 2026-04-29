// src/app/api/categories/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../lib/supabaseAdmin";

/**
 * GET /api/categories
 * ดึงรายการหมวดหมู่พร้อมจำนวนสถานที่
 */
export async function GET() {
  try {
    // ดึงจำนวนสถานที่ในแต่ละหมวดหมู่
    const { data, error } = await supabaseAdmin
      .from("destinations")
      .select("category");

    if (error) {
      console.error("❌ Supabase error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // นับจำนวนในแต่ละหมวดหมู่
    const categoryCounts = data.reduce((acc: any, item: any) => {
      acc[item.category] = (acc[item.category] || 0) + 1;
      return acc;
    }, {});

    // สร้าง array พร้อม icon
    const categories = [
      { name: "ธรรมชาติ", icon: "🌳", count: categoryCounts["ธรรมชาติ"] || 0 },
      { name: "วัด", icon: "🏯", count: categoryCounts["วัด"] || 0 },
      { name: "ร้านอาหาร", icon: "🍜", count: categoryCounts["ร้านอาหาร"] || 0 },
      { name: "คาเฟ่", icon: "☕", count: categoryCounts["คาเฟ่"] || 0 },
      { name: "ที่พัก", icon: "🏠", count: categoryCounts["ที่พัก"] || 0 },
      { name: "อื่นๆ", icon: "📍", count: categoryCounts["อื่นๆ"] || 0 },
    ];

    return NextResponse.json(categories);
  } catch (error) {
    console.error("❌ Error fetching categories:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}