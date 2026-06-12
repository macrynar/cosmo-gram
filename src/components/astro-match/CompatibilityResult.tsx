"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Lock } from "lucide-react";
import type { CompatibilityResult, CompatibilityCategory } from "@/app/api/astro-match/route";
import SynastryWheel from "@/components/match/SynastryWheel";

// ─── Score ring ───────────────────────────────────────────────────────────────

function ScoreRing({ score, size = 140, animate = true }: { score: number; size?: number; animate?: boolean }) {
  const [displayed, setDisplayed] = useState(animate ? 0 : score);
  const r    = (size - 16) / 2;
  const circ = 2 * Math.PI * r;

  useEffect(() => {
    if (!animate) return;
    const start = Date.now();
    const dur   = 1200;
    const tick  = () => {
      const t = Math.min((Date.now() - start) / dur, 1);
      const ease = 1 - Math.pow(1 - t, 3); // ease-out-cubic
      setDisplayed(Math.round(ease * score));
      if (t < 1) requestAnimationFrame(tick);
    };
    const id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, [score, animate]);

  const offset = circ - (displayed / 100) * circ;
  const color  = displayed >= 75 ? "#a78bfa" : displayed >= 50 ? "#f59e0b" : "#f87171";

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
          style={{ transition: "stroke-dashoffset 0.1s linear, stroke 0.3s ease" }}
        />
      </svg>
      <div className="absolute text-center">
        <div className="text-3xl font-bold text-white font-brand">{displayed}</div>
        <div className="text-xs text-slate-400">/ 100</div>
      </div>
    </div>
  );
}

// ─── Category card ────────────────────────────────────────────────────────────

function CategoryCard({ cat, locked, onPaywall, delay = 0 }: {
  cat: CompatibilityCategory;
  locked?: boolean;
  onPaywall?: () => void;
  delay?: number;
}) {
  const icon: Record<string, string> = {
    "Komunikacja": "💬", "Namiętność": "🔥", "Wspólne wartości": "🌿",
    "Wyzwania": "⚡", "Długoterminowość": "⏳",
  };
  const isChallenge = cat.name === "Wyzwania";
  const effectiveScore = isChallenge ? 100 - cat.score : cat.score;
  const barColor = effectiveScore >= 70 ? "#a78bfa" : effectiveScore >= 50 ? "#f59e0b" : "#f87171";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="relative glass-card rounded-2xl p-5 space-y-3 overflow-hidden"
    >
      <div className={locked ? "blur-sm select-none pointer-events-none" : ""}>
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-white flex items-center gap-2">
            <span>{icon[cat.name] ?? "✦"}</span> {cat.name}
          </span>
          <span className="text-lg font-bold text-white font-brand">
            {cat.score}<span className="text-xs text-slate-500 font-normal">/100</span>
          </span>
        </div>

        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
          <motion.div
            className="h-full rounded-full"
            style={{ background: barColor }}
            initial={{ width: 0 }}
            animate={{ width: `${effectiveScore}%` }}
            transition={{ delay: delay + 0.2, duration: 0.7, ease: "easeOut" }}
          />
        </div>

        <p className="text-sm text-slate-300 leading-relaxed">{cat.interpretation}</p>

        <div className="pt-1 border-t border-amber-900/15">
          <p className="text-xs text-amber-400/80 leading-relaxed">
            <span className="font-semibold text-amber-400">→ </span>{cat.insight}
          </p>
        </div>
      </div>

      {locked && (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center gap-2.5 cursor-pointer rounded-2xl"
          style={{ background: "rgba(5,4,14,0.80)", backdropFilter: "blur(6px)" }}
          onClick={onPaywall}
        >
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ background: "rgba(244,63,94,0.12)", border: "0.5px solid rgba(244,63,94,0.38)" }}
          >
            <Lock className="w-4 h-4" style={{ color: "#fb7185" }} />
          </div>
          <p className="text-sm font-medium" style={{ color: "#fda4af", fontFamily: "var(--font-cormorant), serif" }}>
            {cat.name}
          </p>
          <p className="text-xs text-slate-500">Dostępne w planie Plus</p>
          <div
            className="px-3.5 py-1 rounded-full text-xs font-semibold"
            style={{ background: "rgba(244,63,94,0.10)", border: "0.5px solid rgba(244,63,94,0.30)", color: "#fb7185" }}
          >
            Odblokuj →
          </div>
        </div>
      )}
    </motion.div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

