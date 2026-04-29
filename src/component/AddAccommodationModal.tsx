"use client";

import { useUser } from "@clerk/nextjs";
import { useState, useEffect } from "react";
import { supabaseClient } from "@/lib/supabaseClient";

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

export function AddAccommodationModal({
  isOpen,
  onClose,
  onSuccess,
  editAccommodation,
}: AddAccommodationModalProps) {
  const { user } = useUser();
  
  // ✅ State เก็บค่าเป็น String เพื่อให้จัดการ Input ได้ง่าย (เช่น การลบจนว่างเปล่า)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    address: "",
    min_price: "", // ใช้ string รับค่า input
    max_price: "", // ใช้ string รับค่า input
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

  // ✅ โหลดข้อมูลเมื่อเป็นโหมดแก้ไข
  useEffect(() => {
    if (editAccommodation) {
      setFormData({
        name: editAccommodation.name,
        description: editAccommodation.description || "",
        address: editAccommodation.address || "",
        min_price: editAccommodation.min_price ? editAccommodation.min_price.toString() : "", // แปลงเป็น string
        max_price: editAccommodation.max_price ? editAccommodation.max_price.toString() : "", // แปลงเป็น string
        category: editAccommodation.category,
        contact_phone: editAccommodation.contact_phone || "",
        contact_line: editAccommodation.contact_line || "",
        contact_facebook: editAccommodation.contact_facebook || "",
      });
      setExistingImages(editAccommodation.images || []);
    } else {
      resetForm();
    }
  }, [editAccommodation]);

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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const totalImages = existingImages.length + imageFiles.length + files.length;
    if (totalImages > 5) {
      setError("สามารถอัปโหลดได้สูงสุด 5 รูปเท่านั้น");
      return;
    }

    for (const file of files) {
      if (file.size > 5 * 1024 * 1024) {
        setError("แต่ละไฟล์ต้องมีขนาดไม่เกิน 5MB");
        return;
      }
      if (!file.type.startsWith("image/")) {
        setError("กรุณาเลือกไฟล์รูปภาพเท่านั้น");
        return;
      }
    }

    setError(null);
    setImageFiles((prev) => [...prev, ...files]);

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // ✅ Validation: ตรวจสอบราคา
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

      // ✅ Prepare Data & Convert Types
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
          // สร้าง string price_range อัตโนมัติ (เช่น "3000-5000" หรือ "3000+")
          price_range: max ? `${min}-${max}` : `${min}+`, 
          images: allImages.length > 0 ? allImages : null,
      };

      if (editAccommodation) {
        // UPDATE
        const { error: updateError } = await supabaseClient
          .from("accommodations")
          .update(payload)
          .eq("id", editAccommodation.id);

        if (updateError) throw updateError;
      } else {
        // INSERT
        const { error: insertError } = await supabaseClient
          .from("accommodations")
          .insert({
            ...payload,
            created_by: user.id,
          });

        if (insertError) throw insertError;
      }

      resetForm();
      onSuccess();
      onClose();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการบันทึก";
      setError(errorMessage);
      console.error("Error saving accommodation:", err);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const totalImages = existingImages.length + imageFiles.length;
  const canAddMoreImages = totalImages < 5;

  return (
    <div className="fixed inset-0 bg-black/60 bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            {editAccommodation ? "แก้ไขที่พัก" : "เพิ่มที่พักใหม่"}
          </h2>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Image Upload Section */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                รูปภาพที่พัก (สูงสุด 5 รูป)
              </label>
              
              {(existingImages.length > 0 || imagePreviews.length > 0) && (
                <div className="grid grid-cols-5 gap-2 mb-3">
                  {existingImages.map((image, index) => (
                    <div key={`existing-${index}`} className="relative group">
                      <img
                        src={image}
                        alt={`Existing ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg border-2 border-gray-300"
                      />
                      <button
                        type="button"
                        onClick={() => removeExistingImage(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                      >
                        ✕
                      </button>
                      {index === 0 && imagePreviews.length === 0 && (
                        <span className="absolute bottom-1 left-1 bg-blue-600 text-white text-xs px-1.5 py-0.5 rounded">หลัก</span>
                      )}
                    </div>
                  ))}
                  {imagePreviews.map((preview, index) => (
                    <div key={`new-${index}`} className="relative group">
                      <img
                        src={preview}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg border-2 border-blue-300"
                      />
                      <button
                        type="button"
                        onClick={() => removeNewImage(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                      >
                        ✕
                      </button>
                      <span className="absolute top-1 left-1 bg-green-600 text-white text-xs px-1.5 py-0.5 rounded">ใหม่</span>
                    </div>
                  ))}
                </div>
              )}

              {canAddMoreImages && (
                <div>
                  <input
                    type="file"
                    id="images-upload"
                    accept="image/*"
                    multiple
                    onChange={handleImageChange}
                    className="hidden"
                  />
                  <label
                    htmlFor="images-upload"
                    className="inline-flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg cursor-pointer transition font-medium text-sm"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    {totalImages === 0 ? "เลือกรูปภาพ" : "เพิ่มรูปภาพ"}
                  </label>
                  <p className="text-xs text-gray-500 mt-2">
                    รองรับไฟล์ JPG, PNG (แต่ละไฟล์ไม่เกิน 5MB) • อัปโหลดได้อีก {5 - totalImages} รูป
                  </p>
                </div>
              )}
            </div>

            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ชื่อที่พัก <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="เช่น หอพักดอกไม้"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ประเภท <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="หอพัก">หอพัก</option>
                <option value="โรงแรม">โรงแรม</option>
                <option value="โฮมสเตย์">โฮมสเตย์</option>
                <option value="อพาร์ทเมนท์">อพาร์ทเมนท์</option>
                <option value="คอนโด">คอนโด</option>
                <option value="บ้านเช่า">บ้านเช่า</option>
              </select>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                รายละเอียด
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="อธิบายเกี่ยวกับที่พัก..."
              />
            </div>

            {/* Address */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ที่อยู่
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="เช่น ถนนเพชรเกษม..."
              />
            </div>

            {/* ✅ Price Range (New Design: 2 Inputs) */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ราคาเริ่มต้น (บาท) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  value={formData.min_price}
                  onChange={(e) => setFormData({ ...formData, min_price: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="เช่น 3000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ราคาสูงสุด (บาท) <span className="text-xs text-gray-500">(ไม่บังคับ)</span>
                </label>
                <input
                  type="number"
                  value={formData.max_price}
                  onChange={(e) => setFormData({ ...formData, max_price: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="เช่น 5000"
                />
              </div>
            </div>

            {/* Contact Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  เบอร์โทร
                </label>
                <input
                  type="tel"
                  value={formData.contact_phone}
                  onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0812345678"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  LINE ID
                </label>
                <input
                  type="text"
                  value={formData.contact_line}
                  onChange={(e) => setFormData({ ...formData, contact_line: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="@lineid"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Facebook
                </label>
                <input
                  type="text"
                  value={formData.contact_facebook}
                  onChange={(e) => setFormData({ ...formData, contact_facebook: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="facebook.com/..."
                />
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => {
                  resetForm();
                  onClose();
                }}
                disabled={submitting || uploading}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium disabled:opacity-50"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                disabled={submitting || uploading}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading
                  ? `กำลังอัปโหลด... (${imageFiles.length} รูป)`
                  : submitting
                  ? editAccommodation ? "กำลังอัปเดต..." : "กำลังบันทึก..."
                  : editAccommodation ? "อัปเดต" : "บันทึก"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}