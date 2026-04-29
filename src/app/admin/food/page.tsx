"use client";
import { useState, useEffect } from "react";
import { Toaster } from "react-hot-toast";
import RestaurantsTable from "@/component/RestaurantsTable";
import RestaurantModal from "@/component/RestaurantModal";
import Navbar from "@/component/Admin/Navbar";

export default function AdminRestaurantsPage() {
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ทั้งหมด");
  const [form, setForm] = useState({
    id: "",
    name: "",
    description: "",
    image_url: "",
    location: "",
    category: "",
  });
  const [file, setFile] = useState<File | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchRestaurants = async () => {
    const res = await fetch("/api/restaurants");
    const data = await res.json();
    setRestaurants(data);
  };

  useEffect(() => { fetchRestaurants(); }, []);

  // ✅ ฟังก์ชันกรองข้อมูล
  const filteredRestaurants = restaurants.filter((r) => {
    const matchSearch =
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.location?.toLowerCase().includes(search.toLowerCase());
    const matchCategory =
      filter === "ทั้งหมด" || r.category === filter;
    return matchSearch && matchCategory;
  });

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

  return (
    <>
    <Navbar/>
      <Toaster position="top-right" />
      <div className="min-h-screen bg-gray-100 py-10 px-6">
        <h1 className="text-3xl font-bold text-sky-700 text-center mb-10">
          🧑‍💼 จัดการร้านอาหาร (Admin)
        </h1>

        {/* ปุ่มเพิ่ม */}
        <div className="flex justify-center mb-6">
          <button
            onClick={() => {
              setForm({ id:"",name:"",description:"",location:"",category:"",image_url:"" });
              setFile(null);
              setIsModalOpen(true);
            }}
            className="bg-sky-700 text-white px-6 py-2 rounded-lg hover:bg-sky-800"
          >
            ➕ เพิ่มร้านอาหาร
          </button>
        </div>

        {/* ตาราง */}
        <RestaurantsTable
          restaurants={filteredRestaurants}
          onEdit={(r) => { setForm(r); setIsModalOpen(true); }}
          onDelete={fetchRestaurants}
        />

        {isModalOpen && (
          <RestaurantModal
            form={form}
            setForm={setForm}
            file={file}
            setFile={setFile}
            onClose={() => setIsModalOpen(false)}
            refreshData={fetchRestaurants}
          />
        )}
      </div>
    </>
  );
}
