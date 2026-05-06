// src/component/User/DestinationList.tsx
"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import type { Destination } from "@/types/destination";

export default function DestinationList() {
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
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

    const timer = setTimeout(() => {
        fetchDestinations();
    }, 500);
    return () => clearTimeout(timer);

  }, [minBudget, maxBudget]);

  // 🌟 Skeleton Loading สวยงามขึ้น
  if (loading) {
    return (
      <div id="destinations" className="mt-4">
        <div className="flex flex-col md:flex-row justify-between items-end md:items-center mb-8 gap-4">
          <div className="h-8 w-64 bg-gray-200 rounded-lg animate-pulse"></div>
          <div className="h-12 w-full md:w-80 bg-gray-200 rounded-xl animate-pulse"></div>
        </div>

        <div className="grid lg:grid-cols-3 md:grid-cols-2 grid-cols-1 gap-8">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-100 animate-pulse overflow-hidden">
              <div className="w-full h-56 bg-gray-200"></div>
              <div className="p-5 space-y-4">
                <div className="h-5 bg-gray-200 rounded w-3/4"></div>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                </div>
                <div className="flex justify-between pt-4 border-t border-gray-100">
                  <div className="h-8 w-20 bg-gray-200 rounded-lg"></div>
                  <div className="h-8 w-24 bg-gray-200 rounded-lg"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div id="destinations" className="mt-8">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-10 text-center shadow-sm">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
             <span className="text-2xl">🚨</span>
          </div>
          <h3 className="text-xl font-bold text-red-800 mb-2">เกิดข้อผิดพลาด</h3>
          <p className="text-red-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-red-600 hover:bg-red-700 transition-colors text-white px-8 py-3 rounded-xl font-semibold shadow-md"
          >
            ลองใหม่อีกครั้ง
          </button>
        </div>
      </div>
    );
  }

  return (
    <div id="destinations" className="mt-4">
      {/* 🌟 Filter Bar แบบ Modern */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-10 gap-6 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            สถานที่แนะนำ 
           
          </h3>
          <p className="text-gray-500 text-sm mt-1">ค้นหาจุดหมายปลายทางที่เหมาะกับงบประมาณของคุณ</p>
        </div>

        <div className="flex items-center w-full lg:w-auto">
          <div className="flex items-center gap-3 bg-gray-50 p-2 rounded-xl border border-gray-200 w-full lg:w-fit focus-within:ring-2 focus-within:ring-emerald-500 focus-within:border-emerald-500 transition-all">
            <div className="pl-3 text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
            </div>
            <span className="text-sm font-medium text-gray-600 hidden sm:block">งบเที่ยว:</span>
            <input
                type="number"
                placeholder="ต่ำสุด"
                value={minBudget}
                onChange={(e) => setMinBudget(e.target.value ? Number(e.target.value) : "")}
                className="w-full sm:w-24 px-2 py-2 bg-transparent text-sm focus:outline-none text-gray-700 font-medium"
            />
            <span className="text-gray-300">|</span>
            <input
                type="number"
                placeholder="สูงสุด"
                value={maxBudget}
                onChange={(e) => setMaxBudget(e.target.value ? Number(e.target.value) : "")}
                className="w-full sm:w-24 px-2 py-2 bg-transparent text-sm focus:outline-none text-gray-700 font-medium"
            />
            <span className="text-sm text-gray-500 pr-4 font-medium hidden sm:block">บาท</span>
          </div>
        </div>
      </div>

      {destinations.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-16 text-center shadow-inner">
          <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
             <span className="text-4xl">🏜️</span>
          </div>
          <h4 className="text-xl font-bold text-gray-700 mb-2">ไม่พบสถานที่ท่องเที่ยว</h4>
          <p className="text-gray-500 mb-6">ลองปรับช่วงราคาให้กว้างขึ้น หรือล้างตัวกรองเพื่อดูทั้งหมด</p>
          <button 
            onClick={() => { setMinBudget(""); setMaxBudget(""); }}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-md"
          >
            ล้างตัวกรองทั้งหมด
          </button>
        </div>
      ) : (
      <div className="grid lg:grid-cols-3 md:grid-cols-2 grid-cols-1 gap-8">
        {destinations.map((d) => {
            const minPrice = d.min_price || 0;
            const maxPrice = d.max_price || 0;

            return (
                <Link 
                    href={`/destinations/${d.id}`} 
                    key={d.id} 
                    className="block outline-none group"
                >
                    {/* 🌟 Card Design: ใส่ Hover Animation แบบพรีเมียม */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 ease-out overflow-hidden h-full flex flex-col">
                        <div className="relative w-full h-56 overflow-hidden">
                            <Image
                                src={d.image_url || "/images/default.jpg"}
                                alt={d.name}
                                fill
                                className="object-cover group-hover:scale-110 transition-transform duration-700 ease-in-out"
                            />
                            {/* Tags บนรูปภาพ */}
                            <div className="absolute top-4 left-4 flex gap-2">
                                <span className="text-xs font-semibold bg-white/90 backdrop-blur-sm text-sky-800 px-3 py-1.5 rounded-full shadow-sm">
                                    {d.category || "จุดหมายปลายทาง"}
                                </span>
                            </div>
                            {/* ราคาแบนเนอร์มุมขวาบน */}
                            <div className="absolute top-4 right-4">
                                {maxPrice === 0 ? (
                                    <span className="text-xs font-bold text-white bg-green-500/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-sm">
                                        เข้าชมฟรี
                                    </span>
                                ) : (
                                    <span className="text-xs font-bold text-emerald-900 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-sm border border-emerald-100">
                                        {minPrice === maxPrice 
                                            ? `฿${minPrice.toLocaleString()}` 
                                            : `฿${minPrice.toLocaleString()} - ${maxPrice.toLocaleString()}`
                                        }
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="p-5 flex flex-col flex-grow">
                            <div className="flex justify-between items-start mb-1 gap-2">
                                <h4 className="text-xl font-bold text-gray-900 line-clamp-1 group-hover:text-emerald-600 transition-colors">
                                    {d.name}
                                </h4>
                            </div>

                            {/* 🌟 Mockup Rating (ใส่เพิ่มเพื่อให้ Card ดูน่าเชื่อถือ) */}
                            <div className="flex items-center gap-1 mb-3">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-amber-400" viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                                <span className="text-sm font-bold text-gray-700">4.8</span>
                                <span className="text-xs text-gray-400 ml-1">(120 รีวิว)</span>
                            </div>

                            <p className="text-sm text-gray-600 line-clamp-2 mb-4 flex-grow">
                                {d.description || "สัมผัสประสบการณ์การท่องเที่ยวที่น่าประทับใจ พร้อมเก็บความทรงจำดีๆ ที่คุณจะไม่มีวันลืม"}
                            </p>
                            
                            {/* 🌟 ปุ่ม Call To Action */}
                            <div className="pt-4 border-t border-gray-100 flex items-center justify-between mt-auto">
                                <span className="text-sm font-medium text-emerald-600 group-hover:text-emerald-700 flex items-center gap-1">
                                    ดูรายละเอียด
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                                </span>
                            </div>
                        </div>
                    </div>
                </Link>
            );
        })}
      </div>
      )}
    </div>
  );
}