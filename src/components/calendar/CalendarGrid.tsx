"use client";

import React from "react";
import { Lock } from "lucide-react";
import type { DayData } from "@/lib/chart-engine";
import type { MoonPhaseName } from "@/lib/moonPhases";
import type { PowerDay } from "@/lib/astro/powerDays";
import { getDayClass, getDayIntensity, type DayClass } from "@/lib/astro/dayClasses";

type Props = {
  year:           number;
  month:          number;
  days:           DayData[];
  compareDays?:   DayData[];
  selectedDate:   string | null;
  onSelect:       (date: string) => void;
  isPremium:      boolean;
  powerDayMap:    Map<string, PowerDay>;
};

const WEEKDAYS = ["Pn", "Wt", "Śr", "Cz", "Pt", "So", "Nd"];

// ── Moon phase glyphs ──────────────────────────────────────────────────────────
const MOON_GLYPHS: Partial<Record<MoonPhaseName, string>> = {
  new_moon:       "🌑",
  full_moon:      "🌕",
  first_quarter:  "🌓",
  last_quarter:   "🌗",
};

function MoonGlyph({ phase }: { phase: MoonPhaseName }) {
  const glyph = MOON_GLYPHS[phase];
  if (!glyph) return null;
  return (
    <span
      className="absolute bottom-0.5 right-0.5 text-[9px] leading-none pointer-events-none select-none opacity-70"
      aria-hidden="true"
    >
      {glyph}
    </span>
  );
}

// ── Intensity → visual tint (gold palette, barely visible at 1, warm at 5) ───
function intensityStyle(intensity: 1 | 2 | 3 | 4 | 5): React.CSSProperties {
  const alpha = [0, 0.03, 0.06, 0.10, 0.15, 0.22][intensity];
  return {
    background: `rgba(212,175,55,${alpha})`,
    border: "0.5px solid rgba(255,255,255,0.06)",
  };
}

// ── Day cell style by class ────────────────────────────────────────────────────
function cellStyle(
  cls: DayClass,
  isSelected: boolean,
  isToday: boolean,
  intensity: 1 | 2 | 3 | 4 | 5,
): React.CSSProperties {
  if (isSelected) return {
    background: "transparent",
    border: "1.5px solid rgba(212,175,55,0.85)",
    color: "#D4AF37",
    boxShadow: "0 0 14px rgba(212,175,55,0.22)",
    fontWeight: 600,
  };

  if (cls === "exceptional") return {
    ...intensityStyle(intensity),
    border: "1.5px solid rgba(212,175,55,0.80)",
    boxShadow: "0 0 18px rgba(212,175,55,0.35), inset 0 0 8px rgba(212,175,55,0.08)",
    color: "#ffffff",
  };

  if (cls === "power") return {
    ...intensityStyle(intensity),
    border: "1px solid rgba(212,175,55,0.55)",
    boxShadow: "0 0 12px rgba(212,175,55,0.20)",
    color: "#ffffff",
  };

  // significant + normal: intensity tint only; today gets a white ring
  const base = intensityStyle(intensity);
  if (isToday) return {
    ...base,
    border: "1.5px solid rgba(255,255,255,0.50)",
    color: "rgba(255,255,255,0.90)",
    fontWeight: 700,
  };
  return {
    ...base,
    color: cls === "significant" ? "rgba(255,255,255,0.75)" : "rgba(100,116,139,0.55)",
  };
}

// ── Component ──────────────────────────────────────────────────────────────────
export default function CalendarGrid({
  year, month, days, compareDays, selectedDate, onSelect, isPremium, powerDayMap,
}: Props) {
  const today        = new Date().toISOString().slice(0, 10);
  const firstDayJS   = new Date(year, month - 1, 1).getDay();
  const firstDayMon  = (firstDayJS + 6) % 7;
  const rows         = Math.ceil((firstDayMon + days.length) / 7);

  return (
    <div>
      {/* Weekday headers */}
      <div className="grid grid-cols-7 mb-2">
        {WEEKDAYS.map(d => (
          <div key={d} className="text-center text-[11px] py-1 font-medium" style={{ color: "rgba(100,116,139,0.45)" }}>
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: rows * 7 }).map((_, idx) => {
          const dayIdx = idx - firstDayMon;
          if (dayIdx < 0 || dayIdx >= days.length) return <div key={idx} className="h-11" />;

          const day        = days[dayIdx];
          const compareDay = compareDays?.[dayIdx];
          const isToday    = day.date === today;
          const isSelected = day.date === selectedDate;
          const cls        = getDayClass(day, powerDayMap, isPremium);
          const intensity  = getDayIntensity(day.score);

          // Compare mode: split halves when both have a class
          const compareCls = compareDay ? getDayClass(compareDay, new Map(), false) : "normal";
          const compareIntensity = compareDay ? getDayIntensity(compareDay.score) : 1;

          const style = cellStyle(cls, isSelected, isToday, intensity);

          return (
            <button
              key={day.date}
              onClick={() => onSelect(day.date)}
              title={cls === "exceptional" ? "Wyjątkowy dzień" : cls === "power" ? "Dzień Mocy" : undefined}
              className="relative flex items-center justify-center h-11 rounded-lg text-sm transition-all select-none hover:brightness-125"
              style={style}
            >
              {/* Compare split background */}
              {compareDay && (cls !== "normal" || compareCls !== "normal") && (
                <span
                  className="absolute inset-0 rounded-lg pointer-events-none"
                  style={{
                    background: `linear-gradient(to right, rgba(212,175,55,${[0,0.03,0.06,0.10,0.15,0.22][intensity]}) 50%, rgba(212,175,55,${[0,0.03,0.06,0.10,0.15,0.22][compareIntensity]}) 50%)`,
                  }}
                />
              )}

              <span className="relative z-10 flex items-center gap-0.5">
                {cls === "exceptional" && <span className="text-amber-400 text-[10px] leading-none">★</span>}
                {dayIdx + 1}
              </span>

              {/* Moon glyph */}
              {day.moonPhase && <MoonGlyph phase={day.moonPhase} />}
            </button>
          );
        })}
      </div>

      {/* Legend — 3 items max */}
      <div className="mt-4 flex items-center justify-center gap-5 text-[11px]" style={{ color: "rgba(100,116,139,0.50)" }}>
        <span className="flex items-center gap-1.5">
          <span className="w-4 h-4 rounded-md inline-block" style={{ border: "1px solid rgba(212,175,55,0.55)" }} />
          Dzień Mocy
        </span>
        <span className="flex items-center gap-1.5">
          <span className="text-amber-400 text-[10px]">★</span>
          Wyjątkowy
        </span>
        <span className="flex items-center gap-1.5">
          🌕
          Pełnia / Nów
        </span>
      </div>

      {/* Free user upsell */}
      {!isPremium && (
        <div className="mt-5 flex items-center gap-3 px-4 py-3 rounded-xl" style={{ background: "rgba(212,175,55,0.04)", border: "0.5px solid rgba(212,175,55,0.14)" }}>
          <Lock className="w-4 h-4 text-amber-500/40 shrink-0" />
          <p className="text-sm text-slate-500 leading-snug">
            Twoje osobiste Dni Mocy —{" "}
            <a href="/pricing" className="text-amber-400 hover:text-amber-300 transition-colors">odblokuj w Premium</a>
          </p>
        </div>
      )}
    </div>
  );
}
