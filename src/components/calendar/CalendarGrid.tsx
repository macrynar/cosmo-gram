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

function getDayScore(day: DayData, filter: CalendarFilter): number {
  if (filter === "love")   return day.intentionScores.love;
  if (filter === "career") return day.intentionScores.career;
  if (filter === "energy") return day.intentionScores.energy;
  if (filter === "mind")   return day.intentionScores.mind;
  return day.score;
}

type PowerStyle = {
  bg: string;
  glow: string;
  dot: string;
};

const COLOR_MAP: Record<string, PowerStyle> = {
  love:    { bg: "rgba(251,113,133,0.20)", glow: "0 0 18px rgba(251,113,133,0.50)", dot: "rgba(251,113,133,0.65)" },
  career:  { bg: "rgba(212,175,55,0.20)",  glow: "0 0 18px rgba(212,175,55,0.45)",  dot: "rgba(212,175,55,0.65)"  },
  energy:  { bg: "rgba(251,146,60,0.20)",  glow: "0 0 18px rgba(251,146,60,0.45)",  dot: "rgba(251,146,60,0.65)"  },
  mind:    { bg: "rgba(45,212,191,0.20)",  glow: "0 0 18px rgba(45,212,191,0.40)",  dot: "rgba(45,212,191,0.65)"  },
  warning: { bg: "rgba(239,68,68,0.18)",   glow: "0 0 18px rgba(239,68,68,0.40)",   dot: "rgba(239,68,68,0.65)"   },
};

function getDominantKey(day: DayData, filter: CalendarFilter): string {
  if (filter !== "all") return filter;
  if (day.challengingScore > day.positiveScore + 2) return "warning";
  const { love, career, energy, mind } = day.intentionScores;
  const max = Math.max(love, career, energy, mind);
  if (max === love)   return "love";
  if (max === career) return "career";
  if (max === energy) return "energy";
  return "mind";
}

// Moon phase visual markers
type MoonIconProps = { phase: MoonPhaseName };
function MoonPhaseIcon({ phase }: MoonIconProps) {
  const base = "absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full pointer-events-none";
  if (phase === "new_moon")  return <span className={`${base} bg-slate-900 ring-1 ring-white/50`} />;
  if (phase === "full_moon") return <span className={`${base} bg-white/80`} />;
  const gradient = phase === "first_quarter"
    ? "linear-gradient(to right, #0f0c1a 50%, rgba(255,255,255,0.80) 50%)"
    : "linear-gradient(to left, #0f0c1a 50%, rgba(255,255,255,0.80) 50%)";
  return <span className={`${base} overflow-hidden`} style={{ background: gradient }} />;
}

export default function CalendarGrid({ year, month, days, compareDays, selectedDate, onSelect, filter }: Props) {
  const today = new Date().toISOString().slice(0, 10);

  const firstDayJS  = new Date(year, month - 1, 1).getDay();
  const firstDayMon = (firstDayJS + 6) % 7;
  const blanks      = firstDayMon;
  const rows        = Math.ceil((blanks + days.length) / 7);

  return (
    <div>
      {/* Weekday headers */}
      <div className="grid grid-cols-7 mb-1">
        {WEEKDAYS.map(d => (
          <div key={d} className="text-center text-xs py-1" style={{ color: "rgba(100,116,139,0.6)" }}>{d}</div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: rows * 7 }).map((_, idx) => {
          const dayIdx = idx - blanks;
          if (dayIdx < 0 || dayIdx >= days.length) return <div key={idx} className="h-11" />;

          const day         = days[dayIdx];
          const compareDay  = compareDays?.[dayIdx];
          const score       = getDayScore(day, filter);
          const compareScore = compareDay ? getDayScore(compareDay, filter) : 0;
          const isToday     = day.date === today;
          const isSelected  = day.date === selectedDate;
          const isPower     = score >= 7;
          const isSignal    = score >= 3 && score < 7;
          const hasMoon     = day.moonPhase !== null;

          const domKey  = getDominantKey(day, filter);
          const colors  = COLOR_MAP[domKey] ?? COLOR_MAP.career;

          // Compare mode: split circle
          const compareKey    = compareDay ? getDominantKey(compareDay, filter) : domKey;
          const compareColors = COLOR_MAP[compareKey] ?? COLOR_MAP.career;
          const comparePower  = compareScore >= 7;
          const compareSignal = compareScore >= 3 && compareScore < 7;

          return (
            <button
              key={day.date}
              onClick={() => onSelect(day.date)}
              className="relative flex items-center justify-center h-11 rounded-lg text-sm font-medium transition-all select-none"
              style={{
                // Power day: filled glow circle
                ...(isPower && !isSelected ? {
                  background: colors.bg,
                  boxShadow: colors.glow,
                  border: `0.5px solid ${colors.dot}`,
                  color: "#ffffff",
                } : isSignal && !isSelected ? {
                  background: "transparent",
                  border: "0.5px solid rgba(255,255,255,0.10)",
                  color: "rgba(203,213,225,0.80)",
                } : {
                  background: "transparent",
                  border: "0.5px solid rgba(255,255,255,0.07)",
                  color: "rgba(100,116,139,0.70)",
                }),
                // Selected overrides
                ...(isSelected ? {
                  background: "transparent",
                  border: "2px solid rgba(212,175,55,0.85)",
                  boxShadow: "0 0 12px rgba(212,175,55,0.25)",
                  color: "#D4AF37",
                } : {}),
                // Today overrides (when not selected)
                ...(isToday && !isSelected ? {
                  border: "1.5px solid rgba(255,255,255,0.55)",
                  color: "#ffffff",
                  fontWeight: 700,
                } : {}),
              }}
            >
              {/* Compare mode split glow */}
              {compareDay && (isPower || comparePower) && (
                <span
                  className="absolute inset-0 m-auto rounded-full pointer-events-none"
                  style={{
                    width: 36, height: 36,
                    background: `linear-gradient(to right, ${colors.dot} 50%, ${compareColors.dot} 50%)`,
                    opacity: 0.45,
                  }}
                />
              )}

              {/* Signal dot (small, non-power days with some activity) */}
              {isSignal && !isPower && !compareDay && (
                <span
                  className="absolute pointer-events-none rounded-full"
                  style={{
                    width: 5, height: 5,
                    bottom: 6,
                    left: "50%",
                    transform: "translateX(-50%)",
                    background: colors.dot,
                    opacity: 0.55,
                  }}
                />
              )}

              {/* Compare signal dots */}
              {compareDay && (isSignal || compareSignal) && !isPower && !comparePower && (
                <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex gap-0.5 pointer-events-none">
                  {isSignal    && <span className="w-1 h-1 rounded-full" style={{ background: colors.dot, opacity: 0.55 }} />}
                  {compareSignal && <span className="w-1 h-1 rounded-full" style={{ background: compareColors.dot, opacity: 0.55 }} />}
                </span>
              )}

              <span className="relative z-10">{dayIdx + 1}</span>
              {hasMoon && <MoonPhaseIcon phase={day.moonPhase!} />}
            </button>
          );
        })}
      </div>

      {/* Minimal legend */}
      <div className="mt-4 flex items-center justify-center gap-4 text-[11px]" style={{ color: "rgba(100,116,139,0.55)" }}>
        <span className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded-sm inline-block" style={{ background: "rgba(212,175,55,0.20)", border: "0.5px solid rgba(212,175,55,0.50)" }} />
          Dzień mocy
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: "rgba(203,213,225,0.40)" }} />
          Sygnał
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full inline-block bg-slate-900 ring-1 ring-white/50" />
          Faza Księżyca
        </span>
      </div>
    </div>
  );
}
