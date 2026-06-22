// src/actions/users.ts
"use server";

import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

// สร้าง Supabase Admin Client (ใช้สิทธิ์สูงสุด ทะลุทุกกฎ)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ฟังก์ชันเช็คสิทธิ์คนกด (ต้องเป็น Admin เท่านั้น)
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
  if (!user || user.app_metadata?.role !== "admin") {
    throw new Error("Unauthorized: เฉพาะผู้ดูแลระบบเท่านั้น");
  }
};

// 1. ดึงรายชื่อ User ทั้งหมด
export const getAllUsers = async () => {
  await verifyAdminStatus(); // เช็คสิทธิ์ก่อน
  const { data, error } = await supabaseAdmin.auth.admin.listUsers();
  if (error) throw new Error(error.message);
  return data.users;
};

// 2. เปลี่ยน Role (Promote / Demote)
export const updateUserRole = async (userId: string, newRole: "admin" | "user") => {
  await verifyAdminStatus();
  const { data, error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
    app_metadata: { role: newRole },
  });
  if (error) throw new Error(error.message);
  return data.user;
};

// 3. ลบ User ทิ้ง (Ban/Delete)
export const deleteUserAccount = async (userId: string) => {
  await verifyAdminStatus();
  const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
  if (error) throw new Error(error.message);
  return true;
};