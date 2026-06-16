"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect, useState, useCallback } from "react";
import { supabaseClient } from "@/lib/supabaseClient";
import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import { MapPin, Phone, Star, ArrowLeft, MessageSquare, Trash2, Send } from "lucide-react";

interface Review {
  id: number | string;
  created_by: string;
  rating: number;
  comment: string;
  created_at: string;
}

interface AccommodationDetailData {
  id: string | number;
  name: string;
  category?: string;
  description?: string;
  address?: string;
  contact_phone?: string;
  contact_line?: string;
  contact_facebook?: string;
  min_price?: number;
  max_price?: number;
  images?: string[];
}

export default function AccommodationDetail() {
  const params = useParams();
  const rawId = params.id;
  const id = Array.isArray(rawId) ? rawId[0] : rawId;
  const cleanId = id?.toString().trim();

  const { userId } = useAuth();

  const [accommodation, setAccommodation] = useState<AccommodationDetailData | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [mainImageIndex, setMainImageIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [ratingInput, setRatingInput] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [commentInput, setCommentInput] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!cleanId) return;

    const fetchAccommodationDetail = async () => {
      try {
        setLoading(true);
        const { data, error: supaError } = await supabaseClient
          .from("accommodations")
          .select("*")
          .eq("id", cleanId)
          .single();

        if (supaError) throw new Error("ไม่พบข้อมูลที่พัก หรือเกิดข้อผิดพลาด");
        setAccommodation(data);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ");
      } finally {
        setLoading(false);
      }
    };
    fetchAccommodationDetail();
  }, [cleanId]);

  const fetchReviews = useCallback(async () => {
    if (!cleanId) return null;
    try {
      const { data, error: supaError } = await supabaseClient
        .from("reviews")
        .select("*")
        .eq("accommodation_id", cleanId)
        .order("created_at", { ascending: false });

      if (supaError) throw supaError;
      return data; // รีเทิร์น data ออกไปแทนการ setState ตรงนี้
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
          accommodation_id: cleanId,
          rating: ratingInput,
          comment: commentInput,
          created_by: userId,
        }),
      });
      if (!res.ok) throw new Error("ไม่สามารถส่งรีวิวได้");
      setRatingInput(0);
      setCommentInput("");
      const newData = await fetchReviews();
      if (newData) setReviews(newData);
      await fetchReviews();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteReview = async (reviewId: number | string) => {
    if (!confirm("คุณแน่ใจหรือไม่ว่าต้องการลบรีวิวนี้?")) return;
    try {
      const res = await fetch(`/api/reviews?id=${reviewId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("ลบรีวิวไม่สำเร็จ");
      setReviews(reviews.filter((r) => r.id !== reviewId));
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
        <p className="text-slate-500 font-medium animate-pulse">กำลังโหลดข้อมูลที่พัก...</p>
      </div>
    );
  }

  if (error || !accommodation) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4">
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 text-center max-w-md w-full">
          <p className="text-6xl mb-4">🥲</p>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">เกิดข้อผิดพลาด</h2>
          <p className="text-slate-500 mb-8">{error}</p>
          <Link href="/accommodations" className="inline-flex items-center justify-center w-full px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors shadow-sm">
            กลับไปหน้าที่พัก
          </Link>
        </div>
      </div>
    );
  }

  const images = accommodation.images && accommodation.images.length > 0 ? accommodation.images : [];
  const mainImage = images.length > 0 ? images[mainImageIndex] : null;
  const avgRating =
    reviews.length > 0
      ? (reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length).toFixed(1)
      : 0;

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/accommodations" className="inline-flex items-center gap-2 text-slate-600 hover:text-blue-600 transition font-medium">
            <ArrowLeft className="w-5 h-5" />
            <span>กลับไปหน้าที่พัก</span>
          </Link>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* รูปภาพ */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            <div className="relative w-full aspect-4/3 rounded-2xl overflow-hidden bg-slate-200 border border-slate-200 shadow-sm">
              {mainImage ? (
                <Image
                  src={mainImage}
                  alt={accommodation.name}
                  fill
                  unoptimized
                  className="object-cover transition-opacity duration-300"
                />
              ) : (
                <div className="w-full h-full bg-linear-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                  <svg className="w-20 h-20 text-white opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                </div>
              )}
            </div>

            {images.length > 1 && (
              <div className="grid grid-cols-5 gap-3">
                {images.slice(0, 5).map((img, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setMainImageIndex(index)}
                    className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all ${mainImageIndex === index
                        ? "border-blue-500 opacity-100 shadow-md ring-2 ring-blue-500 ring-offset-1"
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

          {/* รายละเอียด */}
          <div className="lg:col-span-5 flex flex-col">
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 h-full flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 text-sm font-bold rounded-lg">
                  {accommodation.category}
                </span>
                <div>
                  {(accommodation.max_price ?? 0) === 0 ? (
                    <span className="text-sm font-bold text-green-600 bg-green-100 px-3 py-1 rounded-full">
                      ติดต่อสอบถาม
                    </span>
                  ) : (
                    <span className="text-sm font-bold text-blue-700 bg-blue-50 px-3 py-1 rounded-lg border border-blue-100">
                      {accommodation.min_price === accommodation.max_price
                        ? `฿${accommodation.max_price?.toLocaleString()}`
                        : `฿${accommodation.min_price?.toLocaleString()} - ${accommodation.max_price?.toLocaleString()}`}
                      <span className="font-normal text-blue-500"> /เดือน</span>
                    </span>
                  )}
                </div>
              </div>

              <h1 className="text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">{accommodation.name}</h1>

              <div className="flex items-center gap-2 mb-6">
                <div className="flex text-amber-400">
                  <Star className="w-5 h-5 fill-current" />
                  <span className="ml-1 text-slate-700 font-bold">{avgRating}</span>
                </div>
                <span className="text-slate-500 font-medium">({reviews.length} รีวิว)</span>
              </div>

              <p className="text-slate-600 text-lg leading-relaxed mb-8 grow whitespace-pre-line">
                {accommodation.description || "ยังไม่มีคำอธิบายสำหรับที่พักนี้"}
              </p>

              <hr className="border-slate-100 mb-8" />

              <div className="space-y-5 text-slate-700 bg-slate-50 p-6 rounded-2xl border border-slate-100">
                <h3 className="font-bold text-lg text-slate-900 mb-2">ข้อมูลและการติดต่อ</h3>

                {accommodation.address && (
                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-white rounded-lg shadow-sm text-blue-600 shrink-0"><MapPin className="w-5 h-5" /></div>
                    <p className="mt-1 leading-relaxed">{accommodation.address}</p>
                  </div>
                )}

                {accommodation.contact_phone && (
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-white rounded-lg shadow-sm text-blue-600 shrink-0"><Phone className="w-5 h-5" /></div>
                    <a href={`tel:${accommodation.contact_phone}`} className="font-medium text-blue-600 hover:underline">
                      {accommodation.contact_phone}
                    </a>
                  </div>
                )}

                {accommodation.contact_line && (
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-white rounded-lg shadow-sm text-[#00B900] shrink-0">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
                      </svg>
                    </div>
                    <a href={`https://line.me/ti/p/${accommodation.contact_line}`} target="_blank" rel="noopener noreferrer" className="font-medium text-[#00B900] hover:underline">
                      @{accommodation.contact_line}
                    </a>
                  </div>
                )}

                {accommodation.contact_facebook && (
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-white rounded-lg shadow-sm text-[#1877F2] shrink-0">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                      </svg>
                    </div>
                    <a href={accommodation.contact_facebook} target="_blank" rel="noopener noreferrer" className="font-medium text-[#1877F2] hover:underline">
                      เข้าชมเพจ Facebook
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ================= ส่วนรีวิว ================= */}
        <section className="mt-12 bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-3 mb-8">
            <MessageSquare className="w-8 h-8 text-blue-600" />
            <h2 className="text-2xl font-bold text-slate-900">รีวิวจากผู้เข้าพัก</h2>
          </div>

          <div className="mb-10 bg-slate-50 p-6 rounded-2xl border border-slate-200">
            {userId ? (
              <form onSubmit={handleSubmitReview}>
                <h3 className="font-bold text-slate-800 mb-4">เขียนรีวิวของคุณ</h3>
                <div className="flex items-center gap-1 mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button key={star} type="button" onClick={() => setRatingInput(star)} onMouseEnter={() => setHoverRating(star)} onMouseLeave={() => setHoverRating(0)} className="focus:outline-none transition-transform hover:scale-110">
                      <Star className={`w-8 h-8 ${(hoverRating || ratingInput) >= star ? "fill-amber-400 text-amber-400" : "text-slate-300"}`} />
                    </button>
                  ))}
                  <span className="ml-3 text-sm text-slate-500">{ratingInput > 0 ? `${ratingInput} ดาว` : "เลือกคะแนน"}</span>
                </div>
                <textarea value={commentInput} onChange={(e) => setCommentInput(e.target.value)} placeholder="แบ่งปันประสบการณ์การพักของคุณที่นี่..." className="w-full p-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none mb-4" rows={3} required></textarea>
                <div className="flex justify-end">
                  <button type="submit" disabled={isSubmitting} className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition disabled:bg-slate-400">
                    {isSubmitting ? "กำลังส่ง..." : "ส่งรีวิว"} <Send className="w-4 h-4" />
                  </button>
                </div>
              </form>
            ) : (
              <div className="text-center py-6">
                <p className="text-slate-600 mb-4">กรุณาเข้าสู่ระบบเพื่อเขียนรีวิวที่พักนี้</p>
              </div>
            )}
          </div>

          {reviews.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-6">
              {reviews.map((review) => (
                <div key={review.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition group">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold">
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
              <p className="text-slate-400 mb-2 text-4xl">📸</p>
              <h3 className="text-lg font-bold text-slate-700 mb-1">ยังไม่มีรีวิว</h3>
              <p className="text-slate-500">มาเป็นคนแรกที่รีวิวประสบการณ์ดีๆ ของที่พักนี้สิ!</p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}