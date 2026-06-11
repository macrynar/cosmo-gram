"use client";

import React from "react";
import { Lock } from "lucide-react";
import type { DayData } from "@/lib/chart-engine";
import type { MoonPhaseName } from "@/lib/moonPhases";
import type { TransitWindow } from "@/lib/astro/windows";

type Props = {
  year:         number;
  month:        number;
  days:         DayData[];
  compareDays?: DayData[];
  selectedDate: string | null;
  onSelect:     (date: string) => void;
  isPremium:    boolean;
  powerWindows:    TransitWindow[];
  windowDateMap:   Map<string, TransitWindow[]>;
};

const WEEKDAYS = ["Pn", "Wt", "Śr", "Cz", "Pt", "So", "Nd"];

// Only show full/new moon — quarters are noise
const MOON_GLYPHS: Partial<Record<MoonPhaseName, string>> = {
  full_moon: "●",
  new_moon:  "○",
};

function bandColor(character: TransitWindow["character"]): string {
  return character === "wspierające"
    ? "rgba(212,175,55,0.60)"
    : "rgba(180,100,30,0.60)";
}

function WindowBands({ windows }: { windows: TransitWindow[] }) {
  if (windows.length === 0) return null;

  const sorted = [...windows].sort((a, b) => b.score - a.score);
  const extra  = sorted.length - 2;

  if (sorted.length === 1) {
    return (
      <span
        className="absolute bottom-0 left-0 right-0 h-[3px] rounded-b-lg pointer-events-none"
        style={{ background: bandColor(sorted[0].character) }}
      />
    );
  }

  // 2+ windows: split band left/right for top-2, "+N" badge if >2
  return (
    <>
      <span className="absolute bottom-0 left-0 right-1/2 h-[3px] rounded-bl-lg pointer-events-none"
        style={{ background: bandColor(sorted[0].character) }} />
      <span className="absolute bottom-0 left-1/2 right-0 h-[3px] rounded-br-lg pointer-events-none"
        style={{ background: bandColor(sorted[1].character) }} />
      {extra > 0 && (
        <span className="absolute bottom-[4px] right-0.5 text-[8px] leading-none font-medium pointer-events-none select-none"
          style={{ color: "rgba(212,175,55,0.55)" }}>
          +{extra}
        </span>
      )}
    </>
  );
}

export default function CalendarGrid({
  year, month, days, compareDays, selectedDate, onSelect,
  isPremium, powerWindows, windowDateMap,
}: Props) {
  const today        = new Date().toISOString().slice(0, 10);
  const firstDayJS   = new Date(year, month - 1, 1).getDay();
  const firstDayMon  = (firstDayJS + 6) % 7;
  const rows         = Math.ceil((firstDayMon + days.length) / 7);
  const peakDates    = new Set(powerWindows.map(w => w.peak));

  return (
    <div>
      {/* Weekday headers */}
      <div className="grid grid-cols-7 mb-2">
        {WEEKDAYS.map(d => (
          <div key={d} className="text-center text-[11px] py-1 font-medium"
            style={{ color: "rgba(100,116,139,0.45)" }}>
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: rows * 7 }).map((_, idx) => {
          const dayIdx    = idx - firstDayMon;
          if (dayIdx < 0 || dayIdx >= days.length) return <div key={idx} className="h-11" />;

          const day        = days[dayIdx];
          const isToday    = day.date === today;
          const isSelected = day.date === selectedDate;
          const isPeak     = isPremium && peakDates.has(day.date);
          const dayWindows = isPremium ? (windowDateMap.get(day.date) ?? []) : [];
          const inWindow   = dayWindows.length > 0;
          const moonGlyph  = day.moonPhase ? (MOON_GLYPHS[day.moonPhase] ?? null) : null;

          const cellStyle: React.CSSProperties = isSelected
            ? { background: "transparent", border: "1.5px solid rgba(212,175,55,0.85)", color: "#D4AF37", boxShadow: "0 0 14px rgba(212,175,55,0.22)", fontWeight: 600 }
            : isPeak
            ? { background: "rgba(212,175,55,0.06)", border: "1px solid rgba(212,175,55,0.45)", boxShadow: "0 0 10px rgba(212,175,55,0.15)", color: "#E3B85C" }
            : isToday
            ? { background: "transparent", border: "1.5px solid rgba(139,92,246,0.60)", color: "rgba(255,255,255,0.90)", fontWeight: 700 }
            : inWindow
            ? { background: "transparent", border: "0.5px solid rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.70)" }
            : { background: "transparent", border: "0.5px solid rgba(255,255,255,0.04)", color: "rgba(100,116,139,0.50)" };

          return (
            <button
              key={day.date}
              onClick={() => onSelect(day.date)}
              title={isPeak ? "★ Dzień Mocy" : isToday ? "Dziś" : undefined}
              className="relative flex flex-col items-center justify-center h-11 rounded-lg text-sm transition-all select-none hover:brightness-125 overflow-hidden"
              style={cellStyle}
            >
              {/* Day number + peak star inline */}
              <span className="relative z-10 flex items-center gap-0.5 leading-none">
                {isPeak && <span className="text-amber-400 text-[10px] leading-none">★</span>}
                {dayIdx + 1}
              </span>

              {/* Moon glyph — top-right */}
              {moonGlyph && (
                <span
                  className="absolute top-0.5 right-1 text-[9px] leading-none pointer-events-none select-none"
                  style={{ color: "rgba(148,163,184,0.45)" }}
                  aria-hidden="true"
                >
                  {moonGlyph}
                </span>
              )}

              {/* Window bands */}
              {inWindow && !isSelected && <WindowBands windows={dayWindows} />}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 flex items-center justify-center gap-5 text-[11px]"
        style={{ color: "rgba(100,116,139,0.50)" }}>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-5 h-[3px] rounded-full" style={{ background: "rgba(212,175,55,0.55)" }} />
          okno tranzytu
        </span>
        <span className="flex items-center gap-1.5">
          <span className="text-amber-400 text-[10px]">★</span>
          Dzień Mocy (peak okna)
        </span>
        <span className="flex items-center gap-1.5">
          <span style={{ color: "rgba(148,163,184,0.55)" }}>● pełnia / nów</span>
        </span>
      </div>

      {/* Free user upsell */}
      {!isPremium && (
        <div className="mt-5 flex items-center gap-3 px-4 py-3 rounded-xl"
          style={{ background: "rgba(212,175,55,0.04)", border: "0.5px solid rgba(212,175,55,0.14)" }}>
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
