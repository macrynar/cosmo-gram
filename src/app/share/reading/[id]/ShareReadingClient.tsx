"use client";

import Link from "next/link";
import Image from "next/image";
import { Star } from "lucide-react";
import { CosmoIcon } from "@/components/CosmoIcon";
import NatalChartSVG from "@/components/generate/NatalChartSVG";
import PlanetTable from "@/components/generate/PlanetTable";
import Interpretation from "@/components/generate/Interpretation";
import { getPersonalityTags } from "@/lib/personality-tags";
import type { NatalChart } from "@/lib/astro-types";

type Props = {
  name: string;
  birthDate: string;
  birthTime: string;
  birthPlace: string;
  chart: NatalChart;
  interpretation: string;
};

function getDominantElement(c: NatalChart): { label: string; emoji: string; color: string } {
  const ELEMENTS: Record<string, string> = {
    "Baran": "Ogień", "Lew": "Ogień", "Strzelec": "Ogień",
    "Byk": "Ziemia", "Panna": "Ziemia", "Koziorożec": "Ziemia",
    "Bliźnięta": "Powietrze", "Waga": "Powietrze", "Wodnik": "Powietrze",
    "Rak": "Woda", "Skorpion": "Woda", "Ryby": "Woda",
  };
  const counts: Record<string, number> = { "Ogień": 0, "Ziemia": 0, "Powietrze": 0, "Woda": 0 };
  c.planets.forEach(p => { const el = ELEMENTS[p.sign]; if (el) counts[el]++; });
  const dominant = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
  const map: Record<string, { emoji: string; color: string }> = {
    "Ogień":     { emoji: "🔥", color: "border-red-800/30 text-red-300/80 bg-red-900/10" },
    "Ziemia":    { emoji: "🌿", color: "border-green-800/30 text-green-300/80 bg-green-900/10" },
    "Powietrze": { emoji: "💨", color: "border-sky-800/30 text-sky-300/80 bg-sky-900/10" },
    "Woda":      { emoji: "💧", color: "border-blue-800/30 text-blue-300/80 bg-blue-900/10" },
  };
  return { label: dominant, ...map[dominant] };
}

export default function ShareReadingClient({ name, birthDate, birthTime, birthPlace, chart, interpretation }: Props) {
  const sun  = chart.planets.find(p => p.name === "Słońce");
  const moon = chart.planets.find(p => p.name === "Księżyc");
  const el   = getDominantElement(chart);
  const tags = getPersonalityTags(chart);

  return (
    <div className="min-h-screen bg-[#03010d] text-white">
      <div className="fixed inset-0 star-bg pointer-events-none" aria-hidden="true" />
      <div aria-hidden="true" className="fixed top-0 left-1/2 -translate-x-1/2 w-[700px] h-[500px] nebula-orb opacity-40 pointer-events-none" />
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

      <main className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 pt-10 pb-36">
        {/* Heading */}
        <div className="mb-8 text-center">
          <p className="text-slate-500 text-xs mb-2 tracking-widest uppercase">Kosmogram Natalny</p>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4 font-brand">{name || "Kosmogram"}</h1>
          <div className="flex flex-wrap items-center justify-center gap-2 text-xs">
            <span className="px-3 py-1 rounded-full bg-amber-900/15 border border-amber-800/25 text-slate-400">
              📅 {birthDate}
            </span>
            {birthTime && !chart.birthData?.timeUnknown && (
              <span className="px-3 py-1 rounded-full bg-amber-900/15 border border-amber-800/25 text-slate-400">
                🕐 {birthTime}
              </span>
            )}
            <span className="px-3 py-1 rounded-full bg-amber-900/15 border border-amber-800/25 text-slate-400 max-w-[240px] truncate">
              📍 {birthPlace}
            </span>
          </div>
        </div>

        {/* Chart + table */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch mb-6">
          <div className="glass-card rounded-3xl p-4 sm:p-5 flex flex-col">
            <NatalChartSVG chart={chart} />

            {/* Sun / Moon / element */}
            <div className="flex flex-wrap items-center justify-center gap-2 mt-4 pt-3 border-t border-amber-900/15">
              {sun && (
                <span className="px-3 py-1 rounded-full text-xs border border-amber-700/40 text-amber-200/90 bg-amber-900/15">
                  ☀️ {sun.sign}
                </span>
              )}
              {moon && (
                <span className="px-3 py-1 rounded-full text-xs border border-slate-700/40 text-slate-300/80 bg-slate-900/20">
                  🌙 {moon.sign}
                </span>
              )}
              <span className={`px-3 py-1 rounded-full text-xs border ${el.color}`}>
                {el.emoji} Dominuje {el.label}
              </span>
            </div>
          </div>
          <div className="h-full"><PlanetTable chart={chart} /></div>
        </div>

        {/* Personality tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
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
      <div className="fixed bottom-0 left-0 right-0 z-20 bg-[#03010d]/90 backdrop-blur-md border-t border-white/8 px-4 py-4">
        <div className="max-w-xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-slate-400 text-sm text-center sm:text-left">
            Chcesz poznać swój kosmogram?
          </p>
          <Link
            href="/generate"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-gradient-to-r from-amber-600 to-amber-500 text-white text-sm font-semibold hover:from-amber-500 hover:to-amber-400 transition-all shadow-lg shadow-amber-950/40 whitespace-nowrap"
          >
            <CosmoIcon className="w-4 h-4" />
            Stwórz swój kosmogram — bezpłatnie
          </Link>
        </div>
      </div>
    </div>
  );
}
