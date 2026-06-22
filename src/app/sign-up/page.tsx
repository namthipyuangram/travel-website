import { SignUpClient } from "./SignUpClient";

export const metadata = {
  title: "สมัครสมาชิก | เที่ยวตามงบโคราช",
  description:
    "เว็บไซต์แนะนำสถานที่ท่องเที่ยว ร้านอาหาร คาเฟ่ และที่พักในจังหวัดโคราช พร้อมระบบกรองตามงบประมาณที่คุณต้องการ",
};

export default function SignUpPage() {
  return <SignUpClient />;
}