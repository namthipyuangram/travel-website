import { SignInClient } from "./SignInClient";

export const metadata = {
  title: "เข้าสู่ระบบ | เที่ยวตามงบโคราช",
  description:
    "เข้าสู่ระบบเพื่อใช้งานเว็บไซต์แนะนำสถานที่ท่องเที่ยว ร้านอาหาร คาเฟ่ และที่พักในจังหวัดนครราชสีมา พร้อมระบบกรองตามงบประมาณ",
};

export default function SignInPage() {
  return <SignInClient />;
}