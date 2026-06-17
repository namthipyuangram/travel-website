"use client";

import { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { X, Upload, Image as ImageIcon, Loader2 } from "lucide-react";

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
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Lock body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
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

    if (Array.isArray(image)) {
      return image[0] || "";
    }

    if (typeof image === "string") {
      try {
        const parsed = JSON.parse(image);

        if (Array.isArray(parsed)) {
          return parsed[0] || "";
        }
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
        form.id ? "อัปเดตข้อมูลเรียบร้อย" : "เพิ่มร้านอาหารเรียบร้อย",
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

  // Drag & Drop Handlers
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
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={!isSubmitting ? onClose : undefined}
          className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        />

        {/* Modal Content */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", duration: 0.5, bounce: 0.3 }}
          className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              {form.id ? "แก้ไขข้อมูลร้านอาหาร" : "เพิ่มร้านอาหารใหม่"}
            </h2>
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors disabled:opacity-50"
            >
              <X size={20} strokeWidth={2.5} />
            </button>
          </div>

          {/* Form Body (Scrollable) */}
          <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
            <form
              id="restaurant-form"
              onSubmit={handleSubmit}
              className="space-y-6"
            >
              {/* Image Upload Zone */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  รูปภาพร้านอาหาร
                </label>
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`relative flex flex-col items-center justify-center w-full min-h-[160px] p-6 transition-all border-2 border-dashed rounded-2xl cursor-pointer overflow-hidden
                    ${
                      isDragging
                        ? "border-blue-500 bg-blue-50"
                        : file || getImageUrl(form.image_url)
                          ? "border-transparent bg-slate-100 p-2"
                          : "border-slate-300 hover:border-slate-400 hover:bg-slate-50"
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
                        className="relative w-full h-48 sm:h-64 rounded-xl overflow-hidden group"
                      >
                        {/* Background */}
                        <img
                          src={
                            file
                              ? URL.createObjectURL(file)
                              : getImageUrl(form.image_url)
                          }
                          alt=""
                          className="absolute inset-0 w-full h-full object-cover"
                        />

                        <div className="absolute inset-0 bg-black/20" />

                        {/* Main Image */}
                        <img
                          src={
                            file
                              ? URL.createObjectURL(file)
                              : getImageUrl(form.image_url)
                          }
                          alt="Preview"
                          className="h-full w-full object-cover"
                        />

                        <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
                          <span className="text-white flex items-center gap-2 font-medium bg-black/40 px-4 py-2 rounded-xl backdrop-blur-md">
                            <Upload size={18} />
                            เปลี่ยนรูปภาพ
                          </span>
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex flex-col items-center text-center space-y-3"
                      >
                        <div className="p-3 bg-white shadow-sm rounded-full border border-slate-100 text-slate-400">
                          <ImageIcon size={28} strokeWidth={1.5} />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-700">
                            คลิกเพื่ออัปโหลด{" "}
                            <span className="font-normal text-slate-500">
                              หรือลากไฟล์มาวาง
                            </span>
                          </p>
                          <p className="text-xs text-slate-400 mt-1">
                            รองรับ JPG, PNG (แนะนำขนาด 800x600px)
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Grid Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="sm:col-span-1 space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700">
                    ชื่อร้าน <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="ระบุชื่อร้านอาหาร"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none placeholder:text-slate-400"
                  />
                </div>

                <div className="sm:col-span-1 space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700">
                    หมวดหมู่
                  </label>
                  <select
                    value={form.category}
                    onChange={(e) =>
                      setForm({ ...form, category: e.target.value })
                    }
                    className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none cursor-pointer appearance-none"
                  >
                    <option value="" disabled className="text-slate-400">
                      -- เลือกหมวดหมู่ --
                    </option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700">
                    ตำแหน่งที่ตั้ง
                  </label>
                  <input
                    type="text"
                    placeholder="เช่น อาคาร, ถนน, เขต, จังหวัด"
                    value={form.location}
                    onChange={(e) =>
                      setForm({ ...form, location: e.target.value })
                    }
                    className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none placeholder:text-slate-400"
                  />
                </div>

                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-sm font-semibold text-slate-700">
                    รายละเอียดเพิ่มเติม
                  </label>
                  <textarea
                    placeholder="เมนูแนะนำ, เวลาเปิด-ปิด, เบอร์ติดต่อ..."
                    value={form.description}
                    onChange={(e) =>
                      setForm({ ...form, description: e.target.value })
                    }
                    rows={3}
                    className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none placeholder:text-slate-400 resize-none"
                  />
                </div>
              </div>
            </form>
          </div>

          {/* Footer Actions */}
          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-5 py-2.5 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:text-slate-900 active:scale-[0.98] transition-all disabled:opacity-50"
            >
              ยกเลิก
            </button>
            <button
              form="restaurant-form"
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 shadow-sm shadow-blue-600/20 active:scale-[0.98] transition-all disabled:opacity-70 flex items-center justify-center min-w-[120px]"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <Loader2 size={16} className="animate-spin" />
                  กำลังบันทึก...
                </span>
              ) : form.id ? (
                "อัปเดตข้อมูล"
              ) : (
                "บันทึกข้อมูล"
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
