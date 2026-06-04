"use client";

import { motion } from "framer-motion";
import { Lock } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { AstroModule } from "@/lib/schemas/astroModule";

const MODULE_EMOJI: Record<string, string> = {
  core:        "✦",
  superpowers: "⚡",
  childhood:   "🌱",
  love:        "❤️",
  career:      "🚀",
  shadows:     "🌑",
  roots:       "🌌",
  purpose:     "🌟",
};

function meterGradient(value: number): string {
  if (value >= 80) return "linear-gradient(to right, #5B2C8F, #D4AF37)";
  if (value >= 55) return "linear-gradient(to right, #3b1f6e, #8b5cf6)";
  return "linear-gradient(to right, #1e1433, #4c3080)";
}

interface Props {
  module:        AstroModule;
  isPremiumUser: boolean;
  index:         number;
  onPaywall?:    () => void;
}

export default function ModuleCard({ module, isPremiumUser, index, onPaywall }: Props) {
  const isLocked = module.isPremium && !isPremiumUser;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="relative rounded-2xl"
      style={{
        background:    "rgba(5,4,14,0.65)",
        border:        `0.5px solid rgba(212,175,55,${isLocked ? "0.09" : "0.18"})`,
        backdropFilter: "blur(18px)",
      }}
    >
      {/* ── Content ── */}
      <div className={`p-5 sm:p-6 space-y-5 ${isLocked ? "blur-sm select-none pointer-events-none" : ""}`}>

        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-base">{MODULE_EMOJI[module.id]}</span>
              <p className="text-[10px] uppercase tracking-[0.24em] font-medium" style={{ color: "rgba(212,175,55,0.60)" }}>
                {module.title}
              </p>
            </div>
            <p
              className="text-xl sm:text-2xl text-white/90 italic leading-snug"
              style={{ fontFamily: "var(--font-cormorant), serif" }}
            >
              &ldquo;{module.quote}&rdquo;
            </p>
          </div>
          {module.confidenceScore < 80 && (
            <div
              className="shrink-0 mt-0.5 text-[9px] px-2 py-0.5 rounded-full whitespace-nowrap"
              title={`Pewność interpretacji: ${module.confidenceScore}%. Podanie godziny urodzenia podwyższy wynik.`}
              style={{ background: "rgba(212,175,55,0.07)", color: "rgba(212,175,55,0.45)", border: "0.5px solid rgba(212,175,55,0.18)", cursor: "help" }}
            >
              {module.confidenceScore}%
            </div>
          )}
        </div>

        {/* Gold divider */}
        <div className="h-px" style={{ background: "linear-gradient(to right, transparent, rgba(212,175,55,0.18), transparent)" }} />

        {/* Visual Meters */}
        <div className="space-y-3.5">
          {module.visualMeters.map((meter, i) => (
            <div key={i}>
              <div className="flex justify-between items-baseline mb-1.5">
                <span className="text-xs text-slate-400">{meter.label}</span>
                <span className="text-[10px] tabular-nums" style={{ color: "rgba(212,175,55,0.50)" }}>{meter.value}</span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
                <motion.div
                  className="h-full rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${meter.value}%` }}
                  transition={{ duration: 0.8, delay: index * 0.07 + i * 0.1 + 0.35, ease: "easeOut" }}
                  style={{ background: meterGradient(meter.value) }}
                />
              </div>
              <p className="text-[10px] text-slate-600 mt-1 italic">{meter.archetype}</p>
            </div>
          ))}
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5">
          {module.tags.map(tag => (
            <span
              key={tag}
              className="px-2.5 py-0.5 rounded-full text-[11px] font-medium"
              style={{ background: "rgba(212,175,55,0.07)", border: "0.5px solid rgba(212,175,55,0.26)", color: "#F3E5AB" }}
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Content (markdown) */}
        <div
          className="text-sm text-slate-300 leading-relaxed space-y-3"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              p:      ({ children }) => <p className="mt-0">{children}</p>,
              strong: ({ children }) => <strong className="text-white font-semibold">{children}</strong>,
            }}
          >
            {module.content}
          </ReactMarkdown>
        </div>

        {/* Tactics */}
        <div>
          <p className="text-[10px] uppercase tracking-[0.22em] font-medium mb-3" style={{ color: "rgba(212,175,55,0.48)" }}>
            Działania
          </p>
          <div className="space-y-2.5">
            {module.tactics.map((tactic, i) => (
              <div key={i} className="flex items-start gap-3">
                <span
                  className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold mt-0.5"
                  style={{ background: "rgba(212,175,55,0.10)", color: "#D4AF37", border: "0.5px solid rgba(212,175,55,0.28)" }}
                >
                  {i + 1}
                </span>
                <p className="text-sm text-slate-300 leading-relaxed">{tactic}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Premium lock overlay ── */}
      {isLocked && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-2xl cursor-pointer"
          style={{ background: "rgba(5,4,14,0.82)", backdropFilter: "blur(6px)" }}
          onClick={onPaywall}
        >
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ background: "rgba(212,175,55,0.12)", border: "0.5px solid rgba(212,175,55,0.38)" }}
          >
            <Lock className="w-4 h-4" style={{ color: "#D4AF37" }} />
          </div>
          <p
            className="text-base font-medium"
            style={{ color: "#F3E5AB", fontFamily: "var(--font-cormorant), serif" }}
          >
            {module.title}
          </p>
          <p className="text-xs text-slate-500">Dostępne w planie Plus</p>
          <div
            className="mt-1 px-4 py-1.5 rounded-full text-xs font-semibold"
            style={{ background: "rgba(212,175,55,0.12)", border: "0.5px solid rgba(212,175,55,0.35)", color: "#D4AF37" }}
          >
            Odblokuj →
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
