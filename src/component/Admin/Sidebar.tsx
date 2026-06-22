"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import type { User } from "@supabase/supabase-js";
import {
  LayoutDashboard,
  MapPin,
  UtensilsCrossed,
  BedDouble,
  MessageSquareText,
  Mail,
  ChevronLeft,
  LogOut,
  Loader2,
} from "lucide-react";
import Image from "next/image";

const menuItems = [
  {
    name: "แดชบอร์ด",
    href: "/admin/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "สถานที่ท่องเที่ยว",
    href: "/admin/destinations",
    icon: MapPin,
  },
  {
    name: "ของกิน",
    href: "/admin/food",
    icon: UtensilsCrossed,
  },
  {
    name: "ที่พัก",
    href: "/admin/accomodations",
    icon: BedDouble,
  },
  {
    name: "รีวิว",
    href: "/admin/reviews",
    icon: MessageSquareText,
  },
];

const secondaryItems = [
  {
    name: "ติดต่อเรา",
    href: "/contact",
    icon: Mail,
  },
];

export const Sidebar = () => {
  const pathname = usePathname();
  const router = useRouter();

  // ─── UI State ──────────────────────────────────────────────────────────────
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // ─── Auth State ────────────────────────────────────────────────────────────
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  useEffect(() => {
    const fetchSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setLoading(false);
    };

    fetchSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  // ─── Handlers ──────────────────────────────────────────────────────────────
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/sign-in");
    router.refresh();
  };

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  // ─── Render Helper ─────────────────────────────────────────────────────────
  const renderItem = (item: { name: string; href: string; icon: any }) => {
    const active = isActive(item.href);
    const Icon = item.icon;

    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={() => setMobileOpen(false)}
        className={`group relative flex h-11 items-center rounded-xl px-3 transition-all duration-200
        ${
          active
            ? "bg-white/[0.06] text-white shadow-sm"
            : "text-slate-400 hover:bg-white/[0.04] hover:text-slate-200"
        }`}
      >
        {active && (
          <span className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full bg-emerald-400" />
        )}

        <Icon
          className={`h-5 w-5 shrink-0 transition-colors ${
            active ? "text-emerald-400" : ""
          }`}
        />

        {!collapsed && (
          <span className="ml-3 truncate text-[15px] font-medium">
            {item.name}
          </span>
        )}

        {collapsed && (
          <div
            className="
            pointer-events-none
            absolute left-full ml-3
            whitespace-nowrap
            rounded-lg
            border border-white/10
            bg-[#111827]
            px-3 py-2
            text-xs text-white
            opacity-0
            shadow-xl
            transition-all
            group-hover:opacity-100
            z-50
          "
          >
            {item.name}
          </div>
        )}
      </Link>
    );
  };

  // สร้างชื่อผู้ใช้จำลองจาก Email (เช่น admin@example.com -> admin)
  const displayName = user?.email?.split("@")[0] || "ผู้ดูแลระบบ";

  return (
    <>
      {/* ── MOBILE HEADER ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between border-b border-white/5 bg-[#0B1220] px-4 py-3 lg:hidden">
        <button
          onClick={() => setMobileOpen(true)}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-white"
        >
          ☰
        </button>

        <div className="flex items-center gap-3">
          <Image
            src="/images/logo-travel.png"
            alt="เที่ยวตามงบโคราช"
            width={48}
            height={48}
            className="rounded-xl shadow-sm"
            priority
          />

          <div className="flex flex-col leading-tight">
            <span className="font-semibold text-white">เที่ยวโคราช</span>
            <span className="text-xs text-white/60">Admin</span>
          </div>
        </div>

        {/* Custom Mobile User Avatar & Logout */}
        {loading ? (
          <div className="flex h-9 w-9 items-center justify-center">
            <Loader2 className="h-4 w-4 animate-spin text-emerald-400" />
          </div>
        ) : (
          <button
            onClick={handleSignOut}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.05] text-emerald-400 hover:bg-red-500/10 hover:text-red-400 border border-white/10 transition-colors"
            title="ออกจากระบบ"
          >
            <LogOut className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* ── BACKDROP ──────────────────────────────────────────────────────── */}
      <div
        onClick={() => setMobileOpen(false)}
        className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-all lg:hidden
        ${mobileOpen ? "opacity-100" : "pointer-events-none opacity-0"}`}
      />

      {/* ── SIDEBAR ───────────────────────────────────────────────────────── */}
      <aside
        className={`
        fixed left-0 top-0 z-50
        flex h-screen flex-col
        border-r border-white/[0.06]
        bg-[#0B1220]
        transition-all duration-300
        lg:sticky lg:translate-x-0
        ${collapsed ? "w-20" : "w-72"}
        ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
      `}
      >
        {/* HEADER */}
        <div className="relative flex h-20 items-center border-b border-white/[0.06] px-5">
          {!collapsed ? (
            <div>
              <h1 className="text-lg font-semibold text-white">เที่ยวโคราช</h1>
              <p className="mt-1 text-xs text-slate-500">
                Travel Management Platform
              </p>
            </div>
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 font-bold text-slate-900 mx-auto">
              ท
            </div>
          )}

          <button
            onClick={() => setCollapsed(!collapsed)}
            className="absolute -right-3 hidden h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-[#111827] lg:flex hover:bg-white/[0.05] transition-colors z-50"
          >
            <ChevronLeft
              className={`h-4 w-4 text-slate-300 transition-transform duration-300 ${
                collapsed ? "rotate-180" : ""
              }`}
            />
          </button>
        </div>

        {/* NAVIGATION */}
        <nav className="flex-1 overflow-y-auto px-3 py-5">
          {!collapsed && (
            <p className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
              ระบบจัดการ
            </p>
          )}

          <div className="space-y-1">
            {menuItems.map((item) => renderItem(item))}
          </div>

          {!collapsed && (
            <p className="mb-3 mt-8 px-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
              เว็บไซต์
            </p>
          )}

          <div className="space-y-1">
            {secondaryItems.map((item) => renderItem(item))}
          </div>
        </nav>

        {/* USER CARD (แทนที่ UserButton ของ Clerk) */}
        <div className="border-t border-white/[0.06] p-4">
          <div
            className={`
            flex items-center
            rounded-2xl
            border border-white/[0.05]
            bg-white/[0.03]
            p-3
            ${collapsed ? "justify-center" : "justify-between"}
          `}
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin text-emerald-400 mx-auto" />
            ) : (
              <>
                <div className="flex items-center min-w-0">
                  {/* Custom Avatar */}
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 font-bold uppercase text-sm border border-emerald-500/20">
                    {user?.email?.charAt(0) || "U"}
                  </div>

                  {!collapsed && (
                    <div className="ml-3 min-w-0 pr-2">
                      <p className="truncate text-sm font-medium text-white capitalize">
                        {displayName}
                      </p>
                      <p className="truncate text-xs text-slate-500">
                        Administrator
                      </p>
                    </div>
                  )}
                </div>

                {/* Logout Button (ซ่อนเมื่อพับเมนู) */}
                {!collapsed && (
                  <button
                    onClick={handleSignOut}
                    title="ออกจากระบบ"
                    className="flex shrink-0 h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-white/[0.05] hover:text-red-400 transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                )}

                {/* กรณีพับเมนูอยู่ ให้คลิกที่ Avatar เพื่อ Logout ได้ */}
                {collapsed && (
                  <button
                    onClick={handleSignOut}
                    className="absolute inset-0 z-10 rounded-2xl flex items-center justify-center opacity-0 hover:opacity-100 bg-[#0B1220]/90 text-red-400 transition-opacity"
                    title="ออกจากระบบ"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};
