"use client";

import { useState, useEffect, useCallback } from "react";
import { createBrowserClient } from "@supabase/ssr";
import type { User } from "@supabase/supabase-js";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

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

interface AddAccommodationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editAccommodation?: Accommodation | null;
}

export const AddAccommodationModal = ({
  isOpen,
  onClose,
  onSuccess,
  editAccommodation,
}: AddAccommodationModalProps) => {
  // ─── Supabase Auth ─────────────────────────────────────────────────────────
  const [user, setUser] = useState<User | null>(null);
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // ดึงข้อมูล User เมื่อ Modal ถูกเปิด
  useEffect(() => {
    if (isOpen) {
      const fetchUser = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
      };
      fetchUser();
    }
  }, [isOpen, supabase.auth]);

  // ─── Form States ───────────────────────────────────────────────────────────
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    address: "",
    min_price: "",
    max_price: "",
    category: "หอพัก",
    contact_phone: "",
    contact_line: "",
    contact_facebook: "",
  });

  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Lock body scroll เมื่อ Modal เปิด
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  // ตั้งค่าข้อมูลเริ่มต้นเมื่อเป็นการแก้ไข
  useEffect(() => {
    if (editAccommodation) {
      setFormData({
        name: editAccommodation.name,
        description: editAccommodation.description || "",
        address: editAccommodation.address || "",
        min_price: editAccommodation.min_price ? editAccommodation.min_price.toString() : "",
        max_price: editAccommodation.max_price ? editAccommodation.max_price.toString() : "",
        category: editAccommodation.category,
        contact_phone: editAccommodation.contact_phone || "",
        contact_line: editAccommodation.contact_line || "",
        contact_facebook: editAccommodation.contact_facebook || "",
      });
      setExistingImages(editAccommodation.images || []);
    } else {
      resetForm();
    }
  }, [editAccommodation, isOpen]);

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      address: "",
      min_price: "",
      max_price: "",
      category: "หอพัก",
      contact_phone: "",
      contact_line: "",
      contact_facebook: "",
    });
    setImageFiles([]);
    setImagePreviews([]);
    setExistingImages([]);
    setError(null);
  };

  // ─── Image Processing ──────────────────────────────────────────────────────
  const processFiles = useCallback((files: File[]) => {
    const totalImages = existingImages.length + imageFiles.length + files.length;
    if (totalImages > 5) {
      setError("สามารถอัปโหลดได้สูงสุด 5 รูปเท่านั้น");
      return;
    }

    const validFiles: File[] = [];
    for (const file of files) {
      if (file.size > 5 * 1024 * 1024) {
        setError("แต่ละไฟล์ต้องมีขนาดไม่เกิน 5MB");
        return;
      }
      if (!file.type.startsWith("image/")) {
        setError("กรุณาเลือกไฟล์รูปภาพเท่านั้น");
        return;
      }
      validFiles.push(file);
    }

    setError(null);
    setImageFiles((prev) => [...prev, ...validFiles]);

    validFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  }, [existingImages.length, imageFiles.length]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) processFiles(files);
  };

  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) processFiles(files);
  };

  const removeNewImage = (index: number) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const removeExistingImage = (index: number) => {
    setExistingImages((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadImages = async (): Promise<string[]> => {
    if (imageFiles.length === 0) return [];
    try {
      setUploading(true);
      const uploadedUrls: string[] = [];
      for (const file of imageFiles) {
        const formData = new FormData();
        formData.append("file", file);
        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        if (!response.ok) throw new Error("การอัปโหลดรูปล้มเหลว");
        const data = await response.json();
        uploadedUrls.push(data.url);
      }
      return uploadedUrls;
    } catch (err) {
      console.error("Upload error:", err);
      throw new Error("ไม่สามารถอัปโหลดรูปภาพได้");
    } finally {
      setUploading(false);
    }
  };

  // ─── Form Submission ───────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      setError("กรุณาเข้าสู่ระบบก่อนทำรายการ");
      return;
    }

    if (!formData.min_price) {
      setError("กรุณาระบุราคาเริ่มต้น");
      return;
    }

    const min = parseInt(formData.min_price);
    const max = formData.max_price ? parseInt(formData.max_price) : null;

    if (max !== null && min > max) {
      setError("ราคาเริ่มต้นต้องไม่มากกว่าราคาสูงสุด");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const newImageUrls = await uploadImages();
      const allImages = [...existingImages, ...newImageUrls];

      const payload = {
        name: formData.name,
        description: formData.description,
        address: formData.address,
        category: formData.category,
        contact_phone: formData.contact_phone,
        contact_line: formData.contact_line,
        contact_facebook: formData.contact_facebook,
        min_price: min,
        max_price: max,
        price_range: max ? `${min}-${max}` : `${min}+`,
        images: allImages.length > 0 ? allImages : null,
      };

      if (editAccommodation) {
        const { error: updateError } = await supabase
          .from("accommodations")
          .update(payload)
          .eq("id", editAccommodation.id);

        if (updateError) throw updateError;
        toast.success("อัปเดตข้อมูลที่พักเรียบร้อยแล้ว");
      } else {
        const { error: insertError } = await supabase
          .from("accommodations")
          .insert({
            ...payload,
            created_by: user.id, // ✅ ใช้ user.id ของ Supabase
          });

        if (insertError) throw insertError;
        toast.success("เพิ่มที่พักใหม่เรียบร้อยแล้ว");
      }

      resetForm();
      onSuccess();
      onClose();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการบันทึก";
      setError(errorMessage);
      toast.error("บันทึกข้อมูลไม่สำเร็จ");
    } finally {
      setSubmitting(false);
    }
  };

  const totalImages = existingImages.length + imageFiles.length;
  const canAddMoreImages = totalImages < 5;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              resetForm();
              onClose();
            }}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: "spring", duration: 0.5, bounce: 0.3 }}
            className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-8 py-5 border-b border-slate-100">
              <h2 className="text-xl font-semibold text-slate-800 tracking-tight">
                {editAccommodation ? "แก้ไขที่พัก" : "เพิ่มที่พักใหม่"}
              </h2>
              <button
                onClick={() => {
                  resetForm();
                  onClose();
                }}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Scrollable Form Body */}
            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
              <form id="accommodation-form" onSubmit={handleSubmit} className="space-y-8">
                
                {/* Error Banner */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm border border-red-100 flex items-center gap-2"
                    >
                      <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {error}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Section: รูปภาพ */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-slate-700">
                    รูปภาพที่พัก <span className="text-slate-400 font-normal">(สูงสุด 5 รูป)</span>
                  </label>
                  
                  {(existingImages.length > 0 || imagePreviews.length > 0) && (
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-4">
                      {existingImages.map((image, index) => (
                        <div key={`existing-${index}`} className="relative group aspect-square">
                          <img src={image} alt={`Existing ${index + 1}`} className="w-full h-full object-cover rounded-xl border border-slate-200" />
                          <button type="button" onClick={() => removeExistingImage(index)} className="absolute -top-2 -right-2 bg-white text-red-500 shadow-md rounded-full w-7 h-7 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:scale-110">
                            ✕
                          </button>
                        </div>
                      ))}
                      {imagePreviews.map((preview, index) => (
                        <div key={`new-${index}`} className="relative group aspect-square">
                          <img src={preview} alt={`Preview ${index + 1}`} className="w-full h-full object-cover rounded-xl border-2 border-blue-500" />
                          <button type="button" onClick={() => removeNewImage(index)} className="absolute -top-2 -right-2 bg-white text-red-500 shadow-md rounded-full w-7 h-7 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:scale-110">
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {canAddMoreImages && (
                    <div
                      onDragOver={onDragOver}
                      onDragLeave={onDragLeave}
                      onDrop={onDrop}
                      className={`relative flex justify-center w-full px-6 py-8 transition-all border-2 border-dashed rounded-2xl ${
                        isDragging ? "border-blue-500 bg-blue-50" : "border-slate-300 hover:border-slate-400 hover:bg-slate-50"
                      }`}
                    >
                      <input type="file" id="images-upload" accept="image/*" multiple onChange={handleImageChange} className="hidden" />
                      <label htmlFor="images-upload" className="flex flex-col items-center justify-center cursor-pointer space-y-2">
                        <div className="p-3 bg-white shadow-sm rounded-full border border-slate-100">
                          <svg className="w-6 h-6 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <p className="text-sm font-medium text-slate-600">คลิกเพื่อเลือกไฟล์ <span className="font-normal text-slate-500">หรือลากไฟล์มาวางที่นี่</span></p>
                        <p className="text-xs text-slate-400">รองรับ JPG, PNG (ไม่เกิน 5MB) • อัปโหลดได้อีก {5 - totalImages} รูป</p>
                      </label>
                    </div>
                  )}
                </div>

                <hr className="border-slate-100" />

                {/* Section: ข้อมูลทั่วไป */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="md:col-span-1 space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">ชื่อที่พัก <span className="text-red-400">*</span></label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none placeholder:text-slate-400"
                      placeholder="ระบุชื่อที่พัก"
                    />
                  </div>

                  <div className="md:col-span-1 space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">ประเภท <span className="text-red-400">*</span></label>
                    <select
                      required
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none"
                    >
                      <option value="หอพัก">หอพัก</option>
                      <option value="โรงแรม">โรงแรม</option>
                      <option value="โฮมสเตย์">โฮมสเตย์</option>
                      <option value="อพาร์ทเมนท์">อพาร์ทเมนท์</option>
                      <option value="คอนโด">คอนโด</option>
                      <option value="บ้านเช่า">บ้านเช่า</option>
                    </select>
                  </div>

                  <div className="md:col-span-2 space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">รายละเอียด</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none placeholder:text-slate-400 resize-none"
                      placeholder="จุดเด่น สิ่งอำนวยความสะดวก ฯลฯ"
                    />
                  </div>

                  <div className="md:col-span-2 space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">ที่อยู่</label>
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none placeholder:text-slate-400"
                      placeholder="บ้านเลขที่, ซอย, ถนน, ตำบล..."
                    />
                  </div>
                </div>

                <hr className="border-slate-100" />

                {/* Section: ราคา */}
                <div className="grid grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">ราคาเริ่มต้น <span className="text-slate-400 font-normal">(บาท)</span> <span className="text-red-400">*</span></label>
                    <input
                      type="number"
                      required
                      value={formData.min_price}
                      onChange={(e) => setFormData({ ...formData, min_price: e.target.value })}
                      className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none placeholder:text-slate-400"
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">ราคาสูงสุด <span className="text-slate-400 font-normal">(บาท / ไม่บังคับ)</span></label>
                    <input
                      type="number"
                      value={formData.max_price}
                      onChange={(e) => setFormData({ ...formData, max_price: e.target.value })}
                      className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none placeholder:text-slate-400"
                      placeholder="0"
                    />
                  </div>
                </div>

                <hr className="border-slate-100" />

                {/* Section: การติดต่อ */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">เบอร์โทรติดต่อ</label>
                    <input
                      type="tel"
                      value={formData.contact_phone}
                      onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                      className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none placeholder:text-slate-400"
                      placeholder="08X-XXX-XXXX"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">LINE ID</label>
                    <input
                      type="text"
                      value={formData.contact_line}
                      onChange={(e) => setFormData({ ...formData, contact_line: e.target.value })}
                      className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none placeholder:text-slate-400"
                      placeholder="@lineid"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">Facebook</label>
                    <input
                      type="text"
                      value={formData.contact_facebook}
                      onChange={(e) => setFormData({ ...formData, contact_facebook: e.target.value })}
                      className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none placeholder:text-slate-400"
                      placeholder="ชื่อเพจ หรือ ลิงก์"
                    />
                  </div>
                </div>
              </form>
            </div>

            {/* Footer / Actions */}
            <div className="px-8 py-5 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3 rounded-b-2xl">
              <button
                type="button"
                onClick={() => {
                  resetForm();
                  onClose();
                }}
                disabled={submitting || uploading}
                className="px-6 py-2.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:text-slate-900 active:scale-95 transition-all disabled:opacity-50"
              >
                ยกเลิก
              </button>
              <button
                form="accommodation-form"
                type="submit"
                disabled={submitting || uploading}
                className="px-6 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700 shadow-sm shadow-blue-600/20 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {(submitting || uploading) && (
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                {uploading
                  ? `กำลังอัปโหลด... (${imageFiles.length})`
                  : submitting
                  ? editAccommodation ? "กำลังอัปเดต..." : "กำลังบันทึก..."
                  : editAccommodation ? "อัปเดตข้อมูล" : "บันึกข้อมูล"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};