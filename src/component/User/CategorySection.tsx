const categories = [
  { name: "ธรรมชาติ", icon: "🌳" },
  { name: "วัด", icon: "🏯" },
  { name: "ร้านอาหาร", icon: "🍜" },
  { name: "คาเฟ่", icon: "☕" },
  { name: "ที่พัก", icon: "🏠" },
];

export default function CategorySection() {
  return (
    <div className="my-8">
      <h3 className="text-2xl font-semibold text-gray-800 mb-6">
        หมวดหมู่ยอดนิยม
      </h3>
      <div className="flex flex-wrap gap-4">
        {categories.map((cat) => (
          <button
            key={cat.name}
            className="flex items-center gap-2 bg-white shadow-sm px-4 py-2 rounded-full hover:bg-sky-50 border"
          >
            <span>{cat.icon}</span>
            <span>{cat.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
