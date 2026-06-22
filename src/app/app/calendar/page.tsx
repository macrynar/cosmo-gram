"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight, Sparkles } from "lucide-react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import HistorySelector, { type HistoryItem } from "@/components/HistorySelector";
import HorizonSwitcher, { type Horizon } from "@/components/calendar/HorizonSwitcher";
import TodayView from "@/components/calendar/views/TodayView";
import WeekView from "@/components/calendar/views/WeekView";
import MonthView from "@/components/calendar/views/MonthView";
import YearView from "@/components/calendar/views/YearView";
import { CosmoIcon } from "@/components/CosmoIcon";
import { useAuth } from "@/components/AuthContext";
import { computeMonthData } from "@/lib/chart-engine";
import {
  getFastWindows,
  buildWindowDateMap,
  getSeasons,
  getExactDaysForMonth,
  getMoonSignChangeDatesForMonth,
  getSkyEvents,
  type TransitWindow,
  type Season,
  type SkyEvent,
} from "@/lib/astro/layers";
import { selectShownSeasons, selectUpcoming, selectGridBands } from "@/lib/astro/calendarSelectors";
import { supabase } from "@/lib/supabase";
import type { NatalChart } from "@/lib/astro-types";
import { ROUTES } from "@/lib/routes";

// ─── Helpers ───────────────────────────────────────────────────────────────────

function nextBirthdayDaysUntil(birthDate: string): number {
  const today = new Date();
  const birth = new Date(birthDate + "T12:00:00Z");
  const m = birth.getUTCMonth();
  const d = birth.getUTCDate();
  const todayUTC = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
  let candidate = new Date(Date.UTC(today.getUTCFullYear(), m, d));
  if (candidate < todayUTC) candidate = new Date(Date.UTC(today.getUTCFullYear() + 1, m, d));
  return Math.round((candidate.getTime() - todayUTC.getTime()) / 86400000);
}

function getMondayISO(date: Date): string {
  const d   = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = d.getUTCDay();
  d.setUTCDate(d.getUTCDate() + (day === 0 ? -6 : 1 - day));
  return d.toISOString().slice(0, 10);
}

function shiftWeek(mondayISO: string, delta: number): string {
  const d = new Date(mondayISO + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + delta * 7);
  return d.toISOString().slice(0, 10);
}

// ─── Types ─────────────────────────────────────────────────────────────────────

type SavedReading = {
  id:              string;
  name:            string;
  birth_date:      string;
  birth_time:      string;
  birth_place:     string;
  chart_data:      NatalChart;
  interpretation:  string;
  daily_reading:   string;
  created_at:      string;
};

