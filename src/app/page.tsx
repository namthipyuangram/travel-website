import Navbar from "../component/User/Navbar";
import HeroSection from "../component/HeroSection";
import FeaturedDestinations from "../component/FeaturedDestinations";
import Footer from "../component/Footer";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-linear-to-b from-sky-100 to-white flex flex-col">
      <Navbar />
      <HeroSection />
      <FeaturedDestinations />
      <Footer />
    </div>
  );
}
