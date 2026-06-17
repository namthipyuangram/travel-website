"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import Image from "next/image";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import type { Destination } from "@/types/destination";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import ConfirmDialog from "../../../component/ConfirmDialog";

// ==================== TYPES & CONSTANTS ====================
interface DestinationFormData {
  name: string;
  description: string;
  category: Destination["category"];
  image_url: string[];
  min_price: number | string;
  max_price: number | string;
  image_file?: File[];
}

const CATEGORIES = [
  "ทั้งหมด",
  "ธรรมชาติ",
  "วัด",
  "ร้านอาหาร",
  "คาเฟ่",
  "ที่พัก",
  "อื่นๆ",
] as const;

export default function AdminDestinationsPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  // ==================== STATES ====================
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal & Dialog States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDestination, setEditingDestination] = useState<Destination | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string | number; name: string } | null>(null);
  const [deletingId, setDeletingId] = useState<string | number | null>(null);

  // Form States
  const [formData, setFormData] = useState<DestinationFormData>({
    name: "",
    description: "",
    category: "ธรรมชาติ",
    image_url: [],
    min_price: 0,
    max_price: 0,
  });
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Search, Filter & Pagination States
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("ทั้งหมด");
  const [page, setPage] = useState(1);
  const itemsPerPage = 5;

  // ==================== EFFECTS ====================
  useEffect(() => {
    if (isLoaded) {
      const role = user?.publicMetadata?.role as string | undefined;
      if (role !== "admin") {
        router.push("/dashboard");
      } else {
        fetchDestinations();
      }
    }
  }, [isLoaded, user, router]);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, activeCategory, destinations.length]);

  useEffect(() => {
    if (editingDestination?.image_url) {
      setImagePreview(parseImageUrl(editingDestination.image_url));
    } else {
      setImagePreview([]);
    }
  }, [editingDestination]);

  // ==================== API CALLS ====================
  const fetchDestinations = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/destinations");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setDestinations(data);
    } catch (err) {
      setError("ไม่สามารถดึงข้อมูลสถานที่ท่องเที่ยวได้");
      toast.error("ดึงข้อมูลไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirm) return;
    const { id } = deleteConfirm;
    try {
      setDeletingId(id);
      setError(null);
      const res = await fetch(`/api/destinations/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      
      toast.success("ลบสถานที่เรียบร้อยแล้ว");
      setDestinations((prev) => prev.filter((d) => d.id !== id));
      
      if (displayedDestinations.length === 1 && page > 1) {
        setPage((p) => p - 1);
      }
    } catch (err) {
      setError("เกิดข้อผิดพลาดในการลบข้อมูล");
      toast.error("ลบข้อมูลไม่สำเร็จ");
    } finally {
      setDeletingId(null);
      setDeleteConfirm(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const method = editingDestination ? "PUT" : "POST";
    const url = editingDestination ? `/api/destinations/${editingDestination.id}` : "/api/destinations";
    const payload = {
      ...formData,
      min_price: Number(formData.min_price) || 0,
      max_price: Number(formData.max_price) || 0,
    };

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success(editingDestination ? "อัปเดตข้อมูลสำเร็จ" : "เพิ่มสถานที่สำเร็จ");
        fetchDestinations();
        handleCloseModal();
      } else {
        throw new Error("Failed to save");
      }
    } catch (err) {
      toast.error("บันทึกข้อมูลไม่สำเร็จ");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ==================== HANDLERS & UTILS ====================
  const handleOpenModal = (destination?: Destination) => {
    if (destination) {
      setEditingDestination(destination);
      setFormData({
        name: destination.name,
        description: destination.description || "",
        category: destination.category,
        image_url: parseImageUrl(destination.image_url),
        min_price: destination.min_price ?? 0,
        max_price: destination.max_price ?? 0,
      });
    } else {
      setEditingDestination(null);
      setFormData({
        name: "",
        description: "",
        category: "ธรรมชาติ",
        image_url: [],
        min_price: 0,
        max_price: 0,
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingDestination(null);
  };

  const parseImageUrl = (urlData: any): string[] => {
    if (!urlData) return [];
    if (Array.isArray(urlData)) return urlData;
    try {
      const parsed = JSON.parse(urlData);
      return Array.isArray(parsed) ? parsed : [urlData];
    } catch {
      return [urlData];
    }
  };

  const getImageUrl = (value: any) => {
    const parsed = parseImageUrl(value);
    return parsed.length > 0 ? parsed[0] : null;
  };

  const handleImageProcessing = (file: File) => {
    const previewUrl = URL.createObjectURL(file);
    setImagePreview([previewUrl]);
    setFormData((prev) => ({ ...prev, image_file: [file] }));
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      handleImageProcessing(file);
    }
  };

  // ==================== COMPUTED DATA ====================
  const filteredDestinations = useMemo(() => {
    return destinations.filter((d) => {
      const matchesSearch =
        d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (d.description?.toLowerCase() || "").includes(searchQuery.toLowerCase());
      const matchesCategory =
        activeCategory === "ทั้งหมด" ? true : d.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [destinations, searchQuery, activeCategory]);

  const totalPages = Math.ceil(filteredDestinations.length / itemsPerPage);
  const displayedDestinations = useMemo(() => {
    return filteredDestinations.slice((page - 1) * itemsPerPage, page * itemsPerPage);
  }, [filteredDestinations, page]);

  const stats = useMemo(() => {
    return {
      total: destinations.length,
      free: destinations.filter((a) => a.max_price === 0).length,
      paid: destinations.filter((a) => (a.max_price || 0) > 0).length,
    };
  }, [destinations]);

  // ==================== RENDER ====================
  if (!isLoaded || loading) {
    return (
      <main className="max-w-6xl mx-auto py-10 px-4 sm:px-6 lg:px-8 min-h-screen">
        <div className="flex justify-between items-center mb-8">
          <div>
            <div className="h-8 w-48 bg-slate-200 rounded-lg animate-pulse mb-2"></div>
            <div className="h-4 w-64 bg-slate-100 rounded-md animate-pulse"></div>
          </div>
          <div className="h-10 w-32 bg-slate-200 rounded-xl animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm h-24 animate-pulse">
              <div className="h-4 w-24 bg-slate-100 rounded mb-3"></div>
              <div className="h-8 w-12 bg-slate-200 rounded"></div>
            </div>
          ))}
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-5 p-5 bg-white border border-slate-100 rounded-2xl h-48 animate-pulse">
              <div className="w-[240px] bg-slate-100 rounded-xl h-full flex-shrink-0"></div>
              <div className="flex-1 flex flex-col justify-between py-1">
                <div>
                  <div className="h-4 w-32 bg-slate-100 rounded mb-3"></div>
                  <div className="h-6 w-3/4 bg-slate-200 rounded mb-4"></div>
                  <div className="h-4 w-full bg-slate-50 rounded mb-2"></div>
                  <div className="h-4 w-2/3 bg-slate-50 rounded"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24">
      <main className="max-w-6xl mx-auto pt-8 px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8"
        >
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">จัดการสถานที่ท่องเที่ยว</h1>
            <p className="text-slate-500 mt-1 text-sm font-medium">เพิ่ม แก้ไข และจัดระเบียบสถานที่ท่องเที่ยวในระบบ</p>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="group relative bg-slate-900 hover:bg-slate-800 text-white px-6 py-2.5 rounded-xl transition-all shadow-sm hover:shadow-md active:scale-95 flex items-center gap-2 font-medium overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-0 group-hover:opacity-10 transition-opacity"></div>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            เพิ่มสถานที่ใหม่
          </button>
        </motion.div>

        {/* Error Banner */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-red-50 border border-red-100 p-4 rounded-xl mb-6 text-red-600 text-sm flex items-center gap-3"
            >
              <svg className="w-5 h-5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stats Dashboard */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {[
            { label: "สถานที่ทั้งหมด (Total)", value: stats.total, color: "bg-slate-500", dot: false },
            { label: "เข้าชมฟรี (Free)", value: stats.free, color: "bg-emerald-500", dot: true },
            { label: "มีค่าใช้จ่าย (Paid)", value: stats.paid, color: "bg-blue-500", dot: true },
          ].map((stat, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-2 mb-2">
                {stat.dot && <span className={`w-2 h-2 rounded-full ${stat.color}`}></span>}
                <p className="text-sm font-medium text-slate-500">{stat.label}</p>
              </div>
              <p className="text-3xl font-bold text-slate-900">{stat.value}</p>
            </motion.div>
          ))}
        </div>

        {/* Filter & Search Bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6"
        >
          <div className="flex overflow-x-auto hide-scrollbar bg-slate-200/50 p-1 rounded-xl w-full md:w-auto relative">
            {CATEGORIES.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveCategory(tab)}
                className={`relative whitespace-nowrap px-5 py-2 rounded-lg text-sm font-medium transition-colors z-10 ${
                  activeCategory === tab ? "text-slate-900" : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {activeCategory === tab && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-white rounded-lg shadow-sm"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    style={{ zIndex: -1 }}
                  />
                )}
                {tab}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-80 group">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="ค้นหาชื่อสถานที่ หรือคำอธิบาย..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-full bg-white border border-slate-200 text-slate-900 rounded-xl px-4 py-2.5 text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none placeholder:text-slate-400"
            />
          </div>
        </motion.div>

        {/* Destination List (List View) */}
        <motion.div layout className="space-y-4">
          <AnimatePresence mode="popLayout">
            {filteredDestinations.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-16 text-center flex flex-col items-center justify-center min-h-[300px]"
              >
                <div className="bg-slate-50 p-4 rounded-full mb-4">
                  <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-1">ไม่พบสถานที่ท่องเที่ยว</h3>
                <p className="text-slate-500 text-sm max-w-sm">ไม่พบข้อมูลที่ตรงกับการค้นหา ลองปรับคำค้นหาใหม่ หรือคลิก "เพิ่มสถานที่ใหม่" เพื่อสร้างรายการ</p>
              </motion.div>
            ) : (
              displayedDestinations.map((d) => {
                const parsedImages = parseImageUrl(d.image_url);
                const displayImgUrl = parsedImages.length > 0 ? parsedImages[0] : null;

                return (
                  <motion.div
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    key={d.id}
                    className="group bg-white border border-slate-200/60 rounded-2xl shadow-sm hover:shadow-md hover:border-slate-300 transition-all p-4 flex flex-col sm:flex-row gap-5"
                  >
                    {/* Image Container */}
                    <div className="relative w-full sm:w-[240px] aspect-[16/10] flex-shrink-0 overflow-hidden rounded-xl bg-slate-100">
                      {displayImgUrl ? (
                        <>
                          <Image src={displayImgUrl} alt={d.name} fill className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out" />
                          {parsedImages.length > 1 && (
                            <div className="absolute bottom-2 right-2 bg-slate-900/70 backdrop-blur-md text-white text-[11px] font-medium px-2 py-1 rounded-md">
                              +{parsedImages.length - 1}
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-300">
                          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                    </div>

                    {/* Content Container */}
                    <div className="flex-1 flex flex-col justify-between min-w-0 py-1">
                      <div>
                        <div className="flex justify-between items-start gap-4">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 mb-1.5">
                              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{d.category}</span>
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 leading-tight truncate pr-4">{d.name}</h3>
                          </div>
                          {/* Price Right Aligned */}
                          <div className="text-right flex-shrink-0">
                            {d.max_price === 0 ? (
                              <div className="flex flex-col items-end">
                                <span className="text-xl font-extrabold text-emerald-600 leading-none">เข้าชมฟรี</span>
                              </div>
                            ) : (
                              <div className="flex flex-col items-end">
                                <span className="text-xl font-extrabold text-slate-900 leading-none">
                                  ฿{d.min_price} <span className="text-base font-semibold text-slate-600">- {d.max_price}</span>
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        <p className="text-sm text-slate-500 mt-2.5 line-clamp-2 leading-relaxed pr-4">
                          {d.description || "ไม่มีคำอธิบายเพิ่มเติม"}
                        </p>
                      </div>

                      {/* Footer Actions */}
                      <div className="flex items-center justify-end mt-4 pt-4 border-t border-slate-100">
                        <div className="flex items-center gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200">
                          <button
                            onClick={() => handleOpenModal(d)}
                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="แก้ไขข้อมูล"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => setDeleteConfirm({ id: d.id, name: d.name })}
                            disabled={deletingId === d.id}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                            title="ลบสถานที่"
                          >
                            {deletingId === d.id ? (
                              <svg className="animate-spin h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                            ) : (
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
        </motion.div>

        {/* Premium Pagination */}
        {totalPages > 1 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-between mt-8 px-2 sm:px-0">
            <p className="hidden sm:block text-sm text-slate-500">
              แสดง <span className="font-semibold text-slate-900">{(page - 1) * itemsPerPage + 1}</span> ถึง{" "}
              <span className="font-semibold text-slate-900">{Math.min(page * itemsPerPage, filteredDestinations.length)}</span> จากทั้งหมด{" "}
              <span className="font-semibold text-slate-900">{filteredDestinations.length}</span> รายการ
            </p>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:text-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                <span className="hidden sm:inline">ก่อนหน้า</span>
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`w-9 h-9 rounded-lg text-sm font-semibold transition-all flex items-center justify-center ${
                      page === pageNum ? "bg-slate-900 text-white shadow-md" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    }`}
                  >
                    {pageNum}
                  </button>
                ))}
              </div>

              <button
                disabled={page === totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:text-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
              >
                <span className="hidden sm:inline">ถัดไป</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </button>
            </div>
          </motion.div>
        )}

        {/* Form Modal */}
        <AnimatePresence>
          {isModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={handleCloseModal}
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
              />

              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ type: "spring", duration: 0.5, bounce: 0.3 }}
                className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-2xl shadow-xl flex flex-col max-h-[90vh] overflow-hidden"
              >
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                  <h2 className="text-xl font-bold text-slate-900">
                    {editingDestination ? "แก้ไขข้อมูลสถานที่" : "เพิ่มสถานที่ท่องเที่ยวใหม่"}
                  </h2>
                  <button onClick={handleCloseModal} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                  <form id="destination-form" onSubmit={handleSubmit} className="space-y-6">
                    {/* Image Drag & Drop */}
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700">รูปภาพสถานที่ <span className="text-red-500">*</span></label>
                      <div
                        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                        onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className={`relative w-full h-48 rounded-xl border-2 overflow-hidden cursor-pointer transition-all duration-300 group ${
                          isDragging ? "border-blue-500 bg-blue-50" : imagePreview.length > 0 || formData.image_url.length > 0 ? "border-transparent" : "border-dashed border-slate-300 hover:border-slate-400 bg-slate-50"
                        }`}
                      >
                        <input type="file" ref={fileInputRef} onChange={(e) => { if (e.target.files?.[0]) handleImageProcessing(e.target.files[0]); }} accept="image/*" className="hidden" />
                        
                        {(imagePreview.length > 0 || formData.image_url.length > 0) ? (
                          <div className="relative w-full h-full">
                            <img src={imagePreview.length > 0 ? imagePreview[0] : formData.image_url[0]} alt="Preview" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <span className="text-sm font-medium text-white bg-black/50 px-4 py-2 rounded-full backdrop-blur-sm">เปลี่ยนรูปภาพ</span>
                            </div>
                          </div>
                        ) : (
                          <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500">
                            <svg className={`w-10 h-10 mb-2 transition-colors ${isDragging ? "text-blue-500" : "text-slate-400"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                            <p className="text-sm font-medium"><span className="text-blue-600">คลิกเพื่ออัปโหลด</span> หรือลากไฟล์มาวาง</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700">ชื่อสถานที่ <span className="text-red-500">*</span></label>
                      <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="เช่น อุทยานแห่งชาติเขาใหญ่" className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl focus:ring-[3px] focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none" />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700">คำอธิบายสถานที่ <span className="text-red-500">*</span></label>
                      <textarea required rows={3} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="จุดเด่น สิ่งที่น่าสนใจ..." className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl focus:ring-[3px] focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none resize-none" />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700">หมวดหมู่</label>
                        <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value as Destination["category"] })} className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl focus:ring-[3px] focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none bg-white">
                          {CATEGORIES.filter((c) => c !== "ทั้งหมด").map((cat) => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700">เริ่มต้น (บาท)</label>
                        <input type="number" min="0" value={formData.min_price} onChange={(e) => setFormData({ ...formData, min_price: e.target.value })} className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl focus:ring-[3px] focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700">สูงสุด (บาท)</label>
                        <input type="number" min="0" value={formData.max_price} onChange={(e) => setFormData({ ...formData, max_price: e.target.value })} className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl focus:ring-[3px] focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none" />
                      </div>
                    </div>
                  </form>
                </div>

                <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                  <button type="button" onClick={handleCloseModal} disabled={isSubmitting} className="px-6 py-2.5 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all disabled:opacity-50">
                    ยกเลิก
                  </button>
                  <button form="destination-form" type="submit" disabled={isSubmitting} className="flex items-center justify-center px-6 py-2.5 text-sm font-semibold text-white bg-slate-900 rounded-xl hover:bg-slate-800 transition-all min-w-[120px] disabled:opacity-70">
                    {isSubmitting ? (
                      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : (
                      editingDestination ? "บันทึกการแก้ไข" : "ยืนยันการเพิ่ม"
                    )}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <ConfirmDialog
          open={!!deleteConfirm}
          onCancel={() => setDeleteConfirm(null)}
          onConfirm={handleConfirmDelete}
          title="ยืนยันการลบสถานที่"
          message={
            <span className="text-slate-600">
              คุณต้องการลบสถานที่ <span className="font-semibold text-slate-900">"{deleteConfirm?.name}"</span> หรือไม่? ข้อมูลและรูปภาพจะถูกลบอย่างถาวร
            </span>
          }
          confirmText="ลบข้อมูลถาวร"
          cancelText="ยกเลิก"
        />
      </main>
    </div>
  );
}