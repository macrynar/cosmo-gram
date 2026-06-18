import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ROUTES } from "@/lib/routes";

export const metadata: Metadata = {
  title: "Kosmogram dziecka — Cosmogram",
  description: "Stwórz kosmogram natalny dla swojego dziecka. Zrozum jego temperament, potrzeby emocjonalne i naturalne talenty przez pryzmat astrologii.",
  alternates: { canonical: "https://www.cosmo-gram.com/for-kids" },
  openGraph: {
    title: "Kosmogram dziecka — Cosmogram",
    description: "Zrozum swoje dziecko głębiej — kosmogram natalny dopasowany do potrzeb rodziców.",
    url: "https://www.cosmo-gram.com/for-kids",
    images: [{ url: "https://www.cosmo-gram.com/og-default.png", width: 1200, height: 630 }],
  },
};

export default function ForKidsPage() {
  return (
    <div className="min-h-screen bg-[#03010d] text-white">
      <Navbar />
      <main className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 pt-28 pb-24">
        <div className="text-center mb-12">
          <p className="text-slate-500 text-xs tracking-widest uppercase mb-3">Dla rodziców</p>
          <h1 className="text-4xl sm:text-5xl font-bold text-white font-brand mb-4">
            Kosmogram dziecka
          </h1>
          <p className="text-slate-400 text-lg max-w-xl mx-auto">
            Każde dziecko przychodzi na świat z unikalnym temperamentem. Kosmogram natalny pomaga zrozumieć potrzeby emocjonalne, styl uczenia się i naturalne talenty Twojego dziecka.
          </p>
          <Link
            href={ROUTES.public.signup.path}
            className="inline-flex items-center gap-2 mt-8 px-7 py-3.5 rounded-full bg-gradient-to-r from-amber-600 to-amber-500 text-white font-semibold hover:from-amber-500 hover:to-amber-400 transition-all shadow-lg shadow-amber-950/40"
          >
            Stwórz kosmogram dziecka — bezpłatnie
          </Link>
        </div>
        <div className="glass-card rounded-2xl p-8 border border-amber-900/20 text-center">
          <p className="text-slate-500 text-sm">Funkcja dostępna po założeniu konta.</p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
