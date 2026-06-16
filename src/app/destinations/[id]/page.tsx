"use client";
import { useState, useEffect, useCallback } from "react";
import {
  MapPin, Phone, Clock, Star, ArrowLeft,
  MessageSquare, Ticket, Trash2, Send, ChevronLeft, ChevronRight
} from "lucide-react";
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
  image_url?: string;
  images?: string[];
}

// ─── Avatar color palette ────────────────────────────────────────────────────
const AVATAR_COLORS = [
  { bg: "bg-sky-100", text: "text-sky-700" },
  { bg: "bg-emerald-100", text: "text-emerald-700" },
  { bg: "bg-violet-100", text: "text-violet-700" },
  { bg: "bg-amber-100", text: "text-amber-700" },
  { bg: "bg-rose-100", text: "text-rose-700" },
];

function getAvatarColor(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

// ─── Star display component ──────────────────────────────────────────────────
function StarRow({ rating, size = "w-4 h-4" }: { rating: number; size?: string }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`${size} ${s <= rating ? "fill-amber-400 text-amber-400" : "text-slate-200"}`}
        />
      ))}
    </div>
  );
}

// ─── Rating summary bar ──────────────────────────────────────────────────────
function RatingSummary({ reviews }: { reviews: Review[] }) {
  if (reviews.length === 0) return null;
  const avg = reviews.reduce((a, r) => a + r.rating, 0) / reviews.length;
  const counts = [5, 4, 3, 2, 1].map((s) => ({
    star: s,
    count: reviews.filter((r) => r.rating === s).length,
  }));
  return (
    <div className="flex flex-col sm:flex-row items-center gap-6 bg-linear-to-br from-sky-50 to-slate-50 p-6 rounded-2xl border border-slate-100 mb-8">
      <div className="text-center shrink-0">
        <p className="text-6xl font-extrabold text-slate-900 leading-none">{avg.toFixed(1)}</p>
        <StarRow rating={Math.round(avg)} size="w-5 h-5" />
        <p className="text-sm text-slate-500 mt-1">{reviews.length} รีวิว</p>
      </div>
      <div className="flex-1 w-full space-y-1.5">
        {counts.map(({ star, count }) => (
          <div key={star} className="flex items-center gap-2 text-xs">
            <span className="text-slate-500 w-4 shrink-0">{star}</span>
            <Star className="w-3 h-3 fill-amber-400 text-amber-400 shrink-0" />
            <div className="flex-1 bg-slate-200 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-amber-400 h-1.5 rounded-full transition-all duration-500"
                style={{ width: reviews.length > 0 ? `${(count / reviews.length) * 100}%` : "0%" }}
              />
            </div>
            <span className="text-slate-400 w-4 text-right shrink-0">{count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DestinationDetail() {
  const params = useParams();
  const rawId = params.id;
  const id = Array.isArray(rawId) ? rawId[0] : rawId;
  const cleanId = id?.toString().trim();
  const { userId } = useAuth();

  const [destination, setDestination] = useState<DestinationDetailData | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [mainImage, setMainImage] = useState<string>("");
  const [activeThumb, setActiveThumb] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [ratingInput, setRatingInput] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [commentInput, setCommentInput] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetch_ = async () => {
      if (!cleanId) return;
      try {
        setLoading(true);
        const res = await fetch(`/api/destinations/${cleanId}`);
        if (!res.ok) throw new Error("ไม่พบข้อมูลสถานที่ หรือเกิดข้อผิดพลาด");
        const data: DestinationDetailData = await res.json();
        setDestination(data);
        const first =
          data.images && data.images.length > 0
            ? data.images[0]
            : data.image_url || "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800";
        setMainImage(first);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ");
      } finally {
        setLoading(false);
      }
    };
    fetch_();
  }, [cleanId]);

  const fetchReviews = useCallback(async () => {
    if (!cleanId) return null;
    try {
      const res = await fetch(`/api/reviews?destination_id=${cleanId}`);
      if (!res.ok) throw new Error("Failed to fetch");
      return await res.json();
    } catch {
      return null;
    }
  }, [cleanId]);

  useEffect(() => {
    fetchReviews().then((d) => d && setReviews(d));
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
        body: JSON.stringify({ destination_id: cleanId, rating: ratingInput, comment: commentInput }),
      });
      if (!res.ok) throw new Error("ไม่สามารถส่งรีวิวได้");
      setRatingInput(0);
      setCommentInput("");
      const d = await fetchReviews();
      if (d) setReviews(d);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการส่งรีวิว");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteReview = async (reviewId: number | string) => {
    if (!confirm("คุณแน่ใจหรือไม่ว่าต้องการลบรีวิวนี้?")) return;
    try {
      const res = await fetch(`/api/reviews?id=${reviewId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("ลบรีวิวไม่สำเร็จ");
      setReviews((prev) => prev.filter((r) => r.id !== reviewId));
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการลบรีวิว");
    }
  };

  const allImages = destination?.images?.length
    ? destination.images
    : destination?.image_url
      ? [destination.image_url]
      : ["https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800"];

  const changeImage = (idx: number) => {
    setActiveThumb(idx);
    setMainImage(allImages[idx]);
  };
  const prevImage = () => changeImage((activeThumb - 1 + allImages.length) % allImages.length);
  const nextImage = () => changeImage((activeThumb + 1) % allImages.length);

  // ── Loading ─────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 border-4 border-slate-200 border-t-sky-500 rounded-full animate-spin" />
        <p className="text-slate-400 text-sm animate-pulse">กำลังโหลดข้อมูล...</p>
      </div>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────────
  if (error || !destination) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4">
        <div className="bg-white p-10 rounded-3xl shadow-sm border border-slate-100 text-center max-w-sm w-full">
          <p className="text-5xl mb-4">🥲</p>
          <h2 className="text-xl font-bold text-slate-800 mb-2">เกิดข้อผิดพลาด</h2>
          <p className="text-slate-500 text-sm mb-8">{error}</p>
          <Link href="/dashboard" className="flex items-center justify-center gap-2 px-6 py-3 bg-sky-600 text-white font-medium rounded-xl hover:bg-sky-700 transition-colors text-sm">
            กลับหน้าหลัก
          </Link>
        </div>
      </div>
    );
  }

  const minPrice = destination.min_price || 0;
  const maxPrice = destination.max_price || 0;
  const avgRating =
    reviews.length > 0
      ? (reviews.reduce((a, r) => a + r.rating, 0) / reviews.length).toFixed(1)
      : null;

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* ── Navbar ─────────────────────────────────────────────────────────── */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-slate-500 hover:text-sky-600 transition-colors text-sm font-medium group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            กลับไปหน้ารวมสถานที่
          </Link>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* ── LEFT: Images ──────────────────────────────────────────────── */}
          <div className="lg:col-span-7 flex flex-col gap-3">
            {/* Main image */}
            <div className="relative w-full aspect-4/3 rounded-2xl overflow-hidden bg-slate-200 group">
              {mainImage && (
                <Image
                  src={mainImage}
                  alt={destination.name}
                  fill
                  unoptimized
                  className="object-cover transition-all duration-500"
                  priority
                />
              )}
              {/* Nav arrows */}
              {allImages.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={prevImage}
                    className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-slate-700 rounded-full p-2 shadow opacity-0 group-hover:opacity-100 transition-all backdrop-blur-sm"
                    aria-label="รูปก่อนหน้า"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={nextImage}
                    className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-slate-700 rounded-full p-2 shadow opacity-0 group-hover:opacity-100 transition-all backdrop-blur-sm"
                    aria-label="รูปถัดไป"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                  {/* Counter badge */}
                  <div className="absolute bottom-3 right-3 bg-black/50 text-white text-xs px-2.5 py-1 rounded-full backdrop-blur-sm">
                    {activeThumb + 1} / {allImages.length}
                  </div>
                </>
              )}
            </div>

            {/* Thumbnails */}
            {allImages.length > 1 && (
              <div className="grid grid-cols-5 gap-2">
                {allImages.slice(0, 5).map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => changeImage(idx)}
                    className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all ${activeThumb === idx
                        ? "border-sky-500 ring-2 ring-sky-500/30"
                        : "border-transparent opacity-60 hover:opacity-90 hover:border-slate-300"
                      }`}
                    aria-label={`รูปที่ ${idx + 1}`}
                  >
                    <Image src={img} alt="" fill unoptimized className="object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Description below image on large screens */}
            {destination.description && (
              <div className="hidden lg:block bg-white rounded-2xl border border-slate-200 p-6">
                <h2 className="font-bold text-slate-900 mb-3">เกี่ยวกับสถานที่</h2>
                <p className="text-slate-600 leading-relaxed text-[15px]">{destination.description}</p>
              </div>
            )}
          </div>

          {/* ── RIGHT: Info card ──────────────────────────────────────────── */}
          <div className="lg:col-span-5">
            <div className="bg-white rounded-3xl border border-slate-200 p-7 lg:sticky lg:top-20">
              {/* Category + Price badges */}
              <div className="flex items-center justify-between mb-5">
                <span className="px-3 py-1 bg-sky-50 text-sky-700 text-xs font-bold rounded-lg tracking-wide">
                  {destination.category || "ท่องเที่ยวทั่วไป"}
                </span>
                {maxPrice === 0 ? (
                  <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-full">
                    <Ticket className="w-3.5 h-3.5" /> เข้าชมฟรี
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-full">
                    <Ticket className="w-3.5 h-3.5 text-slate-500" />
                    {minPrice === maxPrice
                      ? `฿${minPrice.toLocaleString()}`
                      : `฿${minPrice.toLocaleString()} – ${maxPrice.toLocaleString()}`}
                  </span>
                )}
              </div>

              {/* Name */}
              <h1 className="text-3xl font-extrabold text-slate-900 leading-tight tracking-tight mb-3">
                {destination.name}
              </h1>

              {/* Rating row */}
              <div className="flex items-center gap-2 mb-6">
                {avgRating ? (
                  <>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                      <span className="font-bold text-slate-800 text-sm">{avgRating}</span>
                    </div>
                    <span className="text-slate-300">·</span>
                    <span className="text-sm text-slate-500">{reviews.length} รีวิว</span>
                  </>
                ) : (
                  <span className="text-sm text-slate-400">ยังไม่มีรีวิว</span>
                )}
              </div>

              {/* Description (mobile / inside card) */}
              {destination.description && (
                <p className="lg:hidden text-slate-600 text-[15px] leading-relaxed mb-6 border-b border-slate-100 pb-6">
                  {destination.description}
                </p>
              )}

              {/* Info rows */}
              <div className="space-y-4 mb-7">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">ข้อมูลสถานที่</h3>
                <div className="flex items-start gap-3 text-sm text-slate-600">
                  <div className="mt-0.5 p-2 bg-sky-50 rounded-lg shrink-0">
                    <MapPin className="w-4 h-4 text-sky-600" />
                  </div>
                  <span className="leading-relaxed pt-1.5">{destination.location || "ไม่ได้ระบุที่อยู่"}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-600">
                  <div className="p-2 bg-sky-50 rounded-lg shrink-0">
                    <Clock className="w-4 h-4 text-sky-600" />
                  </div>
                  <span>{destination.hours || "ไม่ได้ระบุเวลาเปิด-ปิด"}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-600">
                  <div className="p-2 bg-sky-50 rounded-lg shrink-0">
                    <Phone className="w-4 h-4 text-sky-600" />
                  </div>
                  <span>{destination.phone || "ไม่มีเบอร์ติดต่อ"}</span>
                </div>
              </div>

              {/* CTA */}
              <a
                href={`https://maps.google.com/?q=${encodeURIComponent(destination.location || destination.name)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3.5 bg-sky-600 hover:bg-sky-700 active:bg-sky-800 text-white font-semibold rounded-xl transition-all text-sm shadow-sm shadow-sky-200"
              >
                <MapPin className="w-4 h-4" />
                ดูแผนที่ Google Maps
              </a>
            </div>
          </div>
        </div>

        {/* ── Reviews section ─────────────────────────────────────────────── */}
        <section className="mt-12 bg-white rounded-3xl border border-slate-200 p-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2.5 bg-sky-50 rounded-xl">
              <MessageSquare className="w-5 h-5 text-sky-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">รีวิวจากนักท่องเที่ยว</h2>
            {reviews.length > 0 && (
              <span className="ml-auto text-sm text-slate-400">{reviews.length} รีวิวทั้งหมด</span>
            )}
          </div>

          {/* Rating summary */}
          <RatingSummary reviews={reviews} />

          {/* Write review */}
          <div className="mb-10 bg-slate-50 rounded-2xl border border-slate-200 p-6">
            {userId ? (
              <form onSubmit={handleSubmitReview}>
                <h3 className="font-semibold text-slate-800 mb-4 text-[15px]">แบ่งปันประสบการณ์ของคุณ</h3>
                {/* Star picker */}
                <div className="flex items-center gap-1 mb-4">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setRatingInput(s)}
                      onMouseEnter={() => setHoverRating(s)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="transition-transform hover:scale-110 focus:outline-none"
                      aria-label={`${s} ดาว`}
                    >
                      <Star
                        className={`w-8 h-8 transition-colors ${(hoverRating || ratingInput) >= s
                            ? "fill-amber-400 text-amber-400"
                            : "text-slate-300"
                          }`}
                      />
                    </button>
                  ))}
                  {ratingInput > 0 && (
                    <span className="ml-2 text-sm text-slate-500">
                      {["", "แย่มาก", "พอใช้", "ปานกลาง", "ดี", "ยอดเยี่ยม!"][ratingInput]}
                    </span>
                  )}
                </div>
                <textarea
                  value={commentInput}
                  onChange={(e) => setCommentInput(e.target.value)}
                  placeholder="เล่าให้ฟังว่าที่นี่เป็นยังไง..."
                  className="w-full p-4 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-sky-400/50 focus:border-sky-400 outline-none resize-none text-sm text-slate-700 placeholder:text-slate-400 transition-all mb-4"
                  rows={3}
                  required
                />
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex items-center gap-2 px-5 py-2.5 bg-sky-600 text-white text-sm font-semibold rounded-xl hover:bg-sky-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        กำลังส่ง...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        ส่งรีวิว
                      </>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              <div className="text-center py-8">
                <div className="w-12 h-12 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-3">
                  <MessageSquare className="w-5 h-5 text-slate-400" />
                </div>
                <p className="text-slate-600 text-sm font-medium mb-1">อยากรีวิวสถานที่นี้ใช่ไหม?</p>
                <p className="text-slate-400 text-xs mb-5">เข้าสู่ระบบเพื่อแบ่งปันประสบการณ์ของคุณ</p>
                <Link
                  href="/sign-in"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-sky-600 text-white text-sm font-semibold rounded-xl hover:bg-sky-700 transition-all"
                >
                  เข้าสู่ระบบ
                </Link>
              </div>
            )}
          </div>

          {/* Review cards */}
          {reviews.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-4">
              {reviews.map((review) => {
                const avatar = getAvatarColor(review.created_by || "U");
                const initials = (review.created_by || "U").substring(0, 2).toUpperCase();
                return (
                  <div
                    key={review.id}
                    className="bg-white border border-slate-100 rounded-2xl p-5 hover:border-slate-200 hover:shadow-sm transition-all group"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 ${avatar.bg} ${avatar.text} rounded-full flex items-center justify-center text-sm font-bold shrink-0`}
                        >
                          {initials}
                        </div>
                        <div>
                          <StarRow rating={review.rating} />
                          <p className="text-xs text-slate-400 mt-0.5">
                            {new Date(review.created_at).toLocaleDateString("th-TH", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </p>
                        </div>
                      </div>
                      {userId === review.created_by && (
                        <button
                          type="button"
                          onClick={() => handleDeleteReview(review.id)}
                          className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                          aria-label="ลบรีวิว"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <p className="text-slate-600 text-sm leading-relaxed">{review.comment}</p>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16 px-4 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50">
              <p className="text-4xl mb-3">📸</p>
              <h3 className="text-base font-bold text-slate-700 mb-1">ยังไม่มีรีวิว</h3>
              <p className="text-slate-400 text-sm">มาเป็นคนแรกที่แบ่งปันประสบการณ์สิ!</p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}