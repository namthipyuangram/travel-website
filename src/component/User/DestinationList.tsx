"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import type { Destination } from "@/types/destination";

export default function DestinationList() {
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // State สำหรับกรองราคา
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

  if (loading) {
    return (
      <div id="destinations" className="mt-10">
        <div className="flex flex-col md:flex-row justify-between items-end md:items-center mb-6 gap-4">
             <h3 className="text-2xl font-semibold text-gray-800">
               สถานที่แนะนำในโคราช
             </h3>
             <div className="h-10 w-64 bg-gray-200 rounded-lg animate-pulse"></div>
        </div>

        <div className="grid md:grid-cols-3 sm:grid-cols-2 grid-cols-1 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white rounded-xl shadow animate-pulse">
              <div className="w-full h-48 bg-gray-200"></div>
              <div className="p-4 space-y-3">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div id="destinations" className="mt-10">
        <h3 className="text-2xl font-semibold text-gray-800 mb-6">
          สถานที่แนะนำในโคราช
        </h3>
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <p className="text-red-600 mb-4">❌ {error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-semibold"
          >
            ลองใหม่
          </button>
        </div>
      </div>
    );
  }

  return (
    <div id="destinations" className="mt-10">
      <div className="flex flex-col md:flex-row justify-between items-end md:items-center mb-6 gap-4">
        <h3 className="text-2xl font-semibold text-gray-800">
          สถานที่แนะนำในโคราช ({destinations.length} แห่ง)
        </h3>

        <div className="flex items-center gap-2 bg-white p-2 rounded-lg border shadow-sm">
            <span className="text-sm font-medium text-gray-600 pl-2">งบเที่ยว:</span>
            <input
                type="number"
                placeholder="ต่ำสุด"
                value={minBudget}
                onChange={(e) => setMinBudget(e.target.value ? Number(e.target.value) : "")}
                className="w-20 px-2 py-1 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <span className="text-gray-400">-</span>
            <input
                type="number"
                placeholder="สูงสุด"
                value={maxBudget}
                onChange={(e) => setMaxBudget(e.target.value ? Number(e.target.value) : "")}
                className="w-20 px-2 py-1 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <span className="text-sm text-gray-500 pr-2">บาท</span>
        </div>
      </div>

      {destinations.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-12 text-center">
          <p className="text-gray-500 text-lg mb-2">😔 ไม่พบสถานที่ท่องเที่ยวตามเงื่อนไข</p>
          <p className="text-gray-400 text-sm">ลองปรับช่วงราคา หรือรีเฟรชหน้านี้ใหม่</p>
          <button 
            onClick={() => { setMinBudget(""); setMaxBudget(""); }}
            className="mt-4 text-emerald-600 hover:underline text-sm"
          >
            ล้างตัวกรอง
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-3 sm:grid-cols-2 grid-cols-1 gap-6">
            {destinations.map((d) => {
                // ✅ แก้ไข: ดึงค่าและใส่ fallback เป็น 0 ทันที เพื่อป้องกัน null error
                const minPrice = d.min_price || 0;
                const maxPrice = d.max_price || 0;

                return (
                    <div
                        key={d.id}
                        className="bg-white rounded-xl shadow hover:shadow-lg transition overflow-hidden cursor-pointer group"
                    >
                        <div className="relative w-full h-48">
                            <Image
                                src={d.image_url || "/images/default.jpg"}
                                alt={d.name}
                                fill
                                className="object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                        </div>
                        <div className="p-4">
                            <div className="flex justify-between items-start mb-2">
                                <h4 className="text-lg font-bold text-sky-700 line-clamp-1">{d.name}</h4>
                                <div className="text-right shrink-0 ml-2">
                                    {/* ✅ ใช้ตัวแปร minPrice / maxPrice ที่กัน null แล้ว */}
                                    {maxPrice === 0 ? (
                                        <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-1 rounded-full whitespace-nowrap">ฟรี</span>
                                    ) : (
                                        <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100 whitespace-nowrap">
                                            {minPrice === maxPrice 
                                                ? `฿${minPrice.toLocaleString()}` 
                                                : `฿${minPrice.toLocaleString()}-${maxPrice.toLocaleString()}`
                                            }
                                        </span>
                                    )}
                                </div>
                            </div>

                            <p className="text-sm text-gray-600 mt-1 line-clamp-2 min-h-[40px]">
                                {d.description || "ไม่มีคำอธิบาย"}
                            </p>
                            
                            <div className="mt-3 flex items-center justify-between">
                                <span className="text-xs bg-sky-100 text-sky-700 px-2 py-1 rounded">
                                    {d.category}
                                </span>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
      )}
    </div>
  );
}