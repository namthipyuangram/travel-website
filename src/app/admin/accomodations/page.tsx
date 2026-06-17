"use client";

import { useUser } from "@clerk/nextjs";
import { useEffect, useState, useMemo } from "react";
import { supabaseClient } from "@/lib/supabaseClient";
import { AddAccommodationModal } from "../../../component/AddAccommodationModal";
import ConfirmDialog from "../../../component/ConfirmDialog";
import { motion, AnimatePresence } from "framer-motion";

interface Accommodation {
  id: string;
  name: string;
  description: string;
  address: string;
  price_range: string;
  min_price: number | null;
  max_price: number | null;
  category: string;
  contact_phone: string;
  contact_line: string;
  contact_facebook: string;
  images: string[] | null;
  created_by: string;
  created_at: string;
  status?: "published" | "draft" | "pending";
}

export default function AdminAccommodationsPage() {
  const { user, isLoaded } = useUser();
  const [accommodations, setAccommodations] = useState<Accommodation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal & Dialog States
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAccommodation, setEditingAccommodation] =
    useState<Accommodation | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    id: string;
    name: string;
  } | null>(null);

  // Search, Filter & Pagination States
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<
    "all" | "published" | "draft"
  >("all");
  const [page, setPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    if (!isLoaded) return;
    if (!user) {
      setLoading(false);
      return;
    }
    fetchAccommodations();
  }, [user, isLoaded]);

  // รีเซ็ตหน้ากลับไปที่ 1 เสมอเวลาข้อมูลมีการค้นหาหรือเปลี่ยนฟิลเตอร์
  useEffect(() => {
    setPage(1);
  }, [searchQuery, activeFilter, accommodations.length]);

  const fetchAccommodations = async () => {
    if (!user) return;
    try {
      setLoading(true);
      setError(null);
      const { data, error: fetchError } = await supabaseClient
        .from("accommodations")
        .select("*")
        .eq("created_by", user.id)
        .order("created_at", { ascending: false });

      if (fetchError) throw fetchError;

      const formattedData = (data || []).map((item) => ({
        ...item,
        images:
          typeof item.images === "string"
            ? JSON.parse(item.images)
            : item.images || [],
      }));
      setAccommodations(formattedData);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการโหลดข้อมูล",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (accommodation: Accommodation) => {
    setEditingAccommodation(accommodation);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingAccommodation(null);
  };

  const handleSuccess = () => {
    fetchAccommodations();
    handleCloseModal();
  };

  const handleDeleteClick = (id: string, name: string) => {
    setDeleteConfirm({ id, name });
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirm) return;
    const { id } = deleteConfirm;
    try {
      setDeletingId(id);
      setError(null);
      const { error: deleteError } = await supabaseClient
        .from("accommodations")
        .delete()
        .eq("id", id);
      if (deleteError) throw deleteError;
      setAccommodations((prev) => prev.filter((a) => a.id !== id));
      setDeleteConfirm(null);

      // กรณีลบรายการสุดท้ายของหน้า ให้ถอยกลับไปหน้าก่อนหน้าอัตโนมัติ
      if (displayedAccommodations.length === 1 && page > 1) {
        setPage((p) => p - 1);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการลบ");
    } finally {
      setDeletingId(null);
    }
  };

  // กรองข้อมูล (Search & Filter)
  const filteredAccommodations = useMemo(() => {
    return accommodations.filter((acc) => {
      const matchesSearch =
        acc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        acc.address?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter =
        activeFilter === "all" ? true : acc.status === activeFilter;
      return matchesSearch && matchesFilter;
    });
  }, [accommodations, searchQuery, activeFilter]);

  // คำนวณข้อมูลสำหรับการทำ Pagination
  const totalPages = Math.ceil(filteredAccommodations.length / itemsPerPage);
  const displayedAccommodations = useMemo(() => {
    return filteredAccommodations.slice(
      (page - 1) * itemsPerPage,
      page * itemsPerPage,
    );
  }, [filteredAccommodations, page]);

  const stats = useMemo(() => {
    return {
      total: accommodations.length,
      published: accommodations.filter((a) => a.status === "published").length,
      draft: accommodations.filter((a) => a.status === "draft").length,
    };
  }, [accommodations]);

  // --- Premium Skeleton Loader ---
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
            <div
              key={i}
              className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm h-24 animate-pulse"
            >
              <div className="h-4 w-24 bg-slate-100 rounded mb-3"></div>
              <div className="h-8 w-12 bg-slate-200 rounded"></div>
            </div>
          ))}
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex gap-5 p-5 bg-white border border-slate-100 rounded-2xl h-48 animate-pulse"
            >
              <div className="w-[220px] bg-slate-100 rounded-xl h-full flex-shrink-0"></div>
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

  if (!user) {
    return (
      <main className="max-w-6xl mx-auto py-20 px-4 flex justify-center">
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-8 text-center max-w-md w-full">
          <svg
            className="w-12 h-12 text-amber-500 mx-auto mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <h2 className="text-lg font-semibold text-amber-900 mb-2">
            จำเป็นต้องเข้าสู่ระบบ
          </h2>
          <p className="text-amber-700/80 text-sm">
            กรุณาเข้าสู่ระบบก่อนจัดการข้อมูลที่พักของคุณ
          </p>
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
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
              จัดการที่พักของฉัน
            </h1>
            <p className="text-slate-500 mt-1 text-sm font-medium">
              ภาพรวมรายการที่พักและอัปเดตข้อมูลของคุณ
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="group relative bg-slate-900 hover:bg-slate-800 text-white px-6 py-2.5 rounded-xl transition-all shadow-sm hover:shadow-md active:scale-95 flex items-center gap-2 font-medium overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-0 group-hover:opacity-10 transition-opacity"></div>
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M12 4v16m8-8H4"
              />
            </svg>
            เพิ่มที่พักใหม่
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
              <svg
                className="w-5 h-5 shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stats Dashboard */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {[
            {
              label: "ทั้งหมด (Listings)",
              value: stats.total,
              color: "bg-slate-500",
              dot: false,
            },
            {
              label: "เผยแพร่แล้ว (Published)",
              value: stats.published,
              color: "bg-emerald-500",
              dot: true,
            },
            {
              label: "แบบร่าง (Draft)",
              value: stats.draft,
              color: "bg-amber-500",
              dot: true,
            },
          ].map((stat, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-2 mb-2">
                {stat.dot && (
                  <span className={`w-2 h-2 rounded-full ${stat.color}`}></span>
                )}
                <p className="text-sm font-medium text-slate-500">
                  {stat.label}
                </p>
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
          <div className="flex bg-slate-200/50 p-1 rounded-xl w-full md:w-auto relative">
            {(["all", "published", "draft"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveFilter(tab)}
                className={`relative px-5 py-2 rounded-lg text-sm font-medium transition-colors z-10 ${
                  activeFilter === tab
                    ? "text-slate-900"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {activeFilter === tab && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-white rounded-lg shadow-sm"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    style={{ zIndex: -1 }}
                  />
                )}
                {tab === "all"
                  ? "ทั้งหมด"
                  : tab === "published"
                    ? "เผยแพร่แล้ว"
                    : "แบบร่าง"}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-80 group">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <input
              type="text"
              placeholder="ค้นหาชื่อที่พัก, ตำแหน่งที่ตั้ง..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-full bg-white border border-slate-200 text-slate-900 rounded-xl px-4 py-2.5 text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none placeholder:text-slate-400"
            />
          </div>
        </motion.div>

        {/* Accommodation List */}
        <motion.div layout className="space-y-4">
          <AnimatePresence mode="popLayout">
            {filteredAccommodations.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-16 text-center flex flex-col items-center justify-center min-h-[300px]"
              >
                <div className="bg-slate-50 p-4 rounded-full mb-4">
                  <svg
                    className="w-8 h-8 text-slate-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-1">
                  ไม่พบรายการที่พัก
                </h3>
                <p className="text-slate-500 text-sm max-w-sm">
                  ไม่พบข้อมูลที่ตรงกับการค้นหา ลองปรับคำค้นหาใหม่ หรือคลิก
                  "เพิ่มที่พักใหม่" เพื่อสร้างรายการ
                </p>
              </motion.div>
            ) : (
              displayedAccommodations.map((acc) => (
                <motion.div
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  key={acc.id}
                  className="group bg-white border border-slate-200/60 rounded-2xl shadow-sm hover:shadow-md hover:border-slate-300 transition-all p-4 flex flex-col sm:flex-row gap-5"
                >
                  {/* Image Container */}
                  <div className="relative w-full sm:w-[240px] aspect-[16/10] flex-shrink-0 overflow-hidden rounded-xl bg-slate-100">
                    {acc.images && acc.images.length > 0 ? (
                      <>
                        <img
                          src={acc.images[0]}
                          alt={acc.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                        />
                        {acc.images.length > 1 && (
                          <div className="absolute bottom-2 right-2 bg-slate-900/70 backdrop-blur-md text-white text-[11px] font-medium px-2 py-1 rounded-md">
                            +{acc.images.length - 1}
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 gap-2">
                        <svg
                          className="w-8 h-8"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                      </div>
                    )}
                    {/* Status Badge */}
                    <div className="absolute top-2 left-2">
                      {acc.status === "published" ? (
                        <span className="bg-emerald-500/90 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-md shadow-sm uppercase tracking-wider">
                          เผยแพร่
                        </span>
                      ) : (
                        <span className="bg-amber-500/90 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-md shadow-sm uppercase tracking-wider">
                          แบบร่าง
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Content Container */}
                  <div className="flex-1 flex flex-col justify-between min-w-0 py-1">
                    <div>
                      <div className="flex justify-between items-start gap-4">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                              {acc.category}
                            </span>
                            <span className="text-slate-300">•</span>
                            <span className="text-xs text-slate-500 truncate flex items-center gap-1.5">
                              <svg
                                className="w-3.5 h-3.5 shrink-0"
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
                              </svg>
                              <span className="truncate">
                                {acc.address || "ไม่ระบุตำแหน่ง"}
                              </span>
                            </span>
                          </div>
                          <h3 className="text-lg font-bold text-slate-900 leading-tight truncate pr-4">
                            {acc.name}
                          </h3>
                        </div>
                        {/* Price */}
                        <div className="text-right flex-shrink-0">
                          {acc.price_range ? (
                            <div className="flex flex-col items-end">
                              <span className="text-xl font-extrabold text-slate-900 leading-none">
                                {acc.price_range}
                              </span>
                              <span className="text-xs text-slate-500 font-medium mt-1">
                                บาท / เดือน
                              </span>
                            </div>
                          ) : (
                            <span className="text-sm text-slate-400 bg-slate-50 px-2 py-1 rounded-md">
                              ยังไม่ระบุราคา
                            </span>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-slate-500 mt-2.5 line-clamp-2 leading-relaxed pr-4">
                        {acc.description || "ไม่มีคำอธิบายเพิ่มเติม"}
                      </p>
                    </div>

                    {/* Footer Actions & Contacts */}
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
                      <div className="flex items-center gap-4">
                        {acc.contact_phone && (
                          <div
                            className="flex items-center gap-1.5 text-slate-600 hover:text-slate-900 transition-colors cursor-default"
                            title="เบอร์ติดต่อ"
                          >
                            <svg
                              className="w-4 h-4 text-slate-400"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                              />
                            </svg>
                            <span className="text-xs font-medium hidden sm:inline">
                              {acc.contact_phone}
                            </span>
                          </div>
                        )}
                        {acc.contact_line && (
                          <div
                            className="flex items-center gap-1.5 text-slate-600 hover:text-[#00B900] transition-colors cursor-default"
                            title="LINE ID"
                          >
                            <svg
                              className="w-4 h-4 text-[#00B900]/70"
                              fill="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path d="M24 10.304c0-5.369-5.383-9.738-12-9.738-6.616 0-12 4.369-12 9.738 0 4.814 4.269 8.846 10.038 9.608.391.084.922.258 1.057.592.122.303.079.778.039 1.085l-.171 1.027c-.053.303-.242 1.186 1.039.647 1.281-.54 6.911-4.069 9.428-6.967 1.739-1.907 2.57-4.143 2.57-5.992zm-15.656 2.505h-2.343v-4.498c0-.286.231-.518.518-.518.286 0 .518.231.518.518v3.463h1.307c.286 0 .518.231.518.518 0 .286-.231.518-.518.518zm2.665 0h-1.037c-.286 0-.518-.231-.518-.518v-4.498c0-.286.231-.518.518-.518.286 0 .518.231.518.518v4.498c0 .286-.231.518-.518.518zm4.498-1.554l-1.92-2.944v2.944c0 .286-.231.518-.518.518-.286 0-.518-.231-.518-.518v-4.498c0-.286.231-.518.518-.518.2 0 .385.111.474.286l1.946 2.981v-2.749c0-.286.231-.518.518-.518.286 0 .518.231.518.518v4.498c0 .286-.231.518-.518.518zm2.944-1.909c0 .286-.231.518-.518.518h-1.307v1.037h1.307c.286 0 .518.231.518.518 0 .286-.231.518-.518.518h-1.825c-.286 0-.518-.231-.518-.518v-4.498c0-.286.231-.518.518-.518h1.825c.286 0 .518.231.518.518 0 .286-.231.518-.518.518h-1.307v.883h1.307c.286 0 .518.231.518.518z" />
                            </svg>
                            <span className="text-xs font-medium hidden sm:inline">
                              Line
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200">
                        <button
                          onClick={() => handleEdit(acc)}
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="แก้ไขข้อมูล"
                        >
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteClick(acc.id, acc.name)}
                          disabled={deletingId === acc.id}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                          title="ลบที่พัก"
                        >
                          {deletingId === acc.id ? (
                            <svg
                              className="animate-spin h-5 w-5 text-red-600"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              ></circle>
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              ></path>
                            </svg>
                          ) : (
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </motion.div>

        {/* Premium Pagination */}
        {totalPages > 1 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-between mt-8 px-2 sm:px-0"
          >
            <p className="hidden sm:block text-sm text-slate-500">
              แสดง{" "}
              <span className="font-semibold text-slate-900">
                {(page - 1) * itemsPerPage + 1}
              </span>{" "}
              ถึง{" "}
              <span className="font-semibold text-slate-900">
                {Math.min(page * itemsPerPage, filteredAccommodations.length)}
              </span>{" "}
              จากทั้งหมด{" "}
              <span className="font-semibold text-slate-900">
                {filteredAccommodations.length}
              </span>{" "}
              รายการ
            </p>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:text-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                <span className="hidden sm:inline">ก่อนหน้า</span>
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (pageNum) => (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`w-9 h-9 rounded-lg text-sm font-semibold transition-all flex items-center justify-center ${
                        page === pageNum
                          ? "bg-slate-900 text-white shadow-md"
                          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                      }`}
                    >
                      {pageNum}
                    </button>
                  ),
                )}
              </div>

              <button
                disabled={page === totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:text-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
              >
                <span className="hidden sm:inline">ถัดไป</span>
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            </div>
          </motion.div>
        )}

        {/* Modals & Dialogs */}
        <AddAccommodationModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onSuccess={handleSuccess}
          editAccommodation={editingAccommodation}
        />

        <ConfirmDialog
          open={!!deleteConfirm}
          onCancel={() => setDeleteConfirm(null)}
          onConfirm={handleConfirmDelete}
          title="ยืนยันการลบที่พัก"
          message={
            <span className="text-slate-600">
              คุณต้องการลบที่พัก{" "}
              <span className="font-semibold text-slate-900">
                "{deleteConfirm?.name}"
              </span>{" "}
              หรือไม่? ข้อมูลและรูปภาพทั้งหมดจะถูกลบอย่างถาวร
            </span>
          }
          confirmText="ลบข้อมูลถาวร"
          cancelText="ยกเลิก"
        />
      </main>
    </div>
  );
}
