import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import HowItWorks from "@/components/HowItWorks";
import PricingSection from "@/components/PricingSection";
import FAQSection from "@/components/FAQSection";
import BottomCTA from "@/components/BottomCTA";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <div className="relative min-h-screen bg-[#03010d] text-white overflow-x-clip">
      <Navbar />
      <main className="relative z-10">
        <Hero />
        <Features />
        <HowItWorks />
        <PricingSection />
        <FAQSection />
        <BottomCTA />
      </main>
      <Footer />
    </div>
  );
}
