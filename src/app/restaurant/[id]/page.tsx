"use client";
import { useState, useEffect, useCallback } from "react";
import { MapPin, Phone, Clock, Star, ArrowLeft, MessageSquare, Trash2, Send } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import { useAuth } from "@clerk/nextjs";

interface Review {
  id: number | string;
  created_by: string;
  rating: number;
  comment: string;
  created_at: string;
}

interface RestaurantDetailData {
  id: string;
  name: string;
  category: string;
  description: string;
  location: string;
  phone?: string; 
  hours?: string; 
  images?: string[]; 
  image_url?: string;
}

export default function RestaurantDetail() {
  const params = useParams();
  const rawId = params.id;
  const id = Array.isArray(rawId) ? rawId[0] : rawId;
  const cleanId = id?.toString().trim();

  const { userId } = useAuth();

  const [restaurant, setRestaurant] = useState<RestaurantDetailData | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [mainImage, setMainImage] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [ratingInput, setRatingInput] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [commentInput, setCommentInput] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ================= 1. ดึงข้อมูลร้านอาหาร =================
  useEffect(() => {
    const fetchRestaurantDetail = async () => {
      if (!cleanId) return;
      
      try {
        setLoading(true);
        setError(null);
        
        const res = await fetch(`/api/restaurants/${cleanId}`);
        
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || "ไม่พบข้อมูลร้านอาหาร หรือเกิดข้อผิดพลาด");
        }
        
        const data: RestaurantDetailData = await res.json();
        setRestaurant(data);
        
        // เช็คการแสดงผลรูปภาพ
        if (data.images && data.images.length > 0) {
          setMainImage(data.images[0]);
        } else if (data.image_url) {
          setMainImage(data.image_url);
        } else {
          setMainImage("https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800"); 
        }
      } catch (err: unknown) {
        console.error("🐛 [Catch Block] เกิด Error ขึ้นระหว่างกระบวนการ:", err);
        setError(err instanceof Error ? err.message : "ไม่สามารถโหลดข้อมูลร้านอาหารได้ในขณะนี้");
      } finally {
        setLoading(false);
      }
    };

    fetchRestaurantDetail();
  }, [cleanId]);

  // ================= 2. ดึงข้อมูลรีวิว (จัดการเพื่อแก้ set-state-in-effect) =================
  const fetchReviews = useCallback(async () => {
    if (!cleanId) return null;
    try {
      const res = await fetch(`/api/reviews?restaurant_id=${cleanId}`);
      if (!res.ok) {
        const errData = await res.json();
        console.error("❌ โหลดรีวิวไม่สำเร็จ:", errData);
        return null;
      }
      const data = await res.json();
      return data;
    } catch (error) {
      console.error("Failed to fetch reviews:", error);
      return null;
    }
  }, [cleanId]);

  useEffect(() => {
    const loadReviews = async () => {
      const data = await fetchReviews();
      if (data) setReviews(data);
    };
    loadReviews();
  }, [fetchReviews]);

  // ================= 3. ฟังก์ชันเพิ่มรีวิว =================
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return alert("กรุณาเข้าสู่ระบบก่อนทำการรีวิว");
    if (ratingInput === 0) return alert("กรุณาให้คะแนนดาว");
    if (!commentInput.trim()) return alert("กรุณากรอกความคิดเห็น");

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurant_id: cleanId,
          rating: ratingInput,
          comment: commentInput,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "ไม่สามารถส่งรีวิวได้");
      }
      
      setRatingInput(0);
      setCommentInput("");
      
      const newData = await fetchReviews();
      if (newData) setReviews(newData);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการส่งรีวิว");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ================= 4. ฟังก์ชันลบรีวิว =================
  const handleDeleteReview = async (reviewId: number | string) => {
    if (!confirm("คุณแน่ใจหรือไม่ว่าต้องการลบรีวิวนี้?")) return;
    
    try {
      const res = await fetch(`/api/reviews?id=${reviewId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("ลบรีวิวไม่สำเร็จ");
      
      setReviews(reviews.filter((r) => r.id !== reviewId));
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการลบรีวิว");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-slate-200 border-t-sky-600 rounded-full animate-spin mb-4"></div>
        <p className="text-slate-500 font-medium animate-pulse">กำลังโหลดข้อมูลร้านอาหาร...</p>
      </div>
    );
  }

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

  const avgRating = reviews.length > 0 
    ? (reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length).toFixed(1) 
    : 0;

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
          
          {/* ================= ส่วนแสดงรูปภาพ ================= */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            <div className="relative w-full aspect-4/3 rounded-2xl overflow-hidden bg-slate-200 border border-slate-200 shadow-sm">
              {mainImage && (
                <Image 
                  src={mainImage} 
                  alt={restaurant.name} 
                  fill
                  unoptimized
                  className="object-cover transition-opacity duration-300"
                />
              )}
            </div>
            
            {restaurant.images && restaurant.images.length > 1 && (
              <div className="grid grid-cols-5 gap-3">
                {restaurant.images.slice(0, 5).map((img, index) => (
                  <button 
                    key={index} 
                    type="button"
                    onClick={() => setMainImage(img)}
                    className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                      mainImage === img 
                        ? "border-sky-500 opacity-100 shadow-md ring-2 ring-sky-500 ring-offset-1" 
                        : "border-transparent opacity-60 hover:opacity-100 bg-slate-100"
                    }`}
                  >
                    <Image 
                      src={img} 
                      alt={`Thumbnail ${index + 1}`} 
                      fill
                      unoptimized
                      className="object-cover" 
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ================= ส่วนแสดงรายละเอียด ================= */}
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
                  <span className="ml-1 text-slate-700 font-bold">{avgRating}</span>
                </div>
                <span className="text-slate-500 font-medium">
                  ({reviews.length} รีวิว)
                </span>
              </div>

              <p className="text-slate-600 text-lg leading-relaxed mb-8 grow">
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

        {/* ================= ส่วนแสดงรีวิว & ฟอร์ม ================= */}
        <section className="mt-12 bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-3 mb-8">
            <MessageSquare className="w-8 h-8 text-sky-600" />
            <h2 className="text-2xl font-bold text-slate-900">รีวิวจากลูกค้า</h2>
          </div>

          <div className="mb-10 bg-slate-50 p-6 rounded-2xl border border-slate-200">
            {userId ? (
              <form onSubmit={handleSubmitReview}>
                <h3 className="font-bold text-slate-800 mb-4">เขียนรีวิวร้านอาหารนี้</h3>
                
                <div className="flex items-center gap-1 mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRatingInput(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="focus:outline-none transition-transform hover:scale-110"
                    >
                      <Star 
                        className={`w-8 h-8 ${(hoverRating || ratingInput) >= star ? "fill-amber-400 text-amber-400" : "text-slate-300"}`} 
                      />
                    </button>
                  ))}
                  <span className="ml-3 text-sm text-slate-500">{ratingInput > 0 ? `${ratingInput} ดาว` : "เลือกคะแนน"}</span>
                </div>

                <textarea
                  value={commentInput}
                  onChange={(e) => setCommentInput(e.target.value)}
                  placeholder="แบ่งปันความอร่อยและความประทับใจของคุณที่นี่..."
                  className="w-full p-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none resize-none mb-4"
                  rows={3}
                  required
                ></textarea>
                
                <div className="flex justify-end">
                  <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="flex items-center gap-2 px-6 py-3 bg-sky-600 text-white font-medium rounded-xl hover:bg-sky-700 transition disabled:bg-slate-400"
                  >
                    {isSubmitting ? "กำลังส่ง..." : "ส่งรีวิว"} <Send className="w-4 h-4" />
                  </button>
                </div>
              </form>
            ) : (
              <div className="text-center py-6">
                <p className="text-slate-600 mb-4">กรุณาเข้าสู่ระบบเพื่อเขียนรีวิวร้านอาหารนี้</p>
              </div>
            )}
          </div>
          
          {reviews.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-6">
              {reviews.map((review) => (
                <div key={review.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition group">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-sky-100 text-sky-700 rounded-full flex items-center justify-center font-bold">
                        {review.created_by?.substring(0, 2).toUpperCase() || "U"}
                      </div>
                      <div>
                        <div className="flex text-amber-400">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className={`w-4 h-4 ${i < review.rating ? "fill-current" : "text-slate-200"}`} />
                          ))}
                        </div>
                        <span className="text-xs text-slate-400">{new Date(review.created_at).toLocaleDateString("th-TH")}</span>
                      </div>
                    </div>

                    {userId === review.created_by && (
                      <button 
                        type="button"
                        onClick={() => handleDeleteReview(review.id)}
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition opacity-0 group-hover:opacity-100"
                        title="ลบรีวิวของคุณ"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <p className="text-slate-700 leading-relaxed">{review.comment}</p>
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