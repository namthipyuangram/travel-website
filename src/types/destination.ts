// src/types/destination.ts
export interface Destination {
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
  images?: string[];   // ← เพิ่มบรรทัดนี้
}