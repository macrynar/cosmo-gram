"use client";

import { ChevronLeft, ChevronRight, Clock } from "lucide-react";
import Link from "next/link";
import CalendarGrid from "@/components/calendar/CalendarGrid";
import MonthSummary from "@/components/calendar/MonthSummary";
import DayPanel from "@/components/calendar/DayPanel";
import { ROUTES } from "@/lib/routes";
import type { NatalChart } from "@/lib/astro-types";
import type { TransitWindow, SkyEvent } from "@/lib/astro/layers";
import type { DayData } from "@/lib/chart-engine";

const MONTH_NAMES = [
  "Styczeń","Luty","Marzec","Kwiecień","Maj","Czerwiec",
  "Lipiec","Sierpień","Wrzesień","Październik","Listopad","Grudzień",
];

type Props = {
  year:               number;
  month:              number;
  days:               DayData[];
  chart:              NatalChart;
  readingId:          string;
  isPremium:          boolean;
  fastWindows:        TransitWindow[];
  windowDateMap:      Map<string, TransitWindow[]>;
  exactDays:          Set<string>;
  moonSignChangeDates:Set<string>;
  skyEvents:          SkyEvent[];
  selectedDate:       string | null;
  onSelect:           (date: string) => void;
  onPrevMonth:        () => void;
  onNextMonth:        () => void;
  timeUnknown:        boolean;
};

export default function MonthView({
  year, month, days, chart, readingId, isPremium,
  fastWindows, windowDateMap, exactDays, moonSignChangeDates, skyEvents,
  selectedDate, onSelect, onPrevMonth, onNextMonth, timeUnknown,
}: Props) {
  const todayStr = new Date().toISOString().slice(0, 10);
  const selectedDayData = days.find(d => d.date === selectedDate);
  const selectedWindow  = selectedDate ? windowDateMap.get(selectedDate)?.[0] : undefined;
  const isExact         = !!selectedDate && exactDays.has(selectedDate);

  return (
    <div className={`${selectedDate ? "lg:flex lg:gap-5 lg:items-start" : ""}`}>

      {/* Left column */}
      <div className={`${selectedDate ? "lg:flex-1 lg:min-w-0" : ""} space-y-4`}>

        {/* No birth time CTA */}
        {timeUnknown && (
          <div
            className="glass-card rounded-2xl px-4 py-3 flex items-center gap-3"
            style={{ border: "0.5px solid rgba(148,163,184,0.15)" }}
          >
            <Clock className="w-4 h-4 text-slate-400 shrink-0" />
            <p className="text-sm text-slate-400 flex-1 leading-snug">
              Uzupełnij godzinę urodzenia, żeby odblokować domy natalne i pełnię kalendarza.
            </p>
            <Link
              href={ROUTES.app.cosmogram.path}
              className="text-xs text-amber-400 hover:text-amber-300 font-medium transition-colors shrink-0"
            >
              Uzupełnij →
            </Link>
          </div>
        )}

        {/* Month navigator + grid */}
        <div className="glass-card rounded-2xl p-4">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={onPrevMonth}
              className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h2 className="text-base font-semibold text-white">
              {MONTH_NAMES[month - 1]} {year}
            </h2>
            <button
              onClick={onNextMonth}
              className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {days.length > 0 ? (
            <CalendarGrid
              year={year}
              month={month}
              days={days}
              selectedDate={selectedDate}
              onSelect={(date) => onSelect(date)}
              isPremium={isPremium}
              fastWindows={fastWindows}
              windowDateMap={windowDateMap}
              exactDays={exactDays}
              skyEvents={skyEvents}
              moonSignChangeDates={moonSignChangeDates}
            />
          ) : (
            <div className="text-center py-8 text-slate-500 text-sm">
              Wczytuję dane…
            </div>
          )}
        </div>

        {/* Month summary */}
        <MonthSummary
          year={year}
          month={month}
          isPremium={isPremium}
          readingId={readingId}
          skyEvents={skyEvents}
          onWindowClick={(peakDate) => {
            const d = new Date(peakDate + "T12:00:00Z");
            if (d.getUTCFullYear() !== year || d.getUTCMonth() + 1 !== month) return;
            onSelect(peakDate);
          }}
        />
      </div>

      {/* Right column: Day Panel (desktop) */}
      {selectedDate && (
        <div className="hidden lg:block lg:w-[420px] lg:shrink-0 lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto">
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
      )}

      {/* Mobile bottom sheet */}
      {selectedDate && (
        <div className="lg:hidden fixed inset-0 z-50 flex items-end">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => onSelect(selectedDate)}
          />
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
      )}
    </div>
  );
}
