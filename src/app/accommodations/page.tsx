"use client";

import { useUser } from "@clerk/nextjs";
import { useEffect, useState, useMemo } from "react";
import { supabaseClient } from "@/lib/supabaseClient";
import Navbar from "@/component/User/Navbar";
import Link from "next/link";

interface Accommodation {
  id: string;
  name: string;
  description: string;
  address: string;
  price_range: string;
  category: string;
  contact_phone: string;
  contact_line: string;
  contact_facebook: string;
  images: string[];
  created_by: string;
  created_at: string;
}

export default function AccommodationsPage() {
  const { user, isLoaded } = useUser();
  const [accommodations, setAccommodations] = useState<Accommodation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [priceFilter, setPriceFilter] = useState<string>("all");

  useEffect(() => {
    fetchAccommodations();
  }, []);

  const fetchAccommodations = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabaseClient
        .from("accommodations")
        .select("*")
        .order("created_at", { ascending: false });

      if (fetchError) throw fetchError;

      setAccommodations(data || []);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการโหลดข้อมูล";
      setError(errorMessage);
      console.error("Error fetching accommodations:", err);
    } finally {
      setLoading(false);
    }
  };

  // Filter logic
  const filteredAccommodations = useMemo(() => {
    return accommodations.filter((acc) => {
      const matchesSearch =
        searchQuery === "" ||
        acc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        acc.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        acc.address?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory =
        selectedCategory === "all" || acc.category === selectedCategory;

      let matchesPrice = true;
      if (priceFilter !== "all" && acc.price_range) {
        const priceNum = parseInt(acc.price_range.replace(/[^\d]/g, ""));
        if (!isNaN(priceNum)) {
          switch (priceFilter) {
            case "0-3000":
              matchesPrice = priceNum <= 3000;
              break;
            case "3000-5000":
              matchesPrice = priceNum > 3000 && priceNum <= 5000;
              break;
            case "5000-10000":
              matchesPrice = priceNum > 5000 && priceNum <= 10000;
              break;
            case "10000+":
              matchesPrice = priceNum > 10000;
              break;
          }
        }
      }

      return matchesSearch && matchesCategory && matchesPrice;
    });
  }, [accommodations, searchQuery, selectedCategory, priceFilter]);

  const categories = [
    "all",
    "บ้านเดี่ยว",
    "คอนโด",
    "หอพัก",
    "อพาร์ทเมนท์",
    "โฮมสเตย์",
  ];

  const priceRanges = [
    { value: "all", label: "ทุกราคา" },
    { value: "0-3000", label: "ต่ำกว่า 3,000 บาท" },
    { value: "3000-5000", label: "3,000 - 5,000 บาท" },
    { value: "5000-10000", label: "5,000 - 10,000 บาท" },
    { value: "10000+", label: "มากกว่า 10,000 บาท" },
  ];

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <div className="h-10 bg-gray-200 rounded-lg w-64 mb-2 animate-pulse"></div>
            <div className="h-6 bg-gray-200 rounded-lg w-48 animate-pulse"></div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i}>
                  <div className="h-4 bg-gray-200 rounded w-20 mb-2 animate-pulse"></div>
                  <div className="h-12 bg-gray-200 rounded-lg animate-pulse"></div>
                </div>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
                <div className="h-56 bg-gray-200 animate-pulse"></div>
                <div className="p-5">
                  <div className="h-6 bg-gray-200 rounded-full w-24 mb-3 animate-pulse"></div>
                  <div className="h-6 bg-gray-200 rounded-lg w-full mb-2 animate-pulse"></div>
                  <div className="space-y-2 mb-4">
                    <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                  </div>
                  <div className="h-12 bg-gray-200 rounded-lg animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />

      {/* 🌟 1. Hero Banner Section */}
      <div className="relative w-full min-h-[400px] md:min-h-[500px] lg:min-h-[60vh] bg-gray-900 flex flex-col items-center justify-center overflow-hidden pt-20 pb-12">
        
        {/* รูปพื้นหลัง */}
        <div 
          className="absolute inset-0 bg-cover bg-center transition-transform duration-700 hover:scale-105"
          style={{ backgroundImage: "url('/images/banner3.png')" }} 
        ></div>
        
        {/* Overlay: เพิ่ม bg-black/50 ช่วยให้ตัวหนังสือโดดเด่นขึ้นบนรูปภาพที่สว่าง */}
        <div className="absolute inset-0 bg-black/50"></div>
        {/* แก้ไข: เปลี่ยน bg-linear-to-t เป็น bg-gradient-to-t ตามมาตรฐาน Tailwind */}
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/40 to-transparent"></div>
        
        {/* Content */}
        <div className="relative z-10 text-center px-4 md:px-8 w-full max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-1000 mt-8">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-white mb-4 sm:mb-6 drop-shadow-lg leading-tight">
            สถานที่พักผ่อนใน<span className="text-emerald-400">โคราช</span>
          </h1>
          <p className="text-gray-200 text-base sm:text-lg md:text-xl max-w-2xl mx-auto drop-shadow-md">
            สัมผัสเสน่ห์เมืองย่าโม ค้นพบสถานที่พักผ่อนสุดฮิต ที่พักสบาย และของกินเด็ดๆ ที่รอให้คุณมาสัมผัส
          </p>
        </div>
      </div>

      {/* 🌟 2. Breadcrumbs Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 mb-4">
        <nav aria-label="Breadcrumb" className="flex">
          <ol className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-gray-500 font-medium">
            <li>
              <Link 
                href="/" 
                className="hover:text-emerald-600 transition-colors flex items-center gap-1.5 focus:outline-none focus:text-emerald-600"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                <span>หน้าแรก</span>
              </Link>
            </li>
            
            <li>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </li>

            <li aria-current="page">
              <span className="text-gray-900 font-semibold">สถานที่ท่องเที่ยว</span>
            </li>
          </ol>
        </nav>
      </div>

      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">ค้นหาที่พัก</h1>
          <p className="text-gray-600 text-lg">
            พบ <span className="font-semibold text-blue-600">{filteredAccommodations.length}</span> รายการที่พัก
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4 mb-6 flex items-start gap-3">
            <svg className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="md:col-span-1">
              <label className="block text-sm font-semibold text-gray-700 mb-2">🔍 ค้นหา</label>
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ชื่อที่พัก, รายละเอียด, ที่อยู่..."
                  className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                />
                <svg className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            {/* Category Filter */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">🏠 ประเภท</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition bg-white"
              >
                <option value="all">ทุกประเภท</option>
                {categories.slice(1).map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Price Filter */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">💰 ช่วงราคา</label>
              <select
                value={priceFilter}
                onChange={(e) => setPriceFilter(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition bg-white"
              >
                {priceRanges.map((range) => (
                  <option key={range.value} value={range.value}>{range.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Accommodation List */}
        {filteredAccommodations.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAccommodations.map((acc) => (
              <Link
                key={acc.id}
                href={`/accommodations/${acc.id}`}
                className="block bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 hover:shadow-lg transition-all duration-300"
              >
                <div className="relative w-full h-56 overflow-hidden">
                  <img
                    src={acc.images && acc.images.length > 0 ? acc.images[0] : "https://images.unsplash.com/photo-1566073771259-d3428f588a08?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"}
                    alt={acc.name}
                    className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                  />
                  <span className="absolute top-3 left-3 bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md">
                    {acc.category}
                  </span>
                </div>
                <div className="p-5">
                  <h2 className="text-xl font-bold text-gray-800 mb-2 line-clamp-2">{acc.name}</h2>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">{acc.description}</p>
                  <div className="flex items-center text-gray-500 text-sm mb-2">
                    <svg className="w-4 h-4 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {acc.address}
                  </div>
                  <div className="flex items-center text-gray-700 font-semibold text-base">
                    <svg className="w-4 h-4 mr-1 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2-1.343-2-3-2zM21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    {acc.price_range || "สอบถามราคา"}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 px-4 rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50">
            <p className="text-gray-400 mb-2 text-4xl">😔</p>
            <h3 className="text-lg font-bold text-gray-700 mb-1">ไม่พบที่พักที่ตรงกับเงื่อนไข</h3>
            <p className="text-gray-500">ลองปรับการค้นหาหรือตัวกรองของคุณ</p>
          </div>
        )}
      </main>
    </>
  );
}