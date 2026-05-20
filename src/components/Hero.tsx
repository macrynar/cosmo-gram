"use client";

import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

export default function Hero() {
  return (
    <section
      id="hero"
      className="relative min-h-screen flex flex-col items-center justify-center pt-16 overflow-hidden"
    >
      <div className="absolute inset-0 star-bg" aria-hidden="true" />
      <div className="absolute inset-0 deep-space-stars" aria-hidden="true" />
      <div className="absolute inset-0 deep-space-stars layer-two" aria-hidden="true" />
      <div className="hero-celestial-motion" aria-hidden="true">
        <div className="hero-solar-core">
          <div className="hero-sun" />
          <div className="hero-orbit orbit-main">
            <span className="hero-planet planet-main" />
          </div>
          <div className="hero-orbit orbit-secondary">
            <span className="hero-planet planet-secondary" />
          </div>
          <div className="hero-orbit orbit-tertiary">
            <span className="hero-planet planet-tertiary" />
          </div>
        </div>
      </div>
      <div
        aria-hidden="true"
        className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[900px] h-[700px] nebula-orb opacity-60 pointer-events-none"
      />

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 text-center">
        <h1
          className="font-brand text-4xl sm:text-6xl lg:text-7xl font-semibold text-white leading-[1.05] mb-6"
        >
          Zrozum siebie i swoje relacje za pomocą gwiazd.
        </h1>

        <h2 className="max-w-3xl mx-auto text-base sm:text-xl text-slate-400 leading-relaxed mb-8 font-medium">
          Cosmogram używa precyzyjnych danych astronomicznych i AI, aby stworzyć głęboki, psychologiczny portret dla Ciebie i Twoich bliskich.
        </h2>

        <div className="mt-6">
          <Link
            href="/generate"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-semibold text-sm bg-gradient-to-r from-amber-700 to-amber-500 text-white shadow-lg shadow-amber-950/50 hover:shadow-amber-800/50 hover:scale-[1.03] active:scale-[0.98] transition-all duration-200"
          >
            <Sparkles className="w-4 h-4" />
            Odkryj swój kosmogram
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
