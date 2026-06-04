"use client";

import type { DayData } from "@/lib/chart-engine";
import type { MoonPhaseName } from "@/lib/moonPhases";
import type { CalendarFilter } from "./IntentionFilter";

type Props = {
  year: number;
  month: number;
  days: DayData[];
  compareDays?: DayData[];
  selectedDate: string | null;
  onSelect: (date: string) => void;
  filter: CalendarFilter;
};

const WEEKDAYS = ["Pn", "Wt", "Śr", "Cz", "Pt", "So", "Nd"];

// ── Score helpers ─────────────────────────────────────────────────────────────

function getDayScore(day: DayData, filter: CalendarFilter): number {
  if (filter === "love")   return day.intentionScores.love;
  if (filter === "career") return day.intentionScores.career;
  if (filter === "energy") return day.intentionScores.energy;
  if (filter === "mind")   return day.intentionScores.mind;
  return day.score;
}

// ── Power-day computation: top ~5 days per month, score must be ≥ 7 ──────────

const POWER_MAX    = 5;   // at most 5 highlighted days per month
const POWER_MIN_SCORE = 7; // absolute floor — days below this are never power days

function computePowerDates(days: DayData[], filter: CalendarFilter): Set<string> {
  return new Set(
    [...days]
      .filter(d => getDayScore(d, filter) >= POWER_MIN_SCORE)
      .sort((a, b) => getDayScore(b, filter) - getDayScore(a, filter))
      .slice(0, POWER_MAX)
      .map(d => d.date)
  );
}

// ── Color palette per dominant intention ──────────────────────────────────────

type ColorDef = { bg: string; border: string; glow: string; text: string };

const COLOR: Record<string, ColorDef> = {
  love:    { bg: "rgba(251,113,133,0.16)", border: "rgba(251,113,133,0.55)", glow: "0 0 16px rgba(251,113,133,0.40)", text: "#fda4af" },
  career:  { bg: "rgba(212,175,55,0.16)",  border: "rgba(212,175,55,0.60)",  glow: "0 0 16px rgba(212,175,55,0.38)",  text: "#D4AF37" },
  energy:  { bg: "rgba(251,146,60,0.16)",  border: "rgba(251,146,60,0.55)",  glow: "0 0 16px rgba(251,146,60,0.38)",  text: "#fb923c" },
  mind:    { bg: "rgba(45,212,191,0.16)",  border: "rgba(45,212,191,0.50)",  glow: "0 0 16px rgba(45,212,191,0.35)",  text: "#2dd4bf" },
  warning: { bg: "rgba(239,68,68,0.14)",   border: "rgba(239,68,68,0.50)",   glow: "0 0 16px rgba(239,68,68,0.35)",   text: "#f87171" },
};

function getDominantKey(day: DayData, filter: CalendarFilter): keyof typeof COLOR {
  if (filter !== "all") return filter;
  if (day.challengingScore > day.positiveScore + 2) return "warning";
  const { love, career, energy, mind } = day.intentionScores;
  const max = Math.max(love, career, energy, mind);
  if (max === love)   return "love";
  if (max === career) return "career";
  if (max === energy) return "energy";
  return "mind";
}

// ── Moon phase markers (kept — not colored dots, purely astronomical info) ───

