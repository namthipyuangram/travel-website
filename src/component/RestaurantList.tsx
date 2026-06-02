"use client";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Search, MapPin, Utensils } from "lucide-react";

interface Restaurant {
  id: string;
  name: string;
  description: string;
  location: string;
  category: string;
  image_url: string | null;
  created_at?: string;
}


export default function RestaurantList() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null); // เพิ่มการจัดการ Error

  const categories = [
    { value: "", label: "ทั้งหมด", icon: "🍽️" },
    { value: "คาเฟ่", label: "คาเฟ่", icon: "☕" },
    { value: "อาหารไทย", label: "อาหารไทย", icon: "🍜" },
    { value: "ร้านขนม", label: "ร้านขนม", icon: "🍰" },
    { value: "อื่นๆ", label: "อื่นๆ", icon: "📍" },
  ];

  // ใช้ useCallback เพื่อ memoize ฟังก์ชัน
  const fetchRestaurants = useCallback(async (searchTerm: string, catTerm: string) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append("q", searchTerm);
      if (catTerm) params.append("category", catTerm);

      const res = await fetch(`/api/restaurants?${params.toString()}`);
      if (!res.ok) throw new Error("ไม่สามารถดึงข้อมูลได้");
      
      const data = await res.json();
      setRestaurants(data);
    } catch (err) {
      setError("เกิดข้อผิดพลาดในการโหลดข้อมูล กรุณาลองใหม่อีกครั้ง");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchRestaurants(search, category);
    }, 400);
    return () => clearTimeout(timer);
  }, [search, category, fetchRestaurants]);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-2 flex items-center gap-3">
            <Utensils className="text-sky-600 w-10 h-10" />
            ร้านอาหารแนะนำ
          </h1>
          <p className="text-slate-500 text-lg">ค้นพบร้านอาหารอร่อยๆ ในโคราช</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Search & Filter */}
        <section className="sticky top-4 z-10 bg-white/80 backdrop-blur-md rounded-2xl shadow-sm border border-slate-200 p-4 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="text"
                placeholder="ค้นหาชื่อร้านหรือสถานที่..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-sky-500 transition"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2 lg:pb-0 no-scrollbar">
              {categories.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => setCategory(cat.value)}
                  aria-pressed={category === cat.value}
                  className={`px-5 py-2.5 rounded-xl font-medium transition flex items-center gap-2 whitespace-nowrap shadow-sm ${
                    category === cat.value
                      ? "bg-sky-600 text-white"
                      : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                  }`}
                >
                  <span>{cat.icon}</span>
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Status Messages (Error/Loading/Empty) */}
        {error && (
          <div className="text-center py-12 text-red-500 bg-red-50 rounded-2xl border border-red-100">
            <p>{error}</p>
            <button onClick={() => fetchRestaurants(search, category)} className="mt-4 text-sky-600 underline">ลองใหม่อีกครั้ง</button>
          </div>
        )}

        {loading ? (
          <div className="grid lg:grid-cols-3 md:grid-cols-2 gap-6">
             {/* Skeleton Loading (แนะนำให้ทำ Skeleton จะดู Pro กว่า Spinner หมุนๆ) */}
             {[1, 2, 3].map((i) => (
                <RestaurantSkeleton key={i} />
             ))}
          </div>
        ) : restaurants.length === 0 && !error ? (
          <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-200">
            <p className="text-5xl mb-4">🔍</p>
            <h3 className="text-xl font-bold text-slate-800">ไม่พบสิ่งที่คุณกำลังค้นหา</h3>
            <p className="text-slate-500">ลองใช้คำค้นหาอื่นหรือรีเซ็ตตัวกรอง</p>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 md:grid-cols-2 grid-cols-1 gap-8">
            {restaurants.map((r) => (
               <RestaurantCard key={r.id} restaurant={r} categories={categories} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

// แยก Component ย่อยออกมาเพื่อให้จัดการง่าย
function RestaurantCard({ restaurant: r, categories }: { restaurant: Restaurant, categories: any[] }) {
  return (
    // นำ Link มาครอบตัว Card ไว้ และส่ง id ไปที่ URL
    <Link href={`/restaurant/${r.id}`}>
      <article className="group cursor-pointer bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-500 border border-slate-100 overflow-hidden flex flex-col h-full">
        <div className="relative h-52 overflow-hidden">
          <img
            src={r.image_url || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800"}
            alt={r.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            loading="lazy"
          />
          <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-3 py-1 rounded-lg text-xs font-bold text-sky-700 uppercase tracking-wider shadow-sm">
            {categories.find((c) => c.value === r.category)?.icon} {r.category || "ทั่วไป"}
          </div>
        </div>
        <div className="p-6 flex flex-col grow">
          <h3 className="text-xl font-bold text-slate-800 mb-2 group-hover:text-sky-600 transition-colors">
            {r.name}
          </h3>
          <p className="text-slate-600 text-sm line-clamp-2 mb-4 grow">
            {r.description}
          </p>
          <div className="pt-4 border-t border-slate-50 flex items-center gap-2 text-slate-400 text-sm">
            <MapPin className="w-4 h-4 text-sky-500" />
            <span className="truncate">{r.location}</span>
          </div>
        </div>
      </article>
    </Link>
  );
}

function RestaurantSkeleton() {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col animate-pulse">
      {/* 1. ส่วนรูปภาพ (ความสูง h-52 เท่าของจริง) */}
      <div className="relative h-52 bg-slate-200">
        {/* เลียนแบบ Badge หมวดหมู่ที่มุมซ้ายบน */}
        <div className="absolute top-4 left-4 w-20 h-6 bg-slate-300 rounded-lg" />
      </div>

      {/* 2. ส่วนเนื้อหา (Padding p-6 เท่าของจริง) */}
      <div className="p-6 flex flex-col flex-grow">
        {/* ชื่อร้าน (เลียนแบบ h3) */}
        <div className="h-7 bg-slate-200 rounded-md w-3/4 mb-2" />
        
        {/* คำอธิบายร้าน (เลียนแบบ line-clamp-2) */}
        <div className="space-y-2 mb-4 flex-grow">
          <div className="h-4 bg-slate-200 rounded-md w-full" />
          <div className="h-4 bg-slate-200 rounded-md w-5/6" />
        </div>

        {/* 3. ส่วนท้าย (Border-t และ Location) */}
        <div className="pt-4 border-t border-slate-50 flex items-center gap-2">
          {/* วงกลมเล็กๆ แทน Icon MapPin */}
          <div className="w-4 h-4 bg-slate-200 rounded-full flex-shrink-0" />
          {/* ข้อความที่อยู่ */}
          <div className="h-4 bg-slate-200 rounded-md w-1/2" />
        </div>
      </div>
    </div>
  );
}