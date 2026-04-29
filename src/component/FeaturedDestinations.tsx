"use client";

import { motion } from "framer-motion";
import { MapPin } from "lucide-react";

const destinations = [
  {
    name: "ภูเขา",
    img: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=600&q=60",
  },
  {
    name: "ทะเล",
    img: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=60",
  },
  {
    name: "เมืองเก่า",
    img: "https://images.unsplash.com/photo-1526772662000-3f88f10405ff?auto=format&fit=crop&w=600&q=60",
  },
];

export default function FeaturedDestinations() {
  return (
    <section className="px-8 lg:px-16 py-12 bg-sky-50">
      <h2 className="text-3xl font-bold text-sky-800 text-center mb-10">
        สถานที่ยอดนิยม
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {destinations.map((place, i) => (
          <motion.div
            key={i}
            whileHover={{ scale: 1.05 }}
            className="relative overflow-hidden rounded-2xl shadow-md"
          >
            <img
              src={place.img}
              alt={place.name}
              className="w-full h-64 object-cover"
            />
            <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center text-white text-xl font-semibold">
              <MapPin className="w-5 h-5 mr-2" />
              {place.name}
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