type Props = {
  result:         CompatibilityResult;
  person1Name:    string;
  person2Name:    string;
  isPremiumUser?: boolean;
  onPaywall?:     () => void;
  animate?:       boolean; // false in ?reveal=instant mode
};

export default function CompatibilityResultView({
  result,
  person1Name,
  person2Name,
  isPremiumUser = false,
  onPaywall,
  animate = true,
}: Props) {
  const label1 = person1Name || "Osoba 1";
  const label2 = person2Name || "Osoba 2";

  const overallLabel =
    result.overallScore >= 80 ? "Silna kompatybilność" :
    result.overallScore >= 60 ? "Dobra kompatybilność" :
    result.overallScore >= 40 ? "Umiarkowana kompatybilność" :
    "Wymagająca kompatybilność";

  const hasWheel = !!(result.aspects?.length && result.planetPositions);

  return (
    <div className="space-y-8">
      {/* ── Overall score ── */}
      <motion.div
        className="glass-card rounded-3xl p-8 text-center"
        initial={animate ? { opacity: 0, scale: 0.97 } : false}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      >
        <p className="text-xs text-slate-500 uppercase tracking-widest mb-2">Kompatybilność</p>
        <h2 className="text-lg font-semibold text-white mb-6 font-brand">
          {label1} <span className="text-amber-400">×</span> {label2}
        </h2>

        <ScoreRing score={result.overallScore} animate={animate} />

        <p className="mt-4 text-sm font-medium text-amber-300">{overallLabel}</p>
        {result.summary && (
          <p className="mt-3 text-sm text-slate-400 max-w-lg mx-auto leading-relaxed">
            {result.summary}
          </p>
        )}
      </motion.div>

      {/* ── Synastry wheel ── */}
      {hasWheel && (
        <motion.div
          className="glass-card rounded-3xl p-6"
          initial={animate ? { opacity: 0, y: 16 } : false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="text-xs text-slate-500 uppercase tracking-widest mb-5 text-center">
            Mapa aspektów
          </p>
          <SynastryWheel
            planetsA={result.planetPositions!.a}
            planetsB={result.planetPositions!.b}
            aspects={result.aspects!}
            nameA={label1}
            nameB={label2}
            animate={animate}
          />
        </motion.div>
      )}

      {/* ── 5 category cards ── */}
      {result.categories.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {result.categories.map((cat, i) => (
            <CategoryCard
              key={cat.name}
              cat={cat}
              locked={!isPremiumUser && i > 0}
              onPaywall={onPaywall}
              delay={animate ? 0.5 + i * 0.1 : 0}
            />
          ))}
        </div>
      )}

      {/* ── Paywall nudge for free users ── */}
      {!isPremiumUser && result.categories.length > 0 && (
        <motion.div
          className="rounded-2xl p-5 text-center"
          style={{ background: "rgba(244,63,94,0.05)", border: "0.5px solid rgba(244,63,94,0.18)" }}
          initial={animate ? { opacity: 0 } : false}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.4 }}
        >
          <p className="text-sm text-slate-400 mb-3">
            Odblokuj <span style={{ color: "#fb7185" }}>Namiętność, Wspólne wartości, Wyzwania i Długoterminowość</span> — pełna analiza synastrii w planie Plus.
          </p>
          <button
            onClick={onPaywall}
            className="px-6 py-2.5 rounded-full text-sm font-semibold"
            style={{ background: "linear-gradient(135deg, rgba(244,63,94,0.85), rgba(251,113,133,0.85))", color: "white" }}
          >
            Przejdź na Plus →
          </button>
        </motion.div>
      )}
    </div>
  );
}
