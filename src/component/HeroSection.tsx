"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const images = [
  "/images/wad.jpg",
  "/images/khao.png",
  "/images/wad1.jpeg",
  "/images/anusawaree.jpg",
];

export default function HeroSection() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % images.length);
    }, 3000); // เปลี่ยนภาพทุก 5 วินาที
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="relative h-[80vh] flex items-center justify-center text-center text-white overflow-hidden">
      {/* ภาพพื้นหลังแบบสไลด์ */}
      <AnimatePresence mode="wait">
        <motion.div
          key={images[index]}
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${images[index]})` }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2 }}
        />
      </AnimatePresence>

      {/* ชั้นสีโปร่งเพิ่มความอ่านง่าย */}
      <div className="absolute inset-0 bg-black/40" />

      {/* เนื้อหา */}
      <div className="relative z-10 max-w-2xl px-6">
        <h2 className="text-4xl md:text-5xl font-bold mb-4">
          ยินดีต้อนรับสู่โคราช
        </h2>
        <p className="text-lg mb-6">
          ดินแดนแห่งวัฒนธรรม ประวัติศาสตร์ และธรรมชาติที่สวยงาม
          ค้นหาสถานที่ท่องเที่ยว ร้านอาหาร และคาเฟ่สุดชิคได้ที่นี่
        </p>
        <a
          href="#destinations"
          className="bg-white text-sky-700 px-6 py-3 rounded-full font-semibold hover:bg-gray-100 transition"
        >
          สำรวจสถานที่แนะนำ
        </a>
      </div>
    </section>
  );
}
