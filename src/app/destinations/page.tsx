// src/app/destinations/page.tsx
import Navbar from "@/component/User/Navbar";
import DestinationList from "../../component/User/DestinationList";

export default function DestinationsPage() {
  return (
    <>
    <Navbar/>
    <main className="max-w-6xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold text-emerald-700 mb-8">สถานที่ท่องเที่ยวในโคราช</h1>
      <DestinationList />
    </main>
    </>
  );
}
