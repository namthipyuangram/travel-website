// src/types/destination.ts

export interface Destination {
  id: number;
  name: string;
  description?: string;
  category: "ธรรมชาติ" | "วัด" | "ร้านอาหาร" | "คาเฟ่" | "ที่พัก" | "อื่นๆ";
  image_url?: string;
  min_price: number; 
  max_price: number; 
  created_at?: string;
  created_by?: string;
}
