"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignInButton, UserButton, useUser } from "@clerk/nextjs";
import { motion } from "framer-motion";
import { Compass, Search, Menu } from "lucide-react";

const navItems = [
  { name: "หน้าแรก", href: "/dashboard" },
  { name: "สถานที่ท่องเที่ยว", href: "/destinations" },
  { name: "ของกิน", href: "/food" },
  { name: "ที่พัก", href: "/accomodations" },
  { name: "บทความ", href: "/blog" },
  { name: "ติดต่อเรา", href: "/contact" },
];

export default function Navbar() {
  const pathname = usePathname();
  const { isSignedIn } = useUser();

  return (
    <motion.nav 
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 1, ease: [0.075, 0.82, 0.165, 1] }}
      className="absolute top-0 left-0 w-full z-50 px-6 py-6 md:px-12 md:py-8 flex items-center justify-between"
    >
      {/* โลโก้ */}
      <Link href="/" className="flex items-center gap-2 text-white cursor-pointer group">
        <Compass className="w-8 h-8 text-[#E5A93C] group-hover:rotate-45 transition-transform duration-700" />
        <span className="text-xl font-bold tracking-[0.1em] uppercase">เที่ยวตามงบ</span>
      </Link>

      {/* เมนูตรงกลาง (ซ่อนในมือถือ) */}
      <ul className="hidden lg:flex items-center gap-8 bg-black/20 backdrop-blur-md px-8 py-3 rounded-full border border-white/10 shadow-lg">
        {navItems.map((item) => (
          <li key={item.name}>
            <Link
              href={item.href}
              className={`text-sm tracking-wider font-medium transition-colors ${
                pathname === item.href 
                  ? "text-[#E5A93C]" 
                  : "text-white/80 hover:text-white"
              }`}
            >
              {item.name}
            </Link>
          </li>
        ))}
      </ul>

      {/* เมนูด้านขวา (ค้นหา & เข้าสู่ระบบ) */}
      <div className="flex items-center gap-4 text-white">
        <button className="p-2 hover:bg-white/10 rounded-full transition-colors hidden sm:block">
          <Search className="w-5 h-5" />
        </button>
        
        <div className="hidden sm:block">
          {isSignedIn ? (
            <div className="bg-white/10 p-1 rounded-full backdrop-blur-sm border border-white/20">
              <UserButton />
            </div>
          ) : (
            <SignInButton mode="modal">
              <button className="px-5 py-2 bg-white text-black text-sm font-bold rounded-full hover:bg-gray-200 transition-colors">
                เข้าสู่ระบบ
              </button>
            </SignInButton>
          )}
        </div>

        {/* ปุ่มเมนูมือถือ */}
        <button className="p-2 bg-white text-black hover:bg-gray-200 rounded-full transition-colors lg:hidden">
          <Menu className="w-5 h-5" />
        </button>
      </div>
    </motion.nav>
  );
}