// Onboarding coachmarks — shown on first calendar visit
function useOnboarding() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!localStorage.getItem("cal_v4_onboarded")) setShow(true);
  }, []);
  function dismiss() {
    localStorage.setItem("cal_v4_onboarded", "1");
    setShow(false);
  }
  return { show, dismiss };
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function CalendarPage() {
  const router       = useRouter();
  const pathname     = usePathname();
  const searchParams = useSearchParams();
  const { session, loading: authLoading } = useAuth();
  const { show: showOnboarding, dismiss: dismissOnboarding } = useOnboarding();

  const now = new Date();

  // Horizon from URL param
  const rawH = searchParams.get("h");
  const horizon: Horizon = (rawH === "week" || rawH === "month" || rawH === "year")
    ? rawH
    : "today";

  // Month navigation state
  const paramDate = searchParams.get("date");
  const [year,  setYear]  = useState(() => paramDate ? parseInt(paramDate.slice(0, 4)) : now.getFullYear());
  const [month, setMonth] = useState(() => paramDate ? parseInt(paramDate.slice(5, 7)) : now.getMonth() + 1);

  // Week navigation state
  const [weekStart, setWeekStart] = useState(() => getMondayISO(now));

  // Selected day state (used in Week and Month views)
  const [selectedDate, setSelectedDate] = useState<string | null>(paramDate);

  // Data
  const [readings,        setReadings]        = useState<SavedReading[]>([]);
  const [selectedId,      setSelectedId]      = useState<string | null>(null);
  const [loadingHistory,  setLoadingHistory]  = useState(false);
  const [loadError,       setLoadError]       = useState("");
  const [isPremium,       setIsPremium]       = useState(false);
  const [primaryId,       setPrimaryId]       = useState<string | null>(null);

  const authHeader: Record<string, string> = session
    ? { Authorization: `Bearer ${session.access_token}` }
    : {};

  const selectedReading = useMemo(
    () => readings.find(r => r.id === selectedId) ?? null,
    [readings, selectedId]
  );

  // ── Layer 2: monthly data + windows ──
  const days = useMemo(
    () => selectedReading?.chart_data
      ? computeMonthData(selectedReading.chart_data, year, month)
      : [],
    [selectedReading, year, month]
  );

  const fastWindows = useMemo<TransitWindow[]>(() => {
    if (!isPremium || !selectedReading?.chart_data) return [];
    return getFastWindows(selectedReading.chart_data, year, month);
  }, [isPremium, selectedReading, year, month]);

  const windowDateMap = useMemo(() => {
    const daysInMonth = new Date(year, month, 0).getDate();
    return buildWindowDateMap(selectGridBands(fastWindows, daysInMonth));
  }, [fastWindows, year, month]);

  // ── Layer 1: Seasons ──
  const seasons = useMemo<Season[]>(() => {
    if (!isPremium || !selectedReading?.chart_data) return [];
    try { return getSeasons(selectedReading.chart_data, now); }
    catch { return []; }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPremium, selectedReading]);

  const shownSeasons = useMemo(() => selectShownSeasons(seasons), [seasons]);

  const exactDaysThisMonth = useMemo(
    () => getExactDaysForMonth(seasons, year, month),
    [seasons, year, month]
  );

  const moonSignChangeDates = useMemo(
    () => getMoonSignChangeDatesForMonth(year, month),
    [year, month]
  );

  // ── Layer 3b: Sky events ──
  const skyEvents = useMemo<SkyEvent[]>(() => {
    const start = new Date(Date.UTC(year, month - 1, 1));
    const end   = new Date(Date.UTC(year, month, 0));
    try { return getSkyEvents(start, end, selectedReading?.chart_data); }
    catch { return []; }
  }, [year, month, selectedReading]);

  // ── Today helpers ──
  const todayStr = now.toISOString().slice(0, 10);

  const todayWindow = useMemo<TransitWindow | null>(() => {
    if (!isPremium) return null;
    return windowDateMap.get(todayStr)?.[0] ?? null;
  }, [windowDateMap, todayStr, isPremium]);

  const upcomingWindows = useMemo(
    () => selectUpcoming(fastWindows, todayStr),
    [fastWindows, todayStr]
  );

  const solarReturnDays = useMemo(
    () => selectedReading?.birth_date
      ? nextBirthdayDaysUntil(selectedReading.birth_date)
      : null,
    [selectedReading]
  );

  // ── Data loading ──
  const loadReadings = useCallback(async () => {
    if (!session) return;
    setLoadingHistory(true);
    setLoadError("");
    try {
      const [readingsRes, subData] = await Promise.all([
        fetch("/api/get-readings", { headers: authHeader }),
        supabase.from("subscriptions").select("status").eq("user_id", session.user.id).maybeSingle(),
      ]);
      const { readings: data, primary_id } = await readingsRes.json() as { readings: SavedReading[]; primary_id: string | null };
      setReadings(data || []);
      setPrimaryId(primary_id ?? null);
      if (data?.length) setSelectedId(data[0].id);
      const s = subData.data?.status;
      setIsPremium(s === "active" || s === "trialing");
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

  // ── Month navigation ──
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

  // ── Week navigation ──
  function prevWeek() {
    const newStart = shiftWeek(weekStart, -1);
    setWeekStart(newStart);
    setSelectedDate(null);
    // Sync month to the Thursday of the new week (ISO week standard)
    const thu = new Date(newStart + "T12:00:00Z");
    thu.setUTCDate(thu.getUTCDate() + 3);
    setYear(thu.getUTCFullYear());
    setMonth(thu.getUTCMonth() + 1);
  }
  function nextWeek() {
    const newStart = shiftWeek(weekStart, 1);
    setWeekStart(newStart);
    setSelectedDate(null);
    const thu = new Date(newStart + "T12:00:00Z");
    thu.setUTCDate(thu.getUTCDate() + 3);
    setYear(thu.getUTCFullYear());
    setMonth(thu.getUTCMonth() + 1);
  }

  const selectorItems: HistoryItem[] = readings.map(r => ({
    id:       r.id,
    name:     r.name || `${r.birth_place.split(",")[0]} · ${r.birth_date}`,
    subtitle: r.birth_date,
    sunSign:  r.chart_data?.planets?.find(p => p.name === "Słońce")?.sign,
  }));

  const emptyState = !loadingHistory && readings.length === 0;
  const timeUnknown = !!selectedReading?.chart_data?.birthData?.timeUnknown;

  return (
    <div className="min-h-screen bg-[#03010d] text-white">
      <div className="fixed inset-0 star-bg pointer-events-none" aria-hidden="true" />
      <div
        aria-hidden="true"
        className="fixed top-0 left-1/2 -translate-x-1/2 w-[700px] h-[500px] nebula-orb opacity-40 pointer-events-none"
      />

      <Navbar />

      <main className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 pt-24 pb-20">
        <div className="mb-6 text-center">
          <h1 className="text-3xl sm:text-4xl font-semibold text-white font-brand">
            Cosmo <span className="gradient-text text-glow">Prognoza</span>
          </h1>
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
            <h2 className="text-xl text-white font-semibold mb-2 font-brand">
              Najpierw stwórz swój kosmogram
            </h2>
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
          <div className="space-y-4">
            {/* Solar return banner */}
            {solarReturnDays !== null && solarReturnDays <= 14 && (
              <Link
                href={`${ROUTES.app.solarReturn.path}${selectedId ? `?reading_id=${selectedId}` : ""}`}
                className="flex items-center gap-3 glass-card rounded-2xl px-5 py-3.5 border border-amber-700/40 bg-gradient-to-r from-amber-950/30 to-transparent hover:border-amber-600/60 transition-colors group"
              >
                <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-amber-200">
                    {solarReturnDays === 0
                      ? "Twój Solar Return — Dziś!"
                      : solarReturnDays === 1
                        ? "Twój Solar Return jutro — odkryj energię nadchodzącego roku."
                        : `Twój Solar Return za ${solarReturnDays} dni — odkryj energię nadchodzącego roku.`}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-amber-500 group-hover:text-amber-400 transition-colors shrink-0" />
              </Link>
            )}

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
                primaryId={primaryId}
                onSetPrimary={async (id) => {
                  setPrimaryId(id);
                  await fetch("/api/set-primary-reading", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json", ...authHeader },
                    body: JSON.stringify({ reading_id: id }),
                  });
                }}
                onNew={() => router.push(ROUTES.app.cosmogram.path)}
                newLabel="Nowy kosmogram"
              />
            </div>

            {/* Horizon switcher */}
            <HorizonSwitcher value={horizon} />

            {/* Views */}
            {selectedReading?.chart_data && (
              <>
                {horizon === "today" && (
                  <TodayView
                    chart={selectedReading.chart_data}
                    isPremium={isPremium}
                    dayWindows={windowDateMap.get(todayStr) ?? []}
                    todayWindow={todayWindow}
                    skyEvents={skyEvents}
                    upcomingWindows={upcomingWindows}
                    onWindowClick={() => setSelectedDate(todayStr)}
                    readingId={selectedReading.id}
                    session={session}
                  />
                )}

                {horizon === "week" && (
                  <WeekView
                    weekStart={weekStart}
                    days={days}
                    year={year}
                    month={month}
                    chart={selectedReading.chart_data}
                    readingId={selectedReading.id}
                    isPremium={isPremium}
                    windowDateMap={windowDateMap}
                    exactDays={exactDaysThisMonth}
                    skyEvents={skyEvents}
                    selectedDate={selectedDate}
                    onSelect={(date) => setSelectedDate(prev => prev === date ? null : date)}
                    onPrevWeek={prevWeek}
                    onNextWeek={nextWeek}
                    session={session}
                  />
                )}

                {horizon === "month" && (
                  <MonthView
                    year={year}
                    month={month}
                    days={days}
                    chart={selectedReading.chart_data}
                    readingId={selectedReading.id}
                    isPremium={isPremium}
                    fastWindows={fastWindows}
                    windowDateMap={windowDateMap}
                    exactDays={exactDaysThisMonth}
                    moonSignChangeDates={moonSignChangeDates}
                    skyEvents={skyEvents}
                    selectedDate={selectedDate}
                    onSelect={(date) => setSelectedDate(prev => prev === date ? null : date)}
                    onPrevMonth={prevMonth}
                    onNextMonth={nextMonth}
                    timeUnknown={timeUnknown}
                    session={session}
                  />
                )}

                {horizon === "year" && (
                  <YearView
                    seasons={shownSeasons}
                    isPremium={isPremium}
                    readingId={selectedId}
                    year={year}
                    session={session}
                    onDayClick={(date) => {
                      const d = new Date(date + "T12:00:00Z");
                      setYear(d.getUTCFullYear());
                      setMonth(d.getUTCMonth() + 1);
                      setSelectedDate(date);
                      const p = new URLSearchParams(searchParams.toString());
                      p.set("h", "month");
                      router.replace(`${pathname}?${p.toString()}`);
                    }}
                  />
                )}
              </>
            )}
          </div>
        )}

        {/* Onboarding coachmarks */}
        {showOnboarding && (
          <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm px-4">
            <div className="glass-card rounded-2xl p-5 border border-white/12 shadow-2xl space-y-3">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Jak czytać prognozę
              </p>
              <div className="space-y-2">
                <p className="text-sm text-slate-300">
                  <span className="inline-block w-4 h-[3px] rounded-full bg-amber-400/60 mr-2 align-middle" />
                  to Twoje <strong>okna</strong>: kilka dni sprzyjającej lub wymagającej energii
                </p>
                <p className="text-sm text-slate-300">
                  <span className="text-amber-400 text-[10px] mr-2">★</span>
                  <strong>peak</strong> — najsilniejszy dzień okna
                </p>
                <p className="text-sm text-slate-300">
                  <span className="text-violet-400 text-[9px] mr-2">◆</span>
                  <strong>dzień dokładności</strong> — sezon w najciaśniejszym orbie
                </p>
              </div>
              <button
                onClick={dismissOnboarding}
                className="w-full py-2 rounded-xl text-sm font-medium text-slate-400 border border-white/10 hover:bg-white/5 transition-colors"
              >
                Rozumiem
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
