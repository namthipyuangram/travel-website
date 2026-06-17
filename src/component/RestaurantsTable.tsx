"use client";

import { useState, useEffect, useMemo } from "react";
import toast from "react-hot-toast";
import ConfirmDialog from "./ConfirmDialog";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  restaurants: any[];
  onEdit: (r: any) => void;
  onDelete: () => void;
}

export default function RestaurantsTable({ restaurants, onEdit, onDelete }: Props) {
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Pagination State
  const [page, setPage] = useState(1);
  const itemsPerPage = 5; // ปรับเป็น 5 รายการต่อหน้าเพื่อให้สมดุลกับดีไซน์การ์ดขนาดใหญ่

  // รีเซ็ตหน้ากลับไปที่ 1 เสมอเวลาข้อมูลมีการค้นหา/ฟิลเตอร์จากหน้าหลัก
  useEffect(() => {
    setPage(1);
  }, [restaurants.length]);

  const totalPages = Math.ceil(restaurants.length / itemsPerPage);
  
  const displayedRestaurants = useMemo(() => {
    return restaurants.slice(
      (page - 1) * itemsPerPage,
      page * itemsPerPage
    );
  }, [restaurants, page]);

  // ฟังก์ชันแยกข้อมูลรูปภาพตัวแรก และนับจำนวนรูปภาพทั้งหมดเพื่อแสดง Badge แบบเดียวกับต้นฉบับ
  const getImagesData = (imageUrl: string | null) => {
    if (!imageUrl) return { primary: null, count: 0 };
    try {
      const parsed = JSON.parse(imageUrl);
      if (Array.isArray(parsed)) {
        return { primary: parsed[0] || null, count: parsed.length };
      }
      return { primary: imageUrl, count: 1 };
    } catch {
      return { primary: imageUrl, count: 1 };
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setIsDeleting(true);
      const res = await fetch(`/api/restaurants/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      
      toast.success("ลบข้อมูลร้านอาหารเรียบร้อยแล้ว");
      onDelete();
      setConfirmId(null);

      // กรณีลบรายการสุดท้ายของหน้า ให้ถอยกลับไปหน้าก่อนหน้าอัตโนมัติแบบเดียวกับต้นฉบับ
      if (displayedRestaurants.length === 1 && page > 1) {
        setPage((p) => p - 1);
      }
    } catch {
      toast.error("ไม่สามารถลบข้อมูลได้ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="w-full">
      {/* --- Restaurants Card List (Unified Responsive Layout) --- */}
      <motion.div layout className="space-y-4">
        <AnimatePresence mode="popLayout">
          {restaurants.length === 0 ? (
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
                ไม่พบรายการร้านอาหาร
              </h3>
              <p className="text-slate-500 text-sm max-w-sm">
                ไม่พบข้อมูลที่ตรงกับการค้นหา ลองปรับคำค้นหาใหม่ หรือเพิ่มข้อมูลร้านอาหารใหม่อีกครั้ง
              </p>
            </motion.div>
          ) : (
            displayedRestaurants.map((r, index) => {
              const imgData = getImagesData(r.image_url);
              return (
                <motion.div
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                  key={r.id}
                  className="group bg-white border border-slate-200/60 rounded-2xl shadow-sm hover:shadow-md hover:border-slate-300 transition-all p-4 flex flex-col sm:flex-row gap-5"
                >
                  {/* Image Container */}
                  <div className="relative w-full sm:w-[240px] aspect-[16/10] flex-shrink-0 overflow-hidden rounded-xl bg-slate-100">
                    {imgData.primary ? (
                      <>
                        <img
                          src={imgData.primary}
                          alt={r.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                        />
                        {imgData.count > 1 && (
                          <div className="absolute bottom-2 right-2 bg-slate-900/70 backdrop-blur-md text-white text-[11px] font-medium px-2 py-1 rounded-md">
                            +{imgData.count - 1}
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
                    {/* Status Badge - ปรับดีไซน์ตามต้นฉบับ (แสดงเป็นประเภทบริการหรือสถานะเปิดร้านได้) */}
                    <div className="absolute top-2 left-2">
                      <span className="bg-emerald-500/90 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-md shadow-sm uppercase tracking-wider">
                        ร้านอาหาร
                      </span>
                    </div>
                  </div>

                  {/* Content Container */}
                  <div className="flex-1 flex flex-col justify-between min-w-0 py-1">
                    <div>
                      <div className="flex justify-between items-start gap-4">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                              {r.category || "ทั่วไป"}
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
                                {r.location || "ไม่ได้ระบุตำแหน่งที่ตั้ง"}
                              </span>
                            </span>
                          </div>
                          <h3 className="text-lg font-bold text-slate-900 leading-tight truncate pr-4">
                            {r.name}
                          </h3>
                        </div>
                      </div>
                      <p className="text-sm text-slate-500 mt-2.5 line-clamp-2 leading-relaxed pr-4">
                        {r.description || "พร้อมมอบประสบการณ์อาหารเลิศรสและบริการที่ประทับใจให้กับคุณ"}
                      </p>
                    </div>

                    {/* Footer Actions & Contacts */}
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
                      <div className="flex items-center gap-4">
                        {r.phone && (
                          <div className="flex items-center gap-1.5 text-slate-600 hover:text-slate-900 transition-colors cursor-default">
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
                              {r.phone}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Action Buttons (Fades in on Desktop Hover, Always on for Mobile) */}
                      <div className="flex items-center gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200">
                        <button
                          onClick={() => onEdit(r)}
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
                          onClick={() => setConfirmId(r.id)}
                          disabled={isDeleting && confirmId === r.id}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                          title="ลบร้านอาหาร"
                        >
                          {isDeleting && confirmId === r.id ? (
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
              );
            })
          )}
        </AnimatePresence>
      </motion.div>

      {/* --- Premium Pagination (Identical To Accommodations Page) --- */}
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
              {Math.min(page * itemsPerPage, restaurants.length)}
            </span>{" "}
            จากทั้งหมด{" "}
            <span className="font-semibold text-slate-900">
              {restaurants.length}
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
                )
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

      {/* --- Confirm Delete Dialog --- */}
      <ConfirmDialog
        open={!!confirmId}
        danger={true}
        loading={isDeleting}
        title="ยืนยันการลบร้านอาหาร"
        message={
          <span className="text-slate-600">
            คุณต้องการลบร้านอาหารนี้ออกจากระบบหรือไม่? ข้อมูลทั้งหมดจะถูก{" "}
            <span className="font-semibold text-red-600">ลบอย่างถาวร</span>{" "}
            และไม่สามารถกู้คืนได้
          </span>
        }
        confirmText="ลบข้อมูลถาวร"
        cancelText="ยกเลิก"
        onConfirm={() => confirmId && handleDelete(confirmId)}
        onCancel={() => setConfirmId(null)}
      />
    </div>
  );
}