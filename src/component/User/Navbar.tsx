"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignInButton, UserButton, useUser } from "@clerk/nextjs";
import { motion } from "framer-motion";
import { Compass, Search, Menu, ChevronDown } from "lucide-react";

const navItems = [
  { name: "หน้าแรก", href: "/dashboard" },
  { name: "สถานที่ท่องเที่ยว", href: "/destinations", hasDropdown: true },
  { name: "ของกิน", href: "/restaurant" },
  { name: "ที่พัก", href: "/accommodations" },
  { name: "บทความ", href: "/blog" },
  { name: "ติดต่อเรา", href: "/contact" },
];

export default function Navbar() {
  const pathname = usePathname();
  const { isSignedIn } = useUser();

  return (
    <motion.nav
      initial={{ y: -30, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{
        duration: 0.8,
        ease: [0.16, 1, 0.3, 1],
      }}
      className="fixed top-5 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-7xl"
    >
      <div
        className="
          flex items-center justify-between
          px-5 lg:px-7
          py-3
          rounded-full

          bg-white/10
          backdrop-blur-2xl
          border border-white/20

          shadow-[0_10px_40px_rgba(0,0,0,0.18)]
        "
      >
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-3 shrink-0 group"
        >
          <div
            className="
              w-10 h-10
              rounded-full
              bg-gradient-to-br
              from-amber-300
              to-yellow-500
              flex items-center justify-center
              shadow-lg
            "
          >
            <Compass className="w-5 h-5 text-white transition-transform duration-700 group-hover:rotate-180" />
          </div>

          <div className="hidden sm:block">
            <h1 className="text-white font-bold text-lg tracking-wide">
              เที่ยวตาม
              <span className="text-amber-300">งบ</span>
            </h1>
          </div>
        </Link>

        {/* Desktop Menu */}
        <ul className="hidden lg:flex items-center gap-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;

            return (
              <li key={item.name} className="relative">
                <Link
                  href={item.href}
                  className={`
                    relative
                    flex items-center gap-1
                    px-4 py-2.5
                    rounded-full
                    text-sm
                    font-medium
                    transition-all duration-300

                    ${
                      isActive
                        ? "text-white"
                        : "text-white/75 hover:text-white"
                    }
                  `}
                >
                  {item.name}

                  {item.hasDropdown && (
                    <ChevronDown
                      className="
                        w-3.5 h-3.5
                        opacity-70
                      "
                    />
                  )}

                  {isActive && (
                    <motion.span
                      layoutId="navbar-active"
                      transition={{
                        type: "spring",
                        stiffness: 350,
                        damping: 28,
                      }}
                      className="
                        absolute inset-0
                        rounded-full
                        bg-white/15
                        backdrop-blur-xl
                        border border-white/20
                        shadow-[0_4px_20px_rgba(255,255,255,0.08)]
                        -z-10
                      "
                    />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Right Side */}
        <div className="flex items-center gap-3">
          {/* Search */}
          <button
            className="
              hidden sm:flex
              w-10 h-10
              rounded-full

              bg-white/10
              backdrop-blur-xl
              border border-white/20

              items-center justify-center

              text-white/80
              hover:text-white
              hover:bg-white/20

              transition-all duration-300
            "
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Profile Capsule */}
          <div
            className="
              flex items-center gap-3

              px-3 py-1.5
              rounded-full

              bg-white/10
              backdrop-blur-2xl
              border border-white/20

              shadow-[0_6px_25px_rgba(0,0,0,0.12)]

              hover:bg-white/15
              transition-all duration-300
            "
          >
            <button
              className="
                text-white/80
                hover:text-white
                transition-colors
              "
            >
              <Menu className="w-4 h-4" />
            </button>

            <div className="w-px h-5 bg-white/20" />

            {isSignedIn ? (
              <UserButton
                appearance={{
                  elements: {
                    userButtonAvatarBox:
                      "w-8 h-8 border border-white/20 shadow-md",
                  },
                }}
              />
            ) : (
              <SignInButton mode="modal">
                <button
                  className="
                    text-sm
                    font-semibold
                    text-white
                    hover:text-amber-300
                    transition-colors
                  "
                >
                  เข้าสู่ระบบ
                </button>
              </SignInButton>
            )}
          </div>
        </div>
      </div>
    </motion.nav>
  );
}