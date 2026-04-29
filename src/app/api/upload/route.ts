import { supabaseAdmin } from "../../../lib/supabaseAdmin"; // ✅ ใช้ client ฝั่ง server
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  }

  const fileName = `${Date.now()}-${file.name}`;
  const arrayBuffer = await file.arrayBuffer();

  // ✅ ใช้ supabaseAdmin แทน supabase
  const { data, error } = await supabaseAdmin.storage
    .from("Images")
    .upload(fileName, Buffer.from(arrayBuffer), {
      contentType: file.type,
      upsert: false,
    });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data: publicUrl } = supabaseAdmin.storage
    .from("Images")
    .getPublicUrl(fileName);

  return NextResponse.json({ url: publicUrl.publicUrl });
}
