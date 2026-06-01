"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import HistorySelector, { type HistoryItem } from "@/components/HistorySelector";
import IntentionFilter, { type CalendarFilter } from "@/components/calendar/IntentionFilter";
import CalendarGrid from "@/components/calendar/CalendarGrid";
import UpcomingEvents from "@/components/calendar/UpcomingEvents";
import DayPanel from "@/components/calendar/DayPanel";
import { CosmoIcon } from "@/components/CosmoIcon";
import { useAuth } from "@/components/AuthContext";
import { computeMonthData, type DayData } from "@/lib/chart-engine";
import type { NatalChart } from "@/lib/astro-types";
import { ROUTES } from "@/lib/routes";

type SavedReading = {
  id: string;
  name: string;
  birth_date: string;
  birth_time: string;
  birth_place: string;
  chart_data: NatalChart;
  interpretation: string;
  daily_reading: string;
  created_at: string;
};

const MONTH_NAMES = [
  "Styczeń","Luty","Marzec","Kwiecień","Maj","Czerwiec",
  "Lipiec","Sierpień","Wrzesień","Październik","Listopad","Grudzień",
];

export default function CalendarPage() {
  const router = useRouter();
  const { session, loading: authLoading } = useAuth();

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [filter, setFilter] = useState<CalendarFilter>("all");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const [readings, setReadings] = useState<SavedReading[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [loadError, setLoadError] = useState("");

  const authHeader: Record<string, string> = session ? { Authorization: `Bearer ${session.access_token}` } : {};

  const selectedReading = useMemo(() => readings.find(r => r.id === selectedId) ?? null, [readings, selectedId]);

  const days = useMemo<DayData[]>(() => {
    if (!selectedReading?.chart_data) return [];
    return computeMonthData(selectedReading.chart_data, year, month);
  }, [selectedReading, year, month]);

  const selectedDayData = useMemo(() => days.find(d => d.date === selectedDate) ?? undefined, [days, selectedDate]);

  const loadReadings = useCallback(async () => {
    if (!session) return;
    setLoadingHistory(true);
    setLoadError("");
    try {
      const res = await fetch("/api/get-readings", { headers: authHeader });
      const { readings: data } = await res.json() as { readings: SavedReading[] };
      setReadings(data || []);
      if (data?.length) setSelectedId(data[0].id);
    } catch {
      setLoadError("Nie udało się wczytać kosmogramów.");
    } finally {
      setLoadingHistory(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  useEffect(() => {
    if (authLoading) return;
    loadReadings();
  }, [authLoading, loadReadings]);

  function prevMonth() {
    if (month === 1) { setYear(y => y - 1); setMonth(12); }
    else setMonth(m => m - 1);
    setSelectedDate(null);
  }
  function nextMonth() {
    if (month === 12) { setYear(y => y + 1); setMonth(1); }
    else setMonth(m => m + 1);
    setSelectedDate(null);
  }

  const selectorItems: HistoryItem[] = readings.map(r => ({
    id: r.id,
    name: r.name || `${r.birth_place.split(",")[0]} · ${r.birth_date}`,
    subtitle: r.birth_date,
  }));

  const emptyState = !loadingHistory && readings.length === 0;

  return (
    <div className="min-h-screen bg-[#03010d] text-white">
      <div className="fixed inset-0 star-bg pointer-events-none" aria-hidden="true" />
      <div aria-hidden="true" className="fixed top-0 left-1/2 -translate-x-1/2 w-[700px] h-[500px] nebula-orb opacity-40 pointer-events-none" />

      <Navbar />

      <main className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 pt-24 pb-20">
        <div className="mb-8 text-center">
          <h1 className="text-3xl sm:text-4xl font-semibold text-white mb-2 font-brand">
            Cosmo <span className="gradient-text text-glow">Kalendarz</span>
          </h1>
          <p className="text-slate-500 text-sm">Wybierz kosmogram i odkryj swoje astrologiczne okna</p>
        </div>

        {loadingHistory && (
          <div className="glass-card rounded-2xl p-10 text-center mb-6">
            <div className="w-8 h-8 border-2 border-amber-600/30 border-t-amber-400 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-slate-500 text-sm">Wczytuję kosmogramy…</p>
          </div>
        )}

        {emptyState && (
          <div className="glass-card rounded-2xl p-8 sm:p-10 text-center">
            <CosmoIcon className="w-8 h-8 text-amber-400 mx-auto mb-3" />
            <h2 className="text-xl text-white font-semibold mb-2 font-brand">Najpierw stwórz swój kosmogram</h2>
            <p className="text-slate-400 text-sm mb-6">
              Żeby zobaczyć kalendarz astrologiczny, potrzebujemy co najmniej jednego zapisanego kosmogramu.
            </p>
            <Link
              href={ROUTES.app.cosmogram.path}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-medium text-sm bg-gradient-to-r from-amber-700 to-amber-500 text-white shadow-lg shadow-amber-950/40 hover:shadow-amber-800/40 transition-all"
            >
              <CosmoIcon className="w-4 h-4" />
              Przejdź do tworzenia kosmogramu
            </Link>
          </div>
        )}

        {loadError && (
          <p className="text-center text-red-400 text-sm mb-4">{loadError}</p>
        )}

        {!loadingHistory && readings.length > 0 && (
          <div className="space-y-5">
            {/* Reading selector */}
            <div className="glass-card rounded-2xl px-4 py-3">
              <HistorySelector
                items={selectorItems}
                selectedId={selectedId}
                onSelect={(id) => { setSelectedId(id); setSelectedDate(null); }}
                onDelete={async (id) => {
                  await fetch(`/api/delete-reading?id=${id}`, { method: "DELETE", headers: authHeader });
                  const updated = readings.filter(r => r.id !== id);
                  setReadings(updated);
                  if (id === selectedId) setSelectedId(updated[0]?.id ?? null);
                }}
                onRename={async (id, name) => {
                  await fetch("/api/rename-reading", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json", ...authHeader },
                    body: JSON.stringify({ id, name }),
                  });
                  setReadings(prev => prev.map(r => r.id === id ? { ...r, name } : r));
                }}
                onNew={() => router.push(ROUTES.app.cosmogram.path)}
                newLabel="Nowy kosmogram"
              />
            </div>

            {/* Filters */}
            <div className="flex items-center gap-3 flex-wrap">
              <IntentionFilter active={filter} onChange={(f) => { setFilter(f); setSelectedDate(null); }} />
            </div>

            {/* Month navigator */}
            <div className="glass-card rounded-2xl p-4">
              <div className="flex items-center justify-between mb-4">
                <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <h2 className="text-base font-semibold text-white">
                  {MONTH_NAMES[month - 1]} {year}
                </h2>
                <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              {days.length > 0 ? (
                <CalendarGrid
                  year={year}
                  month={month}
                  days={days}
                  selectedDate={selectedDate}
                  onSelect={(date) => setSelectedDate(prev => prev === date ? null : date)}
                  filter={filter}
                />
              ) : (
                <div className="text-center py-8 text-slate-500 text-sm">Wybierz kosmogram, aby zobaczyć siatkę.</div>
              )}
            </div>

            {/* Day Panel */}
            {selectedDate && selectedReading && (
              <DayPanel
                date={selectedDate}
                dayData={selectedDayData}
                chart={selectedReading.chart_data}
                readingId={selectedReading.id}
                promptContext={""}
                interpretation={selectedReading.interpretation}
                filter={filter}
                onClose={() => setSelectedDate(null)}
              />
            )}

            {/* Upcoming Events */}
            {selectedReading?.chart_data && (
              <UpcomingEvents chart={selectedReading.chart_data} />
            )}
          </div>
        )}
      </main>
    </div>
  );
}
