"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import DayPanel from "@/components/calendar/DayPanel";
import WeekReadingCard from "@/components/calendar/WeekReadingCard";
import type { NatalChart } from "@/lib/astro-types";
import type { TransitWindow, SkyEvent } from "@/lib/astro/layers";
import type { DayData } from "@/lib/chart-engine";

const WEEKDAY_SHORT = ["Nd", "Pn", "Wt", "Śr", "Cz", "Pt", "Sb"];
const MONTH_SHORT: Record<number, string> = {
  1: "sty", 2: "lut", 3: "mar", 4: "kwi", 5: "maj", 6: "cze",
  7: "lip", 8: "sie", 9: "wrz", 10: "paź", 11: "lis", 12: "gru",
};

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

type Props = {
  weekStart:        string;           // ISO Monday of the shown week
  days:             DayData[];
  chart:            NatalChart;
  readingId:        string;
  isPremium:        boolean;
  windowDateMap:    Map<string, TransitWindow[]>;
  exactDays:        Set<string>;
  skyEvents:        SkyEvent[];
  selectedDate:     string | null;
  onSelect:         (date: string) => void;
  onPrevWeek:       () => void;
  onNextWeek:       () => void;
};

function scoreColor(score: number): string {
  if (score >= 50) return "#FFAE3D";
  if (score >= 25) return "#E0B566";
  return "rgba(148,163,184,0.40)";
}

export default function WeekView({
  weekStart, days, chart, readingId, isPremium,
  windowDateMap, exactDays, skyEvents,
  selectedDate, onSelect, onPrevWeek, onNextWeek,
}: Props) {
  const todayStr = new Date().toISOString().slice(0, 10);

  const weekDates: string[] = [];
  const startDate = new Date(weekStart + "T12:00:00Z");
  for (let i = 0; i < 7; i++) {
    const d = new Date(startDate);
    d.setUTCDate(d.getUTCDate() + i);
    weekDates.push(isoDate(d));
  }

  const dayMap = new Map(days.map(d => [d.date, d]));

  const startD  = new Date(weekStart + "T12:00:00Z");
  const endD    = new Date(weekStart + "T12:00:00Z");
  endD.setUTCDate(endD.getUTCDate() + 6);
  const headerLabel = `${startD.getUTCDate()} ${MONTH_SHORT[startD.getUTCMonth() + 1]} – ${endD.getUTCDate()} ${MONTH_SHORT[endD.getUTCMonth() + 1]} ${endD.getUTCFullYear()}`;

  const selectedDayData = selectedDate ? dayMap.get(selectedDate) : undefined;
  const selectedWindow  = selectedDate ? windowDateMap.get(selectedDate)?.[0] : undefined;
  const isExact         = !!selectedDate && exactDays.has(selectedDate);

  return (
    <div className="space-y-4">
      {/* Week navigator */}
      <div className="glass-card rounded-2xl px-4 py-3 flex items-center justify-between">
        <button onClick={onPrevWeek} className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-sm font-semibold text-white">{headerLabel}</span>
        <button onClick={onNextWeek} className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* 7-day grid */}
      <div className="glass-card rounded-2xl p-3 grid grid-cols-7 gap-1.5">
        {weekDates.map((dateStr) => {
          const d      = new Date(dateStr + "T12:00:00Z");
          const wIdx   = d.getUTCDay();
          const wd     = WEEKDAY_SHORT[wIdx];
          const dayNum = d.getUTCDate();
          const data   = dayMap.get(dateStr);
          const wins   = isPremium ? (windowDateMap.get(dateStr) ?? []) : [];
          const top    = wins[0];
          const isToday   = dateStr === todayStr;
          const isSelected = dateStr === selectedDate;
          const isExactDay = exactDays.has(dateStr);
          const score  = data?.score ?? 0;

          return (
            <button
              key={dateStr}
              onClick={() => onSelect(dateStr)}
              className={`flex flex-col items-center gap-1 rounded-xl py-2.5 px-1 transition-colors ${
                isSelected
                  ? "border"
                  : "hover:bg-white/5"
              }`}
              style={isSelected ? {
                background: "rgba(255,174,61,0.10)",
                borderColor: "rgba(255,174,61,0.35)",
              } : undefined}
            >
              <span className="text-[10px] text-slate-500 uppercase">{wd}</span>
              <span className={`text-sm font-semibold leading-none ${isToday ? "text-amber-400" : "text-white"}`}>
                {dayNum}
              </span>

              {/* Score dot */}
              {data && (
                <div
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: scoreColor(score) }}
                />
              )}

              {/* Window band line */}
              {top && (
                <div
                  className="w-full h-0.5 rounded-full"
                  style={{ background: top.favorable ? "rgba(255,174,61,0.50)" : "rgba(224,134,90,0.50)" }}
                />
              )}

              {/* Exact day marker */}
              {isExactDay && (
                <span className="text-[9px] text-violet-400 leading-none">◆</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Week reading card */}
      <WeekReadingCard weekStart={weekStart} readingId={readingId} isPremium={isPremium} />

      {/* Desktop side panel / mobile sheet */}
      {selectedDate && (
        <>
          {/* Desktop inline */}
          <div className="hidden lg:block">
            <DayPanel
              date={selectedDate}
              dayData={selectedDayData}
              chart={chart}
              readingId={readingId}
              isPremium={isPremium}
              activeWindow={selectedWindow}
              isExactDay={isExact}
              skyEvents={skyEvents}
              onClose={() => onSelect(selectedDate)}
            />
          </div>

          {/* Mobile bottom sheet */}
          <div className="lg:hidden fixed inset-0 z-50 flex items-end">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => onSelect(selectedDate)} />
            <div className="relative w-full max-h-[85vh] overflow-y-auto rounded-t-2xl bg-[#07050f] border-t border-white/10 shadow-2xl">
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full bg-white/20" />
              </div>
              <DayPanel
                date={selectedDate}
                dayData={selectedDayData}
                chart={chart}
                readingId={readingId}
                isPremium={isPremium}
                activeWindow={selectedWindow}
                isExactDay={isExact}
                skyEvents={skyEvents}
                onClose={() => onSelect(selectedDate)}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
