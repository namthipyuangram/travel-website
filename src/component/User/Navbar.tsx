"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignInButton, UserButton, useUser } from "@clerk/nextjs";
import { motion, AnimatePresence } from "framer-motion";
import { Compass, Search, Menu, X } from "lucide-react";

const navItems = [
  { name: "หน้าแรก", href: "/dashboard" },
  { name: "สถานที่ท่องเที่ยว", href: "/destinations" },
  { name: "ของกิน", href: "/restaurant" },
  { name: "ที่พัก", href: "/accommodations" },
  { name: "ทริปเที่ยวของฉัน", href: "/trips" },
  { name: "ติดต่อเรา", href: "/contact" },
];

// ─── Pages ที่มี hero เข้ม (เริ่มต้นด้วย glass mode) ─────────────────────────
const HERO_PAGES = ["/", "/dashboard", "/destinations", "/restaurant", "/accommodations", "/trips"];

export default function Navbar() {
  const pathname = usePathname();
  const { isSignedIn } = useUser();

  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // ตรวจสอบว่าหน้านี้มี hero สีเข้มไหม
  const hasHero = HERO_PAGES.some((p) => pathname === p || pathname.startsWith(p + "/"));

  // ── Scroll listener ────────────────────────────────────────────────────────
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll(); // เช็คทันทีเมื่อ mount
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  // ── ตัดสินใจ theme ────────────────────────────────────────────────────────
  // glass = บน hero ยังไม่ scroll | solid = scroll แล้ว หรือหน้าที่ไม่มี hero
  const isGlass = hasHero && !scrolled;

  return (
    <>
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="fixed top-0 left-0 right-0 z-50"
      >
        {/* ── Navbar bar ──────────────────────────────────────────────────── */}
        <div
          className={`
            mx-auto transition-all duration-300 ease-out
            ${scrolled
              ? "max-w-full px-0 pt-0"
              : "max-w-7xl px-4 pt-4"
            }
          `}
        >
          <div
            className={`
              flex items-center justify-between
              px-4 lg:px-6
              transition-all duration-300 ease-out
              ${scrolled
                ? // Solid white mode หลัง scroll
                  "h-14 bg-white border-b border-slate-200/80 shadow-sm rounded-none"
                : // Glassmorphism mode บน hero
                  "h-14 bg-white/10 backdrop-blur-2xl border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.16)] rounded-full"
              }
            `}
          >
            {/* ── Logo ──────────────────────────────────────────────────── */}
            <Link href="/" className="flex items-center gap-3 shrink-0 group">
              <div className="w-9 h-9 rounded-full bg-linear-to-br from-amber-300 to-yellow-500 flex items-center justify-center shadow-md">
                <Compass className="w-4.5 h-4.5 text-white transition-transform duration-700 group-hover:rotate-180" />
              </div>
              <div className="hidden sm:block">
                <span
                  className={`font-bold text-base tracking-wide transition-colors duration-300 ${
                    isGlass ? "text-white" : "text-slate-800"
                  }`}
                >
                  เที่ยวตาม
                  <span className="text-amber-400">งบ</span>
                </span>
              </div>
            </Link>

            {/* ── Desktop menu ───────────────────────────────────────────── */}
            <ul className="hidden lg:flex items-center gap-1">
              {navItems.map((item) => {
                const isActive =
                  item.href === "/dashboard"
                    ? pathname === item.href
                    : pathname === item.href || pathname.startsWith(item.href + "/");

                return (
                  <li key={item.name} className="relative">
                    <Link
                      href={item.href}
                      className={`
                        relative flex items-center gap-1
                        px-3.5 py-2 rounded-full
                        text-sm font-medium
                        transition-all duration-200
                        ${isGlass
                          ? isActive
                            ? "text-white"
                            : "text-white/70 hover:text-white hover:bg-white/10"
                          : isActive
                          ? "text-slate-900"
                          : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                        }
                      `}
                    >
                      {item.name}
                      {isActive && (
                        <motion.span
                          layoutId="navbar-pill"
                          transition={{ type: "spring", stiffness: 380, damping: 30 }}
                          className={`
                            absolute inset-0 rounded-full -z-10
                            ${isGlass
                              ? "bg-white/15 border border-white/20"
                              : "bg-slate-100"
                            }
                          `}
                        />
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>

            {/* ── Right actions ──────────────────────────────────────────── */}
            <div className="flex items-center gap-2">
              {/* Search */}
              <button
                type="button"
                aria-label="ค้นหา"
                className={`
                  hidden sm:flex w-9 h-9 rounded-full
                  items-center justify-center
                  transition-all duration-200
                  ${isGlass
                    ? "bg-white/10 border border-white/20 text-white/80 hover:bg-white/20 hover:text-white"
                    : "bg-slate-100 border border-transparent text-slate-500 hover:bg-slate-200 hover:text-slate-800"
                  }
                `}
              >
                <Search className="w-4 h-4" />
              </button>

              {/* Auth capsule */}
              <div
                className={`
                  flex items-center gap-2.5
                  px-3 py-1.5 rounded-full
                  transition-all duration-200
                  ${isGlass
                    ? "bg-white/10 border border-white/20 hover:bg-white/15"
                    : "bg-slate-100 border border-slate-200 hover:bg-slate-200"
                  }
                `}
              >
                {/* Mobile hamburger */}
                <button
                  type="button"
                  aria-label={mobileOpen ? "ปิดเมนู" : "เปิดเมนู"}
                  onClick={() => setMobileOpen((v) => !v)}
                  className={`
                    lg:hidden transition-colors duration-200
                    ${isGlass ? "text-white/80 hover:text-white" : "text-slate-500 hover:text-slate-800"}
                  `}
                >
                  {mobileOpen
                    ? <X className="w-4 h-4" />
                    : <Menu className="w-4 h-4" />
                  }
                </button>

                {/* Divider — mobile only */}
                <div
                  className={`lg:hidden w-px h-4 ${isGlass ? "bg-white/20" : "bg-slate-300"}`}
                />

                {/* Auth */}
                {isSignedIn ? (
                  <UserButton
                    appearance={{
                      elements: {
                        userButtonAvatarBox: "w-7 h-7",
                      },
                    }}
                  />
                ) : (
                  <SignInButton mode="modal">
                    <button
                      type="button"
                      className={`
                        text-sm font-semibold transition-colors duration-200
                        ${isGlass
                          ? "text-white hover:text-amber-300"
                          : "text-slate-700 hover:text-amber-500"
                        }
                      `}
                    >
                      เข้าสู่ระบบ
                    </button>
                  </SignInButton>
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* ── Mobile drawer ──────────────────────────────────────────────────── */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm lg:hidden"
            />

            {/* Drawer panel */}
            <motion.div
              key="drawer"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 32 }}
              className="fixed top-0 right-0 bottom-0 z-50 w-72 bg-white shadow-2xl lg:hidden flex flex-col"
            >
              {/* Drawer header */}
              <div className="flex items-center justify-between px-5 h-16 border-b border-slate-100">
                <Link href="/" onClick={() => setMobileOpen(false)} className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-linear-to-br from-amber-300 to-yellow-500 flex items-center justify-center">
                    <Compass className="w-4 h-4 text-white" />
                  </div>
                  <span className="font-bold text-slate-800">
                    เที่ยวตาม<span className="text-amber-400">งบ</span>
                  </span>
                </Link>
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  aria-label="ปิดเมนู"
                  className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Drawer nav */}
              <nav className="flex-1 overflow-y-auto px-3 py-4">
                <ul className="space-y-1">
                  {navItems.map((item, i) => {
                    const isActive =
                      item.href === "/dashboard"
                        ? pathname === item.href
                        : pathname === item.href || pathname.startsWith(item.href + "/");

                    return (
                      <motion.li
                        key={item.name}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 + 0.1 }}
                      >
                        <Link
                          href={item.href}
                          onClick={() => setMobileOpen(false)}
                          className={`
                            flex items-center justify-between
                            px-4 py-3 rounded-xl text-sm font-medium
                            transition-all duration-150
                            ${isActive
                              ? "bg-amber-50 text-amber-700"
                              : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                            }
                          `}
                        >
                          <span>{item.name}</span>
                        </Link>
                      </motion.li>
                    );
                  })}
                </ul>
              </nav>

              {/* Drawer footer */}
              {!isSignedIn && (
                <div className="p-4 border-t border-slate-100">
                  <SignInButton mode="modal">
                    <button
                      type="button"
                      className="w-full py-3 bg-amber-400 hover:bg-amber-500 text-white font-semibold rounded-xl text-sm transition-colors"
                    >
                      เข้าสู่ระบบ / สมัครสมาชิก
                    </button>
                  </SignInButton>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}