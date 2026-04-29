"use client";
import { useState } from "react";
import toast from "react-hot-toast";
import ConfirmDialog from "./ConfirmDialog";

interface Props {
  restaurants: any[];
  onEdit: (r: any) => void;
  onDelete: () => void;
}

export default function RestaurantsTable({ restaurants, onEdit, onDelete }: Props) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("");
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const itemsPerPage = 5;

  const categories = [
    "ทั้งหมด",
    "อาหารไทย",
    "อาหารญี่ปุ่น",
    "อาหารเกาหลี",
    "อาหารอีสาน",
    "คาเฟ่ / กาแฟ",
    "บุฟเฟ่ต์",
    "ของหวาน / เบเกอรี่",
  ];

  const filteredRestaurants = restaurants.filter((r) => {
    const matchSearch =
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.location?.toLowerCase().includes(search.toLowerCase());
    const matchCategory =
      filter === "" || filter === "ทั้งหมด" || r.category === filter;
    return matchSearch && matchCategory;
  });

  const totalPages = Math.ceil(filteredRestaurants.length / itemsPerPage);
  const displayedRestaurants = filteredRestaurants.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/restaurants/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      toast.success("ลบร้านอาหารเรียบร้อย ✅");
      onDelete();
      setConfirmId(null);
    } catch {
      toast.error("ลบร้านอาหารไม่สำเร็จ ❌");
    }
  };

  return (
    <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow-md overflow-hidden">
      {/* Search & Filter */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 border-b bg-sky-50">
        <input
          type="text"
          placeholder="ค้นหาร้านอาหาร..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full md:w-1/2 border p-2 rounded-lg focus:ring-2 focus:ring-sky-400 focus:outline-none"
        />
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="w-full md:w-1/4 border p-2 rounded-lg focus:ring-2 focus:ring-sky-400 focus:outline-none bg-white"
        >
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead className="bg-sky-100 text-sky-800">
            <tr>
              <th className="p-3">ชื่อร้าน</th>
              <th className="p-3">หมวดหมู่</th>
              <th className="p-3">ที่ตั้ง</th>
              <th className="p-3">รูปภาพ</th>
              <th className="p-3 text-right">การจัดการ</th>
            </tr>
          </thead>
          <tbody>
            {displayedRestaurants.length > 0 ? (
              displayedRestaurants.map((r) => (
                <tr key={r.id} className="border-b hover:bg-sky-50 transition-colors">
                  <td className="p-3 font-medium">{r.name}</td>
                  <td className="p-3">{r.category}</td>
                  <td className="p-3">{r.location}</td>
                  <td className="p-3">
                    {r.image_url && (
                      <img
                        src={r.image_url}
                        className="w-16 h-16 object-cover rounded-lg border"
                      />
                    )}
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex md:flex-row flex-col justify-end gap-2">
                      <button
                        onClick={() => onEdit(r)}
                        className="bg-yellow-400 hover:bg-yellow-500 text-white px-3 py-1 rounded-lg transition text-sm"
                      >
                        แก้ไข
                      </button>
                      <button
                        onClick={() => setConfirmId(r.id)}
                        className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg transition text-sm"
                      >
                        ลบ
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="text-center py-6 text-gray-500 italic">
                  ไม่พบข้อมูลร้านอาหาร
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile */}
      <div className="md:hidden p-4 space-y-4">
        {displayedRestaurants.length > 0 ? (
          displayedRestaurants.map((r) => (
            <div
              key={r.id}
              className="border rounded-xl p-4 shadow-sm hover:shadow-md transition bg-white"
            >
              <div className="flex items-center space-x-4">
                {r.image_url && (
                  <img
                    src={r.image_url}
                    className="w-20 h-20 object-cover rounded-lg border"
                    alt={r.name}
                  />
                )}
                <div className="flex-1">
                  <h3 className="font-semibold text-lg text-sky-700">{r.name}</h3>
                  <p className="text-gray-600 text-sm">{r.category}</p>
                  {r.location && (
                    <p className="text-gray-500 text-sm mt-1">{r.location}</p>
                  )}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-end gap-2 mt-4">
                <button
                  onClick={() => onEdit(r)}
                  className="bg-yellow-400 hover:bg-yellow-500 text-white px-4 py-1 rounded-lg transition"
                >
                  แก้ไข
                </button>
                <button
                  onClick={() => setConfirmId(r.id)}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-1 rounded-lg transition"
                >
                  ลบ
                </button>
              </div>
            </div>
          ))
        ) : (
          <p className="text-center text-gray-500 italic py-4">
            ไม่พบข้อมูลร้านอาหาร
          </p>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-3 py-4 border-t text-sm">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            className="text-sky-600 disabled:text-gray-400 hover:underline"
          >
            ก่อนหน้า
          </button>
          <span>
            หน้า {page} / {totalPages}
          </span>
          <button
            disabled={page === totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="text-sky-600 disabled:text-gray-400 hover:underline"
          >
            ถัดไป
          </button>
        </div>
      )}

      {/* Confirm Dialog */}
      <ConfirmDialog
        open={!!confirmId}
        title="ยืนยันการลบ?"
        message="คุณต้องการลบร้านนี้ออกจากระบบหรือไม่"
        confirmText="ลบ"
        cancelText="ยกเลิก"
        onConfirm={() => handleDelete(confirmId!)}
        onCancel={() => setConfirmId(null)}
      />
    </div>
  );
}
