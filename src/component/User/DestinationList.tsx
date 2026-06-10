// src/component/User/DestinationList.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, Variants } from "framer-motion";
import { Heart, Star, MapPin, Wallet } from "lucide-react"; 
import type { Destination } from "@/types/destination";

// Framer Motion Variants
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  show: { 
    opacity: 1, 
    y: 0, 
    transition: { type: "spring", stiffness: 300, damping: 24 } 
  },
};

export default function DestinationList() {
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // State สำหรับงบประมาณ
  const [minBudget, setMinBudget] = useState<number | "">("");
  const [maxBudget, setMaxBudget] = useState<number | "">("");

  useEffect(() => {
    async function fetchDestinations() {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        if (minBudget !== "") params.append("minBudget", minBudget.toString());
        if (maxBudget !== "") params.append("maxBudget", maxBudget.toString());
        
        const res = await fetch(`/api/destinations?${params.toString()}`);
        
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        
        const data = await res.json();
        setDestinations(data);
        setError(null);
      } catch (err) {
        console.error("❌ Error fetching destinations:", err);
        setError("ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่อีกครั้ง");
      } finally {
        setLoading(false);
      }
    }

    // Debounce delay 500ms เพื่อไม่ให้ยิง API ถี่เกินไปตอนพิมพ์ตัวเลข
    const timer = setTimeout(() => {
        fetchDestinations();
    }, 500);
    return () => clearTimeout(timer);

  }, [minBudget, maxBudget]);

  // 🌟 Skeleton Loading สไตล์มินิมอล 4 คอลัมน์
  if (loading) {
    return (
      <div id="destinations" className="w-full mt-4 max-w-[1400px] mx-auto px-6">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end mb-10 gap-6">
          <div className="h-10 w-72 bg-neutral-200/60 rounded-lg animate-pulse"></div>
          <div className="h-12 w-full lg:w-80 bg-neutral-200/60 rounded-full animate-pulse"></div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-[1.5rem] p-3 shadow-sm border border-neutral-100 animate-pulse">
              <div className="w-full aspect-[4/3] bg-neutral-200/60 rounded-2xl mb-4"></div>
              <div className="px-2 space-y-3">
                <div className="h-5 bg-neutral-200/60 rounded-md w-3/4"></div>
                <div className="h-4 bg-neutral-200/60 rounded-md w-1/2"></div>
                <div className="h-4 bg-neutral-200/60 rounded-md w-1/4 mt-4"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div id="destinations" className="mt-4  w-full flex justify-center px-6">
        <div className="bg-red-50/50 border border-red-100 rounded-3xl p-10 text-center shadow-sm max-w-md w-full">
          <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-xl">🚨</div>
          <h3 className="text-lg font-semibold text-red-900 mb-2">เกิดข้อผิดพลาด</h3>
          <p className="text-sm text-red-600/80 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-neutral-900 hover:bg-black transition-colors text-white px-6 py-2.5 rounded-full text-sm font-medium"
          >
            ลองใหม่อีกครั้ง
          </button>
        </div>
      </div>
    );
  }

  return (
    <div id="destinations" className="w-full mt-4 md:mt-8 max-w-[1400px] mx-auto px-6 ">
      
      {/* 🌟 Section Header & Budget Filter */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end mb-10 gap-6">
        <div>
          <h2 className="text-3xl font-bold text-neutral-900 mb-2">สถานที่ท่องเที่ยว</h2>
        </div>

        {/* แถบกรอกงบประมาณ (Budget Filter Pill) */}
        <div className="flex items-center gap-3 w-full lg:w-auto">
          <div className="flex items-center bg-white px-4 py-2.5 rounded-full border border-neutral-200 shadow-sm focus-within:ring-2 focus-within:ring-[#E5A93C]/50 focus-within:border-[#E5A93C] transition-all w-full lg:w-auto">
            <Wallet className="w-4 h-4 text-neutral-400 mr-3 hidden sm:block" />
            <input
                type="number"
                placeholder="งบต่ำสุด"
                value={minBudget}
                onChange={(e) => setMinBudget(e.target.value ? Number(e.target.value) : "")}
                className="w-full sm:w-24 bg-transparent text-sm font-medium text-neutral-700 outline-none placeholder:text-neutral-400"
            />
            <span className="text-neutral-300 mx-2">|</span>
            <input
                type="number"
                placeholder="งบสูงสุด"
                value={maxBudget}
                onChange={(e) => setMaxBudget(e.target.value ? Number(e.target.value) : "")}
                className="w-full sm:w-24 bg-transparent text-sm font-medium text-neutral-700 outline-none placeholder:text-neutral-400"
            />
            <span className="text-sm font-medium text-neutral-400 ml-2">บาท</span>
          </div>
          
          <button className="hidden lg:block px-6 py-2.5 rounded-full border border-neutral-200 text-sm font-medium text-neutral-700 hover:bg-neutral-50 hover:border-neutral-300 transition-all active:scale-95 shrink-0">
            See All
          </button>
        </div>
      </div>

      {destinations.length === 0 ? (
        <div className="bg-white rounded-[2rem] p-16 text-center border border-neutral-100 shadow-lg flex flex-col items-center">
           <div className="text-4xl mb-4 opacity-50">🏜️</div>
          <h4 className="text-lg font-medium text-neutral-900 mb-2">ไม่พบที่พักในงบประมาณนี้</h4>
          <p className="text-sm text-neutral-500 mb-6">ลองปรับช่วงราคาให้กว้างขึ้น หรือล้างตัวกรองเพื่อดูทั้งหมด</p>
          <button 
            onClick={() => { setMinBudget(""); setMaxBudget(""); }}
            className="px-6 py-2.5 bg-neutral-900 text-white rounded-full text-sm font-medium hover:bg-black transition-colors"
          >
            ล้างตัวกรอง
          </button>
        </div>
      ) : (
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        viewport={{ once: true, margin: "-50px" }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        {destinations.map((d) => {
            const minPrice = d.min_price || 0;
            const maxPrice = d.max_price || 0;

            return (
                <motion.div variants={itemVariants} key={d.id}>
                  <Link href={`/destinations/${d.id}`} className="block outline-none group h-full">
                      <div className="bg-white rounded-[1.5rem] px-4 py-3 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 hover:shadow-lg hover:-translate-y-1.5 transition-all duration-500 ease-out h-full flex flex-col">
                          
                          <div className="relative w-full aspect-[4/3] rounded-[1.25rem] overflow-hidden mb-4 bg-neutral-100">
                              <Image
                                  src={d.image_url || "/images/default.jpg"}
                                  alt={d.name}
                                  fill
                                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                                  className="object-cover group-hover:scale-105 transition-transform duration-700 ease-[0.16,1,0.3,1]"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                              
                              <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-md px-3.5 py-1.5 rounded-full text-xs font-bold text-neutral-900 shadow-[0_4px_12px_rgba(0,0,0,0.05)] border border-white/20">
                                  {maxPrice === 0 ? (
                                      "Free Entry"
                                  ) : (
                                      <>
                                          ฿{minPrice.toLocaleString()} <span className="text-neutral-500 font-normal">/คืน</span>
                                      </>
                                  )}
                              </div>

                              <button 
                                onClick={(e) => { e.preventDefault(); }}
                                className="absolute top-3 right-3 w-8 h-8 bg-white/95 backdrop-blur-md rounded-full flex items-center justify-center text-neutral-400 hover:text-red-500 hover:scale-110 active:scale-95 transition-all duration-300 shadow-[0_4px_12px_rgba(0,0,0,0.05)] border border-white/20 z-10"
                              >
                                  <Heart className="w-4 h-4" />
                              </button>
                          </div>

                          <div className="px-2 pb-2 flex flex-col flex-grow justify-between">
                              <div>
                                  <h4 className="text-[1.1rem] font-bold text-neutral-900 line-clamp-1 mb-1.5 group-hover:text-neutral-700 transition-colors">
                                      {d.name}
                                  </h4>
                                  <p className="text-sm text-neutral-500 flex items-center gap-1.5 font-medium">
                                      <MapPin className="w-3.5 h-3.5 opacity-70" /> 
                                      <span className="truncate">{d.category || "นครราชสีมา"}</span>
                                  </p>
                              </div>

                              <div className="flex items-center gap-1.5 mt-4">
                                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                                  <span className="text-sm font-bold text-neutral-900">4.8</span>
                                  <span className="text-xs text-neutral-400 font-medium ml-0.5">(128 รีวิว)</span>
                              </div>
                          </div>
                      </div>
                  </Link>
                </motion.div>
            );
        })}
      </motion.div>
      )}
      
      <div className="mt-8 flex justify-center lg:hidden">
         <button className="px-8 py-3 rounded-full border border-neutral-200 text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-all active:scale-95 shadow-sm">
          ดูทั้งหมด
        </button>
      </div>
    </div>
  );
}