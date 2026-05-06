"use client";

import { useUser } from "@clerk/nextjs";
import { useEffect, useState, useMemo } from "react";
import { supabaseClient } from "@/lib/supabaseClient";
import AccommodationModal from "../../component/AccommodationModal";
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

  // Modal states
  const [selectedAccommodation, setSelectedAccommodation] = useState<Accommodation | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

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
      // Search filter
      const matchesSearch =
        searchQuery === "" ||
        acc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        acc.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        acc.address?.toLowerCase().includes(searchQuery.toLowerCase());

      // Category filter
      const matchesCategory =
        selectedCategory === "all" || acc.category === selectedCategory;

      // Price filter
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
      
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header Skeleton */}
        <div className="mb-8">
          <div className="h-10 bg-gray-200 rounded-lg w-64 mb-2 animate-pulse"></div>
          <div className="h-6 bg-gray-200 rounded-lg w-48 animate-pulse"></div>
        </div>

        {/* Filters Skeleton */}
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

        {/* Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
              {/* Image Skeleton */}
              <div className="h-56 bg-linear-to-br from-gray-200 to-gray-300 animate-pulse"></div>
              
              <div className="p-5">
                {/* Badge Skeleton */}
                <div className="h-6 bg-gray-200 rounded-full w-24 mb-3 animate-pulse"></div>
                
                {/* Title Skeleton */}
                <div className="h-6 bg-gray-200 rounded-lg w-full mb-2 animate-pulse"></div>
                
                {/* Description Skeleton */}
                <div className="space-y-2 mb-4">
                  <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                </div>
                
                {/* Address Skeleton */}
                <div className="bg-gray-50 p-3 rounded-lg mb-4">
                  <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
                </div>
                
                {/* Price Skeleton */}
                <div className="bg-linear-to-r from-blue-50 to-blue-100 p-4 rounded-lg mb-4">
                  <div className="h-8 bg-gray-200 rounded w-32 animate-pulse"></div>
                </div>
                
                {/* Button Skeleton */}
                <div className="h-12 bg-gray-200 rounded-lg animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>
      </main>
    );
  }

  return (
    <>
    <Navbar/>
    {/* 🌟 1. Hero Banner Section */}
      <div className="relative w-full h-[300px] md:h-[400px] bg-gray-900 flex flex-col items-center justify-center overflow-hidden">
        {/* รูปพื้นหลัง (เปลี่ยน URL เป็นรูปที่คุณต้องการ เช่น รูปลานย่าโม หรือ ปราสาทหินพิมาย) */}
        <div 
          className="absolute inset-0 bg-cover bg-center transition-transform duration-700 hover:scale-105 opacity-60"
          style={{ backgroundImage: "url('/images/banner2.png')" }} 
        ></div>
        
        {/* Gradient Overlay เพื่อให้ข้อความอ่านง่าย */}
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/90 via-gray-900/40 to-transparent"></div>
        
        <div className="relative z-10 text-center px-6 animate-in fade-in slide-in-from-bottom-4 duration-1000">
         
          <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-4 drop-shadow-lg">
            ที่พักใน<span className="text-emerald-400">โคราช</span>
          </h1>
          <p className="text-gray-200 text-lg md:text-xl max-w-2xl mx-auto drop-shadow-md">
            ที่พักหลากหลายสไตล์ในโคราชที่รอให้คุณมาสัมผัสประสบการณ์การพักผ่อนที่ดีที่สุดในเมืองย่าโม
          </p>
        </div>
      </div>

      {/* 🌟 2. Breadcrumbs Navigation */}
      <div className="max-w-7xl mx-auto px-6 pt-6">
        <nav className="flex text-sm text-gray-500 font-medium items-center space-x-2">
          <Link href="/" className="hover:text-emerald-600 transition-colors flex items-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
            หน้าแรก
          </Link>
          <span>›</span>
          <span className="text-gray-900">ที่พัก</span>
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
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              🔍 ค้นหา
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ชื่อที่พัก, รายละเอียด, ที่อยู่..."
                className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              />
              <svg
                className="absolute left-3 top-3.5 h-5 w-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              🏠 ประเภท
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition bg-white"
            >
              <option value="all">ทุกประเภท</option>
              {categories.slice(1).map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Price Filter */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              💰 ช่วงราคา
            </label>
            <select
              value={priceFilter}
              onChange={(e) => setPriceFilter(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition bg-white"
            >
              {priceRanges.map((range) => (
                <option key={range.value} value={range.value}>
                  {range.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Clear Filters */}
        {(searchQuery || selectedCategory !== "all" || priceFilter !== "all") && (
          <div className="mt-4 flex items-center justify-between bg-blue-50 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              กำลังใช้ตัวกรอง {searchQuery && "• ค้นหา"} {selectedCategory !== "all" && "• ประเภท"} {priceFilter !== "all" && "• ราคา"}
            </p>
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("all");
                setPriceFilter("all");
              }}
              className="text-sm text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 transition"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              ล้างตัวกรอง
            </button>
          </div>
        )}
      </div>

      {/* Accommodations Grid */}
      {filteredAccommodations.length === 0 ? (
        <div className="bg-linear-to-br from-gray-50 to-gray-100 border-2 border-dashed border-gray-300 rounded-xl p-16 text-center">
          <svg
            className="mx-auto h-20 w-20 text-gray-400 mb-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <h3 className="text-2xl font-bold text-gray-900 mb-3">
            ไม่พบที่พักที่ตรงกับเงื่อนไข
          </h3>
          <p className="text-gray-600 text-lg mb-4">ลองปรับเงื่อนไขการค้นหาใหม่ หรือล้างตัวกรองทั้งหมด</p>
          {(searchQuery || selectedCategory !== "all" || priceFilter !== "all") && (
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("all");
                setPriceFilter("all");
              }}
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              รีเซ็ตการค้นหา
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAccommodations.map((acc) => (
            <div
              key={acc.id}
              className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-blue-200"
            >
              {/* Image Section */}
              <div className="relative h-56 bg-linear-to-br from-gray-200 to-gray-300 overflow-hidden group">
                {acc.images && acc.images.length > 0 ? (
                  <>
                    <img
                      src={acc.images[0]}
                      alt={acc.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      onError={(e) => {
                        e.currentTarget.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"/>';
                        e.currentTarget.classList.add('hidden');
                        e.currentTarget.nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                    <div className="hidden absolute inset-0 bg-linear-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                      <svg
                        className="w-16 h-16 text-white opacity-50"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                        />
                      </svg>
                    </div>
                  </>
                ) : (
                  <div className="absolute inset-0 bg-linear-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                    <svg
                      className="w-16 h-16 text-white opacity-50"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                      />
                    </svg>
                  </div>
                )}
                
                {/* Image Counter Badge */}
                {acc.images && acc.images.length > 1 && (
                  <div className="absolute top-3 right-3 bg-black bg-opacity-70 text-white text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                    </svg>
                    {acc.images.length} รูป
                  </div>
                )}
              </div>

              <div className="p-5">
                {/* Category Badge */}
                <div className="mb-3">
                  <span className="inline-block bg-blue-100 text-blue-800 text-xs font-semibold px-3 py-1.5 rounded-full">
                    {acc.category}
                  </span>
                </div>

                {/* Title */}
                <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-1">
                  {acc.name}
                </h3>

                {/* Description */}
                {acc.description && (
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2 leading-relaxed">
                    {acc.description}
                  </p>
                )}

                {/* Address */}
                {acc.address && (
                  <div className="flex items-start gap-2 mb-4 bg-gray-50 p-3 rounded-lg">
                    <svg
                      className="w-5 h-5 text-gray-500 mt-0.5 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    <span className="text-sm text-gray-700 line-clamp-2 flex-1">
                      {acc.address}
                    </span>
                  </div>
                )}

                {/* Price */}
                {acc.price_range && (
                  <div className="mb-4 bg-linear-to-r from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-blue-700">
                        {acc.price_range.toLocaleString()}
                      </span>
                      <span className="text-blue-600 font-medium">฿/เดือน</span>
                    </div>
                  </div>
                )}

                {/* View Details Button */}
                <button
                  onClick={() => {
                    setSelectedAccommodation(acc);
                    setIsModalOpen(true);
                  }}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  ดูรายละเอียด
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {selectedAccommodation && (
        <AccommodationModal
          accommodation={selectedAccommodation}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedAccommodation(null);
          }}
        />
      )}
    </main>
    </>
  );
}