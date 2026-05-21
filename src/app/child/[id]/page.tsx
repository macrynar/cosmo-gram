"use client";

import { useState, useEffect } from "react";
import { Baby, ArrowLeft, Star } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import ChildInterpretation from "@/components/children/ChildInterpretation";
import NatalChartSVG from "@/components/generate/NatalChartSVG";
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

  const sun  = child?.chart_data.planets.find(p => p.name === "Słońce");
  const moon = child?.chart_data.planets.find(p => p.name === "Księżyc");

  const ascSign = child?.chart_data.ascendant != null
    ? (() => {
        const idx = Math.floor(child.chart_data.ascendant / 30);
        const signs = ["Baran","Byk","Bliźnięta","Rak","Lew","Panna","Waga","Skorpion","Strzelec","Koziorożec","Wodnik","Ryby"];
        return signs[idx];
      })()
    : null;

  return (
    <div className="min-h-screen bg-[#03010d] text-white">
      <div className="fixed inset-0 star-bg pointer-events-none" aria-hidden="true" />
      <div aria-hidden="true" className="fixed top-0 left-1/2 -translate-x-1/2 w-[700px] h-[500px] opacity-20 pointer-events-none" style={{ background: "radial-gradient(ellipse at center, #064d2a 0%, transparent 70%)" }} />
      <Star className="fixed top-[18%] left-[6%] w-2 h-2 text-green-400/40 animate-pulse pointer-events-none" style={{ animationDuration: "3.6s" }} />

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
          <div className="glass-card rounded-2xl p-10 text-center">
            <div className="w-8 h-8 border-2 border-green-500/30 border-t-green-500 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-slate-500 text-sm">Wczytuję…</p>
          </div>
        )}

        {error && (
          <div className="glass-card rounded-2xl p-8 text-center border border-red-700/20">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {child && !loading && (
          <div className="space-y-6">
            {/* Header */}
            <div className="glass-card rounded-2xl p-6 border border-green-900/20">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-green-600/30 to-emerald-600/30 border border-green-700/30 flex items-center justify-center flex-shrink-0">
                  <Baby className="w-6 h-6 text-green-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h1 className="text-2xl font-bold text-white mb-1 font-brand">
                    {child.name}
                  </h1>
                  <p className="text-slate-500 text-sm">
                    {ageYears === 0 ? "poniżej roku" : `${ageYears} ${ageYears === 1 ? "rok" : ageYears < 5 ? "lata" : "lat"}`}
                    {" · "}{city}
                    {" · "}{child.birth_date}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mt-4">
                {sun && (
                  <span className="text-xs px-3 py-1 rounded-full border border-amber-700/40 text-amber-300/80 bg-amber-900/10">
                    ☉ {sun.sign}
                  </span>
                )}
                {moon && (
                  <span className="text-xs px-3 py-1 rounded-full border border-blue-700/40 text-blue-300/80 bg-blue-900/10">
                    ☽ {moon.sign}
                  </span>
                )}
                {ascSign && (
                  <span className="text-xs px-3 py-1 rounded-full border border-green-700/40 text-green-300/80 bg-green-900/10">
                    Asc {ascSign}
                  </span>
                )}
                {(() => {
                  const el = getDominantElement(child.chart_data);
                  return (
                    <span className={`text-xs px-3 py-1 rounded-full border ${el.color}`}>
                      {el.emoji} Dominuje {el.label}
                    </span>
                  );
                })()}
              </div>
            </div>

            {/* Personality tags */}
            {(() => {
              const tags = getPersonalityTags(child.chart_data);
              return tags.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {tags.map(tag => (
                    <span key={tag} className="px-3 py-1 rounded-full text-xs border border-slate-700/30 text-slate-400 bg-slate-800/30">
                      {tag}
                    </span>
                  ))}
                </div>
              ) : null;
            })()}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
              <div className="glass-card rounded-3xl p-4 sm:p-5 flex flex-col">
                <NatalChartSVG chart={child.chart_data} />
                {!child.chart_data.birthData?.timeUnknown && (
                  <div className="flex flex-wrap justify-center gap-3 text-xs text-slate-500 mt-4 pt-3 border-t border-green-900/15">
                    {[
                      { color: "bg-amber-400/60", label: "Koniunkcja (0°)" },
                      { color: "bg-green-400/60",  label: "Trygon (120°)" },
                      { color: "bg-red-400/60",    label: "Opozycja (180°)" },
                      { color: "bg-orange-400/60", label: "Kwadrat (90°)" },
                      { color: "bg-blue-400/60",   label: "Sekstyl (60°)" },
                    ].map(({ color, label }) => (
                      <span key={label} className="flex items-center gap-1.5">
                        <span className={`inline-block w-3 h-1.5 rounded-full ${color}`} />
                        {label}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="h-full"><PlanetTable chart={child.chart_data} /></div>
            </div>

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
