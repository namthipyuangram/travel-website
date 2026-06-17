"use client";

import { useEffect, useState, useMemo } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { supabaseClient } from "@/lib/supabaseClient";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  MessageSquare,
  Star,
  Trash2,
  Filter,
  MapPin,
  X,
  User,
  Image as ImageIcon,
} from "lucide-react";
import toast from "react-hot-toast";
import ConfirmDialog from "../../../component/ConfirmDialog";

// --- Types ---
interface RawReview {
  id: string;
  accommodation_id: string | null;
  restaurant_id: number | null;
  destination_id: number | null;
  created_by: string;
  rating: number;
  comment: string;
  created_at: string;
}

interface ReviewItem {
  id: string;
  created_by: string;
  rating: number;
  comment: string;
  created_at: string;
}

interface GroupedLocation {
  target_id: string;
  target_name: string;
  target_location: string | null;
  target_image: string | null;
  target_type: "ที่พัก" | "ร้านอาหาร" | "สถานที่ท่องเที่ยว";
  reviews: ReviewItem[];
  average_rating: number;
}

export default function AdminReviewsPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  const [groupedLocations, setGroupedLocations] = useState<GroupedLocation[]>(
    [],
  );
  const [loading, setLoading] = useState(true);

  // Filters & Pagination
  const [searchQuery, setSearchQuery] = useState("");
  type CategoryType = "ทั้งหมด" | "ที่พัก" | "ร้านอาหาร" | "สถานที่ท่องเที่ยว";
  const [activeType, setActiveType] = useState<CategoryType>("ทั้งหมด");
  const [page, setPage] = useState(1);
  const itemsPerPage = 8;

  // Modals & Dialogs
  const [selectedLocation, setSelectedLocation] =
    useState<GroupedLocation | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Authentication Check
  useEffect(() => {
    if (isLoaded) {
      const role = user?.publicMetadata?.role as string | undefined;
      if (role !== "admin") {
        router.push("/dashboard");
      }
    }
  }, [isLoaded, user, router]);

  useEffect(() => {
    fetchAndGroupReviews();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, activeType]);

  const getFirstImage = (item: any): string | null => {
    try {
      const raw = item.images || item.image_url;

      if (!raw) return null;

      if (Array.isArray(raw)) {
        return raw[0] || null;
      }

      if (typeof raw === "string") {
        const parsed = JSON.parse(raw);

        if (Array.isArray(parsed)) {
          return parsed[0] || null;
        }

        return raw;
      }

      return null;
    } catch {
      return null;
    }
  };

  const fetchAndGroupReviews = async () => {
    try {
      setLoading(true);

      const [
        { data: reviewsData },
        { data: accData },
        { data: restData },
        { data: destData },
      ] = await Promise.all([
        supabaseClient
          .from("reviews")
          .select("*")
          .order("created_at", { ascending: false }),
        supabaseClient
          .from("accommodations")
          .select("id, name, address ,images"),
        supabaseClient
          .from("restaurants")
          .select("id, name, location ,image_url"),
        supabaseClient
          .from("destinations")
          .select("id, name, category ,image_url"),
      ]);

      if (!reviewsData) throw new Error("ไม่สามารถดึงข้อมูลรีวิวได้");

      const groupedMap = new Map<string, GroupedLocation>();

      reviewsData.forEach((r: RawReview) => {
        let target_id = "";
        let target_name = "ไม่ทราบชื่อสถานที่";
        let target_location = "";
        let target_image = null;
        let target_type: GroupedLocation["target_type"] = "สถานที่ท่องเที่ยว";

        if (r.accommodation_id) {
          target_id = r.accommodation_id;

          const target = accData?.find(
            (a) => String(a.id) === String(r.accommodation_id),
          );

          if (target) {
            target_name = target.name;
            target_location = target.address;
            target_type = "ที่พัก";
            target_image = getFirstImage(target);
          }
        } else if (r.restaurant_id) {
          target_id = String(r.restaurant_id);

          const target = restData?.find(
            (a) => String(a.id) === String(r.restaurant_id),
          );

          if (target) {
            target_name = target.name;
            target_location = target.location;
            target_type = "ร้านอาหาร";
            target_image = getFirstImage(target);
          }
        } else if (r.destination_id) {
          target_id = String(r.destination_id);

          const target = destData?.find(
            (a) => String(a.id) === String(r.destination_id),
          );

          if (target) {
            target_name = target.name;
            target_location = target.category || "สถานที่ท่องเที่ยว";
            target_type = "สถานที่ท่องเที่ยว";
            target_image = getFirstImage(target);
          }
        }

        if (!target_id) return;

        if (!groupedMap.has(target_id)) {
          groupedMap.set(target_id, {
            target_id,
            target_name,
            target_location,
            target_image,
            target_type,
            reviews: [],
            average_rating: 0,
          });
        }

        groupedMap.get(target_id)!.reviews.push({
          id: r.id,
          created_by: r.created_by,
          rating: r.rating,
          comment: r.comment,
          created_at: r.created_at,
        });
      });

      const finalGroups = Array.from(groupedMap.values()).map((g) => {
        const sum = g.reviews.reduce((acc, curr) => acc + curr.rating, 0);
        g.average_rating =
          g.reviews.length > 0
            ? Number((sum / g.reviews.length).toFixed(1))
            : 0;
        return g;
      });

      setGroupedLocations(finalGroups);
    } catch (error) {
      toast.error("เกิดข้อผิดพลาดในการโหลดข้อมูลรีวิว");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirm) return;
    try {
      setIsDeleting(true);

      const res = await fetch(`/api/reviews?id=${deleteConfirm}`, {
        method: "DELETE",
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || "ลบรีวิวไม่สำเร็จ");
      }

      toast.success("ลบรีวิวเรียบร้อยแล้ว");

      // ส่วน update state เดิมใช้ได้เลย
      setGroupedLocations((prev) => {
        return prev
          .map((loc) => {
            const newReviews = loc.reviews.filter(
              (r) => r.id !== deleteConfirm,
            );
            if (newReviews.length === loc.reviews.length) return loc;

            const newAvg =
              newReviews.length > 0
                ? Number(
                    (
                      newReviews.reduce((sum, r) => sum + r.rating, 0) /
                      newReviews.length
                    ).toFixed(1),
                  )
                : 0;
            return { ...loc, reviews: newReviews, average_rating: newAvg };
          })
          .filter((loc) => loc.reviews.length > 0);
      });

      if (selectedLocation) {
        const updatedReviews = selectedLocation.reviews.filter(
          (r) => r.id !== deleteConfirm,
        );
        if (updatedReviews.length === 0) {
          setSelectedLocation(null);
        } else {
          const newAvg = Number(
            (
              updatedReviews.reduce((sum, r) => sum + r.rating, 0) /
              updatedReviews.length
            ).toFixed(1),
          );
          setSelectedLocation({
            ...selectedLocation,
            reviews: updatedReviews,
            average_rating: newAvg,
          });
        }
      }
    } catch (error: any) {
      toast.error(error.message || "ลบรีวิวไม่สำเร็จ กรุณาลองใหม่");
    } finally {
      setIsDeleting(false);
      setDeleteConfirm(null);
    }
  };

  const filteredLocations = useMemo(() => {
    return groupedLocations.filter((loc) => {
      const matchSearch = loc.target_name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchType =
        activeType === "ทั้งหมด" || loc.target_type === activeType;
      return matchSearch && matchType;
    });
  }, [groupedLocations, searchQuery, activeType]);

  const totalPages = Math.ceil(filteredLocations.length / itemsPerPage);
  const displayedLocations = useMemo(() => {
    return filteredLocations.slice(
      (page - 1) * itemsPerPage,
      page * itemsPerPage,
    );
  }, [filteredLocations, page]);

  // --- Render Helpers ---
  const renderStars = (rating: number, size = 14) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <Star
        key={i}
        size={size}
        className={`${i < Math.round(rating) ? "fill-amber-400 text-amber-400" : "fill-slate-100 text-slate-200"}`}
      />
    ));
  };

  const timeAgo = (dateStr: string) => {
    const diff = new Date().getTime() - new Date(dateStr).getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return "วันนี้";
    if (days < 30) return `${days} วันที่แล้ว`;
    return new Date(dateStr).toLocaleDateString("th-TH", {
      month: "short",
      day: "numeric",
    });
  };

  if (!isLoaded || loading) {
    return (
      <main className="min-h-screen bg-[#F8FAFC] flex justify-center items-center">
        <svg
          className="animate-spin h-10 w-10 text-indigo-600"
          viewBox="0 0 24 24"
          fill="none"
        >
          <circle
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
            className="opacity-25"
          ></circle>
          <path
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            className="opacity-75"
          ></path>
        </svg>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24">
      <main className="max-w-7xl mx-auto pt-10 px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-white rounded-2xl shadow-sm border border-slate-200/60 text-indigo-600">
              <MessageSquare size={28} strokeWidth={2} />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                จัดการรีวิว (Reviews)
              </h1>
              <p className="text-slate-500 mt-1 text-sm font-medium">
                รวมโพสต์สถานที่ที่มีการรีวิว จัดการง่ายเหมือนใน Social Media
              </p>
            </div>
          </div>
        </motion.div>

        {/* Toolbar: Search & Filter */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col sm:flex-row gap-4 mb-8"
        >
          <div className="relative flex-1 group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-500 transition-colors">
              <Search size={18} />
            </div>
            <input
              type="text"
              placeholder="ค้นหาชื่อสถานที่ที่มีรีวิว..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 text-slate-900 rounded-xl text-sm focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none shadow-sm"
            />
          </div>

          <div className="relative flex-shrink-0 w-full sm:w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Filter size={16} />
            </div>
            <select
              value={activeType}
              onChange={(e) => setActiveType(e.target.value as CategoryType)}
              className="w-full pl-9 pr-8 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none appearance-none shadow-sm cursor-pointer font-medium"
            >
              <option value="ทั้งหมด">ทุกหมวดหมู่สถานที่</option>
              <option value="ที่พัก">ที่พัก</option>
              <option value="ร้านอาหาร">ร้านอาหาร</option>
              <option value="สถานที่ท่องเที่ยว">สถานที่ท่องเที่ยว</option>
            </select>
          </div>
        </motion.div>

        {/* 📱 IG Style Feed Cards */}
        {/* ✅ เปลี่ยนจาก min-h-[400px] เป็น min-h-100 */}
        <motion.div layout className="min-h-100">
          <AnimatePresence mode="popLayout">
            {filteredLocations.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-16 text-center flex flex-col items-center justify-center"
              >
                <div className="bg-slate-50 p-4 rounded-full mb-4 text-slate-400">
                  <MessageSquare size={32} />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-1">
                  ยังไม่มีสถานที่ถูกรีวิว
                </h3>
                <p className="text-slate-500 text-sm max-w-sm">
                  สถานที่ที่มีคนเข้ามาเขียนรีวิวจะแสดงขึ้นที่นี่ในรูปแบบการ์ดโพสต์
                </p>
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {displayedLocations.map((loc, index) => (
                  <motion.div
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2, delay: index * 0.05 }}
                    key={loc.target_id}
                    onClick={() => setSelectedLocation(loc)}
                    className="group flex flex-col bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden"
                  >
                    <div className="relative aspect-square bg-slate-100 overflow-hidden">
                      {loc.target_image ? (
                        <img
                          src={loc.target_image}
                          alt={loc.target_name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                        />
                      ) : (
                        <div className="w-full h-full flex bg-slate-200 items-center justify-center text-slate-400">
                          <ImageIcon size={48} strokeWidth={1} />
                        </div>
                      )}

                      <div className="absolute top-3 left-3">
                        <span className="bg-black/60 backdrop-blur-md text-white text-[10px] font-bold px-2 py-1 rounded-md tracking-wider">
                          {loc.target_type}
                        </span>
                      </div>
                    </div>

                    <div className="p-4 bg-white flex flex-col gap-1.5">
                      <div className="flex justify-between items-start gap-2">
                        <h3 className="font-bold text-slate-900 truncate text-base leading-tight">
                          {loc.target_name}
                        </h3>
                        <div className="flex items-center gap-1 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100 shrink-0">
                          <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400 mb-px" />
                          <span className="font-semibold text-xs text-slate-700">
                            {loc.average_rating}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm font-medium text-indigo-600">
                        ดูทั้งหมด {loc.reviews.length} รีวิว
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Pagination */}
        {totalPages > 1 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-between mt-10 px-2 sm:px-0"
          >
            <p className="hidden sm:block text-sm text-slate-500">
              หน้า <span className="font-semibold text-slate-900">{page}</span>{" "}
              จากทั้งหมด{" "}
              <span className="font-semibold text-slate-900">{totalPages}</span>
            </p>
            <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 transition-all active:scale-95"
              >
                ก่อนหน้า
              </button>
              <button
                disabled={page === totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="px-3 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 transition-all active:scale-95"
              >
                ถัดไป
              </button>
            </div>
          </motion.div>
        )}

        {/* 📱 The Instagram "Post View" Modal 📱 */}
        <AnimatePresence>
          {selectedLocation && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-0 md:p-6">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedLocation(null)}
                className="absolute inset-0 bg-black/80 backdrop-blur-md"
              />

              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ type: "spring", duration: 0.5, bounce: 0.3 }}
                className="relative w-full h-full md:h-auto md:max-h-[85vh] max-w-5xl bg-white md:rounded-2xl shadow-2xl flex flex-col md:flex-row overflow-hidden"
              >
                <button
                  onClick={() => setSelectedLocation(null)}
                  className="md:hidden absolute top-4 right-4 z-50 p-2 bg-black/50 text-white rounded-full backdrop-blur-sm"
                >
                  <X size={20} strokeWidth={2.5} />
                </button>

                {/* Left Side: Photo (IG Style) */}
                <div className="w-full md:w-[55%] h-[40vh] md:h-full bg-black flex items-center justify-center relative shrink-0">
                  {selectedLocation.target_image ? (
                    <img
                      src={selectedLocation.target_image}
                      alt={selectedLocation.target_name}
                      className="w-full h-full object-contain bg-black"
                    />
                  ) : (
                    <div className="flex flex-col items-center text-slate-600">
                      <MapPin size={48} className="mb-2 opacity-50" />
                      <p className="text-sm">ไม่มีรูปภาพสถานที่</p>
                    </div>
                  )}
                  <div className="hidden md:block absolute top-4 left-4 bg-black/60 backdrop-blur-md text-white text-xs font-bold px-3 py-1.5 rounded-lg">
                    {selectedLocation.target_type}
                  </div>
                </div>

                {/* Right Side: Comments (Reviews) Section */}
                <div className="w-full md:w-[45%] h-[60vh] md:h-full flex flex-col bg-white">
                  <div className="p-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white z-10">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-100 overflow-hidden shrink-0">
                        {selectedLocation.target_image ? (
                          <img
                            src={selectedLocation.target_image}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <MapPin size={16} className="text-slate-400" />
                          </div>
                        )}
                      </div>
                      <div>
                        <h2
                          className="font-bold text-slate-900 leading-none truncate max-w-[200px]"
                          title={selectedLocation.target_name}
                        >
                          {selectedLocation.target_name}
                        </h2>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-xs text-slate-500">
                            {selectedLocation.reviews.length} รีวิว
                          </p>
                          <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                          <div className="flex items-center gap-0.5">
                            <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                            <span className="text-xs font-bold text-slate-700">
                              {selectedLocation.average_rating}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedLocation(null)}
                      className="hidden md:flex p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                    >
                      <X size={20} strokeWidth={2.5} />
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-white">
                    <div className="space-y-5">
                      {selectedLocation.reviews.map((r) => (
                        <div key={r.id} className="flex gap-3 group">
                          <div className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs shrink-0">
                            {r.created_by.charAt(0).toUpperCase()}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="bg-slate-50 p-3.5 rounded-2xl rounded-tl-none relative border border-slate-100">
                              <div className="flex justify-between items-center mb-1.5">
                                <span
                                  className="font-semibold text-sm text-slate-900 truncate"
                                  title={r.created_by}
                                >
                                  User ID: {r.created_by.slice(0, 8)}...
                                </span>
                                <div className="flex gap-0.5">
                                  {renderStars(r.rating, 10)}
                                </div>
                              </div>
                              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap break-words">
                                {r.comment || (
                                  <span className="text-slate-400 italic">
                                    ไม่มีข้อความ
                                  </span>
                                )}
                              </p>
                            </div>

                            <div className="flex items-center gap-4 mt-1.5 pl-2">
                              <span className="text-[11px] font-medium text-slate-400">
                                {timeAgo(r.created_at)}
                              </span>
                              <button
                                onClick={() => setDeleteConfirm(r.id)}
                                className="text-[11px] font-bold text-slate-400 hover:text-red-500 transition-colors"
                              >
                                ลบรีวิวนี้
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <ConfirmDialog
          open={!!deleteConfirm}
          danger={true}
          loading={isDeleting}
          title="ยืนยันการลบรีวิว"
          message={
            <span className="text-slate-600">
              คุณต้องการลบรีวิวคอมเมนต์นี้หรือไม่? ข้อมูลนี้จะถูก{" "}
              <span className="font-semibold text-red-600">ลบอย่างถาวร</span>
            </span>
          }
          confirmText="ลบรีวิวทิ้ง"
          cancelText="ยกเลิก"
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteConfirm(null)}
        />
      </main>
    </div>
  );
}
