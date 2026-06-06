"use client";

import { useState, useEffect } from "react";
import { Baby, ArrowLeft, Star } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import ChildInterpretation from "@/components/children/ChildInterpretation";
import NatalChartAltarView from "@/components/generate/NatalChartAltarView";
import PlanetTable from "@/components/generate/PlanetTable";
import { useAuth } from "@/components/AuthContext";
import { calcAgeYears } from "@/lib/prompts/child-v1";
import type { NatalChart } from "@/lib/astro-types";
import { getPersonalityTags } from "@/lib/personality-tags";

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

function getDominantElement(chart: NatalChart) {
  const counts: Record<string, number> = { "Ogień": 0, "Ziemia": 0, "Powietrze": 0, "Woda": 0 };
  chart.planets.forEach(p => { const el = ELEMENTS[p.sign]; if (el) counts[el]++; });
  const dominant = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
  return { label: dominant, ...ELEMENT_STYLE[dominant] };
}

type ChildData = {
  id: string;
  name: string;
  birth_date: string;
  birth_time: string;
  birth_place: string;
  chart_data: NatalChart;
  interpretation: string;
};

export default function ChildPage() {
  const { session } = useAuth();
  const params = useParams();
  const id = params?.id as string;

  const [child, setChild] = useState<ChildData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!session || !id) return;
    fetch("/api/get-children", {
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
      .then(r => r.json())
      .then(({ children }: { children: ChildData[] }) => {
        const found = children.find(c => c.id === id);
        if (found) setChild(found);
        else setError("Nie znaleziono karty dziecka");
      })
      .catch(() => setError("Błąd wczytywania"))
      .finally(() => setLoading(false));
  }, [session, id]);

  const ageYears = child ? calcAgeYears(child.birth_date) : 0;
  const city = child?.birth_place.split(",")[0] ?? "";

  return (
    <div className="min-h-screen text-white" style={{ background: "#050508" }}>
      <div className="fixed inset-0 star-bg pointer-events-none" aria-hidden="true" />
      <div aria-hidden="true" className="fixed top-0 left-1/2 -translate-x-1/2 w-[700px] h-[500px] pointer-events-none"
        style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(88,60,140,0.18) 0%, transparent 70%)", filter: "blur(2px)" }} />
      <Star className="fixed top-[18%] left-[6%] w-2 h-2 text-amber-400/40 animate-pulse pointer-events-none" style={{ animationDuration: "3.6s" }} />
      <Star className="fixed top-[55%] right-[5%] w-2 h-2 text-amber-400/40 animate-pulse pointer-events-none" style={{ animationDuration: "4.2s" }} />

      <Navbar />

      <main className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 pt-24 pb-20">
        <div className="mb-6">
          <Link
            href="/children"
            className="inline-flex items-center gap-2 text-slate-500 hover:text-white text-sm transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Powrót do kart dzieci
          </Link>
        </div>

        {loading && (
          <div className="rounded-2xl p-10 text-center" style={{ background: "rgba(5,4,14,0.65)", border: "0.5px solid rgba(212,175,55,0.14)" }}>
            <div className="w-8 h-8 rounded-full animate-spin border-t-2 mx-auto mb-3" style={{ borderColor: "transparent", borderTopColor: "#D4AF37" }} />
            <p className="text-slate-500 text-sm">Wczytuję…</p>
          </div>
        )}

        {error && (
          <div className="rounded-2xl p-8 text-center" style={{ background: "rgba(239,68,68,0.06)", border: "0.5px solid rgba(239,68,68,0.25)" }}>
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {child && !loading && (
          <div className="space-y-6">
            {/* Header */}
            <div className="rounded-2xl p-6" style={{ background: "rgba(5,4,14,0.72)", border: "0.5px solid rgba(212,175,55,0.18)", backdropFilter: "blur(24px)" }}>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "rgba(212,175,55,0.10)", border: "0.5px solid rgba(212,175,55,0.28)" }}>
                  <Baby className="w-6 h-6" style={{ color: "#D4AF37" }} />
                </div>
                <div className="flex-1 min-w-0">
                  <h1 className="text-2xl font-bold text-white mb-1"
                    style={{ fontFamily: "var(--font-cormorant), serif" }}>
                    {child.name}
                  </h1>
                  <p className="text-slate-500 text-sm">
                    {ageYears === 0 ? "poniżej roku" : `${ageYears} ${ageYears === 1 ? "rok" : ageYears < 5 ? "lata" : "lat"}`}
                    {" · "}{city}
                    {" · "}{child.birth_date}
                  </p>
                </div>
              </div>
            </div>

            {/* Chart — dark crystal altar view */}
            <NatalChartAltarView chart={child.chart_data} />

            {/* Dominant element badge */}
            <div className="flex justify-center">
              {(() => {
                const el = getDominantElement(child.chart_data);
                return (
                  <span className={`text-xs px-3 py-1 rounded-full border ${el.color}`}>
                    {el.emoji} Dominuje {el.label}
                  </span>
                );
              })()}
            </div>

            {/* Planet table */}
            <PlanetTable chart={child.chart_data} />

            {/* Personality tags */}
            {(() => {
              const tags = getPersonalityTags(child.chart_data);
              return tags.length > 0 ? (
                <div className="flex flex-wrap gap-2 justify-center">
                  {tags.map(tag => (
                    <span key={tag} className="px-3 py-1 rounded-full text-xs border border-amber-700/35 text-amber-200/80 bg-amber-900/15">
                      {tag}
                    </span>
                  ))}
                </div>
              ) : null;
            })()}

            <ChildInterpretation
              text={child.interpretation}
              childName={child.name}
            />
          </div>
        )}
      </main>
    </div>
  );
}
