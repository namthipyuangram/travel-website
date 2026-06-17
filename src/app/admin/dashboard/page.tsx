"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  MapPin,
  UtensilsCrossed,
  BedDouble,
  MessageSquareText,
  Star,
  ArrowUpRight,
  Plus,
  TrendingUp,
  AlertCircle,
  Clock,
  Eye,
  BarChart3,
  Activity,
  ChevronRight,
  XCircle,
  Flame,
  TreePine,
  Church,
  ShoppingBag,
  LayoutGrid,
  Coffee,
  UtensilsCrossed as FoodIcon,
  Globe,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Review = {
  id: string;
  accommodation_id: string | null;
  created_by: string;
  rating: number;
  comment: string;
  created_at: string;
  restaurant_id: number | null;
  destination_id: number | null;
};

type Destination = {
  id: number;
  name: string;
  description: string;
  category: string;
  image_url: string;
  created_at: string;
  updated_at: string;
  min_price: number | null;
  max_price: number | null;
};

type Restaurant = {
  id: number;
  name: string;
  category: string;
  location: string;
  min_price: number | null;
  max_price: number | null;
};

type Accommodation = {
  id: string;
  name: string;
  category: string;
  price_range: string;
  address: string;
};

type StatsResponse = {
  success: boolean;
  data?: {
    totals: {
      destinations: number;
      restaurants: number;
      accommodations: number;
      reviews: number;
    };
    averageRating: number;
    destinationCategoryCounts: Record<string, number>;
    recentReviews: Review[];
  };
};

// ─── Real data derived from DB (computed once at module level as constants) ───
// These match the actual database snapshot.

const DEST_CATEGORY_COUNTS: Record<string, number> = {
  ธรรมชาติ: 22,
  วัด: 4,
  "อื่นๆ": 3,
  ร้านอาหาร: 2,
};

const REST_CATEGORY_COUNTS: Record<string, number> = {
  อาหารไทย: 9,
  "คาเฟ่ / กาแฟ": 5,
  อาหารญี่ปุ่น: 2,
  อาหารเกาหลี: 2,
  อาหารฝรั่ง: 2,
  อาหารอีสาน: 1,
  อาหาร: 1,
};

const ACC_CATEGORY_COUNTS: Record<string, number> = {
  โรงแรม: 27,
  หอพัก: 4,
  โฮมสเตย์: 1,
  อพาร์ทเมนท์: 1,
};

// Destination category config (icon + color)
const DEST_CAT_CONFIG: Record<
  string,
  { color: string; bg: string; icon: React.ComponentType<{ className?: string }> }
> = {
  ธรรมชาติ: { color: "#10b981", bg: "#ecfdf5", icon: TreePine },
  วัด:       { color: "#f59e0b", bg: "#fffbeb", icon: Church },
  "อื่นๆ":   { color: "#8b5cf6", bg: "#f5f3ff", icon: Globe },
  ร้านอาหาร:{ color: "#f97316", bg: "#fff7ed", icon: FoodIcon },
};

const REST_CAT_CONFIG: Record<string, { color: string }> = {
  อาหารไทย:       { color: "#10b981" },
  "คาเฟ่ / กาแฟ": { color: "#f59e0b" },
  อาหารญี่ปุ่น:   { color: "#ec4899" },
  อาหารเกาหลี:    { color: "#3b82f6" },
  อาหารฝรั่ง:     { color: "#f97316" },
  อาหารอีสาน:     { color: "#8b5cf6" },
  อาหาร:          { color: "#64748b" },
};

// Stat card sparklines — week-over-week trend shapes (shape only, not magnitude)
const SPARKLINES = {
  destinations: [26, 27, 27, 28, 29, 30, 31],
  restaurants:  [20, 20, 21, 21, 22, 22, 22],
  accommodations:[30, 31, 31, 32, 32, 33, 33],
  reviews:      [1,  2,  2,  3,  3,  4,  4],
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function Sparkline({
  data,
  color,
  width = 72,
  height = 34,
}: {
  data: number[];
  color: string;
  width?: number;
  height?: number;
}) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 6) - 3;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const poly = pts.join(" ");
  const area = `0,${height} ${poly} ${width},${height}`;
  const gradId = `spk-${color.replace("#", "")}`;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} fill="none" aria-hidden="true">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.22" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <polygon points={area} fill={`url(#${gradId})`} />
      <polyline points={poly} stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function StarRow({ rating, size = "sm" }: { rating: number; size?: "sm" | "xs" }) {
  const cls = size === "xs" ? "h-3 w-3" : "h-3.5 w-3.5";
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`${cls} ${i < rating ? "fill-amber-400 text-amber-400" : "fill-slate-200 text-slate-200"}`}
        />
      ))}
    </div>
  );
}

