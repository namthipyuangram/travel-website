"use client";

import Navbar from "../../../component/Admin/Navbar";
import { useEffect, useState } from "react";
import Image from "next/image";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import type { Destination } from "@/types/destination";

export default function AdminDestinationsPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDestination, setEditingDestination] = useState<Destination | null>(null);

  // ✅ 1. ปรับ State ให้รับ string ได้ เพื่อให้ User ลบเลขจนว่างได้ตอนพิมพ์
  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    category: Destination["category"];
    image_url: string;
    min_price: number | string;
    max_price: number | string;
  }>({
    name: "",
    description: "",
    category: "ธรรมชาติ",
    image_url: "",
    min_price: 0,
    max_price: 0,
  });

  // ✅ ตรวจสอบสิทธิ์ admin
  useEffect(() => {
    if (isLoaded) {
      const role = user?.publicMetadata?.role as string | undefined;
      if (role !== "admin") {
        router.push("/dashboard");
      }
    }
  }, [isLoaded, user, router]);

  // ✅ ดึงข้อมูลสถานที่
  useEffect(() => {
    fetchDestinations();
  }, []);

  const fetchDestinations = async () => {
    const res = await fetch("/api/destinations");
    const data = await res.json();
    setDestinations(data);
  };

  const handleOpenModal = (destination?: Destination) => {
    if (destination) {
      setEditingDestination(destination);
      setFormData({
        name: destination.name,
        description: destination.description || "",
        category: destination.category,
        image_url: destination.image_url || "",
        // ✅ 2. ใช้ ?? 0 เพื่อกันค่า null จาก Database ทำให้ input ไม่พัง
        min_price: destination.min_price ?? 0,
        max_price: destination.max_price ?? 0,
      });
    } else {
      setEditingDestination(null);
      setFormData({
        name: "",
        description: "",
        category: "ธรรมชาติ",
        image_url: "",
        min_price: 0,
        max_price: 0,
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingDestination(null);
    setFormData({
      name: "",
      description: "",
      category: "ธรรมชาติ",
      image_url: "",
      min_price: 0,
      max_price: 0,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const method = editingDestination ? "PUT" : "POST";
    const url = editingDestination
      ? `/api/destinations/${editingDestination.id}`
      : "/api/destinations";

    // ✅ 3. แปลงค่ากลับเป็น Number ก่อนส่ง API
    const payload = {
        ...formData,
        min_price: Number(formData.min_price) || 0,
        max_price: Number(formData.max_price) || 0,
    }

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      fetchDestinations();
      handleCloseModal();
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("คุณแน่ใจหรือไม่ที่จะลบสถานที่นี้?")) return;
    const res = await fetch(`/api/destinations/${id}`, { method: "DELETE" });
    if (res.ok) fetchDestinations();
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <Navbar />

        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              🌏 จัดการสถานที่ท่องเที่ยว
            </h1>
            <p className="text-gray-600 mt-1">
              เพิ่ม / แก้ไข / ลบสถานที่ในระบบ
            </p>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg font-semibold"
          >
            ➕ เพิ่มสถานที่ใหม่
          </button>
        </div>

        {/* ตาราง / การ์ดแสดงข้อมูล */}
        <div className="grid md:grid-cols-3 sm:grid-cols-2 grid-cols-1 gap-6">
          {destinations.map((d) => (
            <div
              key={d.id}
              className="bg-white rounded-xl shadow hover:shadow-lg transition overflow-hidden"
            >
              <Image
                src={d.image_url || "/images/default.jpg"}
                alt={d.name}
                width={400}
                height={250}
                className="w-full h-48 object-cover"
              />
              <div className="p-4">
                <h4 className="text-lg font-bold text-emerald-700">{d.name}</h4>
                <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                  {d.description}
                </p>
                
                {/* แสดงราคาในการ์ด */}
                <div className="flex justify-between items-center mt-2">
                    <span className="text-xs inline-block bg-emerald-100 text-emerald-700 px-2 py-1 rounded">
                    {d.category}
                    </span>
                    <span className="text-xs font-bold text-gray-500">
                        {d.max_price === 0 ? "เข้าชมฟรี" : `฿${d.min_price} - ${d.max_price}`}
                    </span>
                </div>

                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => handleOpenModal(d)}
                    className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg text-sm font-semibold"
                  >
                    ✏️ แก้ไข
                  </button>
                  <button
                    onClick={() => handleDelete(d.id)}
                    className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg text-sm font-semibold"
                  >
                    🗑️ ลบ
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                {editingDestination ? "✏️ แก้ไขสถานที่" : "➕ เพิ่มสถานที่ใหม่"}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ชื่อสถานที่
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    คำอธิบาย
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    หมวดหมู่
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        category: e.target.value as Destination["category"],
                      })
                    }
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="ธรรมชาติ">🌳 ธรรมชาติ</option>
                    <option value="วัด">🏯 วัด</option>
                    <option value="ร้านอาหาร">🍜 ร้านอาหาร</option>
                    <option value="คาเฟ่">☕ คาเฟ่</option>
                    <option value="ที่พัก">🏠 ที่พัก</option>
                    <option value="อื่นๆ">📍 อื่นๆ</option>
                  </select>
                </div>
                
                {/* ✅ 4. Input ราคาที่ใช้ State แบบ String/Number */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      ค่าเข้าเริ่มต้น (บาท)
                    </label>
                    <input
                      type="number"
                      value={formData.min_price}
                      // ใช้ e.target.value ตรงๆ (เป็น string) เพื่อให้ลบจนว่างได้
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          min_price: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      สูงสุด (บาท)
                    </label>
                    <input
                      type="number"
                      value={formData.max_price}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          max_price: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    URL รูปภาพ
                  </label>
                  <input
                    type="url"
                    value={formData.image_url}
                    onChange={(e) =>
                      setFormData({ ...formData, image_url: e.target.value })
                    }
                    placeholder="https://example.com/image.jpg"
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 rounded-lg font-semibold"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-lg font-semibold"
                  >
                    {editingDestination ? "💾 บันทึก" : "➕ เพิ่ม"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}