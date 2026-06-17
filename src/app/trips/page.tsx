"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Luggage,
  MapPin,
  Utensils,
  BedDouble,
  ChevronRight,
  RefreshCcw,
  Trash2,
  Pencil,
  CalendarDays,
  Banknote,
  Plus,
  X,
  CheckCircle2,
  ChevronLeft,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import Navbar from "@/component/User/Navbar";

// ─── Types ───────────────────────────────────────────────────────────────────

interface TripItemDetail {
  id: string | number;
  name: string;
  min_price: number;
  image_url?: string | string[];
  images?: string | string[];
  category?: string;
}

interface TripItem {
  id: string;
  item_id: string | number;
  item_type: "destination" | "restaurant" | "accommodation";
  item_detail: TripItemDetail;
}

interface Trip {
  id: string;
  name: string;
  total_budget: string | number;
  created_at: string;
  trip_items: TripItem[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TYPE_CONFIG = {
  destination: {
    label: "ที่เที่ยว",
    icon: <MapPin className="w-3.5 h-3.5" />,
    color: "bg-blue-50 text-blue-700 border-blue-100",
    dot: "bg-blue-400",
  },
  restaurant: {
    label: "ร้านอาหาร",
    icon: <Utensils className="w-3.5 h-3.5" />,
    color: "bg-orange-50 text-orange-700 border-orange-100",
    dot: "bg-orange-400",
  },
  accommodation: {
    label: "ที่พัก",
    icon: <BedDouble className="w-3.5 h-3.5" />,
    color: "bg-purple-50 text-purple-700 border-purple-100",
    dot: "bg-purple-400",
  },
};

// ─── Image Utility ────────────────────────────────────────────────────────────

function getImageUrl(item: TripItemDetail | null | undefined): string {
  // 1. ดักไว้เลยว่าถ้าไม่มี item ให้ส่งรูปเปล่าๆ กลับไป
  if (!item)
    return "https://ui-avatars.com/api/?name=Trip&background=f5f5f5&color=888&size=200";

  const extractFirst = (val: string | string[] | undefined): string | null => {
    if (!val) return null;
    if (Array.isArray(val)) return val[0] ?? null;
    if (val.trim().startsWith("[")) {
      try {
        const parsed = JSON.parse(val);
        return Array.isArray(parsed) ? (parsed[0] ?? null) : null;
      } catch {
        return val;
      }
    }
    return val;
  };

  return (
    extractFirst(item.image_url) ||
    extractFirst(item.images) ||
    // 2. เผื่อกรณีที่ item มีอยู่จริงแต่ item.name หายไป
    `https://ui-avatars.com/api/?name=${encodeURIComponent(item.name || "Trip")}&background=f5f5f5&color=888&size=200`
  );
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("th-TH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function totalSpend(items: TripItem[]): number {
  return items.reduce((sum, i) => sum + (i.item_detail?.min_price || 0), 0);
}

// ─── Edit Drawer ──────────────────────────────────────────────────────────────

function EditTripDrawer({
  trip,
  onClose,
  onSaved,
}: {
  trip: Trip;
  onClose: () => void;
  onSaved: (updated: Trip) => void;
}) {
  const [name, setName] = useState(trip.name);
  const [items, setItems] = useState<TripItem[]>(trip.trip_items || []);
  const [isSaving, setIsSaving] = useState(false);

  const removeItem = (itemId: string) => {
    setItems((prev) => prev.filter((i) => i.id !== itemId));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/trips/${trip.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          items: items.map((i) => ({ id: i.item_id, type: i.item_type })),
        }),
      });
      if (!res.ok) throw new Error("Failed to save");
      const data = await res.json();
      onSaved({ ...trip, name, trip_items: items });
      onClose();
    } catch (err) {
      alert("เกิดข้อผิดพลาดในการบันทึก กรุณาลองใหม่");
    } finally {
      setIsSaving(false);
    }
  };

  const spend = totalSpend(items);

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[60]"
      />

      {/* Drawer */}
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="fixed top-0 right-0 h-full w-full max-w-md bg-white z-[70] shadow-2xl flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-neutral-100">
          <h3 className="text-xl font-bold text-neutral-900">แก้ไขทริป</h3>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-neutral-100 flex items-center justify-center hover:bg-neutral-200 transition-colors"
          >
            <X className="w-5 h-5 text-neutral-600" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* Trip Name */}
          <div>
            <label className="block text-sm font-medium text-neutral-600 mb-2">
              ชื่อทริป
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-black/5 focus:border-neutral-400 transition-all outline-none text-neutral-900 font-medium"
            />
          </div>

          {/* Items List */}
          <div>
            <p className="text-sm font-medium text-neutral-600 mb-3">
              รายการในทริป ({items.length})
            </p>
            <AnimatePresence initial={false}>
              {items.length === 0 ? (
                <div className="text-center py-10 text-neutral-400">
                  <Luggage className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">ไม่มีรายการแล้ว</p>
                </div>
              ) : (
                items.map((tripItem) => {
                  const detail = tripItem.item_detail;
                  const typeConf =
                    TYPE_CONFIG[tripItem.item_type] ?? TYPE_CONFIG.destination;

                  return (
                    <motion.div
                      key={tripItem.id}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                      transition={{ duration: 0.2 }}
                      className="mb-3 overflow-hidden"
                    >
                      <div className="flex gap-3 p-3 border border-neutral-100 rounded-2xl bg-neutral-50/50 hover:bg-white transition-colors">
                        <img
                          src={getImageUrl(detail)}
                          alt={detail.name}
                          className="w-14 h-14 rounded-xl object-cover shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <span
                            className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border mb-1 ${typeConf.color}`}
                          >
                            {typeConf.icon}
                            {typeConf.label}
                          </span>
                          <p className="text-sm font-semibold text-neutral-900 leading-snug line-clamp-1">
                            {detail.name}
                          </p>
                          <p className="text-blue-600 font-bold text-sm mt-0.5">
                            ฿{detail.min_price.toLocaleString()}
                          </p>
                        </div>
                        <button
                          onClick={() => removeItem(tripItem.id)}
                          className="self-start mt-1 w-7 h-7 rounded-full bg-red-50 flex items-center justify-center hover:bg-red-100 transition-colors shrink-0"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-red-400" />
                        </button>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-5 border-t border-neutral-100 bg-white space-y-4">
          <div className="flex justify-between items-baseline">
            <span className="text-sm text-neutral-500">ราคารวมประมาณ</span>
            <span className="text-2xl font-bold text-neutral-900">
              ฿{spend.toLocaleString()}
            </span>
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3.5 rounded-xl font-semibold text-neutral-700 bg-neutral-100 hover:bg-neutral-200 transition-colors"
            >
              ยกเลิก
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving || !name.trim()}
              className="flex-1 py-3.5 rounded-xl font-bold text-white bg-black hover:bg-neutral-800 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSaving ? (
                <RefreshCcw className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  บันทึก
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </>
  );
}

// ─── Trip Card ────────────────────────────────────────────────────────────────

function TripCard({
  trip,
  onEdit,
  onDelete,
}: {
  trip: Trip;
  onEdit: (trip: Trip) => void;
  onDelete: (id: string) => void;
}) {
  const items = trip.trip_items || [];
  const spend = totalSpend(items);

  // กลุ่มรูปภาพ preview สูงสุด 4 รูป
  const previewImages = items
    .filter((i) => i && i.item_detail)
    .slice(0, 4)
    .map((i) => getImageUrl(i.item_detail));

  // นับจำนวนตามประเภท
  const countByType = items.reduce<Record<string, number>>((acc, i) => {
    acc[i.item_type] = (acc[i.item_type] || 0) + 1;
    return acc;
  }, {});

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ type: "spring", stiffness: 300, damping: 24 }}
      className="bg-white rounded-2xl border border-neutral-100 shadow-[0_4px_20px_rgb(0,0,0,0.04)] overflow-hidden group hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300"
    >
      {/* Image Strip */}
      <div className="relative h-40 bg-neutral-100 overflow-hidden">
        {previewImages.length === 0 ? (
          <div className="w-full h-full flex items-center justify-center">
            <Luggage className="w-12 h-12 text-neutral-300" />
          </div>
        ) : previewImages.length === 1 ? (
          <img
            src={previewImages[0]}
            alt=""
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div
            className={`grid h-full gap-0.5 ${previewImages.length === 2 ? "grid-cols-2" : previewImages.length === 3 ? "grid-cols-3" : "grid-cols-2 grid-rows-2"}`}
          >
            {previewImages.map((src, idx) => (
              <img
                key={idx}
                src={src}
                alt=""
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            ))}
          </div>
        )}

        {/* Overlay Actions */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <button
            onClick={() => onEdit(trip)}
            className="w-9 h-9 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm hover:bg-white transition-colors"
          >
            <Pencil className="w-4 h-4 text-neutral-700" />
          </button>
          <button
            onClick={() => {
              if (confirm(`ลบทริป "${trip.name}" ใช่หรือไม่?`))
                onDelete(trip.id);
            }}
            className="w-9 h-9 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm hover:bg-red-50 transition-colors"
          >
            <Trash2 className="w-4 h-4 text-red-400" />
          </button>
        </div>

        {/* Item count badge */}
        {items.length > 4 && (
          <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-sm text-white text-xs font-semibold px-2.5 py-1 rounded-full">
            +{items.length - 4} รายการ
          </div>
        )}
      </div>

      {/* Card Body */}
      <div className="p-5">
        <h3 className="text-base font-bold text-neutral-900 mb-1 leading-snug line-clamp-1">
          {trip.name}
        </h3>

        {/* Meta row */}
        <div className="flex items-center gap-3 text-xs text-neutral-400 mb-4">
          <span className="flex items-center gap-1">
            <CalendarDays className="w-3.5 h-3.5" />
            {formatDate(trip.created_at)}
          </span>
          <span className="flex items-center gap-1">
            <Banknote className="w-3.5 h-3.5" />฿{spend.toLocaleString()}
          </span>
        </div>

        {/* Type breakdown */}
        <div className="flex flex-wrap gap-2">
          {(Object.keys(TYPE_CONFIG) as Array<keyof typeof TYPE_CONFIG>).map(
            (type) => {
              const count = countByType[type];
              if (!count) return null;
              const conf = TYPE_CONFIG[type];
              return (
                <span
                  key={type}
                  className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full border ${conf.color}`}
                >
                  {conf.icon}
                  {conf.label} {count}
                </span>
              );
            },
          )}
          {items.length === 0 && (
            <span className="text-xs text-neutral-400">ยังไม่มีรายการ</span>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="px-5 pb-4">
        <button
          onClick={() => onEdit(trip)}
          className="w-full py-3 rounded-xl border border-neutral-200 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 hover:border-neutral-300 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
        >
          <Pencil className="w-4 h-4" />
          แก้ไขทริปนี้
        </button>
      </div>
    </motion.div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="col-span-full flex flex-col items-center justify-center py-24 text-center"
    >
      <div className="w-24 h-24 bg-neutral-100 rounded-3xl flex items-center justify-center mb-6">
        <Luggage className="w-12 h-12 text-neutral-300" />
      </div>
      <h3 className="text-xl font-bold text-neutral-800 mb-2">
        ยังไม่มีทริปที่บันทึก
      </h3>
      <p className="text-neutral-400 text-sm mb-8 max-w-xs">
        เริ่มจัดทริปแรกของคุณแล้วกดบันทึกไว้ที่นี่ได้เลย
      </p>
      <Link
        href="/trips/plan"
        className="bg-black text-white px-7 py-3.5 rounded-xl font-semibold text-sm flex items-center gap-2 hover:bg-neutral-800 active:scale-[0.98] transition-all"
      >
        <Plus className="w-4 h-4" />
        จัดทริปใหม่
      </Link>
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function MyTripsPage() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // ─── Fetch Trips ─────────────────────────────────────────────────────────

  const fetchTrips = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/trips");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();

      console.log("ข้อมูลที่ได้จาก API:", data);
      setTrips(data.trips || []);
    } catch (err) {
      console.error(err);
      setError("ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTrips();
  }, [fetchTrips]);

  // ─── Delete ───────────────────────────────────────────────────────────────

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/trips/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      setTrips((prev) => prev.filter((t) => t.id !== id));
    } catch {
      alert("เกิดข้อผิดพลาดในการลบ กรุณาลองใหม่");
    } finally {
      setDeletingId(null);
    }
  };

  // ─── After Edit Saved ─────────────────────────────────────────────────────

  const handleSaved = (updated: Trip) => {
    setTrips((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="w-full max-w-5xl mx-auto py-12 px-4 sm:px-6">
      <Navbar />
      {/* Header */}
      <div className="flex items-start justify-between mb-10">
        <div>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1 text-sm text-neutral-400 hover:text-neutral-600 transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            กลับไปจัดทริป
          </Link>
          <h1 className="text-3xl sm:text-4xl font-bold text-neutral-900 tracking-tight flex items-center gap-3">
            <Luggage className="w-8 h-8" />
            ทริปของฉัน
          </h1>
          {!isLoading && trips.length > 0 && (
            <p className="text-neutral-400 mt-2 text-sm">
              {trips.length} ทริปที่บันทึกไว้
            </p>
          )}
        </div>

        <Link
          href="/trips/plan"
          className="bg-black text-white px-5 py-3 rounded-xl font-semibold text-sm flex items-center gap-2 hover:bg-neutral-800 active:scale-[0.98] transition-all shadow-sm shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">จัดทริปใหม่</span>
          <span className="sm:hidden">ใหม่</span>
        </Link>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-neutral-100 overflow-hidden animate-pulse"
            >
              <div className="h-40 bg-neutral-100" />
              <div className="p-5 space-y-3">
                <div className="h-5 bg-neutral-100 rounded-lg w-3/4" />
                <div className="h-3 bg-neutral-100 rounded-lg w-1/2" />
                <div className="flex gap-2">
                  <div className="h-6 w-20 bg-neutral-100 rounded-full" />
                  <div className="h-6 w-20 bg-neutral-100 rounded-full" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error */}
      {!isLoading && error && (
        <div className="text-center py-20">
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={fetchTrips}
            className="text-sm font-medium text-neutral-600 flex items-center gap-2 mx-auto hover:text-neutral-900 transition-colors"
          >
            <RefreshCcw className="w-4 h-4" />
            โหลดใหม่
          </button>
        </div>
      )}

      {/* Grid */}
      {!isLoading && !error && (
        <motion.div
          layout
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          <AnimatePresence mode="popLayout">
            {trips.length === 0 ? (
              <EmptyState key="empty" />
            ) : (
              trips.map((trip) => (
                <TripCard
                  key={trip.id}
                  trip={trip}
                  onEdit={setEditingTrip}
                  onDelete={handleDelete}
                />
              ))
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Edit Drawer */}
      <AnimatePresence>
        {editingTrip && (
          <EditTripDrawer
            key={editingTrip.id}
            trip={editingTrip}
            onClose={() => setEditingTrip(null)}
            onSaved={handleSaved}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