type MoonIconProps = { phase: MoonPhaseName };
function MoonPhaseIcon({ phase }: MoonIconProps) {
  const base = "absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full pointer-events-none";
  if (phase === "new_moon")  return <span className={`${base} bg-slate-800 ring-1 ring-white/40`} />;
  if (phase === "full_moon") return <span className={`${base} bg-white/70`} />;
  const g = phase === "first_quarter"
    ? "linear-gradient(to right, #0f0c1a 50%, rgba(255,255,255,0.70) 50%)"
    : "linear-gradient(to left, #0f0c1a 50%, rgba(255,255,255,0.70) 50%)";
  return <span className={`${base} overflow-hidden`} style={{ background: g }} />;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function CalendarGrid({ year, month, days, compareDays, selectedDate, onSelect, filter }: Props) {
  const today = new Date().toISOString().slice(0, 10);

  // Computed once per render — guarantees ≤ 5 highlighted days regardless of score distribution
  const powerDates        = computePowerDates(days, filter);
  const comparePowerDates = compareDays ? computePowerDates(compareDays, filter) : new Set<string>();

  const firstDayJS  = new Date(year, month - 1, 1).getDay();
  const firstDayMon = (firstDayJS + 6) % 7;
  const blanks      = firstDayMon;
  const rows        = Math.ceil((blanks + days.length) / 7);

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
          const dayIdx = idx - blanks;
          if (dayIdx < 0 || dayIdx >= days.length) return <div key={idx} className="h-11" />;

          const day        = days[dayIdx];
          const compareDay = compareDays?.[dayIdx];
          const isToday    = day.date === today;
          const isSelected = day.date === selectedDate;

          // Strict binary: power or not
          const isPower        = powerDates.has(day.date);
          const isComparePower = comparePowerDates.has(day.date);
          const hasMoon        = day.moonPhase !== null;

          const domKey = getDominantKey(day, filter);
          const color  = COLOR[domKey] ?? COLOR.career;

          // Compare mode: also get compare day's dominant color
          const compareDomKey = compareDay ? getDominantKey(compareDay, filter) : domKey;
          const compareColor  = COLOR[compareDomKey] ?? COLOR.career;

          // ── Build styles ──────────────────────────────────────────────────

          // Default: silent grey, uniform, no color signal whatsoever
          let style: React.CSSProperties = {
            background:  "transparent",
            border:      "0.5px solid rgba(255,255,255,0.06)",
            color:       "rgba(100,116,139,0.55)",
            boxShadow:   "none",
          };

          // Power day: fill + glow
          if (isPower && !isSelected) {
            style = {
              background: color.bg,
              border:     `0.5px solid ${color.border}`,
              color:      "#ffffff",
              boxShadow:  color.glow,
            };
          }

          // Selected: gold ring, always overrides
          if (isSelected) {
            style = {
              background: "transparent",
              border:     "1.5px solid rgba(212,175,55,0.80)",
              color:      "#D4AF37",
              boxShadow:  "0 0 14px rgba(212,175,55,0.22)",
              fontWeight: 600,
            };
          }

          // Today (when not selected): white ring only
          if (isToday && !isSelected) {
            style = {
              ...style,
              border:     isPower ? `1.5px solid ${color.border}` : "1.5px solid rgba(255,255,255,0.45)",
              color:      isPower ? "#ffffff" : "rgba(255,255,255,0.90)",
              fontWeight: 700,
            };
          }

          return (
            <button
              key={day.date}
              onClick={() => onSelect(day.date)}
              className="relative flex items-center justify-center h-11 rounded-lg text-sm transition-all select-none hover:border-white/20"
              style={style}
            >
              {/* Compare mode: split half-circles — only when both have data */}
              {compareDay && (isPower || isComparePower) && (
                <span
                  className="absolute inset-0 rounded-lg pointer-events-none"
                  style={{
                    background: `linear-gradient(to right, ${color.bg} 50%, ${compareColor.bg} 50%)`,
                    borderLeft:  `0.5px solid ${color.border}`,
                    borderRight: `0.5px solid ${compareColor.border}`,
                    borderTop:   `0.5px solid ${isPower ? color.border : compareColor.border}`,
                    borderBottom:`0.5px solid ${isPower ? color.border : compareColor.border}`,
                  }}
                />
              )}

              <span className="relative z-10">{dayIdx + 1}</span>

              {/* Moon phase: kept because it's astronomical fact, not a score indicator */}
              {hasMoon && <MoonPhaseIcon phase={day.moonPhase!} />}
            </button>
          );
        })}
      </div>

      {/* Legend — two items only */}
      <div className="mt-4 flex items-center justify-center gap-5 text-[11px]" style={{ color: "rgba(100,116,139,0.50)" }}>
        <span className="flex items-center gap-1.5">
          <span className="w-4 h-4 rounded-md inline-block" style={{ background: "rgba(212,175,55,0.16)", border: "0.5px solid rgba(212,175,55,0.55)" }} />
          Dzień mocy (~5 / mies.)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full inline-block bg-white/70" />
          Pełnia / Nów
        </span>
      </div>
    </div>
  );
}
