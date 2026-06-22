// src/actions/users.ts
"use server";

import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const verifyAdminStatus = async () => {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) { },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized: ไม่พบข้อมูลผู้ใช้งาน");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    throw new Error("Unauthorized: เฉพาะผู้ดูแลระบบเท่านั้น");
  }
};

export const getAllUsers = async () => {
  await verifyAdminStatus();

  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.listUsers();
  if (authError) throw new Error(authError.message);

  const { data: profilesData, error: profilesError } = await supabaseAdmin
    .from("profiles")
    .select("*");
  if (profilesError) throw new Error(profilesError.message);

  // คำนวณสถานะออนไลน์ (สมมติว่า active ภายใน 30 นาทีถือว่าออนไลน์)
  const ONLINE_THRESHOLD = 30 * 60 * 1000; // 30 นาทีในหน่วยมิลลิวินาที
  const now = new Date().getTime();

  const usersWithRoles = authData.users.map((u) => {
    const profile = profilesData.find((p) => p.id === u.id);
    const lastActiveStr = profile?.last_active_at || u.last_sign_in_at;
    const lastActiveTime = lastActiveStr ? new Date(lastActiveStr).getTime() : 0;
    const isOnline = (now - lastActiveTime) < ONLINE_THRESHOLD;

    return {
      id: u.id,
      email: u.email,
      created_at: u.created_at,
      last_sign_in_at: lastActiveStr,
      isOnline: isOnline,
      role: profile?.role || "user",
      provider: u.app_metadata?.provider || "email",
    };
  });

  // เรียงลำดับให้คนออนไลน์และเพิ่งสร้างบัญชีขึ้นก่อน
  return usersWithRoles.sort((a, b) => {
    if (a.isOnline === b.isOnline) {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
    return a.isOnline ? -1 : 1;
  });
};

export const updateUserRole = async (userId: string, newRole: "admin" | "user") => {
  await verifyAdminStatus();
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .update({ role: newRole })
    .eq("id", userId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
};

export const deleteUserAccount = async (userId: string) => {
  await verifyAdminStatus();
  const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
  if (error) throw new Error(error.message);
  return true;
};

export const updateOnlineStatus = async () => {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll() { },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    // อัปเดตเวลาล่าสุดลงตาราง profiles
    await supabaseAdmin
      .from("profiles")
      .update({ last_active_at: new Date().toISOString() })
      .eq("id", user.id);
  }
};