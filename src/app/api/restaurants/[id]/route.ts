// src/app/api/restaurants/[id]/route.ts

import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabaseAdmin";

// ==========================================
// Types & Helpers
// ==========================================
// รองรับ Next.js 15 ที่ params จะเป็น Promise
type RouteContext = {
  params: Promise<{ id: string }>;
};

interface UpdateRestaurantBody {
  name?: string;
  description?: string;
  image_url?: string;
  location?: string;
  category?: string;
}

// ตรวจสอบว่าเป็น "ตัวเลข"
const isNumeric = (val: string) => /^\d+$/.test(val);

// ==========================================
// GET: ดึงข้อมูลร้านอาหาร 1 ร้าน (Public)
// ==========================================
export async function GET(req: Request, context: RouteContext) {
  try {
    const { id } = await context.params;

    if (!isNumeric(id)) {
      return NextResponse.json({ error: "ID ต้องเป็นตัวเลข" }, { status: 400 });
    }

    const numericId = Number(id);

    const { data, error } = await supabaseAdmin
      .from("restaurants")
      .select("*")
      .eq("id", numericId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "ไม่พบร้านอาหารที่ระบุ" }, { status: 404 });
      }
      throw error;
    }

    const formattedData = {
      ...data,
      images: data.image_url ? [data.image_url] : [],
      reviews: [], // สามารถเขียน Query ดึง reviews เพิ่มเติมได้ในอนาคต
    };

    return NextResponse.json(formattedData, { status: 200 });
  } catch (error: unknown) {
    console.error("GET Restaurant Error:", error);
    const errorMessage = error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการดึงข้อมูล";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// ==========================================
// PUT: อัปเดตข้อมูลร้านอาหาร (Protected)
// ==========================================
export async function PUT(req: Request, context: RouteContext) {
  try {
    // 🔒 TODO: เพิ่มการตรวจสอบสิทธิ์ (Authentication/Authorization) ตรงนี้
    // ตัวอย่าง: const session = await getServerSession(); if (!session?.user.isAdmin) return 401;

    const { id } = await context.params;

    if (!isNumeric(id)) {
      return NextResponse.json({ error: "ID ต้องเป็นตัวเลข" }, { status: 400 });
    }

    const numericId = Number(id);
    const body: UpdateRestaurantBody = await req.json();

    // ดึงเฉพาะฟิลด์ที่ต้องการอัปเดต เพื่อป้องกันการส่งฟิลด์แปลกปลอมเข้ามา
    const updateData = {
      name: body.name,
      description: body.description,
      image_url: body.image_url,
      location: body.location,
      category: body.category,
    };

    const { data, error } = await supabaseAdmin
      .from("restaurants")
      .update(updateData)
      .eq("id", numericId)
      .select();

    if (error) throw error;

    if (!data || data.length === 0) {
      return NextResponse.json({ error: "ไม่พบร้านอาหารที่ต้องการแก้ไข" }, { status: 404 });
    }

    return NextResponse.json(data[0], { status: 200 });
  } catch (error: unknown) {
    console.error("PUT Restaurant Error:", error);
    const errorMessage = error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการแก้ไขข้อมูล";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// ==========================================
// DELETE: ลบข้อมูลร้านอาหาร (Protected)
// ==========================================
export async function DELETE(req: Request, context: RouteContext) {
  try {
    // 🔒 TODO: เพิ่มการตรวจสอบสิทธิ์ (Authentication/Authorization) ตรงนี้
    // ตัวอย่าง: const session = await getServerSession(); if (!session?.user.isAdmin) return 401;

    const { id } = await context.params;

    if (!isNumeric(id)) {
      return NextResponse.json({ error: "ID ต้องเป็นตัวเลข" }, { status: 400 });
    }

    const numericId = Number(id);

    const { error } = await supabaseAdmin
      .from("restaurants")
      .delete()
      .eq("id", numericId);

    if (error) throw error;

    return NextResponse.json({ success: true, message: "ลบข้อมูลสำเร็จ" }, { status: 200 });
  } catch (error: unknown) {
    console.error("DELETE Restaurant Error:", error);
    const errorMessage = error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการลบข้อมูล";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}