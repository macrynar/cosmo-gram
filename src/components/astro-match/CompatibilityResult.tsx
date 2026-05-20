"use client";

import type { CompatibilityResult, CompatibilityCategory } from "@/app/api/astro-match/route";

const CATEGORY_ICONS: Record<string, string> = {
  "Komunikacja": "💬",
  "Namiętność": "🔥",
  "Wspólne wartości": "🌿",
  "Wyzwania": "⚡",
};

function ScoreRing({ score, size = 140 }: { score: number; size?: number }) {
  const r = (size - 16) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;

  const color =
    score >= 75 ? "#a78bfa" :
    score >= 50 ? "#f59e0b" :
    "#f87171";

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#1e1b4b" strokeWidth={8} />
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke={color} strokeWidth={8}
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 1s ease" }}
        />
      </svg>
      <div className="absolute text-center">
        <div className="text-3xl font-bold text-white" style={{ fontFamily: "'Cinzel', serif" }}>
          {score}
        </div>
        <div className="text-xs text-slate-400">/ 100</div>
      </div>
    </div>
  );
}

function CategoryCard({ cat }: { cat: CompatibilityCategory }) {
  const icon = CATEGORY_ICONS[cat.name] ?? "✦";
  const isChallenge = cat.name === "Wyzwania";
  const effectiveScore = isChallenge ? 100 - cat.score : cat.score;

  const barColor =
    effectiveScore >= 75 ? "bg-violet-500" :
    effectiveScore >= 50 ? "bg-amber-500" :
    "bg-red-500";

  return (
    <div className="glass-card rounded-2xl p-5 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-white flex items-center gap-2">
          <span>{icon}</span> {cat.name}
        </span>
        <span className="text-lg font-bold text-white" style={{ fontFamily: "'Cinzel', serif" }}>
          {cat.score}<span className="text-xs text-slate-500 font-normal">/100</span>
        </span>
      </div>

      <div className="h-1.5 bg-purple-950/60 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${barColor}`}
          style={{ width: `${cat.score}%` }}
        />
      </div>

      <p className="text-sm text-slate-300 leading-relaxed">{cat.interpretation}</p>

      <div className="pt-1 border-t border-purple-900/20">
        <p className="text-xs text-violet-400/80 leading-relaxed">
          <span className="font-semibold text-violet-400">→ </span>{cat.insight}
        </p>
      </div>
    </div>
  );
}

type Props = {
  result: CompatibilityResult;
  person1Name: string;
  person2Name: string;
};

export default function CompatibilityResultView({ result, person1Name, person2Name }: Props) {
  const label1 = person1Name || "Osoba 1";
  const label2 = person2Name || "Osoba 2";

  const overallLabel =
    result.overallScore >= 80 ? "Silna kompatybilność" :
    result.overallScore >= 60 ? "Dobra kompatybilność" :
    result.overallScore >= 40 ? "Umiarkowana kompatybilność" :
    "Wymagająca kompatybilność";

  return (
    <div className="space-y-8">
      {/* Overall score */}
      <div className="glass-card rounded-3xl p-8 text-center">
        <p className="text-xs text-slate-500 uppercase tracking-widest mb-2">Kompatybilność</p>
        <h2 className="text-lg font-semibold text-white mb-6" style={{ fontFamily: "'Cinzel', serif" }}>
          {label1} <span className="text-violet-400">×</span> {label2}
        </h2>

        <ScoreRing score={result.overallScore} />

        <p className="mt-4 text-sm font-medium text-violet-300">{overallLabel}</p>
        <p className="mt-3 text-sm text-slate-400 max-w-lg mx-auto leading-relaxed">
          {result.summary}
        </p>
      </div>

      {/* 4 categories */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {result.categories.map(cat => (
          <CategoryCard key={cat.name} cat={cat} />
        ))}
      </div>
    </div>
  );
}
