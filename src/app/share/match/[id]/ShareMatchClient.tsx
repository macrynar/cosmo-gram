"use client";

import Link from "next/link";
import Image from "next/image";
import { Star, Heart } from "lucide-react";
import CompatibilityResultView from "@/components/astro-match/CompatibilityResult";
import type { CompatibilityResult } from "@/app/api/astro-match/route";

type Props = {
  person1Name: string;
  person2Name: string;
  result: CompatibilityResult;
};

export default function ShareMatchClient({ person1Name, person2Name, result }: Props) {
  return (
    <div className="min-h-screen bg-[#03010d] text-white">
      <div className="fixed inset-0 star-bg pointer-events-none" aria-hidden="true" />
      <div aria-hidden="true" className="fixed top-0 left-1/2 -translate-x-1/2 w-[700px] h-[500px] nebula-orb opacity-30 pointer-events-none" />
      <Star className="fixed top-[22%] left-[6%] w-2 h-2 text-pink-400/40 animate-pulse pointer-events-none" style={{ animationDuration: "3.2s" }} />
      <Star className="fixed top-[60%] right-[5%] w-2 h-2 text-amber-400/40 animate-pulse pointer-events-none" style={{ animationDuration: "4.5s" }} />

      {/* Top bar — logo only */}
      <header className="relative z-10 flex items-center justify-center px-6 py-4 border-b border-white/5">
        <Link href="/" aria-label="Cosmogram">
          <Image
            src="/logo-b-refined.svg"
            alt="Cosmogram"
            width={200}
            height={50}
            priority
            className="h-[38px] w-auto [filter:brightness(0)_invert(1)] opacity-90"
          />
        </Link>
      </header>

      <main className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 pt-10 pb-32">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-4 rounded-full border border-pink-500/30 bg-pink-900/20 text-pink-300 text-xs font-medium tracking-wide">
            <Heart className="w-3.5 h-3.5 text-pink-400" />
            Analiza kompatybilności
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2 font-brand">
            {person1Name || "Osoba 1"}{" "}
            <span className="bg-gradient-to-r from-pink-400 to-amber-300 bg-clip-text text-transparent">×</span>{" "}
            {person2Name || "Osoba 2"}
          </h1>
        </div>

        <CompatibilityResultView
          result={result}
          person1Name={person1Name}
          person2Name={person2Name}
        />
      </main>

      {/* Sticky CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-20 bg-[#03010d]/90 backdrop-blur-md border-t border-white/8 px-4 py-4">
        <div className="max-w-xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-slate-400 text-sm text-center sm:text-left">
            Sprawdź swoją kompatybilność astrologiczną
          </p>
          <Link
            href="/astro-match"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-gradient-to-r from-pink-600 to-amber-600 text-white text-sm font-semibold hover:from-pink-500 hover:to-amber-500 transition-all shadow-lg shadow-amber-950/40 whitespace-nowrap"
          >
            <Heart className="w-4 h-4" />
            Sprawdź swój Astro Match — bezpłatnie
          </Link>
        </div>
      </div>
    </div>
  );
}
