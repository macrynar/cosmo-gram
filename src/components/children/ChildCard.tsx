"use client";

import { Trash2, ChevronRight } from "lucide-react";
import Link from "next/link";
import { calcAgeYears } from "@/lib/prompts/child-v1";
import type { NatalChart } from "@/lib/astro-types";

type Props = {
  id: string;
  name: string;
  birthDate: string;
  birthPlace: string;
  chartData: NatalChart;
  onDelete: (id: string) => void;
};

export default function ChildCard({ id, name, birthDate, birthPlace, chartData, onDelete }: Props) {
  const ageYears = calcAgeYears(birthDate);
  const sun  = chartData.planets.find(p => p.name === "Słońce");
  const moon = chartData.planets.find(p => p.name === "Księżyc");
  const city = birthPlace.split(",")[0];

  const signBadge = (label: string, sign: string | undefined, color: string) =>
    sign ? (
      <span className={`text-xs px-2 py-0.5 rounded-full border ${color}`}>
        {label} {sign}
      </span>
    ) : null;

  function handleDelete(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (confirm(`Usunąć kartę ${name}?`)) onDelete(id);
  }

  const ascSign = chartData.ascendant != null
    ? (() => {
        const idx = Math.floor(chartData.ascendant / 30);
        const signs = ["Baran","Byk","Bliźnięta","Rak","Lew","Panna","Waga","Skorpion","Strzelec","Koziorożec","Wodnik","Ryby"];
        return signs[idx] ?? undefined;
      })()
    : undefined;

  return (
    <Link
      href={`/child/${id}`}
      className="group glass-card rounded-2xl p-5 border border-green-900/20 hover:border-green-700/40 transition-all duration-200 block"
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-white font-semibold text-lg" style={{ fontFamily: "'Cinzel', serif" }}>
            {name}
          </h3>
          <p className="text-slate-500 text-xs mt-0.5">
            {ageYears === 0 ? "poniżej roku" : `${ageYears} ${ageYears === 1 ? "rok" : ageYears < 5 ? "lata" : "lat"}`} · {city}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleDelete}
            className="text-slate-600 hover:text-red-400 transition-colors p-1 opacity-0 group-hover:opacity-100"
            title="Usuń"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-green-400 transition-colors" />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {signBadge("Słońce", sun?.sign, "border-amber-700/40 text-amber-300/80 bg-amber-900/10")}
        {signBadge("Księżyc", moon?.sign, "border-blue-700/40 text-blue-300/80 bg-blue-900/10")}
        {signBadge("Asc", ascSign, "border-green-700/40 text-green-300/80 bg-green-900/10")}
      </div>

      <p className="mt-3 text-xs text-slate-600">{birthDate}</p>
    </Link>
  );
}
