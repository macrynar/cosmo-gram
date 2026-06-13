"use client";

import React from "react";
import { Lock } from "lucide-react";
import type { DayData } from "@/lib/chart-engine";
import type { MoonPhaseName } from "@/lib/astro/layers";
import type { TransitWindow, SkyEvent } from "@/lib/astro/layers";

type Props = {
  year:                 number;
  month:                number;
  days:                 DayData[];
  compareDays?:         DayData[];
  selectedDate:         string | null;
  onSelect:             (date: string) => void;
  isPremium:            boolean;
  fastWindows:          TransitWindow[];
  windowDateMap:        Map<string, TransitWindow[]>;
  exactDays:            Set<string>;        // ◆ season exact days
  skyEvents:            SkyEvent[];         // for ℞ and eclipse glyphs
  moonSignChangeDates?: Set<string>;        // days when Moon enters a new sign
};

const WEEKDAYS = ["Pn", "Wt", "Śr", "Cz", "Pt", "So", "Nd"];

const MOON_GLYPHS: Partial<Record<MoonPhaseName, { glyph: string; label: string }>> = {
  full_moon: { glyph: "●", label: "Pełnia" },
  new_moon:  { glyph: "○", label: "Nów"    },
};

function bandColor(character: TransitWindow["character"]): string {
  return character === "wspierające"
    ? "rgba(212,175,55,0.65)"
    : "rgba(180,100,30,0.65)";
}

