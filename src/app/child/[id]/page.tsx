"use client";

import { useState, useEffect } from "react";
import { Baby, ArrowLeft, Star } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import ChildInterpretation from "@/components/children/ChildInterpretation";
import { useAuth } from "@/components/AuthContext";
import { calcAgeYears } from "@/lib/prompts/child-v1";
import type { NatalChart } from "@/lib/astro-types";

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

      <main className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 pt-24 pb-20">
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
              </div>
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
