import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import TrustBand from "@/components/TrustBand";
import Features from "@/components/Features";
import HowItWorks from "@/components/HowItWorks";
import BottomCTA from "@/components/BottomCTA";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#03010d] text-white">
      <Navbar />
      <main>
        <Hero />
        <TrustBand />
        <Features />
        <HowItWorks />
        <BottomCTA />
      </main>
      <Footer />
    </div>
  );
}
