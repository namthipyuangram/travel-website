"use client";

import { useState, useEffect, useMemo } from "react";
import { Toaster } from "react-hot-toast";
import RestaurantsTable from "@/component/RestaurantsTable";
import RestaurantModal from "@/component/RestaurantModal";
import { motion } from "framer-motion";
import { Plus, Search, Store, Filter } from "lucide-react";

export default function AdminRestaurantsPage() {
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ทั้งหมด");
  const [isLoading, setIsLoading] = useState(true);
  
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
    try {
      setIsLoading(true);
      const res = await fetch("/api/restaurants");
      const data = await res.json();
      setRestaurants(data);
    } catch (error) {
      console.error("Failed to fetch restaurants:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRestaurants();
  }, []);

  const filteredRestaurants = useMemo(() => {
    return restaurants.filter((r) => {
      const matchSearch =
        r.name.toLowerCase().includes(search.toLowerCase()) ||
        r.location?.toLowerCase().includes(search.toLowerCase());
      const matchCategory = filter === "ทั้งหมด" || r.category === filter;
      return matchSearch && matchCategory;
    });
  }, [restaurants, search, filter]);

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

  const handleOpenModal = () => {
    setForm({ id: "", name: "", description: "", location: "", category: "", image_url: "" });
    setFile(null);
    setIsModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-8">
      <Toaster position="top-right" toastOptions={{ className: 'text-sm font-medium' }} />
      
      <main className="max-w-7xl mx-auto pt-8 px-4 sm:px-6 lg:px-8">
        
        {/* Header Section */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white rounded-xl shadow-sm border border-slate-200 text-slate-700">
              <Store size={24} strokeWidth={2} />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">จัดการร้านอาหาร</h1>
              <p className="text-slate-500 mt-1 text-sm font-medium">เพิ่ม แก้ไข และจัดการข้อมูลร้านอาหารทั้งหมด</p>
            </div>
          </div>
          
          <button
            onClick={handleOpenModal}
            className="group w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl transition-all shadow-sm hover:shadow-md active:scale-[0.98] flex items-center justify-center gap-2 font-medium"
          >
            <Plus size={18} strokeWidth={2.5} />
            เพิ่มร้านอาหาร
          </button>
        </motion.div>

        {/* Toolbar: Search & Filter */}
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          transition={{ delay: 0.1 }}
          className="flex flex-col md:flex-row gap-4 mb-6"
        >
          {/* Search Input */}
          <div className="relative flex-1 group">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
              <Search size={18} />
            </div>
            <input
              type="text"
              placeholder="ค้นหาร้านอาหาร หรือ ทำเลที่ตั้ง..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 text-slate-900 rounded-xl text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none placeholder:text-slate-400 shadow-sm"
            />
          </div>

          {/* Category Filter */}
          <div className="relative md:w-64 group">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
              <Filter size={18} />
            </div>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none appearance-none shadow-sm cursor-pointer"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </div>
          </div>
        </motion.div>

        {/* Table Container */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.2 }}
          className="rounded-2xl overflow-hidden"
        >
          {isLoading ? (
            <div className="flex justify-center items-center h-64 text-slate-400">
              <svg className="animate-spin h-8 w-8 text-slate-300" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"></circle>
                <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" className="opacity-75"></path>
              </svg>
            </div>
          ) : (
            <RestaurantsTable
              restaurants={filteredRestaurants}
              onEdit={(r: any) => { setForm(r); setIsModalOpen(true); }}
              onDelete={fetchRestaurants}
            />
          )}
        </motion.div>

        {/* Modal */}
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
      </main>
    </div>
  );
}