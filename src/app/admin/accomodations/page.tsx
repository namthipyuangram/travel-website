"use client";

import { useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { supabaseClient } from "@/lib/supabaseClient";
import { AddAccommodationModal } from "../../../component/AddAccommodationModal";
import ConfirmDialog from "../../../component/ConfirmDialog"; // ⬅️ Import ConfirmDialog
import Navbar from "@/component/Admin/Navbar";

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
}

export default function AdminAccommodationsPage() {
  const { user, isLoaded } = useUser();
  const [accommodations, setAccommodations] = useState<Accommodation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAccommodation, setEditingAccommodation] = useState<Accommodation | null>(null); // ⬅️ สำหรับเก็บข้อมูลที่กำลังแก้ไข
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null); // ⬅️ สำหรับ confirm dialog

  useEffect(() => {
    if (!isLoaded) return;
    if (!user) {
      setLoading(false);
      return;
    }

    fetchAccommodations();
  }, [user, isLoaded]);

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

  // ⬅️ ฟังก์ชันเปิด modal แก้ไข
  const handleEdit = (accommodation: Accommodation) => {
    setEditingAccommodation(accommodation);
    setIsModalOpen(true);
  };

  // ⬅️ ฟังก์ชันปิด modal และรีเซ็ตข้อมูล
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingAccommodation(null);
  };

  // ⬅️ ฟังก์ชันเมื่อบันทึกสำเร็จ
  const handleSuccess = () => {
    fetchAccommodations();
    handleCloseModal();
  };

  // ⬅️ แสดง confirm dialog ก่อนลบ
  const handleDeleteClick = (id: string, name: string) => {
    setDeleteConfirm({ id, name });
  };

  // ⬅️ ลบจริงเมื่อกด confirm
  const handleConfirmDelete = async () => {
    if (!deleteConfirm) return;

    const { id, name } = deleteConfirm;

    try {
      setDeletingId(id);
      setError(null);

      const { error: deleteError } = await supabaseClient
        .from("accommodations")
        .delete()
        .eq("id", id);

      if (deleteError) throw deleteError;

      setAccommodations((prev) => prev.filter((a) => a.id !== id));
      setDeleteConfirm(null); // ปิด dialog
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการลบ";
      setError(errorMessage);
      console.error("Error deleting accommodation:", err);
    } finally {
      setDeletingId(null);
    }
  };

  if (!isLoaded || (loading && !accommodations.length)) {
    return (
      <main className="max-w-6xl mx-auto py-10 px-4">
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">กำลังโหลดข้อมูล...</p>
          </div>
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="max-w-6xl mx-auto py-10 px-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <p className="text-gray-800 font-medium">
            กรุณาเข้าสู่ระบบก่อนจัดการข้อมูลที่พักของคุณ
          </p>
        </div>
      </main>
    );
  }

  return (
    <>
    <Navbar/>
    <main className="max-w-6xl mx-auto py-10 px-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">จัดการที่พักของฉัน</h1>
          <p className="text-gray-600 mt-1">
            ทั้งหมด {accommodations.length} รายการ
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition font-medium shadow-sm flex items-center gap-2 justify-center"
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
              d="M12 4v16m8-8H4"
            />
          </svg>
          เพิ่มที่พักใหม่
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && accommodations.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-12 text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-400 mb-4"
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
          <h3 className="text-lg font-medium text-gray-900 mb-2">ยังไม่มีที่พัก</h3>
          <p className="text-gray-600 mb-4">เริ่มต้นเพิ่มที่พักแรกของคุณวันนี้</p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition font-medium"
          >
            เพิ่มที่พักใหม่
          </button>
        </div>
      ) : (
        /* Accommodations List */
        <div className="space-y-4">
          {accommodations.map((acc) => (
            <div
              key={acc.id}
              className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition overflow-hidden"
            >
              <div className="p-6">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  {/* Left: Info with Image */}
                  <div className="flex-1 flex gap-4">
                    {/* Image */}
                    <div className="flex-shrink-0">
                      {acc.images && acc.images.length > 0 ? (
                        <div className="relative w-32 h-32 rounded-lg overflow-hidden">
                          <img
                            src={acc.images[0]}
                            alt={acc.name}
                            className="w-full h-full object-cover"
                          />
                          {acc.images.length > 1 && (
                            <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                              +{acc.images.length - 1}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="bg-gradient-to-br from-blue-400 to-blue-600 w-32 h-32 rounded-lg flex items-center justify-center">
                          <svg
                            className="w-12 h-12 text-white"
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
                    </div>

                    {/* Details */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-xl font-semibold text-gray-900">
                          {acc.name}
                        </h3>
                        <span className="inline-block bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
                          {acc.category}
                        </span>
                      </div>

                      {acc.description && (
                        <p className="text-gray-600 mb-2 line-clamp-2">
                          {acc.description}
                        </p>
                      )}

                      <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                        {acc.address && (
                          <div className="flex items-center gap-1">
                            <svg
                              className="w-4 h-4 text-gray-400 flex-shrink-0"
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
                            <span className="line-clamp-1">{acc.address}</span>
                          </div>
                        )}

                        {acc.price_range && (
                          <div className="flex items-center gap-1">
                            <svg
                              className="w-4 h-4 text-gray-400 flex-shrink-0"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                            <span className="font-medium text-blue-600">
                              {acc.price_range} ฿/เดือน
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Contact Info */}
                      {(acc.contact_phone || acc.contact_line || acc.contact_facebook) && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {acc.contact_phone && (
                            <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                              📞 {acc.contact_phone}
                            </span>
                          )}
                          {acc.contact_line && (
                            <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                              LINE: {acc.contact_line}
                            </span>
                          )}
                          {acc.contact_facebook && (
                            <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                              FB ✓
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex md:flex-col gap-2">
                    <button
                      onClick={() => handleEdit(acc)} // ⬅️ เรียกฟังก์ชันแก้ไข
                      className="flex-1 md:flex-none px-4 py-2 text-blue-600 hover:bg-blue-50 border border-blue-600 rounded-lg transition font-medium text-sm"
                    >
                      แก้ไข
                    </button>
                    <button
                      onClick={() => handleDeleteClick(acc.id, acc.name)} // ⬅️ แสดง confirm dialog
                      disabled={deletingId === acc.id}
                      className="flex-1 md:flex-none px-4 py-2 text-red-600 hover:bg-red-50 border border-red-600 rounded-lg transition font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {deletingId === acc.id ? "กำลังลบ..." : "ลบ"}
                    </button>
                  </div>
                </div>
              </div>

              {/* Footer: Created Date */}
              <div className="bg-gray-50 px-6 py-3 border-t">
                <p className="text-xs text-gray-500">
                  สร้างเมื่อ:{" "}
                  {new Date(acc.created_at).toLocaleDateString("th-TH", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal - ส่งข้อมูลที่พักไปด้วยถ้าเป็นโหมดแก้ไข */}
      <AddAccommodationModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSuccess={handleSuccess}
        editAccommodation={editingAccommodation} // ⬅️ เปลี่ยนชื่อ prop
      />

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        open={!!deleteConfirm} // ⬅️ เปลี่ยนจาก isOpen เป็น open
        onCancel={() => setDeleteConfirm(null)} // ⬅️ เปลี่ยนจาก onClose เป็น onCancel
        onConfirm={handleConfirmDelete}
        title="ยืนยันการลบที่พัก"
        message={`คุณต้องการลบที่พัก "${deleteConfirm?.name}" หรือไม่? การดำเนินการนี้ไม่สามารถย้อนกลับได้`}
        confirmText="ลบ"
        cancelText="ยกเลิก"
      />
    </main>
    </>
  );
}