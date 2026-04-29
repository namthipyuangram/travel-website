// src/components/Navbar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignInButton, UserButton, useUser } from "@clerk/nextjs";

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
    <nav className="bg-blue-600 backdrop-blur-md shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex justify-between items-center px-6 py-4">
        <Link href="/" className="text-2xl font-bold text-white">
          เที่ยวตามงบ
        </Link>

        <ul className="hidden md:flex gap-6">
          {navItems.map((item) => (
            <li key={item.name}>
              <Link
                href={item.href}
                className={`transition hover:text-yellow-600 ${
                  pathname === item.href ? "text-yellow-600 font-semibold" : "text-white"
                }`}
              >
                {item.name}
              </Link>
            </li>
          ))}
        </ul>

        <div>
          {isSignedIn ? (
            <UserButton afterSignOutUrl="/" />
          ) : (
            <SignInButton mode="modal">
              <button className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition">
                เข้าสู่ระบบ
              </button>
            </SignInButton>
          )}
        </div>
      </div>
    </nav>
  );
}
