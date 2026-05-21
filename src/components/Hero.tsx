"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

function CosmogramSignet({ className }: { className?: string }) {
  return (
    <svg
      viewBox="-24 -24 48 48"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M 12.67,-17.99 A 22,22 0 1,0 12.67,17.99 A 18,18 0 1,1 12.67,-17.99 Z"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="0.5"
        strokeLinejoin="round"
      />
      <circle cx="4" cy="0" r="4" fill="currentColor" />
    </svg>
  );
}

export default function Hero() {
  return (
    <section
      id="hero"
      className="relative min-h-screen flex flex-col items-center justify-center pt-16 overflow-hidden"
    >
      {/* Star layers */}
      <div className="absolute inset-0 star-bg" aria-hidden="true" />
      <div className="absolute inset-0 deep-space-stars" aria-hidden="true" />
      <div className="absolute inset-0 deep-space-stars layer-two" aria-hidden="true" />
      <div className="absolute inset-0 deep-space-stars layer-three" aria-hidden="true" />
      <div className="absolute inset-0 deep-space-stars layer-four" aria-hidden="true" />
      <div className="absolute inset-0 star-sparkle" aria-hidden="true" />
      <div className="absolute inset-0 star-sparkle delay-1" aria-hidden="true" />
      <div className="absolute inset-0 star-sparkle delay-2" aria-hidden="true" />

      {/* Solar glow layers — radiate from sun center */}
      <div aria-hidden="true" className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse 30% 25% at 50% 50%, rgba(250,200,80,0.13) 0%, transparent 100%)" }} />
      <div aria-hidden="true" className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse 55% 45% at 50% 50%, rgba(215,140,40,0.08) 0%, transparent 100%)" }} />
      <div aria-hidden="true" className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse 85% 70% at 50% 50%, rgba(180,90,20,0.05) 0%, transparent 100%)" }} />

      {/* Solar system animation */}
      <div className="hero-celestial-motion" aria-hidden="true">
        <div className="hero-solar-core">
          <div className="hero-sun" />
          <div className="hero-orbit orbit-mercury"><span className="hero-planet planet-mercury" /></div>
          <div className="hero-orbit orbit-venus"><span className="hero-planet planet-venus" /></div>
          <div className="hero-orbit orbit-earth"><span className="hero-planet planet-earth" /></div>
          <div className="hero-orbit orbit-mars"><span className="hero-planet planet-mars" /></div>
          <div className="hero-orbit orbit-jupiter"><span className="hero-planet planet-jupiter" /></div>
          <div className="hero-orbit orbit-saturn"><span className="hero-planet planet-saturn" /></div>
          <div className="hero-orbit orbit-uranus"><span className="hero-planet planet-uranus" /></div>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 text-center">
        <h1 className="font-brand text-4xl sm:text-6xl lg:text-7xl font-semibold text-white leading-[1.05] mb-6">
          Zrozum siebie i swoje relacje za pomocą gwiazd.
        </h1>

        <h2 className="max-w-3xl mx-auto text-base sm:text-xl text-slate-400 leading-relaxed mb-8 font-medium">
          Cosmogram używa precyzyjnych danych astronomicznych i AI, aby stworzyć głęboki, psychologiczny portret dla Ciebie i Twoich bliskich.
        </h2>

        <div className="mt-6">
          <Link
            href="/generate"
            className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-full font-semibold text-sm bg-gradient-to-r from-amber-700 to-amber-500 text-white shadow-lg shadow-amber-950/50 hover:shadow-amber-800/50 hover:scale-[1.03] active:scale-[0.98] transition-all duration-200"
          >
            <CosmogramSignet className="w-4 h-4" />
            Odkryj swój kosmogram
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
