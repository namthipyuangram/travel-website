// src/lib/supabaseClient.ts
import { createBrowserClient } from "@supabase/ssr";

export const createSupabaseClient = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anon) {
    throw new Error("Missing Supabase env vars (CLIENT)");
  }

  // createBrowserClient จะจัดการซิงก์ Session ลง Cookie ให้โดยอัตโนมัติ
  return createBrowserClient(url, anon);
};