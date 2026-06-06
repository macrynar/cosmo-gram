"use client";

import Link from "next/link";
import Image from "next/image";
import { Star } from "lucide-react";
import { CosmoIcon } from "@/components/CosmoIcon";
import NatalChartAltarView from "@/components/generate/NatalChartAltarView";
import PlanetTable from "@/components/generate/PlanetTable";
import Interpretation from "@/components/generate/Interpretation";
import { getPersonalityTags } from "@/lib/personality-tags";
import type { NatalChart } from "@/lib/astro-types";

const ELEMENTS: Record<string, string> = {
  "Baran": "Ogień", "Lew": "Ogień", "Strzelec": "Ogień",
  "Byk": "Ziemia", "Panna": "Ziemia", "Koziorożec": "Ziemia",
  "Bliźnięta": "Powietrze", "Waga": "Powietrze", "Wodnik": "Powietrze",
  "Rak": "Woda", "Skorpion": "Woda", "Ryby": "Woda",
};
const ELEMENT_STYLE: Record<string, { emoji: string; color: string }> = {
  "Ogień":     { emoji: "🔥", color: "border-red-800/30 text-red-300/80 bg-red-900/10" },
  "Ziemia":    { emoji: "🌿", color: "border-green-800/30 text-green-300/80 bg-green-900/10" },
  "Powietrze": { emoji: "💨", color: "border-sky-800/30 text-sky-300/80 bg-sky-900/10" },
  "Woda":      { emoji: "💧", color: "border-blue-800/30 text-blue-300/80 bg-blue-900/10" },
};

function getDominantElement(c: NatalChart) {
  const counts: Record<string, number> = { "Ogień": 0, "Ziemia": 0, "Powietrze": 0, "Woda": 0 };
  c.planets.forEach(p => { const el = ELEMENTS[p.sign]; if (el) counts[el]++; });
  const dominant = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
  return { label: dominant, ...ELEMENT_STYLE[dominant] };
}

type Props = {
  name: string;
  birthDate: string;
  birthTime: string;
  birthPlace: string;
  chart: NatalChart;
  interpretation: string;
};

export default function ShareReadingClient({ name, birthDate, birthTime, birthPlace, chart, interpretation }: Props) {
  const el   = getDominantElement(chart);
  const tags = getPersonalityTags(chart);

  return (
    <div className="min-h-screen text-white" style={{ background: "#050508" }}>
      <div className="fixed inset-0 star-bg pointer-events-none" aria-hidden="true" />
      <div aria-hidden="true" className="fixed top-0 left-1/2 -translate-x-1/2 w-[700px] h-[500px] pointer-events-none"
        style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(88,60,140,0.18) 0%, transparent 70%)", filter: "blur(2px)" }} />
      <Star className="fixed top-[18%] left-[8%] w-2 h-2 text-amber-400/40 animate-pulse pointer-events-none" style={{ animationDuration: "3.5s" }} />
      <Star className="fixed top-[55%] right-[4%] w-2 h-2 text-amber-400/40 animate-pulse pointer-events-none" style={{ animationDuration: "4s" }} />

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

      <main className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 pt-10 pb-36 space-y-6">
        {/* Heading */}
        <div className="text-center">
          <p className="text-[10px] uppercase tracking-[0.30em] mb-2" style={{ color: "rgba(212,175,55,0.60)" }}>
            Kosmogram Natalny
          </p>
          <h1
            className="text-3xl sm:text-4xl font-medium text-white mb-4"
            style={{ fontFamily: "var(--font-cormorant), serif" }}
          >
            {name || "Kosmogram"}
          </h1>
          <div className="flex flex-wrap items-center justify-center gap-2 text-xs">
            <span className="px-3 py-1 rounded-full text-slate-400" style={{ background: "rgba(212,175,55,0.07)", border: "0.5px solid rgba(212,175,55,0.18)" }}>
              📅 {birthDate}
            </span>
            {birthTime && !chart.birthData?.timeUnknown && (
              <span className="px-3 py-1 rounded-full text-slate-400" style={{ background: "rgba(212,175,55,0.07)", border: "0.5px solid rgba(212,175,55,0.18)" }}>
                🕐 {birthTime}
              </span>
            )}
            <span className="px-3 py-1 rounded-full text-slate-400 max-w-[240px] truncate" style={{ background: "rgba(212,175,55,0.07)", border: "0.5px solid rgba(212,175,55,0.18)" }}>
              📍 {birthPlace}
            </span>
          </div>
        </div>

        {/* Dark crystal altar view */}
        <NatalChartAltarView chart={chart} />

        {/* Dominant element */}
        <div className="flex justify-center">
          <span className={`text-xs px-3 py-1 rounded-full border ${el.color}`}>
            {el.emoji} Dominuje {el.label}
          </span>
        </div>

        {/* Planet table */}
        <PlanetTable chart={chart} />

        {/* Personality tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap items-center justify-center gap-2">
            {tags.map(tag => (
              <span key={tag} className="px-3 py-1 rounded-full text-xs border border-amber-700/35 text-amber-200/80 bg-amber-900/15">
                {tag}
              </span>
            ))}
          </div>
        )}

        <Interpretation text={interpretation} loading={false} />
      </main>

      {/* Sticky CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-20 backdrop-blur-md border-t border-white/8 px-4 py-4"
        style={{ background: "rgba(5,4,14,0.90)" }}>
        <div className="max-w-xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-slate-400 text-sm text-center sm:text-left">
            Chcesz poznać swój kosmogram?
          </p>
          <Link
            href="/generate"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-white text-sm font-semibold transition-all shadow-lg whitespace-nowrap"
            style={{
              background: "linear-gradient(135deg, rgba(212,175,55,0.92), rgba(197,160,89,0.92))",
              color: "#050508",
              boxShadow: "0 4px 20px rgba(212,175,55,0.20)",
            }}
          >
            <CosmoIcon className="w-4 h-4" />
            Stwórz swój kosmogram — bezpłatnie
          </Link>
        </div>
      </div>
    </div>
  );
}