export default function CalendarGrid({
  year, month, days, compareDays, selectedDate, onSelect,
  isPremium, fastWindows, windowDateMap, exactDays, skyEvents, moonSignChangeDates,
}: Props) {
  const today       = new Date().toISOString().slice(0, 10);
  const firstDayJS  = new Date(year, month - 1, 1).getDay();
  const firstDayMon = (firstDayJS + 6) % 7;
  const rows        = Math.ceil((firstDayMon + days.length) / 7);
  const peakDates   = new Set(fastWindows.map(w => w.peak));

  // Sky event maps for quick lookup
  const retroStartDates = new Set(skyEvents.filter(e => e.type === "retro_start").map(e => e.date));
  const eclipseDates    = new Set(
    skyEvents.filter(e => e.type === "solar_eclipse" || e.type === "lunar_eclipse").map(e => e.date)
  );

  // Moon sign change dates (from DayData or inferred — simplified: mark the day)
  // (Full sign-change times come from getMoonRhythm; here we just need the date)

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
          const dayIdx  = idx - firstDayMon;
          if (dayIdx < 0 || dayIdx >= days.length) return <div key={idx} className="h-11" />;

          const day        = days[dayIdx];
          const isToday        = day.date === today;
          const isSelected     = day.date === selectedDate;
          const isPeak         = isPremium && peakDates.has(day.date);
          const isExact        = exactDays.has(day.date);                           // ◆
          const isRetro        = retroStartDates.has(day.date);                     // ℞
          const isEclipse      = eclipseDates.has(day.date);
          const isMoonChange   = moonSignChangeDates?.has(day.date) ?? false;       // ☽
          const dayWindows = isPremium ? (windowDateMap.get(day.date) ?? []) : [];
          const inWindow   = dayWindows.length > 0;

          // Moon phase for this day
          const moonPhase  = day.moonPhase as MoonPhaseName | null ?? null;
          const moonInfo   = moonPhase ? (MOON_GLYPHS[moonPhase] ?? null) : null;

          // Cell style — ordered by priority: selected > peak > today > exact > inWindow > quiet
          const cellStyle: React.CSSProperties = isSelected
            ? { background: "rgba(255,174,61,0.10)", border: "1.5px solid rgba(255,174,61,0.80)", color: "#FFAE3D", boxShadow: "0 0 14px rgba(255,174,61,0.18)", fontWeight: 600 }
            : isPeak
            ? { background: "rgba(255,174,61,0.07)", border: "1px solid rgba(255,174,61,0.45)", boxShadow: "0 0 10px rgba(255,174,61,0.12)", color: "#E3B85C" }
            : isToday
            ? { background: "rgba(255,174,61,0.05)", border: "1.5px solid rgba(255,174,61,0.50)", color: "rgba(255,255,255,0.95)", fontWeight: 700 }
            : isExact
            ? { background: "rgba(107,196,160,0.06)", border: "0.5px solid rgba(107,196,160,0.35)", color: "rgba(107,196,160,0.90)" }
            : inWindow
            ? { background: "rgba(255,174,61,0.04)", border: "0.5px solid rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.70)" }
            : { background: "transparent", border: "0.5px solid transparent", color: "rgba(100,116,139,0.50)" };

          return (
            <button
              key={day.date}
              onClick={() => onSelect(day.date)}
              title={
                isPeak    ? "★ peak okna"  :
                isExact   ? "◆ dzień dokładności sezonu" :
                isToday   ? "Dziś" :
                undefined
              }
              className="relative flex flex-col items-center justify-center h-11 rounded-lg text-sm transition-all select-none hover:brightness-125 overflow-hidden"
              style={cellStyle}
            >
              {/* Day number + peak star */}
              <span className="relative z-10 flex items-center gap-0.5 leading-none">
                {isPeak  && <span className="text-amber-400 text-[10px] leading-none">★</span>}
                {isExact && !isPeak && <span className="text-[9px] leading-none" style={{ color: "rgba(107,196,160,0.85)" }}>◆</span>}
                {dayIdx + 1}
              </span>

              {/* Retrograde ℞ — bottom-left */}
              {isRetro && (
                <span className="absolute bottom-0.5 left-1 text-[8px] leading-none font-semibold pointer-events-none select-none"
                  style={{ color: "rgba(251,191,36,0.60)" }}
                  aria-label="stacja retrogradu">
                  ℞
                </span>
              )}

              {/* Moon glyph — top-right; eclipse = brighter */}
              {moonInfo && (
                <span
                  className="absolute top-0.5 right-1 text-[9px] leading-none pointer-events-none select-none"
                  style={{ color: isEclipse ? "rgba(253,224,71,0.90)" : "rgba(148,163,184,0.45)" }}
                  aria-label={moonInfo.label}
                >
                  {moonInfo.glyph}
                </span>
              )}

              {/* Moon sign change — bottom-right corner */}
              {isMoonChange && (
                <span
                  className="absolute bottom-0.5 right-1 text-[7px] leading-none pointer-events-none select-none"
                  style={{ color: "rgba(99,102,241,0.30)" }}
                  aria-label="zmiana znaku Księżyca"
                >
                  ☽
                </span>
              )}

              {/* Fast window band — thin indented bottom stripe */}
              {inWindow && !isSelected && (
                <>
                  {dayWindows.length === 1 ? (
                    <span className="absolute bottom-1 left-1.5 right-1.5 h-[2px] rounded-full pointer-events-none"
                      style={{ background: bandColor(dayWindows[0].character) }} />
                  ) : (
                    <>
                      <span className="absolute bottom-1 left-1.5 right-[calc(50%+1px)] h-[2px] rounded-full pointer-events-none"
                        style={{ background: bandColor(dayWindows[0].character) }} />
                      <span className="absolute bottom-1 left-[calc(50%+1px)] right-1.5 h-[2px] rounded-full pointer-events-none"
                        style={{ background: bandColor(dayWindows[1].character) }} />
                    </>
                  )}
                </>
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5 text-[11px]"
        style={{ color: "rgba(100,116,139,0.50)" }}>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-5 h-[3px] rounded-full" style={{ background: "rgba(212,175,55,0.55)" }} />
          okno tranzytu
        </span>
        <span className="flex items-center gap-1.5">
          <span className="text-amber-400 text-[10px]">★</span>
          peak okna
        </span>
        <span className="flex items-center gap-1.5">
          <span className="text-[9px]" style={{ color: "rgba(107,196,160,0.80)" }}>◆</span>
          dzień dokładności sezonu
        </span>
        <span className="flex items-center gap-1.5">
          <span style={{ color: "rgba(148,163,184,0.55)" }}>● pełnia / ○ nów</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span style={{ color: "rgba(251,191,36,0.60)", fontSize: 10 }}>℞</span>
          stacja retrogradu
        </span>
        <span className="flex items-center gap-1.5">
          <span style={{ color: "rgba(99,102,241,0.45)", fontSize: 9 }}>☽</span>
          zmiana znaku Księżyca
        </span>
      </div>

      {/* Free user upsell */}
      {!isPremium && (
        <div className="mt-5 flex items-center gap-3 px-4 py-3 rounded-xl"
          style={{ background: "rgba(212,175,55,0.04)", border: "0.5px solid rgba(212,175,55,0.14)" }}>
          <Lock className="w-4 h-4 text-amber-500/40 shrink-0" />
          <p className="text-sm text-slate-500 leading-snug">
            Twoje osobiste okna i dni sezonu —{" "}
            <a href="/pricing" className="text-amber-400 hover:text-amber-300 transition-colors">odblokuj w Premium</a>
          </p>
        </div>
      )}
    </div>
  );
}
