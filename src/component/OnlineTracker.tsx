"use client";

import { useEffect } from "react";
import { updateOnlineStatus } from "@/actions/users";

export default function OnlineTracker() {
  useEffect(() => {
    // อัปเดตทันทีที่เปิดหน้าเว็บ
    updateOnlineStatus();

    // ตั้งเวลาให้อัปเดตซ้ำทุกๆ 3 นาที (180,000 มิลลิวินาที)
    const interval = setInterval(() => {
      updateOnlineStatus();
    }, 180000);

    return () => clearInterval(interval);
  }, []);

  return null; // คอมโพเนนต์นี้ทำงานเบื้องหลัง ไม่ต้องแสดงผลอะไร
}