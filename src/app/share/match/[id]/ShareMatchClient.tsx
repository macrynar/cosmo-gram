"use client";

import Link from "next/link";
import Image from "next/image";
import { Heart } from "lucide-react";
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
      <div aria-hidden="true" className="fixed top-0 left-1/2 -translate-x-1/2 w-[700px] h-[500px] pointer-events-none"
        style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(244,63,94,0.12) 0%, transparent 70%)" }} />

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
          <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-4 rounded-full text-xs font-medium tracking-wide"
            style={{ color: "#fb7185", background: "rgba(244,63,94,0.08)", border: "0.5px solid rgba(244,63,94,0.25)" }}>
            <Heart className="w-3.5 h-3.5 text-pink-400" />
            Analiza kompatybilności
          </div>
          <h1
            className="text-3xl sm:text-4xl font-semibold text-white mb-2"
            style={{ fontFamily: "var(--font-cormorant), serif" }}
          >
            {person1Name || "Osoba 1"}{" "}
            <span style={{
              background: "linear-gradient(135deg, #fb7185 0%, #FFAE3D 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}>
              ×
            </span>{" "}
            {person2Name || "Osoba 2"}
          </h1>
        </div>

        <CompatibilityResultView
          result={result}
          person1Name={person1Name}
          person2Name={person2Name}
          isPremiumUser={true}
          animate={false}
        />
      </main>

      {/* Sticky CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-20 px-4 py-4"
        style={{ background: "rgba(3,1,13,0.92)", backdropFilter: "blur(16px)", borderTop: "0.5px solid rgba(255,255,255,0.06)" }}>
        <div className="max-w-xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-slate-400 text-sm text-center sm:text-left">
            Sprawdź swoją kompatybilność astrologiczną
          </p>
          <Link
            href="/astro-match"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all"
            style={{
              background: "linear-gradient(135deg, #e11d48, #fb7185)",
              color: "white",
              boxShadow: "0 4px 24px rgba(244,63,94,0.25)",
            }}
          >
            <Heart className="w-4 h-4" />
            Sprawdź swój Cosmo Match — bezpłatnie
          </Link>
        </div>
      </div>
    </div>
  );
}
