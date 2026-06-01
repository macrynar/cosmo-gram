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

function IntensityDot({ score, isPositive }: { score: number; isPositive: boolean }) {
  if (score <= 2) return null;

  const size = score >= 9 ? "w-8 h-8" : score >= 6 ? "w-6 h-6" : "w-4 h-4";
  const opacity = score >= 9 ? "opacity-90" : score >= 6 ? "opacity-60" : "opacity-40";
  const color = isPositive ? "bg-amber-400" : "bg-red-400";

  return (
    <span className={`absolute inset-0 m-auto rounded-full ${size} ${color} ${opacity} -z-10`} />
  );
}

export default function CalendarGrid({ year, month, days, selectedDate, onSelect, filter }: Props) {
  const today = new Date().toISOString().slice(0, 10);

  // What weekday (0=Mon…6=Sun) does day 1 fall on?
  const firstDayJS = new Date(year, month - 1, 1).getDay(); // 0=Sun
  const firstDayMon = (firstDayJS + 6) % 7; // shift to Mon=0

  const blanks = firstDayMon;
  const totalCells = blanks + days.length;
  const rows = Math.ceil(totalCells / 7);

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
          if (dayIdx < 0 || dayIdx >= days.length) {
            return <div key={idx} />;
          }

          const day = days[dayIdx];
          const score = getDayScore(day, filter);
          const isPositive = day.positiveScore >= day.challengingScore;
          const isToday = day.date === today;
          const isSelected = day.date === selectedDate;

          return (
            <button
              key={day.date}
              onClick={() => onSelect(day.date)}
              className={`relative flex items-center justify-center aspect-square rounded-lg text-sm font-medium transition-all
                ${isSelected ? "ring-2 ring-amber-400 bg-amber-900/30 text-white" :
                  isToday ? "border border-amber-500/60 text-amber-200" :
                  "text-slate-300 hover:bg-white/5"}
              `}
            >
              <IntensityDot score={score} isPositive={isPositive} />
              {dayIdx + 1}
            </button>
          );
        })}
      </div>
    </div>
  );
}
