import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "react-hot-toast"; // ✅ เพิ่มตรงนี้

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Travel Explorer",
  description: "ค้นพบสถานที่ท่องเที่ยวใหม่ ๆ ทั่วโลก",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="th">
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          {/* ส่วนเนื้อหาหลักของแต่ละหน้า */}
          <main>{children}</main>
          <Toaster position="top-right" />
        </body>
      </html>
    </ClerkProvider>
  );
}
