"use client";
import { useState, useEffect } from "react";
import { MapPin, Phone, Clock, Star, ArrowLeft, MessageSquare, Ticket } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

interface Review {
  id: number;
  user: string;
  rating: number;
  comment: string;
}

// ✅ ปรับ Interface ให้รองรับข้อมูลของ Destination
interface DestinationDetailData {
  id: string | number;
  name: string;
  category?: string;
  description?: string;
  location?: string;
  phone?: string; 
  hours?: string; 
  min_price?: number;
  max_price?: number;
  image_url?: string; // รูปเดี่ยว (ถ้ามี)
  images?: string[]; // แกลเลอรีรูปภาพ (ถ้ามี)
  reviews?: Review[];
}

export default function DestinationDetail() {
  const params = useParams();
  const rawId = params.id;
  const id = Array.isArray(rawId) ? rawId[0] : rawId;
  const cleanId = id?.toString().trim();

  const [destination, setDestination] = useState<DestinationDetailData | null>(null);
  const [mainImage, setMainImage] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDestinationDetail = async () => {
      if (!cleanId) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // ✅ เปลี่ยน API Endpoint เป็น destinations
        const res = await fetch(`/api/destinations/${cleanId}`);
        
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || "ไม่พบข้อมูลสถานที่ หรือเกิดข้อผิดพลาด");
        }
        
        const data: DestinationDetailData = await res.json();
        setDestination(data);
        
        // ✅ ระบบเลือกรูปภาพ: เช็คแกลเลอรี -> เช็ครูปเดี่ยว -> รูป Default
        if (data.images && data.images.length > 0) {
          setMainImage(data.images[0]);
        } else if (data.image_url) {
          setMainImage(data.image_url);
        } else {
          setMainImage("https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800"); // รูป Default สถานที่ท่องเที่ยว
        }
      } catch (err: any) {
        setError(err.message || "ไม่สามารถโหลดข้อมูลสถานที่ได้ในขณะนี้");
      } finally {
        setLoading(false);
      }
    };

    fetchDestinationDetail();
  }, [cleanId]);

  // ================= 1. สถานะ Loading =================
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-slate-200 border-t-sky-600 rounded-full animate-spin mb-4"></div>
        <p className="text-slate-500 font-medium animate-pulse">กำลังโหลดข้อมูลสถานที่...</p>
      </div>
    );
  }

  // ================= 2. สถานะ Error =================
  if (error || !destination) {
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

  // เตรียมตัวแปรราคา
  const minPrice = destination.min_price || 0;
  const maxPrice = destination.max_price || 0;

  // ================= 3. สถานะ Success =================
  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Link href="/" className="inline-flex items-center gap-2 text-slate-600 hover:text-sky-600 transition font-medium">
            <ArrowLeft className="w-5 h-5" />
            <span>กลับไปหน้ารวมสถานที่</span>
          </Link>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* ส่วนแสดงรูปภาพ */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            <div className="w-full aspect-[4/3] rounded-2xl overflow-hidden bg-slate-200 border border-slate-200 shadow-sm">
              <img 
                src={mainImage} 
                alt={destination.name} 
                className="w-full h-full object-cover transition-opacity duration-300"
              />
            </div>
            
            {/* Gallery Thumbnails */}
            {destination.images && destination.images.length > 1 && (
              <div className="grid grid-cols-5 gap-3">
                {destination.images.slice(0, 5).map((img, index) => (
                  <button 
                    key={index} 
                    onClick={() => setMainImage(img)}
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

          {/* ส่วนแสดงรายละเอียด */}
          <div className="lg:col-span-5 flex flex-col">
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 h-full flex flex-col">
              
              <div className="flex justify-between items-start mb-4">
                <span className="inline-block px-3 py-1 bg-sky-100 text-sky-700 text-sm font-bold rounded-lg">
                  {destination.category || "จุดท่องเที่ยวทั่วไป"}
                </span>
                
                {/* ✅ ป้ายแสดงราคา (ดึงตรรกะมาจากการ์ด) */}
                <div>
                  {maxPrice === 0 ? (
                    <span className="text-sm font-bold text-green-600 bg-green-100 px-3 py-1 rounded-full flex items-center gap-1">
                      <Ticket className="w-4 h-4" /> เข้าชมฟรี
                    </span>
                  ) : (
                    <span className="text-sm font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-100 flex items-center gap-1">
                      <Ticket className="w-4 h-4" />
                      {minPrice === maxPrice 
                        ? `฿${minPrice.toLocaleString()}` 
                        : `฿${minPrice.toLocaleString()} - ${maxPrice.toLocaleString()}`
                      }
                    </span>
                  )}
                </div>
              </div>
              
              <h1 className="text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">{destination.name}</h1>
              
              <div className="flex items-center gap-2 mb-6">
                <div className="flex text-amber-400">
                  <Star className="w-5 h-5 fill-current" />
                  <Star className="w-5 h-5 fill-current" />
                  <Star className="w-5 h-5 fill-current" />
                  <Star className="w-5 h-5 fill-current" />
                  <Star className="w-5 h-5 text-slate-300" />
                </div>
                <span className="text-slate-500 font-medium">
                  ({destination.reviews?.length || 0} รีวิว)
                </span>
              </div>

              <p className="text-slate-600 text-lg leading-relaxed mb-8 flex-grow">
                {destination.description || "ยังไม่มีคำอธิบายสำหรับสถานที่นี้"}
              </p>

              <hr className="border-slate-100 mb-8" />

              <div className="space-y-5 text-slate-700 bg-slate-50 p-6 rounded-2xl border border-slate-100">
                <h3 className="font-bold text-lg text-slate-900 mb-2">ข้อมูลสถานที่และการติดต่อ</h3>
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-white rounded-lg shadow-sm text-sky-600 shrink-0"><MapPin className="w-5 h-5" /></div>
                  <p className="mt-1 leading-relaxed">{destination.location || "ไม่ได้ระบุที่อยู่"}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-white rounded-lg shadow-sm text-sky-600 shrink-0"><Clock className="w-5 h-5" /></div>
                  <p className="font-medium">{destination.hours || "ไม่ได้ระบุเวลาเปิด-ปิด"}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-white rounded-lg shadow-sm text-sky-600 shrink-0"><Phone className="w-5 h-5" /></div>
                  <p className="font-medium">{destination.phone || "ไม่มีเบอร์ติดต่อ"}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ส่วนแสดงรีวิว */}
        <section className="mt-12 bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-3 mb-8">
            <MessageSquare className="w-8 h-8 text-sky-600" />
            <h2 className="text-2xl font-bold text-slate-900">รีวิวจากนักท่องเที่ยว</h2>
          </div>
          
          {destination.reviews && destination.reviews.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-6">
              {destination.reviews.map((review) => (
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
              <p className="text-slate-400 mb-2 text-4xl">📸</p>
              <h3 className="text-lg font-bold text-slate-700 mb-1">ยังไม่มีรีวิว</h3>
              <p className="text-slate-500">เคยไปที่นี่ไหม? มาเป็นคนแรกที่รีวิวสถานที่นี้สิ!</p>
            </div>
          )}
        </section>

      </main>
    </div>
  );
}