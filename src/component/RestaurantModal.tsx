"use client";

import { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { X, Upload, Image as ImageIcon, Loader2, ChevronDown, Check } from "lucide-react";

interface Props {
  form: any;
  setForm: (val: any) => void;
  file: File | null;
  setFile: (val: File | null) => void;
  onClose: () => void;
  refreshData: () => void;
}

export default function RestaurantModal({
  form,
  setForm,
  file,
  setFile,
  onClose,
  refreshData,
}: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  
  // Custom Dropdown State
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const categoryDropdownRef = useRef<HTMLDivElement>(null);

  // Lock body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  // Handle clicking outside of the custom dropdown to close it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        categoryDropdownRef.current &&
        !categoryDropdownRef.current.contains(event.target as Node)
      ) {
        setIsCategoryOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const categories = [
    "อาหารไทย",
    "อาหารฝรั่ง",
    "อาหารญี่ปุ่น",
    "อาหารเกาหลี",
    "อาหารอีสาน",
    "คาเฟ่ / กาแฟ",
    "บุฟเฟ่ต์",
    "ของหวาน / เบเกอรี่",
    "อื่น ๆ",
  ];

  const getImageUrl = (image: any) => {
    if (!image) return "";
    if (Array.isArray(image)) return image[0] || "";
    if (typeof image === "string") {
      try {
        const parsed = JSON.parse(image);
        if (Array.isArray(parsed)) return parsed[0] || "";
      } catch {}
      return image;
    }
    return "";
  };

  const uploadFileViaApi = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    if (!res.ok) throw new Error("Upload failed");
    const data = await res.json();
    return data.url;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    let imageUrl = getImageUrl(form.image_url);

    if (file) {
      try {
        imageUrl = await uploadFileViaApi(file);
      } catch {
        toast.error("อัปโหลดรูปภาพไม่สำเร็จ");
        setIsSubmitting(false);
        return;
      }
    }

    try {
      const method = form.id ? "PUT" : "POST";
      const url = form.id ? `/api/restaurants/${form.id}` : "/api/restaurants";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          image_url: imageUrl ? [imageUrl] : [],
        }),
      });

      if (!res.ok) throw new Error("Save failed");

      toast.success(
        form.id ? "อัปเดตข้อมูลร้านอาหารสำเร็จ" : "เพิ่มร้านอาหารใหม่สำเร็จ",
      );
      setForm({
        id: "",
        name: "",
        description: "",
        image_url: [],
        location: "",
        category: "",
      });
      setFile(null);
      onClose();
      refreshData();
    } catch {
      toast.error("บันทึกข้อมูลไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type.startsWith("image/")) {
        setFile(droppedFile);
      } else {
        toast.error("กรุณาอัปโหลดไฟล์รูปภาพเท่านั้น");
      }
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 font-sans">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={!isSubmitting ? onClose : undefined}
          className="absolute inset-0 bg-zinc-950/40 backdrop-blur-sm"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 15 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="relative w-full max-w-2xl bg-white rounded-xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] border border-zinc-200/50 flex flex-col max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
            <div>
              <h2 className="text-[17px] font-semibold text-zinc-900 tracking-tight">
                {form.id ? "แก้ไขข้อมูลร้านอาหาร" : "เพิ่มร้านอาหารใหม่"}
              </h2>
              <p className="text-xs text-zinc-500 mt-0.5">
                {form.id ? "แก้ไขและอัปเดตข้อมูลร้านอาหาร" : "เพิ่มข้อมูลร้านอาหารใหม่เข้าสู่ระบบ"}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="p-1.5 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-md transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500"
            >
              <X size={18} strokeWidth={2} />
            </button>
          </div>

          {/* Form Body */}
          <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
            <form id="restaurant-form" onSubmit={handleSubmit} className="space-y-6">
              
              {/* Image Upload Zone */}
              <div>
                <label className="block text-[13px] font-medium text-zinc-700 mb-2">
                  รูปภาพหน้าร้าน <span className="text-zinc-400 font-normal">(Thumbnail)</span>
                </label>
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`relative flex flex-col items-center justify-center w-full min-h-[180px] p-2 transition-all border border-dashed rounded-lg cursor-pointer overflow-hidden
                    ${
                      isDragging
                        ? "border-zinc-500 bg-zinc-100/80"
                        : file || getImageUrl(form.image_url)
                          ? "border-transparent bg-zinc-50"
                          : "border-zinc-300 hover:border-zinc-400 bg-zinc-50/50 hover:bg-zinc-50"
                    }
                  `}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        setFile(e.target.files[0]);
                      }
                    }}
                    className="hidden"
                  />

                  <AnimatePresence mode="wait">
                    {file || getImageUrl(form.image_url) ? (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="relative w-full h-48 sm:h-56 rounded-md overflow-hidden group border border-zinc-200/50 shadow-sm"
                      >
                        <img
                          src={file ? URL.createObjectURL(file) : getImageUrl(form.image_url)}
                          alt=""
                          className="absolute inset-0 w-full h-full object-cover blur-md opacity-50 scale-110"
                        />
                        <img
                          src={file ? URL.createObjectURL(file) : getImageUrl(form.image_url)}
                          alt="Preview"
                          className="relative h-full w-full object-contain"
                        />
                        <div className="absolute inset-0 bg-zinc-950/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                          <span className="text-white flex items-center gap-1.5 text-xs font-medium bg-zinc-950/60 border border-white/10 px-3 py-1.5 rounded-md backdrop-blur-md">
                            <Upload size={14} /> เปลี่ยนรูปภาพ
                          </span>
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex flex-col items-center text-center space-y-2 py-8"
                      >
                        <div className="p-2.5 bg-white shadow-sm border border-zinc-200 rounded-lg text-zinc-400 mb-1">
                          <ImageIcon size={22} strokeWidth={1.5} />
                        </div>
                        <div>
                          <p className="text-[13px] font-medium text-zinc-900">
                            คลิกเพื่อเลือกไฟล์ <span className="font-normal text-zinc-500">หรือลากรูปมาวางที่นี่</span>
                          </p>
                          <p className="text-[11px] text-zinc-400 mt-1">
                            รองรับไฟล์ JPG, PNG, WEBP (แนะนำสัดส่วน 16:9)
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Form Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-4">
                <div className="sm:col-span-1 space-y-1.5">
                  <label className="text-[13px] font-medium text-zinc-700">
                    ชื่อร้านอาหาร <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="เช่น The Coffee Club"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg bg-white focus:outline-none focus:ring-4 focus:ring-zinc-900/5 focus:border-zinc-400 transition-all placeholder:text-zinc-400"
                  />
                </div>

                {/* ─── Premium Custom Dropdown ─── */}
                <div className="sm:col-span-1 space-y-1.5" ref={categoryDropdownRef}>
                  <label className="text-[13px] font-medium text-zinc-700">
                    หมวดหมู่
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsCategoryOpen(!isCategoryOpen)}
                      className={`w-full pl-3 pr-3 py-2 text-sm border rounded-lg bg-white transition-all flex items-center justify-between focus:outline-none focus:ring-4 focus:ring-zinc-900/5 focus:border-zinc-400 ${
                        isCategoryOpen 
                          ? "border-zinc-400 ring-4 ring-zinc-900/5" 
                          : "border-zinc-200 hover:border-zinc-300"
                      } ${form.category ? "text-zinc-900" : "text-zinc-400"}`}
                    >
                      <span className="truncate">{form.category || "เลือกหมวดหมู่..."}</span>
                      <ChevronDown
                        size={16}
                        className={`text-zinc-400 transition-transform duration-200 ${
                          isCategoryOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    <AnimatePresence>
                      {isCategoryOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: 4, scale: 0.98 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 4, scale: 0.98 }}
                          transition={{ duration: 0.15 }}
                          className="absolute z-50 w-full mt-1.5 bg-white border border-zinc-200 rounded-lg shadow-[0_12px_30px_-10px_rgba(0,0,0,0.1)] py-1 overflow-hidden"
                        >
                          <div className="max-h-56 overflow-y-auto custom-scrollbar">
                            {categories.map((cat) => (
                              <button
                                key={cat}
                                type="button"
                                onClick={() => {
                                  setForm({ ...form, category: cat });
                                  setIsCategoryOpen(false);
                                }}
                                className="w-full text-left px-3 py-2 text-[13px] hover:bg-zinc-50 flex items-center justify-between transition-colors group"
                              >
                                <span className={form.category === cat ? "text-zinc-900 font-medium" : "text-zinc-600 group-hover:text-zinc-900"}>
                                  {cat}
                                </span>
                                {form.category === cat && (
                                  <Check size={14} className="text-zinc-900" />
                                )}
                              </button>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-[13px] font-medium text-zinc-700">
                    ตำแหน่งที่ตั้ง / พิกัด
                  </label>
                  <input
                    type="text"
                    placeholder="เช่น ชั้น G สยามพารากอน, ถ.สุขุมวิท"
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg bg-white focus:outline-none focus:ring-4 focus:ring-zinc-900/5 focus:border-zinc-400 transition-all placeholder:text-zinc-400"
                  />
                </div>

                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-[13px] font-medium text-zinc-700">
                    คำอธิบาย / รายละเอียดเพิ่มเติม
                  </label>
                  <textarea
                    placeholder="ใส่ข้อมูลเวลาเปิด-ปิด, เมนูแนะนำ, หรือจุดเด่นของร้าน..."
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg bg-white focus:outline-none focus:ring-4 focus:ring-zinc-900/5 focus:border-zinc-400 transition-all placeholder:text-zinc-400 resize-none leading-relaxed"
                  />
                </div>
              </div>
            </form>
          </div>

          {/* Footer Actions */}
          <div className="px-6 py-4 border-t border-zinc-100 bg-zinc-50/50 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-[13px] font-medium text-zinc-600 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50 hover:text-zinc-900 active:scale-[0.98] transition-all disabled:opacity-50"
            >
              ยกเลิก
            </button>
            <button
              form="restaurant-form"
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-[13px] font-medium text-white bg-zinc-900 rounded-lg hover:bg-zinc-800 shadow-sm active:scale-[0.98] transition-all disabled:opacity-70 flex items-center justify-center min-w-[100px]"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <Loader2 size={14} className="animate-spin text-zinc-400" />
                  กำลังบันทึก...
                </span>
              ) : form.id ? (
                "บันทึกการเปลี่ยนแปลง"
              ) : (
                "สร้างร้านอาหาร"
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}