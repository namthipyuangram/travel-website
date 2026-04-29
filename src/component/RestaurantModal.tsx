"use client";
import { useState } from "react";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

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

    let imageUrl = form.image_url;

    if (file) {
      try {
        imageUrl = await uploadFileViaApi(file);
      } catch {
        toast.error("อัปโหลดรูปภาพไม่สำเร็จ ❌");
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
        body: JSON.stringify({ ...form, image_url: imageUrl }),
      });

      if (!res.ok) throw new Error("Save failed");

      toast.success(
        form.id ? "แก้ไขร้านอาหารเรียบร้อย ✅" : "เพิ่มร้านอาหารเรียบร้อย ✅"
      );
      setForm({
        id: "",
        name: "",
        description: "",
        image_url: "",
        location: "",
        category: "",
      });
      setFile(null);
      onClose();
      refreshData();
    } catch {
      toast.error("บันทึกร้านอาหารไม่สำเร็จ ❌");
    } finally {
      setIsSubmitting(false);
    }
  };

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

  return (
    <div className="fixed inset-0 bg-black/40 bg-opacity-40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ duration: 0.2 }}
        className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl relative"
      >
        {/* ปุ่มปิด */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 text-xl"
        >
          ✖
        </button>

        <h2 className="text-2xl font-semibold mb-5 text-center text-sky-700">
          {form.id ? "แก้ไขข้อมูลร้านอาหาร" : "เพิ่มร้านอาหารใหม่"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* ชื่อร้าน */}
          <div>
            <label className="block text-gray-700 mb-1">ชื่อร้าน *</label>
            <input
              type="text"
              placeholder="ชื่อร้านอาหาร"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-sky-400 focus:outline-none transition"
              required
            />
          </div>

          {/* ที่ตั้ง */}
          <div>
            <label className="block text-gray-700 mb-1">ที่ตั้ง</label>
            <input
              type="text"
              placeholder="เช่น ถนนมิตรภาพ, อ.เมือง"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-sky-400 focus:outline-none transition"
            />
          </div>

          {/* หมวดหมู่ */}
          <div>
            <label className="block text-gray-700 mb-1">หมวดหมู่</label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full border p-2 rounded-lg bg-white focus:ring-2 focus:ring-sky-400 focus:outline-none"
            >
              <option value="">-- เลือกหมวดหมู่ --</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* รายละเอียด */}
          <div>
            <label className="block text-gray-700 mb-1">รายละเอียด</label>
            <textarea
              placeholder="คำอธิบายเกี่ยวกับร้าน"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-sky-400 focus:outline-none transition"
              rows={3}
            />
          </div>

          {/* รูปภาพ */}
          <div className="flex flex-col items-center mt-4">
            <button
              type="button"
              onClick={() => document.getElementById("fileInput")?.click()}
              className="bg-sky-600 text-white px-5 py-2 rounded-lg hover:bg-sky-700 transition shadow-sm"
            >
              📷 {file ? "เลือกรูปใหม่" : "เลือกรูปภาพ"}
            </button>
            <input
              id="fileInput"
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="hidden"
            />

            <AnimatePresence>
              {(file || form.image_url) && (
                <motion.img
                  key="preview"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  src={file ? URL.createObjectURL(file) : form.image_url}
                  alt="Preview"
                  className="mt-4 w-40 h-40 object-cover rounded-xl shadow-md"
                />
              )}
            </AnimatePresence>
          </div>

          {/* ปุ่มบันทึก */}
          <div className="flex justify-center mt-6">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-8 py-2 rounded-lg text-white transition ${
                isSubmitting
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-sky-700 hover:bg-sky-800"
              }`}
            >
              {isSubmitting
                ? "กำลังบันทึก..."
                : form.id
                ? "บันทึกการแก้ไข"
                : "เพิ่มร้านอาหาร"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
