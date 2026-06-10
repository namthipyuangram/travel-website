import Navbar from "../../component/User/Navbar";
import HeroSection from "../../component/HeroSection";
import CategorySection from "../../component/User/CategorySection";
import DestinationList from "../../component/User/DestinationList";
import Footer from "../../component/Footer";

export default async function DashboardPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <Navbar />
      <HeroSection />

      <section className="min-w-7xl mx-auto px-4 py-8 bg-gradient-to-br from-amber-50 to-orange-50">
        <CategorySection />
        <DestinationList />
      </section>

      <Footer />
    </main>
  );
}