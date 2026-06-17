"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, MapPin, Utensils, BedDouble,
  ChevronRight, ChevronLeft, RefreshCcw,
  CheckCircle2, Luggage, X, Trash2
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

type TripMode = "total" | "custom";

interface TripItem {
  id: string | number;
  name: string;
  image_url?: string | string[];
  images?: string | string[];
  min_price: number;
  category?: string;
}

// เก็บข้อมูลครบเพื่อแสดงใน Drawer ได้เลย
interface SelectedItem {
  item: TripItem;
  type: string;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function BudgetTripPlanner() {
  const [mode, setMode] = useState<TripMode>("total");
  const [totalBudget, setTotalBudget] = useState<string>("");
  const [customBudgets, setCustomBudgets] = useState({
    accommodation: "",
    food: "",
    destination: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [tripData, setTripData] = useState<any>(null);

  // ตะกร้า + สถานะ Drawer
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // ราคารวมทุกรายการในตะกร้า
  const totalPrice = selectedItems.reduce(
    (sum, { item }) => sum + (item.min_price || 0),
    0
  );

  // ─── API Calls ──────────────────────────────────────────────────────────────

  const handleGenerate = async () => {
    setIsLoading(true);
    setSelectedItems([]);
    setIsCartOpen(false);

    try {
      const payload = {
        mode,
        ...(mode === "total"
          ? { totalBudget: Number(totalBudget) }
          : {
              customBudgets: {
                accommodation: Number(customBudgets.accommodation),
                food: Number(customBudgets.food),
                destination: Number(customBudgets.destination),
              },
            }),
      };

      const res = await fetch("/api/trips/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setTripData(data.trip);
    } catch (error) {
      console.error(error);
      alert("เกิดข้อผิดพลาดในการดึงข้อมูล");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveTrip = async () => {
    if (selectedItems.length === 0) return;
    setIsLoading(true);
    try {
      const itemsToSave = selectedItems.map(({ item, type }) => ({
        id: item.id,
        type,
      }));
      await fetch("/api/trips/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "ทริปโคราชของฉัน",
          totalBudget: mode === "total" ? totalBudget : "Custom",
          items: itemsToSave,
        }),
      });
      alert("บันทึกทริปเรียบร้อยแล้ว!");
      setIsCartOpen(false);
    } catch (error) {
      console.error(error);
      alert("เกิดข้อผิดพลาดในการบันทึกทริป");
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Selection Helpers ──────────────────────────────────────────────────────

  const toggleSelection = (item: TripItem, type: string) => {
    setSelectedItems((prev) => {
      const exists = prev.some(
        (i) => i.item.id === item.id && i.type === type
      );
      return exists
        ? prev.filter((i) => !(i.item.id === item.id && i.type === type))
        : [...prev, { item, type }];
    });
  };

  const removeItem = (id: string | number, type: string) => {
    setSelectedItems((prev) =>
      prev.filter((i) => !(i.item.id === id && i.type === type))
    );
  };

  // ─── Image Utility ──────────────────────────────────────────────────────────

  const getImageUrl = (item: TripItem): string => {
    const extractFirst = (val: string | string[] | undefined): string | null => {
      if (!val) return null;
      if (Array.isArray(val)) return val[0] ?? null;
      if (val.trim().startsWith("[")) {
        try {
          const parsed = JSON.parse(val);
          return Array.isArray(parsed) ? parsed[0] ?? null : null;
        } catch {
          return val;
        }
      }
      return val;
    };
    return (
      extractFirst(item.image_url) ||
      extractFirst(item.images) ||
      "https://via.placeholder.com/400x300?text=No+Image"
    );
  };

  // ─── Type label ─────────────────────────────────────────────────────────────

  const typeLabel: Record<string, string> = {
    destination: "สถานที่",
    restaurant: "ร้านอาหาร",
    accommodation: "ที่พัก",
  };

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    // pb-10 เพียงพอ เพราะเราเอา Sticky Bar ออกแล้ว ใช้ Floating Button แทน
    <div className="w-full max-w-5xl mx-auto py-12 px-4 sm:px-6 pb-10 relative">

      {/* ── Header & Input ────────────────────────────────────────────── */}
      <div className="bg-white rounded-[2rem] p-6 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-neutral-100 mb-10">
        <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-neutral-900 mb-6 flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-black" />
          จัดทริปตามงบประมาณ
        </h2>

        {/* Toggle Mode */}
        <div className="flex bg-neutral-100/80 p-1 rounded-2xl mb-8 w-full max-w-sm relative">
          <button
            onClick={() => setMode("total")}
            className={`flex-1 py-2.5 text-sm font-medium rounded-xl z-10 transition-colors ${
              mode === "total"
                ? "text-neutral-900"
                : "text-neutral-500 hover:text-neutral-700"
            }`}
          >
            ระบุงบรวม
          </button>
          <button
            onClick={() => setMode("custom")}
            className={`flex-1 py-2.5 text-sm font-medium rounded-xl z-10 transition-colors ${
              mode === "custom"
                ? "text-neutral-900"
                : "text-neutral-500 hover:text-neutral-700"
            }`}
          >
            ระบุแยกหมวด
          </button>
          <motion.div
            className="absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white rounded-xl shadow-sm border border-neutral-200/50"
            animate={{ left: mode === "total" ? "4px" : "calc(50% + 0px)" }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
          />
        </div>

        {/* Input Fields */}
        <AnimatePresence mode="wait">
          {mode === "total" ? (
            <motion.div
              key="total"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="max-w-sm"
            >
              <label className="block text-sm font-medium text-neutral-600 mb-2">
                งบประมาณรวมทั้งทริป (บาท)
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 font-medium">
                  ฿
                </span>
                <input
                  type="number"
                  value={totalBudget}
                  onChange={(e) => setTotalBudget(e.target.value)}
                  placeholder="เช่น 3000"
                  className="w-full pl-10 pr-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-black/5 focus:border-neutral-400 transition-all outline-none"
                />
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="custom"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 sm:grid-cols-3 gap-4"
            >
              {[
                { key: "accommodation", label: "ที่พัก", icon: <BedDouble className="w-4 h-4" /> },
                { key: "food", label: "ร้านอาหาร", icon: <Utensils className="w-4 h-4" /> },
                { key: "destination", label: "ที่เที่ยว", icon: <MapPin className="w-4 h-4" /> },
              ].map(({ key, label, icon }) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-neutral-600 mb-2 flex items-center gap-1.5">
                    {icon} {label}
                  </label>
                  <input
                    type="number"
                    value={customBudgets[key as keyof typeof customBudgets]}
                    onChange={(e) =>
                      setCustomBudgets({ ...customBudgets, [key]: e.target.value })
                    }
                    placeholder="฿"
                    className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-black/5 focus:border-neutral-400 transition-all outline-none"
                  />
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <button
          onClick={handleGenerate}
          disabled={isLoading}
          className="mt-8 bg-black text-white px-8 py-3.5 rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-neutral-800 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <RefreshCcw className="w-5 h-5 animate-spin" />
          ) : (
            <>
              เริ่มจัดทริป <ChevronRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>

      {/* ── Results ───────────────────────────────────────────────────── */}
      <AnimatePresence>
        {tripData && !isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
            className="space-y-12"
          >
            <TripRow
              title="สถานที่ท่องเที่ยวแนะนำ"
              icon={<MapPin className="w-5 h-5 text-blue-500" />}
              items={tripData.destinations}
              type="destination"
              selectedItems={selectedItems}
              onToggle={toggleSelection}
              getImageUrl={getImageUrl}
            />
            <TripRow
              title="ร้านอาหารในงบ"
              icon={<Utensils className="w-5 h-5 text-orange-500" />}
              items={tripData.restaurants}
              type="restaurant"
              selectedItems={selectedItems}
              onToggle={toggleSelection}
              getImageUrl={getImageUrl}
            />
            <TripRow
              title="ที่พักน่านอน"
              icon={<BedDouble className="w-5 h-5 text-purple-500" />}
              items={tripData.accommodations}
              type="accommodation"
              selectedItems={selectedItems}
              onToggle={toggleSelection}
              getImageUrl={getImageUrl}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Floating Cart Button ──────────────────────────────────────── */}
      <AnimatePresence>
        {selectedItems.length > 0 && !isCartOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsCartOpen(true)}
            className="fixed bottom-8 right-8 z-[50] w-16 h-16 bg-black text-white rounded-full shadow-2xl flex items-center justify-center border-4 border-white"
          >
            <Luggage className="w-7 h-7" />
            {/* Badge จำนวนรายการ */}
            <motion.div
              key={selectedItems.length}
              initial={{ scale: 1.6 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 500, damping: 20 }}
              className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center shadow"
            >
              {selectedItems.length}
            </motion.div>
          </motion.button>
        )}
      </AnimatePresence>

      {/* ── Cart Drawer ───────────────────────────────────────────────── */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCartOpen(false)}
              className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[60]"
            />

            {/* Drawer Panel */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed top-0 right-0 h-full w-full max-w-md bg-white z-[70] shadow-2xl flex flex-col"
            >
              {/* Drawer Header */}
              <div className="flex justify-between items-center px-6 py-5 border-b border-neutral-100">
                <div>
                  <h3 className="text-xl font-bold text-neutral-900">สรุปทริปของคุณ</h3>
                  <p className="text-sm text-neutral-400 mt-0.5">
                    {selectedItems.length} รายการที่เลือก
                  </p>
                </div>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="w-9 h-9 rounded-full bg-neutral-100 flex items-center justify-center hover:bg-neutral-200 transition-colors"
                >
                  <X className="w-5 h-5 text-neutral-600" />
                </button>
              </div>

              {/* Drawer Items */}
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
                <AnimatePresence initial={false}>
                  {selectedItems.map(({ item, type }) => (
                    <motion.div
                      key={`${type}-${item.id}`}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20, height: 0, marginBottom: 0 }}
                      transition={{ type: "spring", stiffness: 300, damping: 25 }}
                      className="flex gap-4 p-3 border border-neutral-100 rounded-2xl bg-neutral-50/50 hover:bg-white transition-colors"
                    >
                      {/* Thumbnail */}
                      <img
                        src={getImageUrl(item)}
                        alt={item.name}
                        className="w-16 h-16 rounded-xl object-cover shrink-0"
                      />
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider mb-0.5">
                          {typeLabel[type] ?? type}
                        </p>
                        <p className="font-semibold text-sm text-neutral-900 leading-snug line-clamp-2">
                          {item.name}
                        </p>
                        <p className="text-blue-600 font-bold text-sm mt-1">
                          ฿{item.min_price.toLocaleString()}
                        </p>
                      </div>
                      {/* Remove */}
                      <button
                        onClick={() => removeItem(item.id, type)}
                        className="self-start mt-1 w-7 h-7 rounded-full bg-red-50 flex items-center justify-center hover:bg-red-100 transition-colors shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-red-400" />
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {/* Empty state */}
                {selectedItems.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-20 text-neutral-400">
                    <Luggage className="w-12 h-12 mb-3 opacity-30" />
                    <p className="text-sm">ยังไม่ได้เลือกรายการ</p>
                  </div>
                )}
              </div>

              {/* Drawer Footer */}
              <div className="px-6 py-5 border-t border-neutral-100 bg-white">
                <div className="flex justify-between items-baseline mb-4">
                  <span className="text-sm text-neutral-500">ราคารวมทั้งหมด</span>
                  <span className="text-2xl font-bold text-neutral-900">
                    ฿{totalPrice.toLocaleString()}
                  </span>
                </div>
                <button
                  onClick={handleSaveTrip}
                  disabled={selectedItems.length === 0 || isLoading}
                  className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm shadow-blue-600/20"
                >
                  {isLoading ? (
                    <RefreshCcw className="w-5 h-5 animate-spin" />
                  ) : (
                    "บันทึกทริปนี้"
                  )}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── TripRow Component ────────────────────────────────────────────────────────

function TripRow({
  title,
  icon,
  items,
  type,
  selectedItems,
  onToggle,
  getImageUrl,
}: {
  title: string;
  icon: React.ReactNode;
  items: TripItem[];
  type: string;
  selectedItems: SelectedItem[];
  onToggle: (item: TripItem, type: string) => void;
  getImageUrl: (item: TripItem) => string;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(Math.ceil(scrollLeft + clientWidth) < scrollWidth);
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener("resize", checkScroll);
    return () => window.removeEventListener("resize", checkScroll);
  }, [items]);

  const scroll = (dir: "left" | "right") => {
    scrollRef.current?.scrollBy({
      left: dir === "left" ? -320 : 320,
      behavior: "smooth",
    });
  };

  if (!items || items.length === 0) return null;

  return (
    <div className="relative">
      <div className="flex items-center gap-2 mb-4 px-2">
        {icon}
        <h3 className="text-xl font-semibold text-neutral-900 tracking-tight">
          {title}
        </h3>
      </div>

      <div className="relative">
        {/* ปุ่มเลื่อนซ้าย */}
        <AnimatePresence>
          {canScrollLeft && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={() => scroll("left")}
              className="absolute -left-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-white/95 backdrop-blur shadow-lg border border-neutral-100 rounded-full hidden sm:flex items-center justify-center text-neutral-700 hover:text-black hover:scale-105 transition-all"
            >
              <ChevronLeft className="w-6 h-6 -ml-1" />
            </motion.button>
          )}
        </AnimatePresence>

        {/* ปุ่มเลื่อนขวา */}
        <AnimatePresence>
          {canScrollRight && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={() => scroll("right")}
              className="absolute -right-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-white/95 backdrop-blur shadow-lg border border-neutral-100 rounded-full hidden sm:flex items-center justify-center text-neutral-700 hover:text-black hover:scale-105 transition-all"
            >
              <ChevronRight className="w-6 h-6 ml-1" />
            </motion.button>
          )}
        </AnimatePresence>

        {/* Scroll Container */}
        <div
          ref={scrollRef}
          onScroll={checkScroll}
          className="flex overflow-x-auto snap-x snap-mandatory pb-8 pt-2 px-2 -mx-2 gap-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
        >
          <motion.div
            className="flex gap-5"
            variants={{ show: { transition: { staggerChildren: 0.08 } } }}
            initial="hidden"
            animate="show"
          >
            {items.map((item) => {
              const isSelected = selectedItems.some(
                (i) => i.item.id === item.id && i.type === type
              );

              return (
                <motion.div
                  key={item.id}
                  onClick={() => onToggle(item, type)}
                  variants={{
                    hidden: { opacity: 0, x: 20 },
                    show: {
                      opacity: 1,
                      x: 0,
                      transition: { type: "spring", stiffness: 300, damping: 24 },
                    },
                  }}
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                  className={`snap-start shrink-0 w-[280px] bg-white rounded-2xl overflow-hidden cursor-pointer group transition-all duration-300 ${
                    isSelected
                      ? "ring-2 ring-blue-500 shadow-[0_8px_25px_rgba(59,130,246,0.2)]"
                      : "border border-neutral-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)]"
                  }`}
                >
                  {/* Image */}
                  <div className="relative h-40 w-full overflow-hidden bg-neutral-100">
                    <img
                      src={getImageUrl(item)}
                      alt={item.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div
                      className={`absolute inset-0 bg-black/10 transition-opacity duration-300 ${
                        isSelected ? "opacity-100" : "opacity-0"
                      }`}
                    />

                    {/* Checkmark */}
                    <AnimatePresence>
                      {isSelected && (
                        <motion.div
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0, opacity: 0 }}
                          className="absolute top-3 left-3 z-10 bg-white rounded-full p-0.5 shadow-md"
                        >
                          <CheckCircle2 className="w-6 h-6 text-blue-600 fill-blue-50" />
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Price Badge */}
                    {item.min_price != null && (
                      <div className="absolute top-3 right-3 z-10 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-neutral-900 shadow-sm">
                        ฿{item.min_price.toLocaleString()}
                      </div>
                    )}
                  </div>

                  {/* Card Body */}
                  <div className="p-5">
                    {item.category && (
                      <p className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider mb-1">
                        {item.category}
                      </p>
                    )}
                    <h4 className="text-base font-semibold text-neutral-900 leading-snug line-clamp-2">
                      {item.name}
                    </h4>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </div>
    </div>
  );
}