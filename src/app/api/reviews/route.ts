import { supabaseClient} from "@/lib/supabaseClient"; // ✅ ตรวจสอบว่าชื่อในไฟล์ client ตรงกัน
import { auth } from "@clerk/nextjs/server";

export async function GET() {
  const { data, error } = await supabaseClient
    .from("reviews")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return Response.json({ error: error.message }, { status: 400 });
  return Response.json(data);
}

export async function POST(req: Request) {
  // ✅ ต้อง await
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { accommodation_id, rating, comment } = body;

  const { data, error } = await supabaseClient.from("reviews").insert([
    {
      accommodation_id,
      rating,
      comment,
      created_by: userId,
    },
  ]);

  if (error) return Response.json({ error: error.message }, { status: 400 });
  return Response.json(data);
}
