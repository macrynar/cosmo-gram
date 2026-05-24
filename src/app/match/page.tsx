import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ROUTES, BRAND } from "@/lib/routes";
import { Heart } from "lucide-react";

export const metadata: Metadata = {
  title: "Cosmo Match — kompatybilność dwóch osób — Cosmogram",
  description: "Sprawdź astrologiczną kompatybilność dwóch osób. Cosmo Match analizuje synastrię — relacje planet, punkty zgodności i napięcia między kosmogramami.",
  alternates: { canonical: "https://cosmogram.pl/match" },
  openGraph: {
    title: "Cosmo Match — kompatybilność dwóch osób — Cosmogram",
    description: "Astrologiczna analiza kompatybilności par. Synastria dwóch kosmogramów w kilkanaście sekund.",
    url: "https://cosmogram.pl/match",
    images: [{ url: "https://cosmogram.pl/og-default.png", width: 1200, height: 630 }],
  },
};

export default function MatchPublicPage() {
  return (
    <div className="min-h-screen bg-[#03010d] text-white">
      <Navbar />
      <main className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 pt-28 pb-24">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-4 rounded-full border border-pink-500/30 bg-pink-900/20 text-pink-300 text-xs font-medium">
            <Heart className="w-3.5 h-3.5" />
            {BRAND.match}
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-white font-brand mb-4">
            Kompatybilność
            <br />
            <span className="bg-gradient-to-r from-pink-400 to-amber-300 bg-clip-text text-transparent">
              dwóch kosmogramów
            </span>
          </h1>
          <p className="text-slate-400 text-lg max-w-xl mx-auto">
            {BRAND.match} analizuje synastrię — wzajemne oddziaływanie planet dwóch osób. Więcej niż „Waga i Byk pasują" — pełna mapa relacji.
          </p>
          <Link
            href={ROUTES.public.signup.path}
            className="inline-flex items-center gap-2 mt-8 px-7 py-3.5 rounded-full bg-gradient-to-r from-pink-600 to-amber-600 text-white font-semibold hover:from-pink-500 hover:to-amber-500 transition-all shadow-lg shadow-pink-950/40"
          >
            <Heart className="w-4 h-4" />
            Sprawdź kompatybilność — bezpłatnie
          </Link>
        </div>

        <div className="glass-card rounded-2xl p-8 border border-pink-900/20 text-center">
          <p className="text-slate-500 text-sm">Pełna analiza dostępna po założeniu konta.</p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
