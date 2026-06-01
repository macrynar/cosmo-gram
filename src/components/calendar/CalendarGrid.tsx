"use client";

import type { DayData } from "@/lib/chart-engine";
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
  if (filter === "peace")  return day.intentionScores.peace;
  return day.score;
}

function getDominantIntention(day: DayData): "love" | "career" | "peace" | "none" {
  const { love, career, peace } = day.intentionScores;
  const max = Math.max(love, career, peace);
  if (max <= 2) return "none";
  if (love === max) return "love";
  if (career === max) return "career";
  return "peace";
}

type DotProps = { day: DayData; filter: CalendarFilter };
function IntentDot({ day, filter }: DotProps) {
  const score = getDayScore(day, filter);
  if (score < 3) return <span className="h-1.5 w-1.5" />;

  const isChallenge = day.challengingScore > day.positiveScore + 2;

  let color: string;
  if (filter === "love")   color = "bg-rose-400";
  else if (filter === "career") color = "bg-amber-400";
  else if (filter === "peace")  color = "bg-indigo-400";
  else {
    if (isChallenge) color = "bg-red-400";
    else {
      const dom = getDominantIntention(day);
      color = dom === "love" ? "bg-rose-400" : dom === "peace" ? "bg-indigo-400" : "bg-amber-400";
    }
  }

  const size = score >= 7 ? "w-2 h-2" : "w-1.5 h-1.5";
  return <span className={`${size} rounded-full ${color} mt-0.5 opacity-80`} />;
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1">
      <span className={`w-2 h-2 rounded-full ${color} inline-block`} />
      {label}
    </span>
  );
}

export default function CalendarGrid({ year, month, days, selectedDate, onSelect, filter }: Props) {
  const today = new Date().toISOString().slice(0, 10);

  const firstDayJS = new Date(year, month - 1, 1).getDay();
  const firstDayMon = (firstDayJS + 6) % 7;
  const blanks = firstDayMon;
  const rows = Math.ceil((blanks + days.length) / 7);

  return (
    <div>
      <div className="grid grid-cols-7 mb-1">
        {WEEKDAYS.map(d => (
          <div key={d} className="text-center text-xs text-slate-500 py-1">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: rows * 7 }).map((_, idx) => {
          const dayIdx = idx - blanks;
          if (dayIdx < 0 || dayIdx >= days.length) return <div key={idx} />;

          const day = days[dayIdx];
          const isToday = day.date === today;
          const isSelected = day.date === selectedDate;

          return (
            <button
              key={day.date}
              onClick={() => onSelect(day.date)}
              className={`relative flex flex-col items-center justify-center pt-1.5 pb-1 rounded-lg text-sm font-medium transition-all min-h-[44px]
                ${isSelected
                  ? "ring-2 ring-amber-400 bg-amber-900/30 text-white"
                  : isToday
                  ? "border border-amber-500/60 text-amber-200"
                  : "text-slate-300 hover:bg-white/5"}
              `}
            >
              <span>{dayIdx + 1}</span>
              <IntentDot day={day} filter={filter} />
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3 mt-4 flex-wrap justify-center text-[11px] text-slate-500">
        {filter === "all" ? (
          <>
            <LegendDot color="bg-amber-400" label="sprzyja karierze/ogólnie" />
            <LegendDot color="bg-rose-400" label="sprzyja miłości" />
            <LegendDot color="bg-indigo-400" label="sprzyja spokojowi" />
            <LegendDot color="bg-red-400" label="dzień wyzwań" />
          </>
        ) : filter === "love" ? (
          <LegendDot color="bg-rose-400" label="siła tranzytów miłości" />
        ) : filter === "career" ? (
          <LegendDot color="bg-amber-400" label="siła tranzytów kariery" />
        ) : (
          <LegendDot color="bg-indigo-400" label="siła tranzytów spokoju" />
        )}
        <span className="text-slate-600">— większa kropka = silniejszy tranzyt</span>
      </div>
    </div>
  );
}
