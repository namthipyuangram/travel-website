"use client";
import { useState, useEffect } from "react";
import { MapPin, Phone, Clock, Star, ArrowLeft, MessageSquare } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

interface Review {
  id: number;
  user: string;
  rating: number;
  comment: string;
}

interface RestaurantDetailData {
  id: string;
  name: string;
  category: string;
  description: string;
  location: string;
  phone?: string; 
  hours?: string; 
  images: string[]; 
  reviews: Review[];
}

export default function RestaurantDetail() {
  const params = useParams();
 const rawId = params.id;
const id = Array.isArray(rawId) ? rawId[0] : rawId;
const cleanId = id?.toString().trim();

  // 🐛 ดัก Debug: ดูว่า ID ที่ได้จาก URL คืออะไร
  console.log("🐛 [Component Render] ID จาก URL:", cleanId);

  const [restaurant, setRestaurant] = useState<RestaurantDetailData | null>(null);
  const [mainImage, setMainImage] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 🐛 ดัก Debug: ติดตามการเปลี่ยนแปลงของ State ทั้งหมด
  useEffect(() => {
    console.log("🐛 [State Update] สถานะปัจจุบัน:", { 
      loading, 
      hasError: !!error, 
      errorMsg: error, 
      hasRestaurantData: !!restaurant,
      mainImage 
    });
  }, [loading, error, restaurant, mainImage]);

  useEffect(() => {
    const fetchRestaurantDetail = async () => {
      if (!cleanId) {
        console.log("🐛 [Fetch] ข้ามการทำงานเพราะไม่มี ID");
        return;
      }
      
      try {
        console.log(`🐛 [Fetch] กำลังเริ่มดึงข้อมูลของ ID: ${cleanId}`);
        setLoading(true);
        setError(null);
        
        const res = await fetch(`/api/restaurants/${cleanId}`);
        
        // 🐛 ดัก Debug: ดู Response ดิบๆ จาก API
        console.log("🐛 [Fetch API Response] HTTP Status:", res.status, "| res.ok:", res.ok);
        
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          console.error("🐛 [Fetch API Error] ข้อมูล Error จาก Backend:", errData);
          throw new Error(errData.error || "ไม่พบข้อมูลร้านอาหาร หรือเกิดข้อผิดพลาด");
        }
        
        const data: RestaurantDetailData = await res.json();
        
        // 🐛 ดัก Debug: ดูข้อมูลที่ถูกแปลงเป็น JSON แล้วแบบเต็มๆ
        console.log("🐛 [Fetch Success] ข้อมูลที่ได้จาก API แบบสมบูรณ์:", data);
        
        setRestaurant(data);
        
        if (data.images && data.images.length > 0) {
          console.log("🐛 [Image Logic] เจอรูปภาพในฐานข้อมูล เซ็ตรูปแรกเป็นรูปหลัก:", data.images[0]);
          setMainImage(data.images[0]);
        } else {
          console.log("🐛 [Image Logic] ไม่เจอรูปภาพ ใช้ Default Image");
          setMainImage("https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800"); 
        }
      } catch (err: any) {
        // 🐛 ดัก Debug: ดู Error ที่เข้าบล็อก Catch (อาจเป็น Network error หรือ throw มาจากด้านบน)
        console.error("🐛 [Catch Block] เกิด Error ขึ้นระหว่างกระบวนการ:", err);
        setError(err.message || "ไม่สามารถโหลดข้อมูลร้านอาหารได้ในขณะนี้");
      } finally {
        console.log("🐛 [Finally] จบการทำงานฟังก์ชัน Fetch (ปิด Loading)");
        setLoading(false);
      }
    };

    fetchRestaurantDetail();
  }, [cleanId]);

  // ================= 1. สถานะ Loading =================
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-slate-200 border-t-sky-600 rounded-full animate-spin mb-4"></div>
        <p className="text-slate-500 font-medium animate-pulse">กำลังโหลดข้อมูลร้านอาหาร...</p>
      </div>
    );
  }

  // ================= 2. สถานะ Error =================
  if (error || !restaurant) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4">
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 text-center max-w-md w-full">
          <p className="text-6xl mb-4">🥲</p>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">เกิดข้อผิดพลาด</h2>
          <p className="text-slate-500 mb-8">{error}</p>
          <Link href="/" className="inline-flex items-center justify-center w-full px-6 py-3 bg-sky-600 text-white font-medium rounded-xl hover:bg-sky-700 transition-colors shadow-sm">
            กลับไปหน้าหลัก
          </Link>
        </div>
      </div>
    );
  }

  // ================= 3. สถานะ Success =================
  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Link href="/" className="inline-flex items-center gap-2 text-slate-600 hover:text-sky-600 transition font-medium">
            <ArrowLeft className="w-5 h-5" />
            <span>กลับไปหน้ารวมร้านอาหาร</span>
          </Link>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          <div className="lg:col-span-7 flex flex-col gap-4">
            <div className="w-full aspect-[4/3] rounded-2xl overflow-hidden bg-slate-200 border border-slate-200 shadow-sm">
              <img 
                src={mainImage} 
                alt={restaurant.name} 
                className="w-full h-full object-cover transition-opacity duration-300"
              />
            </div>
            
            {restaurant.images && restaurant.images.length > 1 && (
              <div className="grid grid-cols-5 gap-3">
                {restaurant.images.slice(0, 5).map((img, index) => (
                  <button 
                    key={index} 
                    onClick={() => {
                      console.log(`🐛 [Click] ผู้ใช้กดเปลี่ยนรูปภาพไปที่ Index: ${index}`, img);
                      setMainImage(img);
                    }}
                    className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                      mainImage === img 
                        ? "border-sky-500 opacity-100 shadow-md ring-2 ring-sky-500 ring-offset-1" 
                        : "border-transparent opacity-60 hover:opacity-100 bg-slate-100"
                    }`}
                  >
                    <img src={img} alt={`Thumbnail ${index + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="lg:col-span-5 flex flex-col">
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 h-full flex flex-col">
              <div className="mb-4">
                <span className="inline-block px-3 py-1 bg-sky-100 text-sky-700 text-sm font-bold rounded-lg">
                  {restaurant.category || "ทั่วไป"}
                </span>
              </div>
              
              <h1 className="text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">{restaurant.name}</h1>
              
              <div className="flex items-center gap-2 mb-6">
                <div className="flex text-amber-400">
                  <Star className="w-5 h-5 fill-current" />
                  <Star className="w-5 h-5 fill-current" />
                  <Star className="w-5 h-5 fill-current" />
                  <Star className="w-5 h-5 fill-current" />
                  <Star className="w-5 h-5 text-slate-300" />
                </div>
                <span className="text-slate-500 font-medium">
                  ({restaurant.reviews?.length || 0} รีวิว)
                </span>
              </div>

              <p className="text-slate-600 text-lg leading-relaxed mb-8 flex-grow">
                {restaurant.description || "ยังไม่มีคำอธิบายสำหรับร้านนี้"}
              </p>

              <hr className="border-slate-100 mb-8" />

              <div className="space-y-5 text-slate-700 bg-slate-50 p-6 rounded-2xl border border-slate-100">
                <h3 className="font-bold text-lg text-slate-900 mb-2">ข้อมูลสถานที่และการติดต่อ</h3>
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-white rounded-lg shadow-sm text-sky-600 shrink-0"><MapPin className="w-5 h-5" /></div>
                  <p className="mt-1 leading-relaxed">{restaurant.location || "ไม่ได้ระบุที่อยู่"}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-white rounded-lg shadow-sm text-sky-600 shrink-0"><Clock className="w-5 h-5" /></div>
                  <p className="font-medium">{restaurant.hours || "ไม่ได้ระบุเวลาเปิด-ปิด"}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-white rounded-lg shadow-sm text-sky-600 shrink-0"><Phone className="w-5 h-5" /></div>
                  <p className="font-medium">{restaurant.phone || "ไม่มีเบอร์ติดต่อ"}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <section className="mt-12 bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-3 mb-8">
            <MessageSquare className="w-8 h-8 text-sky-600" />
            <h2 className="text-2xl font-bold text-slate-900">รีวิวจากลูกค้า</h2>
          </div>
          
          {restaurant.reviews && restaurant.reviews.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-6">
              {restaurant.reviews.map((review) => (
                <div key={review.id} className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white shadow-sm border border-slate-200 rounded-full flex items-center justify-center font-bold text-sky-700">
                        {review.user.charAt(0)}
                      </div>
                      <span className="font-bold text-slate-800">{review.user}</span>
                    </div>
                    <div className="flex text-amber-400">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`w-4 h-4 ${i < review.rating ? 'fill-current' : 'text-slate-300'}`} />
                      ))}
                    </div>
                  </div>
                  <p className="text-slate-600 leading-relaxed">{review.comment}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 px-4 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50">
              <p className="text-slate-400 mb-2 text-4xl">⭐</p>
              <h3 className="text-lg font-bold text-slate-700 mb-1">ยังไม่มีรีวิว</h3>
              <p className="text-slate-500">แวะไปทานแล้วอย่าลืมมาให้คะแนนร้านนี้นะ!</p>
            </div>
          )}
        </section>

      </main>
    </div>
  );
}