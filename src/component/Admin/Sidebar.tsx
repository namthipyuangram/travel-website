"use client";

import { useState, useEffect, useMemo } from "react";
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
  UserCog2,
  Menu,
  X,
} from "lucide-react";
import Image from "next/image";

// ─── Types ────────────────────────────────────────────────────────────────────

type NavItem = {
  name: string;
  href: string;
  icon: React.ElementType;
};

type NavGroup = {
  label: string;
  items: NavItem[];
};

// ─── Navigation Data ──────────────────────────────────────────────────────────

const NAVIGATION_GROUPS: NavGroup[] = [
  {
    label: "ภาพรวม",
    items: [
      { name: "แดชบอร์ด", href: "/admin/dashboard", icon: LayoutDashboard },
    ],
  },
  {
    label: "จัดการเนื้อหา",
    items: [
      { name: "สถานที่ท่องเที่ยว", href: "/admin/destinations", icon: MapPin },
      { name: "ของกิน", href: "/admin/food", icon: UtensilsCrossed },
      { name: "ที่พัก", href: "/admin/accomodations", icon: BedDouble },
      { name: "รีวิว", href: "/admin/reviews", icon: MessageSquareText },
    ],
  },
  {
    label: "ระบบ",
    items: [
      { name: "จัดการผู้ใช้", href: "/admin/users", icon: UserCog2 },
      { name: "ติดต่อเรา", href: "/contact", icon: Mail },
    ],
  },
];

// ─── Tooltip (collapsed state only) ──────────────────────────────────────────

