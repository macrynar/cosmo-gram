import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PricingSection from "@/components/PricingSection";

export const metadata: Metadata = {
  title: "Cennik — Cosmogram",
  description: "Zacznij bezpłatnie i przejdź na pełną wersję, gdy chcesz więcej. Sprawdź plany Cosmogram — bez ukrytych kosztów.",
  alternates: { canonical: "https://cosmogram.pl/pricing" },
  openGraph: {
    title: "Cennik — Cosmogram",
    description: "Plan Free i Premium. Cosmogram — twój kosmiczny przewodnik.",
    url: "https://cosmogram.pl/pricing",
    images: [{ url: "https://cosmogram.pl/og-default.png", width: 1200, height: 630 }],
  },
};

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-[#03010d] text-white">
      <Navbar />
      <main className="pt-16">
        <PricingSection />
      </main>
      <Footer />
    </div>
  );
}
