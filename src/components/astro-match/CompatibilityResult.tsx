"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Lock, MessageCircle, Flame, Heart, Zap, Clock } from "lucide-react";
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
      const ease = 1 - Math.pow(1 - t, 3);
      setDisplayed(Math.round(ease * score));
      if (t < 1) requestAnimationFrame(tick);
    };
    const id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, [score, animate]);

  const offset = circ - (displayed / 100) * circ;
  const color  = displayed >= 75 ? "#FFAE3D" : displayed >= 50 ? "#E0B566" : "#877FA0";

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(43,37,64,0.5)" strokeWidth={8} />
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

const CATEGORY_ICON: Record<string, React.ReactNode> = {
  "Komunikacja":      <MessageCircle className="w-3.5 h-3.5" />,
  "Namiętność":       <Flame         className="w-3.5 h-3.5" />,
  "Wspólne wartości": <Heart         className="w-3.5 h-3.5" />,
  "Wyzwania":         <Zap           className="w-3.5 h-3.5" />,
  "Długoterminowość": <Clock         className="w-3.5 h-3.5" />,
};

function CategoryCard({ cat, locked, onPaywall, delay = 0 }: {
  cat: CompatibilityCategory;
  locked?: boolean;
  onPaywall?: () => void;
  delay?: number;
}) {
  const isChallenge    = cat.name === "Wyzwania";
  const effectiveScore = isChallenge ? 100 - cat.score : cat.score;
  const barColor       = effectiveScore >= 70 ? "#FFAE3D" : effectiveScore >= 50 ? "#E0B566" : "#877FA0";
  const barGlow        = effectiveScore >= 70
    ? "0 0 10px rgba(255,174,61,0.35)"
    : effectiveScore >= 50
    ? "0 0 10px rgba(224,181,102,0.28)"
    : "none";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="relative glass-card rounded-2xl overflow-hidden"
      style={{ border: "0.5px solid rgba(255,174,61,0.10)" }}
    >
      <div className={locked ? "blur-sm select-none pointer-events-none p-5 space-y-4" : "p-5 space-y-4"}>

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{
                background: "rgba(255,174,61,0.10)",
                border: "0.5px solid rgba(255,174,61,0.22)",
                color: "#FFAE3D",
              }}
            >
              {CATEGORY_ICON[cat.name] ?? null}
            </div>
            <span className="text-sm font-semibold text-white">{cat.name}</span>
          </div>
          <div className="text-right">
            <span className="text-2xl font-bold font-brand" style={{ color: barColor }}>{cat.score}</span>
            <span className="text-xs ml-0.5" style={{ color: "rgba(255,255,255,0.25)" }}>/100</span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
          <motion.div
            className="h-full rounded-full"
            style={{ background: barColor, boxShadow: barGlow }}
            initial={{ width: 0 }}
            animate={{ width: `${effectiveScore}%` }}
            transition={{ delay: delay + 0.2, duration: 0.7, ease: "easeOut" }}
          />
        </div>

        {/* Interpretation */}
        <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.65)" }}>
          {cat.interpretation}
        </p>

        {/* Insight callout */}
        <div
          className="rounded-lg px-3 py-2.5"
          style={{
            background: "rgba(255,174,61,0.06)",
            borderLeft: "2px solid rgba(255,174,61,0.40)",
          }}
        >
          <p className="text-xs leading-relaxed" style={{ color: "#E0B566" }}>
            {cat.insight}
          </p>
        </div>
      </div>

      {locked && (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center gap-2.5 cursor-pointer rounded-2xl"
          style={{ background: "rgba(5,4,14,0.82)", backdropFilter: "blur(8px)" }}
          onClick={onPaywall}
        >
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ background: "rgba(255,174,61,0.10)", border: "0.5px solid rgba(255,174,61,0.30)" }}
          >
            <Lock className="w-4 h-4" style={{ color: "#FFAE3D" }} />
          </div>
          <p className="text-sm font-semibold" style={{ color: "#E0B566" }}>{cat.name}</p>
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.30)" }}>Dostępne w planie Plus</p>
          <div
            className="mt-1 px-4 py-1.5 rounded-full text-xs font-semibold"
            style={{ background: "rgba(255,174,61,0.10)", border: "0.5px solid rgba(255,174,61,0.28)", color: "#FFAE3D" }}
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

  // FAZA 3 reveal timing:
  // 0.0s  — wheel card fades in, planets A stagger (~2s internally)
  // 2.5s  — score card appears
  // 3.5s  — overall label + summary
  // 4.5s+ — category cards stagger
  const wheelDelay    = 0;
  const scoreDelay    = animate ? 2.5 : 0;
  const summaryDelay  = animate ? 3.5 : 0;
  const catBaseDelay  = animate ? 4.5 : 0;

  return (
    <div className="space-y-8">
      {/* ── Synastry wheel first (if available) ── */}
      {hasWheel && (
        <motion.div
          className="glass-card rounded-3xl p-6"
          initial={animate ? { opacity: 0, y: 16 } : false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: wheelDelay, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
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

      {/* ── Overall score ── */}
      <motion.div
        className="glass-card rounded-3xl p-8 text-center"
        initial={animate ? { opacity: 0, scale: 0.97 } : false}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: hasWheel ? scoreDelay : 0, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      >
        <p className="text-xs text-slate-500 uppercase tracking-widest mb-2">Kompatybilność</p>
        <h2 className="text-lg font-semibold text-white mb-6 font-brand">
          {label1} <span className="text-amber-400">×</span> {label2}
        </h2>

        <ScoreRing score={result.overallScore} animate={animate} />

        <motion.div
          initial={animate ? { opacity: 0 } : false}
          animate={{ opacity: 1 }}
          transition={{ delay: hasWheel ? summaryDelay : 0.4, duration: 0.5 }}
        >
          <p className="mt-4 text-sm font-medium text-amber-300">{overallLabel}</p>
          {result.summary && (
            <p className="mt-3 text-sm text-slate-400 max-w-lg mx-auto leading-relaxed">
              {result.summary}
            </p>
          )}
        </motion.div>
      </motion.div>

      {/* ── 5 category cards ── */}
      {result.categories.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {result.categories.map((cat, i) => (
            <CategoryCard
              key={cat.name}
              cat={cat}
              locked={!isPremiumUser && i > 0}
              onPaywall={onPaywall}
              delay={catBaseDelay + i * 0.12}
            />
          ))}
        </div>
      )}

      {/* ── Paywall nudge for free users ── */}
      {!isPremiumUser && result.categories.length > 0 && (
        <motion.div
          className="rounded-2xl p-5 text-center"
          style={{ background: "rgba(255,174,61,0.04)", border: "0.5px solid rgba(255,174,61,0.14)" }}
          initial={animate ? { opacity: 0 } : false}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.4 }}
        >
          <p className="text-sm text-slate-400 mb-3">
            Odblokuj <span style={{ color: "#FFAE3D" }}>Namiętność, Wspólne wartości, Wyzwania i Długoterminowość</span> — pełna analiza synastrii w planie Plus.
          </p>
          <button
            onClick={onPaywall}
            className="px-6 py-2.5 rounded-full text-sm font-semibold"
            style={{ background: "var(--grad-ember, linear-gradient(110deg,#F4A93D,#E07A2F))", color: "var(--on-accent, #201405)" }}
          >
            Przejdź na Plus →
          </button>
        </motion.div>
      )}
    </div>
  );
}
