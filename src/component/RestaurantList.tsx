"use client";
import { useEffect, useState } from "react";
import { Search, MapPin } from "lucide-react";

interface Restaurant {
  id: string;
  name: string;
  description: string;
  location: string;
  category: string;
  image_url: string;
}

export default function RestaurantList() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(true);

  const categories = [
    { value: "", label: "ทั้งหมด", icon: "🍽️" },
    { value: "คาเฟ่", label: "คาเฟ่", icon: "☕" },
    { value: "อาหารไทย", label: "อาหารไทย", icon: "🍜" },
    { value: "ร้านขนม", label: "ร้านขนม", icon: "🍰" },
    { value: "อื่นๆ", label: "อื่นๆ", icon: "📍" },
  ];

  const fetchRestaurants = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append("q", search);
      if (category) params.append("category", category);

      const res = await fetch(`/api/restaurants?${params.toString()}`);
      const data = await res.json();
      setRestaurants(data);
    } catch (error) {
      console.error("Error fetching restaurants:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchRestaurants();
    }, 400); // debounce
    return () => clearTimeout(timer);
  }, [search, category]);

  return (
    <div className="min-h-screen bg-linear-to-br from-sky-50 via-white to-blue-50">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <h1 className="text-4xl font-bold text-sky-700 mb-2 flex items-center gap-3">
          🍽️ ร้านอาหารแนะนำ
        </h1>
        <p className="text-gray-600">ค้นพบร้านอาหารอร่อยๆ ในโคราช</p>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Search & Filter Section */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search Input */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="ค้นหาชื่อร้าน, ที่อยู่, หรือรายละเอียด..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-sky-500 focus:outline-none transition"
              />
            </div>

            {/* Category Filter */}
            <div className="flex gap-2 flex-wrap lg:flex-nowrap">
              {categories.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => setCategory(cat.value)}
                  className={`px-4 py-3 rounded-xl font-medium transition whitespace-nowrap ${
                    category === cat.value
                      ? "bg-sky-600 text-white shadow-lg"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {cat.icon} {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Results Count */}
          <div className="mt-4 text-sm text-gray-600">
            พบ <span className="font-semibold text-sky-700">{restaurants.length}</span> ร้านอาหาร
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block w-12 h-12 border-4 border-sky-200 border-t-sky-600 rounded-full animate-spin"></div>
            <p className="mt-4 text-gray-600">กำลังโหลด...</p>
          </div>
        )}

        {/* Empty */}
        {!loading && restaurants.length === 0 && (
          <div className="text-center py-16 bg-white rounded-2xl shadow">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">ไม่พบร้านอาหาร</h3>
            <p className="text-gray-500">ลองค้นหาด้วยคำอื่นหรือเปลี่ยนหมวดหมู่</p>
          </div>
        )}

        {/* Grid */}
        {!loading && restaurants.length > 0 && (
          <div className="grid lg:grid-cols-3 md:grid-cols-2 grid-cols-1 gap-6">
            {restaurants.map((r) => (
              <div
                key={r.id}
                className="bg-white rounded-2xl shadow-md hover:shadow-2xl transition-all duration-300 overflow-hidden group cursor-pointer transform hover:-translate-y-1"
              >
                <div className="relative h-56 overflow-hidden bg-gray-200">
                  <img
                    src={r.image_url || "/images/default.jpg"}
                    alt={r.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    onError={(e) => {
                      e.currentTarget.src =
                        "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800";
                    }}
                  />
                  <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs font-semibold text-sky-700 shadow-lg">
                    {categories.find((c) => c.value === r.category)?.icon || "🍽️"}{" "}
                    {r.category || "อื่นๆ"}
                  </div>
                </div>

                <div className="p-5">
                  <h3 className="text-xl font-bold text-gray-800 mb-2 line-clamp-1 group-hover:text-sky-700 transition">
                    {r.name}
                  </h3>
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2 leading-relaxed">
                    {r.description || "ร้านอาหารคุณภาพ บรรยากาศดี"}
                  </p>
                  {r.location && (
                    <div className="flex items-start gap-2 text-sm text-gray-500">
                      <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-sky-600" />
                      <span className="line-clamp-2">{r.location}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
