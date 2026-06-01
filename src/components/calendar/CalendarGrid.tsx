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

function getDominantIntention(day: DayData): "love" | "career" | "peace" {
  const { love, career, peace } = day.intentionScores;
  if (love >= career && love >= peace) return "love";
  if (career >= peace) return "career";
  return "peace";
}

// Background glow circle — 5 clear intensity levels
type GlowProps = { day: DayData; filter: CalendarFilter };
function IntensityGlow({ day, filter }: GlowProps) {
  const score = getDayScore(day, filter);
  if (score < 3) return null;

  const isChallenge = day.challengingScore > day.positiveScore + 2;

  let color: string;
  if (filter === "love")        color = "bg-rose-500";
  else if (filter === "career") color = "bg-amber-500";
  else if (filter === "peace")  color = "bg-indigo-500";
  else if (isChallenge)         color = "bg-red-500";
  else {
    const dom = getDominantIntention(day);
    color = dom === "love" ? "bg-rose-500" : dom === "peace" ? "bg-indigo-500" : "bg-amber-500";
  }

  // 5 size levels — clearly differentiated
  const size =
    score >= 9 ? "w-11 h-11" :
    score >= 7 ? "w-9 h-9"  :
    score >= 5 ? "w-7 h-7"  :
    score >= 4 ? "w-5 h-5"  :
                 "w-3 h-3";

  const opacity =
    score >= 9 ? "opacity-75" :
    score >= 7 ? "opacity-55" :
    score >= 5 ? "opacity-40" :
    score >= 4 ? "opacity-30" :
                 "opacity-20";

  // Extra ring for top scores
  const ring = score >= 9 ? `ring-1 ring-offset-0 ${color.replace("bg-", "ring-").replace("500", "400")}/50` : "";

  return (
    <span className={`absolute inset-0 m-auto rounded-full ${size} ${color} ${opacity} ${ring} pointer-events-none`} />
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

          const day = days[dayIdx];
          const isToday    = day.date === today;
          const isSelected = day.date === selectedDate;
          const hasScore   = getDayScore(day, filter) >= 3;

          return (
            <button
              key={day.date}
              onClick={() => onSelect(day.date)}
              className={`relative flex items-center justify-center h-11 rounded-lg text-sm font-medium transition-all select-none
                ${isSelected
                  ? "ring-2 ring-amber-400 text-white"
                  : isToday
                  ? "border border-amber-500/60 text-amber-100"
                  : hasScore
                  ? "text-white hover:ring-1 hover:ring-white/20"
                  : "text-slate-500 hover:text-slate-300 hover:bg-white/5"}
              `}
            >
              <IntensityGlow day={day} filter={filter} />
              <span className="relative z-10">{dayIdx + 1}</span>
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-5 space-y-2">
        <div className="flex items-center gap-3 flex-wrap justify-center text-[11px] text-slate-500">
          {filter === "all" ? (
            <>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500 opacity-60 inline-block" />kariera / ogólnie</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-500 opacity-60 inline-block" />miłość</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-indigo-500 opacity-60 inline-block" />spokój</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-500 opacity-60 inline-block" />wyzwanie</span>
            </>
          ) : filter === "love" ? (
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-500 opacity-60 inline-block" />siła tranzytów miłości</span>
          ) : filter === "career" ? (
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500 opacity-60 inline-block" />siła tranzytów kariery</span>
          ) : (
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-indigo-500 opacity-60 inline-block" />siła tranzytów spokoju</span>
          )}
        </div>
        <p className="text-center text-[11px] text-slate-600">
          Wielkość kółka = intensywność tranzytu w Twoim kosmogramie · tylko ~5–10 dni w miesiącu jest zaznaczonych
        </p>
      </div>
    </div>
  );
}
