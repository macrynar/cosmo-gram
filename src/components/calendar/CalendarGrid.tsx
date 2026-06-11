"use client";

import React from "react";
import { Lock } from "lucide-react";
import type { DayData } from "@/lib/chart-engine";
import type { MoonPhaseName } from "@/lib/moonPhases";
import type { TransitWindow } from "@/lib/astro/windows";
import { getDayIntensity } from "@/lib/astro/dayClasses";

type Props = {
  year:         number;
  month:        number;
  days:         DayData[];
  compareDays?: DayData[];
  selectedDate: string | null;
  onSelect:     (date: string) => void;
  isPremium:    boolean;
  // Power windows — top-5 for the month (premium only)
  powerWindows:    TransitWindow[];
  // Full window date map — date → windows containing it
  windowDateMap:   Map<string, TransitWindow[]>;
};

const WEEKDAYS = ["Pn", "Wt", "Śr", "Cz", "Pt", "So", "Nd"];

const MOON_GLYPHS: Partial<Record<MoonPhaseName, string>> = {
  new_moon:      "🌑",
  full_moon:     "🌕",
  first_quarter: "🌓",
  last_quarter:  "🌗",
};

function MoonGlyph({ phase }: { phase: MoonPhaseName }) {
  const glyph = MOON_GLYPHS[phase];
  if (!glyph) return null;
  return (
    <span className="absolute bottom-0.5 right-0.5 text-[9px] leading-none pointer-events-none select-none opacity-70" aria-hidden="true">
      {glyph}
    </span>
  );
}

// Intensity → background gold tint
function intensityBg(intensity: 1 | 2 | 3 | 4 | 5): React.CSSProperties {
  const alpha = [0, 0.03, 0.06, 0.10, 0.15, 0.22][intensity];
  return { background: `rgba(212,175,55,${alpha})`, border: "0.5px solid rgba(255,255,255,0.06)" };
}

// Window band color by character
function windowBandColor(windows: TransitWindow[]): string | null {
  if (!windows.length) return null;
  // Pick the highest-score window for the band color
  const top = windows.sort((a, b) => b.score - a.score)[0];
  return top.character === "wspierające"
    ? "rgba(212,175,55,0.55)"   // gold
    : "rgba(180,100,30,0.55)";  // amber-rust for "wymagające"
}

export default function CalendarGrid({
  year, month, days, compareDays, selectedDate, onSelect,
  isPremium, powerWindows, windowDateMap,
}: Props) {
  const today       = new Date().toISOString().slice(0, 10);
  const firstDayJS  = new Date(year, month - 1, 1).getDay();
  const firstDayMon = (firstDayJS + 6) % 7;
  const rows        = Math.ceil((firstDayMon + days.length) / 7);

  // Peak dates set for quick lookup
  const peakDates = new Set(powerWindows.map(w => w.peak));

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
          const intensity  = getDayIntensity(day.score);
          const isPeak     = isPremium && peakDates.has(day.date);
          const dayWindows = isPremium ? (windowDateMap.get(day.date) ?? []) : [];
          const bandColor  = windowBandColor([...dayWindows]);
          const inWindow   = dayWindows.length > 0;

          // Compare mode alpha for split background
          const compareIntensity = compareDay ? getDayIntensity(compareDay.score) : 1;

          const baseStyle: React.CSSProperties = isSelected
            ? { background: "transparent", border: "1.5px solid rgba(212,175,55,0.85)", color: "#D4AF37", boxShadow: "0 0 14px rgba(212,175,55,0.22)", fontWeight: 600 }
            : isPeak
            ? { ...intensityBg(intensity), border: "1px solid rgba(212,175,55,0.55)", boxShadow: "0 0 12px rgba(212,175,55,0.20)", color: "#ffffff" }
            : isToday
            ? { ...intensityBg(intensity), border: "1.5px solid rgba(255,255,255,0.50)", color: "rgba(255,255,255,0.90)", fontWeight: 700 }
            : { ...intensityBg(intensity), color: inWindow ? "rgba(255,255,255,0.75)" : "rgba(100,116,139,0.55)" };

          return (
            <button
              key={day.date}
              onClick={() => onSelect(day.date)}
              title={isPeak ? "★ Dzień Mocy" : undefined}
              className="relative flex flex-col items-center justify-center h-11 rounded-lg text-sm transition-all select-none hover:brightness-125 overflow-hidden"
              style={baseStyle}
            >
              {/* Compare split background */}
              {compareDay && (
                <span
                  className="absolute inset-0 rounded-lg pointer-events-none"
                  style={{
                    background: `linear-gradient(to right,rgba(212,175,55,${[0,0.03,0.06,0.10,0.15,0.22][intensity]}) 50%,rgba(212,175,55,${[0,0.03,0.06,0.10,0.15,0.22][compareIntensity]}) 50%)`,
                  }}
                />
              )}

              {/* Day number + peak star */}
              <span className="relative z-10 flex items-center gap-0.5 leading-none">
                {isPeak && <span className="text-amber-400 text-[10px] leading-none">★</span>}
                {dayIdx + 1}
              </span>

              {/* Window band — thin stripe at bottom */}
              {inWindow && bandColor && !isSelected && (
                <span
                  className="absolute bottom-0 left-0 right-0 h-[3px] rounded-b-lg pointer-events-none"
                  style={{ background: bandColor }}
                />
              )}

              {/* Moon glyph */}
              {day.moonPhase && <MoonGlyph phase={day.moonPhase} />}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 flex items-center justify-center gap-5 text-[11px]" style={{ color: "rgba(100,116,139,0.50)" }}>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-5 h-[3px] rounded-full" style={{ background: "rgba(212,175,55,0.55)" }} />
          okno tranzytu
        </span>
        <span className="flex items-center gap-1.5">
          <span className="text-amber-400 text-[10px]">★</span>
          Dzień Mocy (peak)
        </span>
        <span className="flex items-center gap-1.5">
          🌕 pełnia / nów
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
