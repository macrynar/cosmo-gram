"use client";

import Link from "next/link";
import { ArrowRight, Sparkles, Star, Zap } from "lucide-react";

export default function BottomCTA() {
  return (
    <section id="join" aria-labelledby="cta-heading" className="relative py-24 sm:py-36 overflow-hidden">
      <div aria-hidden="true" className="absolute inset-0 star-bg opacity-50 pointer-events-none" />
      <div aria-hidden="true" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] nebula-orb opacity-80 pointer-events-none" />

      <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-8 rounded-full border border-amber-700/40 bg-amber-900/10 text-amber-300 text-xs font-medium tracking-wide">
          <Zap className="w-3 h-3 fill-amber-400" />
          Startuj od razu w planie Free
          <Zap className="w-3 h-3 fill-amber-400" />
        </div>

        <h2 id="cta-heading" className="font-brand text-3xl sm:text-5xl lg:text-6xl font-semibold text-white leading-tight mb-6">
          Odkryj, co Twój kosmogram mówi o Tobie.
        </h2>

        <p className="text-base sm:text-xl text-slate-400 leading-relaxed mb-10 max-w-xl mx-auto">
          Zacznij od darmowego kosmogramu. Gdy chcesz więcej — Astro Match, Horoskop Dziecka i pełny Astro Chat — jeden klik do Premium.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link href="/generate" className="inline-flex items-center justify-center gap-2 px-7 py-4 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-amber-700 to-amber-500 hover:from-amber-600 hover:to-amber-400 shadow-xl shadow-amber-950/40 hover:shadow-amber-800/40 transition-all duration-200 glow-nebula whitespace-nowrap">
            Generuj kosmogram
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link href="#pricing" className="inline-flex items-center justify-center gap-2 px-7 py-4 rounded-xl font-semibold text-sm text-slate-200 bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-200 whitespace-nowrap">
            Porównaj plany
          </Link>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 mt-5 text-xs text-slate-600">
          <span className="flex items-center gap-1"><span className="w-1 h-1 rounded-full bg-green-500" /> Free bez opłat</span>
          <span className="flex items-center gap-1"><span className="w-1 h-1 rounded-full bg-green-500" /> Upgrade w 1 kliknięcie</span>
          <span className="flex items-center gap-1"><span className="w-1 h-1 rounded-full bg-green-500" /> Bez zobowiązań</span>
        </div>

        <div className="mt-8 flex items-center justify-center gap-2 text-xs text-slate-500">
          <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
          Zacznij za darmo. Płać tylko jeśli zostaniesz.
          <Sparkles className="w-3 h-3 text-amber-300" />
        </div>
      </div>

      <div aria-hidden="true" className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-[#03010d] to-transparent pointer-events-none" />
      <div aria-hidden="true" className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-[#03010d] to-transparent pointer-events-none" />
    </section>
  );
}
