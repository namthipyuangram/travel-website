"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence, useMotionValue, useSpring } from "framer-motion";
import { MapPin, ArrowRight, ArrowLeft, Play } from "lucide-react";

// Mock Data
const DESTINATIONS = [
  {
    id: "01",
    title: "อนุสาวรีย์ท้าวสุรนารี",
    subtitle: "ยินดีต้อนรับสู่โคราช",
    location: "อ.เมือง, นครราชสีมา",
    image: "/images/suranari.jpg",
    desc: "ศูนย์รวมจิตใจของชาวโคราช สักการะวีรสตรีผู้ยิ่งใหญ่แห่งเมืองย่าโม ค้นหาสถานที่ท่องเที่ยว ร้านอาหาร และคาเฟ่สุดชิคได้ที่นี่",
  },
  {
    id: "02",
    title: "อุทยานแห่งชาติเขาใหญ่",
    subtitle: "มรดกโลกทางธรรมชาติ",
    location: "อ.ปากช่อง, นครราชสีมา",
    image: "/images/khao.jpg",
    desc: "สัมผัสธรรมชาติอันอุดมสมบูรณ์ พื้นที่สีเขียวที่ใกล้กรุงเทพฯ ที่สุด พร้อมจุดชมวิวและน้ำตกที่สวยงาม",
  },
  {
    id: "03",
    title: "วัดศาลาลอย",
    subtitle: "ศิลปะประยุกต์ล้ำค่า",
    location: "อ.เมือง, นครราชสีมา",
    image: "/images/wab3.webp",
    desc: "กราบขอพรเจดีย์บรรจุอัฐิย่าโม และชมความงามของอุโบสถเรือสำเภาที่สร้างจากเครื่องปั้นดินเผาด่านเกวียน",
  },
  {
    id: "04",
    title: "วัดบ้านไร่",
    subtitle: "ตำนานหลวงพ่อคูณ",
    location: "อ.ด่านขุนทด, นครราชสีมา",
    image: "/images/wad4.webp",
    desc: "ตื่นตากับวิหารเทพวิทยาคม อัญมณีแห่งสถาปัตยกรรมประติมากรรมช้างกลางน้ำที่ยิ่งใหญ่ที่สุดในเอเชีย",
  },
  {
    id: "05",
    title: "ผาเก็บตะวัน ",
    subtitle: "อุทยานแห่งชาติทับลาน",
    location: "อ.นาดี, นครราชสีมา",
    image: "/images/wab2.jpg",
    desc: "เป็นสถานที่ท่องเที่ยวยอดนิยม อยู่ในพื้นที่อุทยานแห่งชาติทับลาน เส้นทางดีเดินทางสะดวก วิวสวย บรรยากาศดี ช่วงฤดูฝนแบบนี้อากาศดีเย็น",
  },
  {
    id: "06",
    title: "เทอร์มินอล 21 โคราช",
    subtitle: "จุดเช็คอินแลนด์มาร์คใหม่",
    location: "อ.เมือง, นครราชสีมา",
    image: "/images/terminal.jpg",
    desc: "สัมผัสประสบการณ์ช้อปปิ้งท่ามกลางบรรยากาศจากทั่วโลก พร้อมชมวิวเมืองโคราชแบบ 360 องศาบนหอคอย Skydeck สูง 110 เมตร",
  },
  {
  id: "07",
  title: "เขายายเที่ยง",
  subtitle: "กังหันลมและสายลมเย็น",
  location: "อ.สีคิ้ว, นครราชสีมา",
  image: "/images/thiang.jpg",
  desc: "ปั่นจักรยานรับลมเย็นบนสันเขื่อน ชมวิวทิวทัศน์กังหันลมยักษ์และพาโนรามาของโค้งน้ำลำตะคองที่สวยที่สุดในโคราช",
},
{
  id: "08",
  title: "ปราสาทหินพิมาย",
  subtitle: "อารยธรรมขอมที่ยิ่งใหญ่",
  location: "อ.พิมาย, นครราชสีมา",
  image: "/images/phimai.webp",
  desc: "ชมปราสาทหินทรงขอมที่ใหญ่ที่สุดในไทย สัมผัสความมหัศจรรย์ของสถาปัตยกรรมโบราณและลวดลายสลักหินที่ประณีตงดงาม",
},
{
  id: "09",
  title: "น้ำผุดธรรมชาติบ้านท่าช้าง",
  subtitle: "สระมรกตแห่งเมืองโคราช",
  location: "อ.ปากช่อง, นครราชสีมา",
  image: "/images/unnamed.webp",
  desc: "สัมผัสความมหัศจรรย์ของน้ำผุดธรรมชาติสีฟ้าใสใจกลางป่าปากช่อง ลงเล่นน้ำคลายร้อนท่ามกลางบรรยากาศอันร่มรื่น",
},
];
const springTransition = { 
  type: "spring", 
  stiffness: 200, 
  damping: 30 
} as const;
const easeOutCirc = [0.075, 0.82, 0.165, 1] as const;