function Tooltip({ label }: { label: string }) {
  return (
    <span
      role="tooltip"
      className="
        pointer-events-none absolute left-[calc(100%+12px)] top-1/2
        -translate-y-1/2 z-100 whitespace-nowrap rounded-lg
        bg-[#1E3A8A] border border-[#1E3A8A]
        px-3 py-1.5 text-[12px] font-medium text-white
        shadow-[0_8px_24px_rgba(0,0,0,0.12)]
        opacity-0 invisible -translate-x-2
        group-hover:opacity-100 group-hover:visible group-hover:translate-x-0
        transition-all duration-200
      "
    >
      {label}
      <span className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-[#1E3A8A]" />
    </span>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);

  const supabase = useMemo(
    () =>
      createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      ),
    [],
  );

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (mounted) {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) setUser(session?.user ?? null);
    });
    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  // Close mobile sidebar on navigation
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const handleSignOut = async () => {
    if (signingOut) return;
    setSigningOut(true);
    await supabase.auth.signOut();
    router.push("/sign-in");
    router.refresh();
  };

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  const displayName = user?.email?.split("@")[0] ?? "ผู้ดูแลระบบ";
  const avatarInitial = (user?.email?.charAt(0) ?? "A").toUpperCase();

  return (
    <>
      {/* ── Mobile Header ───────────────────────────────────────────── */}
      <header className="flex items-center justify-between border-b border-[#DBEAFE] bg-white px-4 py-3 lg:hidden">
        <button
          onClick={() => setMobileOpen(true)}
          aria-label="เปิดเมนู"
          className="
            flex h-9 w-9 items-center justify-center rounded-lg
            border border-[#DBEAFE] text-[#64748B]
            transition-colors hover:border-[#EC4899]/30 hover:bg-[#EC4899]/10 hover:text-[#EC4899]
          "
        >
          <Menu className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#EC4899]/10 ring-1 ring-[#EC4899]/30">
            <Image
              src="/images/logo-travel.png"
              alt="Logo"
              width={20}
              height={20}
              className="rounded"
              priority
            />
          </div>
          <span className="text-sm font-bold tracking-tight text-[#1E3A8A]">
            เที่ยวโคราช
          </span>
        </div>

        <button
          onClick={handleSignOut}
          disabled={signingOut}
          aria-label="ออกจากระบบ"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-transparent text-[#64748B] transition-colors hover:border-red-500/25 hover:bg-red-50 hover:text-red-500 disabled:opacity-40"
        >
          {signingOut ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <LogOut className="h-4 w-4" />
          )}
        </button>
      </header>

      {/* ── Mobile Backdrop ─────────────────────────────────────────── */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
          className="fixed inset-0 z-40 bg-[#1E3A8A]/20 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* ── Sidebar ─────────────────────────────────────────────────── */}
      <aside
        className={[
          "fixed left-0 top-0 z-50 flex h-screen flex-col",
          "border-r border-[#DBEAFE] bg-white",
          "transition-[width,transform] duration-300 ease-in-out",
          "lg:sticky lg:translate-x-0",
          collapsed ? "w-18" : "w-60",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
      >
        {/* Collapse button — desktop (ย้ายออกมานอก Header กันโดนตัด) */}
        <button
          onClick={() => setCollapsed((c) => !c)}
          aria-label={collapsed ? "ขยาย Sidebar" : "ย่อ Sidebar"}
          className="
            absolute -right-3.5 top-4.25 z-50 hidden h-7 w-7 items-center justify-center
            rounded-full border border-[#DBEAFE] bg-white
            text-[#3B82F6] shadow-sm
            transition-all hover:border-[#EC4899]/40 hover:text-[#EC4899] hover:scale-110
            lg:flex
          "
        >
          <ChevronLeft
            className={`h-3.5 w-3.5 transition-transform duration-300 ${collapsed ? "rotate-180" : ""}`}
          />
        </button>

        {/* ── Logo / Header ──────────────────────────────────────── */}
        <div className="flex h-15 shrink-0 items-center border-b border-[#DBEAFE] px-3.5">
          <Link
            href="/dashboard"
            className="group flex items-center gap-3 px-2 w-full min-w-0"
          >
            {/* Logo */}
            <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl">
              <Image
                src="/images/logo-travel.png"
                alt="เที่ยวตามงบโคราช"
                fill
                priority
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
            </div>

            {/* Wordmark (เฟดหายสมูทๆ) */}
            <div
              className={`flex-1 overflow-hidden transition-all duration-300 ${
                collapsed ? "w-0 opacity-0" : "w-auto opacity-100"
              }`}
            >
              <p className="truncate text-sm font-bold tracking-tight text-slate-900">
                เที่ยวตามงบ<span className="text-[#3B82F6]">โคราช</span>
              </p>
              <p className="mt-0.5 truncate text-xs text-slate-500">
                หน้าจัดการระบบของเว็บไซต์
              </p>
            </div>
          </Link>

          {/* Mobile close */}
          <button
            onClick={() => setMobileOpen(false)}
            aria-label="ปิดเมนู"
            className="ml-auto flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[#64748B] hover:text-[#EC4899] lg:hidden"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* ── Navigation (ซ่อน Scrollbar ถาวร) ────────────────────── */}
        <nav
          className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
          aria-label="Navigation"
        >
          <div className="space-y-4">
            {NAVIGATION_GROUPS.map((group) => (
              <div key={group.label}>
                {/* Group header */}
                {!collapsed ? (
                  <p className="mb-1 px-2 text-[9.5px] font-bold uppercase tracking-widest text-[#3B82F6]">
                    {group.label}
                  </p>
                ) : (
                  <div className="mx-auto mb-2 h-px w-5 rounded-full bg-[#DBEAFE]" />
                )}

                <ul className="space-y-0.5" role="list">
                  {group.items.map((item) => {
                    const active = isActive(item.href);
                    const Icon = item.icon;

                    return (
                      <li key={item.href} role="listitem">
                        <Link
                          href={item.href}
                          aria-current={active ? "page" : undefined}
                          className={[
                            "group relative flex h-9 items-center rounded-lg min-w-0",
                            "outline-none transition-all duration-150",
                            "focus-visible:ring-2 focus-visible:ring-[#EC4899]/40",
                            collapsed ? "justify-center px-0" : "px-2.5",
                            active
                              ? "bg-[#EC4899]/10 text-[#EC4899]"
                              : "text-[#64748B] hover:bg-[#EFF6FF] hover:text-[#1E3A8A]",
                          ].join(" ")}
                        >
                          {/* Active indicator */}
                          {active && (
                            <span
                              aria-hidden="true"
                              className="absolute left-0 top-1/2 h-4.5 w-1 -translate-y-1/2 rounded-r-[3px]"
                              style={{
                                background: "linear-gradient(180deg, #EC4899, #F472B6)",
                              }}
                            />
                          )}

                          <Icon
                            aria-hidden="true"
                            className={`h-4 w-4 shrink-0 transition-colors ${
                              active
                                ? "text-[#EC4899]"
                                : "text-[#94A3B8] group-hover:text-[#3B82F6]"
                            }`}
                          />

                          {/* Text (เฟดหายเนียนๆ ป้องกัน Scrollbar ดันจอ) */}
                          <div
                            className={`flex items-center overflow-hidden transition-all duration-300 ${
                              collapsed ? "w-0 opacity-0" : "flex-1 w-auto opacity-100 ml-2"
                            }`}
                          >
                            <span className="truncate text-[13px] font-medium block w-full">
                              {item.name}
                            </span>
                          </div>

                          {collapsed && <Tooltip label={item.name} />}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </nav>

        {/* ── User Panel ─────────────────────────────────────────── */}
        <div className="shrink-0 border-t border-[#DBEAFE] p-3">
          {loading ? (
            <div className="flex h-12 items-center justify-center">
              <Loader2 className="h-4 w-4 animate-spin text-[#3B82F6]" />
            </div>
          ) : (
            <div
              className={[
                "relative flex items-center rounded-[11px] min-w-0",
                "border border-[#DBEAFE] bg-[#EFF6FF]",
                "transition-[border-color] hover:border-[#3B82F6]/40",
                collapsed ? "justify-center p-2" : "p-2",
              ].join(" ")}
            >
              {/* Avatar */}
              <div className="relative shrink-0">
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-[13px] font-bold text-[#EC4899]"
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(236,72,153,0.15), rgba(244,114,182,0.15))",
                    boxShadow: "inset 0 0 0 1px rgba(236,72,153,0.25)",
                  }}
                >
                  {avatarInitial}
                </div>
                <span
                  aria-label="Online"
                  className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-400"
                />
              </div>

              {/* Info (ซ่อนเนียนๆ) */}
              <div
                className={`flex items-center overflow-hidden transition-all duration-300 ${
                  collapsed ? "w-0 opacity-0" : "flex-1 w-auto opacity-100 ml-2"
                }`}
              >
                <div className="min-w-0 flex-1 overflow-hidden pr-1">
                  <p className="truncate text-[13px] font-semibold capitalize leading-none text-[#1E3A8A]">
                    {displayName}
                  </p>
                  <p className="mt-1 truncate text-[10px] uppercase leading-none tracking-[0.04em] text-[#3B82F6]">
                    Administrator
                  </p>
                </div>

                <button
                  onClick={handleSignOut}
                  disabled={signingOut}
                  aria-label="ออกจากระบบ"
                  title="ออกจากระบบ"
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[#64748B] transition-colors hover:bg-red-50 hover:text-red-500 disabled:opacity-40"
                >
                  {signingOut ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <LogOut className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>

              {/* Collapsed overlay */}
              {collapsed && (
                <button
                  onClick={handleSignOut}
                  disabled={signingOut}
                  aria-label="ออกจากระบบ"
                  className="group absolute inset-0 z-10 h-full w-full cursor-pointer rounded-[11px]"
                >
                  <Tooltip label="ออกจากระบบ" />
                </button>
              )}
            </div>
          )}
        </div>
      </aside>
    </>
  );
}