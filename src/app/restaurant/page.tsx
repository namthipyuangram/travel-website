import Navbar from "@/component/User/Navbar";
import RestaurantList from "../../component/RestaurantList";
import Link from "next/link";

export default function RestaurantsPage() {
  return (
  <>
    <Navbar />
        
        {/* 🌟 1. Hero Banner Section */}
        <div className="relative w-full h-[300px] md:h-[400px] bg-gray-900 flex flex-col items-center justify-center overflow-hidden">
          {/* รูปพื้นหลัง (เปลี่ยน URL เป็นรูปที่คุณต้องการ เช่น รูปลานย่าโม หรือ ปราสาทหินพิมาย) */}
          <div 
            className="absolute inset-0 bg-cover bg-center transition-transform duration-700 hover:scale-105 opacity-60"
            style={{ backgroundImage: "url('/images/banaer1.png')" }} 
          ></div>
          
          {/* Gradient Overlay เพื่อให้ข้อความอ่านง่าย */}
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900/90 via-gray-900/40 to-transparent"></div>
          
          <div className="relative z-10 text-center px-6 animate-in fade-in slide-in-from-bottom-4 duration-1000">
           
            <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-4 drop-shadow-lg">
            ร้านอาหาร<span className="text-emerald-600">เด็ดๆในโคราช</span>
            </h1>
            <p className="text-gray-200 text-lg md:text-xl max-w-2xl mx-auto drop-shadow-md">
              ร้านอาหารอร่อยในโคราชที่คุณไม่ควรพลาด พร้อมเมนูเด็ดๆ ที่จะทำให้คุณต้องกลับมาอีกครั้ง!
            </p>
          </div>
        </div>
  
        {/* 🌟 2. Breadcrumbs Navigation */}
        <div className="max-w-7xl mx-auto px-6 pt-6">
          <nav className="flex text-sm text-gray-500 font-medium items-center space-x-2">
            <Link href="/" className="hover:text-emerald-600 transition-colors flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
              หน้าแรก
            </Link>
            <span>›</span>
            <span className="text-gray-900">ร้านอาหาร</span>
          </nav>
        </div>
  
        {/* 🌟 3. Main Content */}
        <main className="max-w-7xl mx-auto px-6 pb-16 pt-6">
          <RestaurantList />
        </main>
</>
);
}