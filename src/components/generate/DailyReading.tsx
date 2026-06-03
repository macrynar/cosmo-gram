"use client";

import { motion } from "framer-motion";
import { CalendarDays, Loader2, Sun, Zap, ShieldAlert, Quote } from "lucide-react";
import type { DailyReadingData } from "@/app/api/daily-reading/route";

interface Props {
  text: string;
  loading: boolean;
  dateLabel: string;
}

function parseReading(text: string): DailyReadingData | null {
  if (!text) return null;
  try {
    return JSON.parse(text) as DailyReadingData;
  } catch {
    return {
      headline: "Dzienny horoskop",
      theme: "",
      insight: text.replace(/#{1,3} .*/g, "").replace(/\*\*/g, "").trim().slice(0, 400),
      action: "",
      avoid: "",
      mantra: "",
    };
  }
}

export default function DailyReading({ text, loading, dateLabel }: Props) {
  const reading = parseReading(text);

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: "rgba(5,4,14,0.65)",
        border: "0.5px solid rgba(212,175,55,0.18)",
        backdropFilter: "blur(18px)",
      }}
    >
      {/* Header */}
      <div
        className="px-5 py-3.5 flex items-center justify-between gap-3"
        style={{ borderBottom: "0.5px solid rgba(212,175,55,0.10)" }}
      >
        <div className="flex items-center gap-2">
          <Sun className="w-4 h-4" style={{ color: "#D4AF37" }} />
          <span className="text-xs font-semibold text-slate-400 tracking-widest uppercase">Dzienny horoskop</span>
        </div>
        <span className="inline-flex items-center gap-1 text-[11px] text-slate-500">
          <CalendarDays className="w-3.5 h-3.5" />
          {dateLabel}
        </span>
      </div>

      {/* Body */}
      <div className="px-5 pb-6 pt-5">
        {loading ? (
          <div className="flex flex-col items-center gap-3 text-slate-500 py-12">
            <Loader2 className="w-5 h-5 animate-spin" style={{ color: "#D4AF37" }} />
            <span className="text-xs">AI oblicza tranzyty i układa horoskop…</span>
          </div>
        ) : !reading ? (
          <p className="text-sm text-slate-500">
            Dzienny horoskop pojawi się tutaj po wygenerowaniu kosmogramu.
          </p>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-5"
          >
            {/* Headline */}
            <div>
              <h3
                className="text-lg sm:text-xl font-bold text-white leading-snug"
                style={{ fontFamily: "var(--font-cormorant), serif" }}
              >
                {reading.headline}
              </h3>
              {reading.theme && (
                <p className="mt-1.5 text-sm leading-relaxed" style={{ color: "rgba(212,175,55,0.75)" }}>
                  {reading.theme}
                </p>
              )}
            </div>

            {/* Divider */}
            <div className="altar-divider" />

            {/* Insight */}
            {reading.insight && (
              <p className="text-slate-300 text-sm leading-7">{reading.insight}</p>
            )}

            {/* Action + Avoid */}
            {(reading.action || reading.avoid) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {reading.action && (
                  <div
                    className="flex gap-3 p-3.5 rounded-xl"
                    style={{ background: "rgba(16,185,129,0.08)", border: "0.5px solid rgba(16,185,129,0.20)" }}
                  >
                    <Zap className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[10px] font-semibold text-emerald-400/70 uppercase tracking-wider mb-1">Dziś zrób</p>
                      <p className="text-sm text-slate-300 leading-relaxed">{reading.action}</p>
                    </div>
                  </div>
                )}
                {reading.avoid && (
                  <div
                    className="flex gap-3 p-3.5 rounded-xl"
                    style={{ background: "rgba(212,175,55,0.06)", border: "0.5px solid rgba(212,175,55,0.18)" }}
                  >
                    <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "rgba(212,175,55,0.65)" }} />
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: "rgba(212,175,55,0.55)" }}>Dziś unikaj</p>
                      <p className="text-sm text-slate-300 leading-relaxed">{reading.avoid}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Mantra */}
            {reading.mantra && (
              <div className="flex items-center gap-3 pt-1">
                <Quote className="w-4 h-4 shrink-0 -scale-x-100" style={{ color: "rgba(212,175,55,0.45)" }} />
                <p className="text-sm italic" style={{ color: "rgba(212,175,55,0.65)" }}>{reading.mantra}</p>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