export default function HeroSection() {
  const [activeIdx, setActiveIdx] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springConfig = { damping: 50, stiffness: 400 } ;
  const parallaxX = useSpring(mouseX, springConfig);
  const parallaxY = useSpring(mouseY, springConfig);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const { innerWidth, innerHeight } = window;
      const x = (e.clientX / innerWidth - 0.5) * 2;
      const y = (e.clientY / innerHeight - 0.5) * 2;
      mouseX.set(x * -15);
      mouseY.set(y * -15);
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [mouseX, mouseY]);

  const nextSlide = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setActiveIdx((prev) => (prev + 1) % DESTINATIONS.length);
    setTimeout(() => setIsAnimating(false), 600);
  };

  const prevSlide = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setActiveIdx((prev) => (prev === 0 ? DESTINATIONS.length - 1 : prev - 1));
    setTimeout(() => setIsAnimating(false), 600);
  };

  useEffect(() => {
    const timer = setInterval(() => {
      nextSlide();
    }, 5000);
    return () => clearInterval(timer);
  }, [activeIdx, isAnimating]);

  const activeData = DESTINATIONS[activeIdx];

  return (
    <section className="relative w-full h-screen min-h-[750px] overflow-hidden bg-[#050505] text-white">
      {/* 1. Background Layer */}
      <div className="absolute inset-0 w-full h-full overflow-hidden">
        <AnimatePresence mode="popLayout">
          <motion.div
            key={activeIdx}
            initial={{ scale: 1.1, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, ease: "easeInOut" }}
            className="absolute inset-0 w-full h-full"
          >
            <motion.div
              className="absolute inset-[-5%] w-[110%] h-[110%] bg-cover bg-center"
              style={{
                backgroundImage: `url(${activeData.image})`,
                x: parallaxX,
                y: parallaxY,
              }}
            />
            <div className="absolute inset-0 bg-black/40" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/40 to-transparent w-full md:w-3/4" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent h-1/2 top-auto bottom-0" />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* 2. Main Content Container */}
      <div className="relative z-10 w-full h-full flex flex-col md:flex-row items-center justify-between px-6 pt-24 pb-12 md:px-12 lg:px-24">
        
        {/* Left Content (Text) */}
        <div className="w-full md:w-1/2 flex flex-col justify-center gap-6 md:pr-12 z-20">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeData.id}
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -40, opacity: 0 }}
              transition={{ duration: 0.8, ease: easeOutCirc }}
              className="flex flex-col gap-2"
            >
              <div className="flex items-center gap-3 text-[#E5A93C]">
                <MapPin className="w-5 h-5" />
                <span className="uppercase tracking-[0.2em] text-sm font-semibold">
                  {activeData.subtitle}
                </span>
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-7xl font-bold leading-[1.1] mt-2 mb-4">
                {activeData.title}
              </h1>

              <p className="text-white/80 text-base md:text-lg max-w-lg leading-relaxed">
                {activeData.desc}
              </p>

              <div className="flex items-center gap-6 mt-6">
                <a href="#destinations" className="group relative px-8 py-4 bg-white text-black rounded-full font-bold uppercase tracking-wider text-sm overflow-hidden">
                  <span className="relative z-10 flex items-center gap-2">
                    สำรวจสถานที่แนะนำ
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </span>
                  <div className="absolute inset-0 bg-[#E5A93C] transform scale-x-0 origin-left group-hover:scale-x-100 transition-transform duration-500 ease-out z-0" />
                </a>
                <button className="w-12 h-12 rounded-full border border-white/30 flex items-center justify-center hover:bg-white hover:text-black transition-all duration-300 group">
                  <Play className="w-4 h-4 ml-1 group-hover:scale-110 transition-transform" />
                </button>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Right Content (Carousel Cards + Centered Controls) */}
        <div className="w-full md:w-1/2 flex flex-col items-center justify-center gap-10 mt-12 md:mt-0">
          
          {/* Card Carousel Wrapper */}
          <div className="relative w-full max-w-[280px] md:max-w-[320px] lg:max-w-[360px] h-[380px] md:h-[450px] lg:h-[500px] [perspective:1000px]">
            {DESTINATIONS.map((dest, i) => {
              const offset = i - activeIdx;
              const isActive = offset === 0;
              const isPast = offset < 0;

              const xPos = isActive ? "0%" : isPast ? "-120%" : `calc(${offset * 35}% + ${offset * 15}px)`;
              const scale = isActive ? 1 : Math.max(0.7, 0.85 - Math.abs(offset) * 0.05);
              const opacity = isActive ? 1 : isPast ? 0 : Math.max(0, 0.6 - offset * 0.15);
              let zIndex = 30 - Math.abs(offset);
              if (isActive) zIndex = 50;

              return (
                <motion.div
                  key={dest.id}
                  initial={false}
                  animate={{
                    x: xPos,
                    scale: scale,
                    opacity: opacity,
                    zIndex: zIndex,
                    rotateY: isActive ? 0 : -12 * offset,
                  }}
                  transition={springTransition}
                  className="absolute left-0 w-full aspect-[3/4] rounded-3xl overflow-hidden shadow-2xl cursor-grab active:cursor-grabbing origin-center border border-white/10"
                  onClick={() => i > activeIdx && nextSlide()}
                  drag="x"
                  dragConstraints={{ left: 0, right: 0 }}
                  onDragEnd={(_, info) => {
                    if (info.offset.x < -50) nextSlide();
                    else if (info.offset.x > 50) prevSlide();
                  }}
                >
                  <motion.div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ backgroundImage: `url(${dest.image})` }}
                    animate={{ scale: isActive ? 1 : 1.15 }}
                    transition={{ duration: 1.5 }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-transparent" />
                  
                  <div className="absolute bottom-0 left-0 p-6 md:p-8 w-full">
                    <motion.div
                      animate={isActive ? { y: 0, opacity: 1 } : { y: 20, opacity: 0 }}
                      className="flex items-center gap-2 mb-2"
                    >
                      <MapPin className="w-3 h-3 text-[#E5A93C]" />
                      <span className="text-xs uppercase tracking-widest text-[#E5A93C] font-medium">{dest.location}</span>
                    </motion.div>
                    <motion.h3
                      animate={isActive ? { y: 0, opacity: 1 } : { y: 20, opacity: 0 }}
                      className="text-xl md:text-2xl font-bold text-white leading-tight"
                    >
                      {dest.title}
                    </motion.h3>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Centered Controls Box */}
          <div className="flex items-center gap-4">
            <button
              onClick={prevSlide}
              className="w-12 h-12 md:w-14 md:h-14 rounded-full border border-white/20 flex items-center justify-center backdrop-blur-md bg-white/5 hover:bg-white hover:text-black transition-all duration-300 group"
            >
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            </button>
            <button
              onClick={nextSlide}
              className="w-12 h-12 md:w-14 md:h-14 rounded-full border border-white/20 flex items-center justify-center backdrop-blur-md bg-white/5 hover:bg-white hover:text-black transition-all duration-300 group"
            >
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

        </div>
      </div>
    </section>
  );
}