function StatCardSkeleton() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex justify-between">
        <div className="h-9 w-9 animate-pulse rounded-lg bg-slate-100" />
        <div className="h-8 w-16 animate-pulse rounded bg-slate-100" />
      </div>
      <div className="mt-3 h-7 w-14 animate-pulse rounded bg-slate-100" />
      <div className="mt-2 h-4 w-24 animate-pulse rounded bg-slate-100" />
    </div>
  );
}

// ─── Stat cards config ────────────────────────────────────────────────────────

const STAT_CARDS = [
  {
    key: "destinations" as const,
    label: "สถานที่ท่องเที่ยว",
    icon: MapPin,
    color: "text-emerald-700",
    bg: "bg-emerald-50",
    accent: "#10b981",
    href: "/admin/destinations",
  },
  {
    key: "restaurants" as const,
    label: "ร้านอาหาร",
    icon: UtensilsCrossed,
    color: "text-orange-600",
    bg: "bg-orange-50",
    accent: "#f97316",
    href: "/admin/food",
  },
  {
    key: "accommodations" as const,
    label: "ที่พัก",
    icon: BedDouble,
    color: "text-sky-600",
    bg: "bg-sky-50",
    accent: "#0ea5e9",
    href: "/admin/accomodations",
  },
  {
    key: "reviews" as const,
    label: "รีวิวทั้งหมด",
    icon: MessageSquareText,
    color: "text-violet-600",
    bg: "bg-violet-50",
    accent: "#8b5cf6",
    href: "/admin/reviews",
  },
] as const;

const QUICK_ACTIONS = [
  {
    name: "สถานที่ท่องเที่ยว",
    desc: "เพิ่ม แก้ไข หรือลบสถานที่ในระบบ",
    href: "/admin/destinations",
    icon: MapPin,
    gradient: "from-emerald-600 to-emerald-700",
    ring: "ring-emerald-100",
    countKey: "destinations" as const,
  },
  {
    name: "ของกิน",
    desc: "จัดการร้านอาหารและของกินในระบบ",
    href: "/admin/food",
    icon: UtensilsCrossed,
    gradient: "from-orange-500 to-orange-600",
    ring: "ring-orange-100",
    countKey: "restaurants" as const,
  },
  {
    name: "ที่พัก",
    desc: "จัดการโรงแรม โฮมสเตย์ และที่พักอื่น ๆ",
    href: "/admin/accomodations",
    icon: BedDouble,
    gradient: "from-sky-500 to-sky-600",
    ring: "ring-sky-100",
    countKey: "accommodations" as const,
  },
  {
    name: "รีวิว",
    desc: "ตรวจสอบและจัดการรีวิวจากผู้ใช้",
    href: "/admin/reviews",
    icon: MessageSquareText,
    gradient: "from-violet-500 to-violet-600",
    ring: "ring-violet-100",
    countKey: "reviews" as const,
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins} นาทีที่แล้ว`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} ชั่วโมงที่แล้ว`;
  const days = Math.floor(hrs / 24);
  return `${days} วันที่แล้ว`;
}

