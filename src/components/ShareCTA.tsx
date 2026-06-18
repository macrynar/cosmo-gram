"use client";

import Link from "next/link";
import { motion } from "framer-motion";

// ─── Floatujący pasek CTA na ekranach udostępniania ─────────────────────────
// Wspólny dla kosmogramu i synastrii — spójny z design systemem.

type Accent = "gold" | "rose";

const ACCENTS: Record<Accent, { glow: string; bg: string; color: string; shadow: string }> = {
  gold: {
    glow:   "rgba(212,175,55,0.18)",
    bg:     "linear-gradient(135deg, rgba(212,175,55,0.92), rgba(197,160,89,0.92))",
    color:  "#050508",
    shadow: "0 4px 20px rgba(212,175,55,0.22)",
  },
  rose: {
    glow:   "rgba(244,63,94,0.16)",
    bg:     "linear-gradient(135deg, #e11d48, #fb7185)",
    color:  "#ffffff",
    shadow: "0 4px 24px rgba(244,63,94,0.25)",
  },
};

export default function ShareCTA({
  text,
  href,
  label,
  icon,
  accent = "gold",
}: {
  text: string;
  href: string;
  label: string;
  icon?: React.ReactNode;
  accent?: Accent;
}) {
  const a = ACCENTS[accent];
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="fixed bottom-0 left-0 right-0 z-30 px-4 py-4"
      style={{
        background: "rgba(5,4,14,0.90)",
        backdropFilter: "blur(16px)",
        borderTop: "0.5px solid rgba(255,255,255,0.07)",
      }}
    >
      {/* górny akcent-glow */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-px"
        style={{ background: `linear-gradient(to right, transparent, ${a.glow}, transparent)` }}
      />
      <div className="max-w-xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        <p className="text-slate-400 text-sm text-center sm:text-left">{text}</p>
        <Link
          href={href}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all shadow-lg"
          style={{ background: a.bg, color: a.color, boxShadow: a.shadow }}
        >
          {icon}
          {label}
        </Link>
      </div>
    </motion.div>
  );
}
