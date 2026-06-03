"use client";

import type { DayData } from "@/lib/chart-engine";
import type { MoonPhaseName } from "@/lib/moonPhases";
import type { CalendarFilter } from "./IntentionFilter";

type Props = {
  year: number;
  month: number;
  days: DayData[];
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

function getDotColor(day: DayData, filter: CalendarFilter): string {
  const isChallenge = day.challengingScore > day.positiveScore + 2;

  if (filter === "love")   return "bg-rose-400";
  if (filter === "career") return "bg-amber-400";
  if (filter === "energy") return "bg-orange-400";
  if (filter === "mind")   return "bg-teal-400";

  if (isChallenge) return "bg-red-500";
  // "all" filter — pick dominant intention color
  const { love, career, energy, mind } = day.intentionScores;
  const max = Math.max(love, career, energy, mind);
  if (max === love)   return "bg-rose-400";
  if (max === career) return "bg-amber-400";
  if (max === energy) return "bg-orange-400";
  return "bg-teal-400";
}

// Background glow circle — 5 clear intensity levels
type GlowProps = { day: DayData; filter: CalendarFilter };
function IntensityGlow({ day, filter }: GlowProps) {
  const score = getDayScore(day, filter);
  if (score < 3) return null;

  const color = getDotColor(day, filter);

  const size =
    score >= 9 ? "w-11 h-11" :
    score >= 7 ? "w-9 h-9"   :
    score >= 5 ? "w-7 h-7"   :
    score >= 4 ? "w-5 h-5"   :
                 "w-3 h-3";

  const opacity =
    score >= 9 ? "opacity-75" :
    score >= 7 ? "opacity-55" :
    score >= 5 ? "opacity-40" :
    score >= 4 ? "opacity-30" :
                 "opacity-20";

  const ring = score >= 9
    ? `ring-1 ring-offset-0 ${color.replace("bg-", "ring-").replace("400", "300").replace("500", "400")}/50`
    : "";

  return (
    <span className={`absolute inset-0 m-auto rounded-full ${size} ${color} ${opacity} ${ring} pointer-events-none`} />
  );
}

// Moon phase visual markers — replaces the intensity dot on phase days
type MoonIconProps = { phase: MoonPhaseName };
function MoonPhaseIcon({ phase }: MoonIconProps) {
  const base = "absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full pointer-events-none";
  if (phase === "new_moon") {
    return <span className={`${base} bg-slate-900 ring-1 ring-white/60`} />;
  }
  if (phase === "full_moon") {
    return <span className={`${base} bg-white/90`} />;
  }
  // first_quarter: right half lit, last_quarter: left half lit
  const gradient = phase === "first_quarter"
    ? "linear-gradient(to right, #0f0c1a 50%, rgba(255,255,255,0.85) 50%)"
    : "linear-gradient(to left, #0f0c1a 50%, rgba(255,255,255,0.85) 50%)";
  return <span className={`${base} overflow-hidden`} style={{ background: gradient }} />;
}

export default function CalendarGrid({ year, month, days, selectedDate, onSelect, filter }: Props) {
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
          <div key={d} className="text-center text-xs text-slate-500 py-1">{d}</div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: rows * 7 }).map((_, idx) => {
          const dayIdx = idx - blanks;
          if (dayIdx < 0 || dayIdx >= days.length) return <div key={idx} className="h-11" />;

          const day        = days[dayIdx];
          const isToday    = day.date === today;
          const isSelected = day.date === selectedDate;
          const hasScore   = getDayScore(day, filter) >= 3;
          const hasMoon    = day.moonPhase !== null;

          return (
            <button
              key={day.date}
              onClick={() => onSelect(day.date)}
              className={`relative flex items-center justify-center h-11 rounded-lg text-sm font-medium transition-all select-none
                ${isSelected
                  ? "ring-2 ring-amber-400 text-white"
                  : isToday
                  ? "ring-2 ring-white text-white animate-pulse-slow font-bold"
                  : hasScore
                  ? "text-white hover:ring-1 hover:ring-white/20"
                  : hasMoon
                  ? "text-slate-300 hover:ring-1 hover:ring-white/15"
                  : "text-slate-500 hover:text-slate-300 hover:bg-white/5"}
              `}
            >
              <IntensityGlow day={day} filter={filter} />
              <span className="relative z-10">{dayIdx + 1}</span>
              {hasMoon && <MoonPhaseIcon phase={day.moonPhase!} />}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-5 space-y-2">
        <div className="flex items-center gap-3 flex-wrap justify-center text-[11px] text-slate-500">
          {filter === "all" ? (
            <>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-400 opacity-60 inline-block" />miłość</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-400 opacity-60 inline-block" />kariera</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-orange-400 opacity-60 inline-block" />energia</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-teal-400 opacity-60 inline-block" />komunikacja</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-500 opacity-60 inline-block" />wyzwanie</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-slate-900 ring-1 ring-white/60 inline-block" />faza Księżyca</span>
            </>
          ) : filter === "love" ? (
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-400 opacity-60 inline-block" />siła tranzytów miłości</span>
          ) : filter === "career" ? (
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-400 opacity-60 inline-block" />siła tranzytów kariery</span>
          ) : filter === "energy" ? (
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-orange-400 opacity-60 inline-block" />siła tranzytów energii</span>
          ) : (
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-teal-400 opacity-60 inline-block" />siła tranzytów komunikacji</span>
          )}
        </div>
        <p className="text-center text-[11px] text-slate-600">
          Wielkość kółka = intensywność tranzytu · ~5–10 dni w miesiącu jest zaznaczonych
        </p>
      </div>
    </div>
  );
}