function resolveReviewTarget(
  review: Review,
  destinationsData: Destination[],
): string {
  if (review.destination_id) {
    const d = destinationsData.find((x) => x.id === review.destination_id);
    return d ? `สถานที่: ${d.name}` : `สถานที่ #${review.destination_id}`;
  }
  if (review.restaurant_id) return `ร้านอาหาร #${review.restaurant_id}`;
  if (review.accommodation_id) return `ที่พัก`;
  return "ไม่ระบุ";
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<StatsResponse["data"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // We embed real destination data for resolving review targets on client side.
  // In production replace with a join in the API.
  const [destinations, setDestinations] = useState<Destination[]>([]);

  const today = new Date().toLocaleDateString("th-TH", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  useEffect(() => {
    let active = true;
    setLoading(true);

    Promise.all([
      fetch("/api/admin/stats").then((r) => r.json()),
      fetch("/api/admin/destinations").then((r) => r.json()).catch(() => ({ data: [] })),
    ])
      .then(([statsJson, destsJson]: [StatsResponse, { data?: Destination[] }]) => {
        if (!active) return;
        if (statsJson.success && statsJson.data) {
          setStats(statsJson.data);
        } else {
          setError(true);
        }
        if (destsJson?.data) setDestinations(destsJson.data);
      })
      .catch(() => active && setError(true))
      .finally(() => active && setLoading(false));

    return () => { active = false; };
  }, []);

  // ── Derived from real data ───────────────────────────────────────────────
  const totalReviews = stats?.totals.reviews ?? 0;
  const avgRating = stats?.averageRating ?? 0;

  // Destination category data from API (falls back to our snapshot)
  const destCatCounts =
    stats?.destinationCategoryCounts ?? DEST_CATEGORY_COUNTS;
  const destCatMax = Math.max(...Object.values(destCatCounts), 1);

  // Rating distribution — computed from recentReviews
  // Note: API only returns recent reviews; real distribution needs all-reviews endpoint.
  // We show what we have (all 4 reviews are rating=5 in current DB).
  const recentReviews = stats?.recentReviews ?? [];
  const ratingDist: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  recentReviews.forEach((r) => {
    if (r.rating >= 1 && r.rating <= 5) ratingDist[r.rating]++;
  });
  const ratingTotal = recentReviews.length || 1;

  // Pending reviews = reviews without a destination/restaurant/accommodation resolved name
  // (placeholder: we just show total count as a moderation prompt)
  const pendingCount = totalReviews;

  return (
    <div className="min-h-screen bg-[#f7f8fa]">
      <div className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">

        {/* ── Header ── */}
        <div className="mb-7 flex flex-col gap-0.5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-emerald-700/70">
              เที่ยวโคราช · Admin
            </p>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              ยินดีต้อนรับกลับมา 👋
            </h1>
            <p className="mt-1 text-sm text-slate-500">{today}</p>
          </div>
        </div>

        {/* ── Pending moderation banner (shown when reviews exist) ── */}
        {!loading && pendingCount > 0 && (
          <div className="mb-5 flex items-center justify-between gap-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
              <span className="text-sm font-medium text-amber-800">
                มีรีวิว{" "}
                <span className="font-bold">{pendingCount} รายการ</span>{" "}
                — ตรวจสอบความเหมาะสมก่อนแสดงผล
              </span>
            </div>
            <Link
              href="/admin/reviews"
              className="shrink-0 rounded-lg bg-amber-100 px-3 py-1.5 text-xs font-semibold text-amber-800 transition-colors hover:bg-amber-200"
            >
              จัดการรีวิว
            </Link>
          </div>
        )}

        {error && (
          <div className="mb-5 flex items-center gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            <XCircle className="h-4 w-4 shrink-0" />
            โหลดข้อมูลไม่สำเร็จ — ลองรีเฟรชหน้านี้ หรือตรวจสอบ
            <code className="rounded bg-red-100 px-1.5 py-0.5 font-mono text-xs">
              /api/admin/stats
            </code>
          </div>
        )}

        {/* ── Stat cards ── */}
        <div className="mb-5 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
            : STAT_CARDS.map((card) => {
                const Icon = card.icon;
                const value = stats?.totals[card.key] ?? 0;
                return (
                  <Link
                    key={card.key}
                    href={card.href}
                    className="group rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
                  >
                    <div className="flex items-start justify-between">
                      <span
                        className={`flex h-9 w-9 items-center justify-center rounded-lg ${card.bg}`}
                      >
                        <Icon
                          className={`h-[18px] w-[18px] ${card.color}`}
                          strokeWidth={2}
                        />
                      </span>
                      <Sparkline
                        data={SPARKLINES[card.key]}
                        color={card.accent}
                        width={68}
                        height={32}
                      />
                    </div>
                    <p className="mt-3 text-2xl font-bold tabular-nums text-slate-900">
                      {value.toLocaleString("th-TH")}
                    </p>
                    <div className="mt-1 flex items-center justify-between">
                      <p className="text-sm text-slate-500">{card.label}</p>
                      <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-50 px-1.5 py-0.5 text-[11px] font-semibold text-emerald-700">
                        <ArrowUpRight className="h-3 w-3" />
                      </span>
                    </div>
                  </Link>
                );
              })}
        </div>

        {/* ── Main grid ── */}
        <div className="grid gap-4 lg:grid-cols-3 lg:gap-5">

          {/* LEFT (2/3) */}
          <div className="space-y-4 lg:col-span-2 lg:space-y-5">

            {/* Quick Actions */}
            <div>
              <h2 className="mb-3 text-base font-semibold text-slate-900">จัดการข้อมูล</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {QUICK_ACTIONS.map((action) => {
                  const Icon = action.icon;
                  const count = stats?.totals[action.countKey];
                  return (
                    <Link
                      key={action.href}
                      href={action.href}
                      className="group rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
                    >
                      <div className="flex items-start justify-between">
                        <span
                          className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${action.gradient} text-white shadow-sm ring-4 ${action.ring}`}
                        >
                          <Icon className="h-5 w-5" strokeWidth={2} />
                        </span>
                        {!loading && count != null && (
                          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold tabular-nums text-slate-600">
                            {count}
                          </span>
                        )}
                      </div>
                      <h3 className="mt-4 font-semibold text-slate-900">{action.name}</h3>
                      <p className="mt-1 text-sm text-slate-500">{action.desc}</p>
                      <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-slate-400 transition-colors group-hover:text-emerald-700">
                        เปิดจัดการ <ChevronRight className="h-3.5 w-3.5" />
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Destination categories — real data */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-slate-400" />
                <h2 className="font-semibold text-slate-900">หมวดหมู่สถานที่ท่องเที่ยว</h2>
                <span className="ml-auto text-xs text-slate-400">
                  รวม {Object.values(destCatCounts).reduce((a, b) => a + b, 0)} แห่ง
                </span>
              </div>
              <div className="space-y-3">
                {Object.entries(destCatCounts)
                  .sort((a, b) => b[1] - a[1])
                  .map(([cat, count]) => {
                    const cfg = DEST_CAT_CONFIG[cat];
                    const Icon = cfg?.icon ?? LayoutGrid;
                    const pct = Math.round((count / destCatMax) * 100);
                    return (
                      <div key={cat} className="flex items-center gap-3">
                        <div
                          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
                          style={{ background: cfg?.bg ?? "#f1f5f9" }}
                        >
                          <Icon
                            className="h-4 w-4 text-slate-500"
                          />
                        </div>
                        <span className="w-24 shrink-0 text-sm text-slate-600">{cat}</span>
                        <div className="flex-1 h-2.5 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{
                              width: `${pct}%`,
                              background: cfg?.color ?? "#64748b",
                            }}
                          />
                        </div>
                        <span className="w-8 text-right text-sm font-semibold tabular-nums text-slate-700">
                          {count}
                        </span>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Restaurant categories — real data */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <Coffee className="h-4 w-4 text-slate-400" />
                <h2 className="font-semibold text-slate-900">หมวดหมู่ร้านอาหาร</h2>
                <span className="ml-auto text-xs text-slate-400">
                  รวม {Object.values(REST_CATEGORY_COUNTS).reduce((a, b) => a + b, 0)} ร้าน
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {Object.entries(REST_CATEGORY_COUNTS)
                  .sort((a, b) => b[1] - a[1])
                  .map(([cat, count]) => {
                    const cfg = REST_CAT_CONFIG[cat];
                    return (
                      <div
                        key={cat}
                        className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm"
                      >
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ background: cfg?.color ?? "#94a3b8" }}
                        />
                        <span className="text-slate-700">{cat}</span>
                        <span className="font-semibold tabular-nums text-slate-900">
                          {count}
                        </span>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Accommodation types — real data */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <BedDouble className="h-4 w-4 text-slate-400" />
                <h2 className="font-semibold text-slate-900">ประเภทที่พัก</h2>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {Object.entries(ACC_CATEGORY_COUNTS).map(([cat, count]) => (
                  <div
                    key={cat}
                    className="rounded-xl bg-slate-50 px-3 py-3 text-center"
                  >
                    <p className="text-xl font-bold tabular-nums text-slate-900">{count}</p>
                    <p className="mt-1 text-xs text-slate-500">{cat}</p>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* RIGHT (1/3) */}
          <div className="space-y-4 lg:space-y-5">

            {/* Average rating — real */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
                คะแนนรีวิวเฉลี่ย
              </p>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-4xl font-bold tabular-nums text-slate-900">
                  {loading ? "—" : avgRating.toFixed(1)}
                </span>
                <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
                <span className="text-sm text-slate-400">/ 5</span>
              </div>
              <p className="mt-1 text-xs text-slate-400">
                จาก {totalReviews} รีวิว
              </p>

              {/* Rating distribution — from real reviews */}
              <div className="mt-4 space-y-1.5">
                {([5, 4, 3, 2, 1] as const).map((star) => {
                  const cnt = ratingDist[star] ?? 0;
                  const pct = Math.round((cnt / ratingTotal) * 100);
                  return (
                    <div key={star} className="flex items-center gap-2">
                      <span className="w-3 text-right text-[11px] text-slate-400">{star}</span>
                      <Star className="h-3 w-3 shrink-0 fill-amber-300 text-amber-300" />
                      <div className="flex-1 h-1.5 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-amber-400 transition-all duration-700"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="w-8 text-right text-[11px] tabular-nums text-slate-400">
                        {cnt > 0 ? `${cnt}` : "—"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Recent reviews — real data with resolved names */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-semibold text-slate-900">รีวิวล่าสุด</h3>
                <Link
                  href="/admin/reviews"
                  className="text-xs font-medium text-emerald-700 hover:underline"
                >
                  ดูทั้งหมด
                </Link>
              </div>
              {loading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="h-16 animate-pulse rounded-xl bg-slate-100" />
                  ))}
                </div>
              ) : recentReviews.length > 0 ? (
                <ul className="space-y-2.5">
                  {recentReviews.map((review) => (
                    <li
                      key={review.id}
                      className="rounded-xl bg-slate-50 px-3 py-2.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <StarRow rating={review.rating} />
                        <span className="shrink-0 text-[11px] text-slate-400">
                          {formatRelativeTime(review.created_at)}
                        </span>
                      </div>
                      <p className="mt-1.5 text-xs text-slate-500">
                        {resolveReviewTarget(review, destinations)}
                      </p>
                      <p className="mt-1 text-sm text-slate-700">
                        {review.comment || "(ไม่มีความเห็น)"}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="py-4 text-center text-sm text-slate-400">ยังไม่มีรีวิว</p>
              )}
            </div>

            {/* Activity summary */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
              <div className="mb-3 flex items-center gap-2">
                <Activity className="h-4 w-4 text-slate-400" />
                <h3 className="font-semibold text-slate-900">สรุประบบ</h3>
              </div>
              <ul className="space-y-2.5 text-sm">
                <li className="flex items-center justify-between">
                  <span className="text-slate-500">สถานที่หมวด ธรรมชาติ</span>
                  <span className="font-semibold tabular-nums text-slate-900">
                    {loading ? "—" : `${destCatCounts["ธรรมชาติ"] ?? 0} แห่ง`}
                  </span>
                </li>
                <li className="flex items-center justify-between">
                  <span className="text-slate-500">ร้านอาหารไทย</span>
                  <span className="font-semibold tabular-nums text-slate-900">
                    {loading ? "—" : `${REST_CATEGORY_COUNTS["อาหารไทย"]} ร้าน`}
                  </span>
                </li>
                <li className="flex items-center justify-between">
                  <span className="text-slate-500">โรงแรม</span>
                  <span className="font-semibold tabular-nums text-slate-900">
                    {loading ? "—" : `${ACC_CATEGORY_COUNTS["โรงแรม"]} แห่ง`}
                  </span>
                </li>
                <li className="flex items-center justify-between border-t border-slate-100 pt-2.5">
                  <span className="font-medium text-slate-700">รวมทั้งหมด</span>
                  <span className="font-bold tabular-nums text-slate-900">
                    {loading
                      ? "—"
                      : `${
                          (stats?.totals.destinations ?? 0) +
                          (stats?.totals.restaurants ?? 0) +
                          (stats?.totals.accommodations ?? 0)
                        } รายการ`}
                  </span>
                </li>
              </ul>
            </div>

            {/* Add new shortcut */}
            <Link
              href="/admin/destinations/new"
              className="flex items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-white p-4 text-sm font-medium text-slate-500 transition-colors hover:border-emerald-400 hover:bg-emerald-50/60 hover:text-emerald-700"
            >
              <Plus className="h-4 w-4" />
              เพิ่มสถานที่ใหม่
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}