"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Clock, GitCompare, X, Sparkles } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import HistorySelector, { type HistoryItem } from "@/components/HistorySelector";
import CalendarGrid from "@/components/calendar/CalendarGrid";
import MonthSummary from "@/components/calendar/MonthSummary";
import DayPanel from "@/components/calendar/DayPanel";
import TodayBar from "@/components/calendar/TodayBar";
import SeasonsCard from "@/components/calendar/SeasonsCard";
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
import { supabase } from "@/lib/supabase";
import type { NatalChart } from "@/lib/astro-types";
import { ROUTES } from "@/lib/routes";

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

// Onboarding coachmarks — shown on first calendar visit, stored in localStorage
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

export default function CalendarPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { session, loading: authLoading } = useAuth();
  const { show: showOnboarding, dismiss: dismissOnboarding } = useOnboarding();

  const now = new Date();
  const paramDate = searchParams.get("date");
  const [year,  setYear]  = useState(() => paramDate ? parseInt(paramDate.slice(0, 4))  : now.getFullYear());
  const [month, setMonth] = useState(() => paramDate ? parseInt(paramDate.slice(5, 7))  : now.getMonth() + 1);
  const [selectedDate, setSelectedDate] = useState<string | null>(paramDate);

  const [readings, setReadings]             = useState<SavedReading[]>([]);
  const [selectedId, setSelectedId]         = useState<string | null>(null);
  const [compareId, setCompareId]           = useState<string | null>(null);
  const [compareMode, setCompareMode]       = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [loadError, setLoadError]           = useState("");
  const [isPremium, setIsPremium]           = useState(false);

  const authHeader: Record<string, string> = session ? { Authorization: `Bearer ${session.access_token}` } : {};

  const selectedReading = useMemo(() => readings.find(r => r.id === selectedId) ?? null, [readings, selectedId]);
  const compareReading  = useMemo(
    () => compareMode && compareId ? readings.find(r => r.id === compareId) ?? null : null,
    [readings, compareId, compareMode]
  );

  // ── Month day data ──
  const days = useMemo(
    () => selectedReading?.chart_data ? computeMonthData(selectedReading.chart_data, year, month) : [],
    [selectedReading, year, month]
  );

  const compareDays = useMemo(
    () => compareReading?.chart_data ? computeMonthData(compareReading.chart_data, year, month) : undefined,
    [compareReading, year, month]
  );

  // ── Layer 2: Fast windows ──
  const fastWindows = useMemo<TransitWindow[]>(() => {
    if (!isPremium || !selectedReading?.chart_data) return [];
    return getFastWindows(selectedReading.chart_data, year, month);
  }, [isPremium, selectedReading, year, month]);

  const windowDateMap = useMemo(
    () => buildWindowDateMap(fastWindows),
    [fastWindows]
  );

  // ── Layer 1: Seasons ──
  const seasons = useMemo<Season[]>(() => {
    if (!isPremium || !selectedReading?.chart_data) return [];
    try {
      return getSeasons(selectedReading.chart_data, new Date());
    } catch { return []; }
  }, [isPremium, selectedReading]);

  const exactDaysThisMonth = useMemo(
    () => getExactDaysForMonth(seasons, year, month),
    [seasons, year, month]
  );

  const moonSignChangeDates = useMemo(
    () => getMoonSignChangeDatesForMonth(year, month),
    [year, month]
  );

  // ── Layer 3b: Sky events (month ±1 day buffer) ──
  const skyEvents = useMemo<SkyEvent[]>(() => {
    const start = new Date(Date.UTC(year, month - 1, 1));
    const end   = new Date(Date.UTC(year, month, 0));
    try {
      return getSkyEvents(start, end, selectedReading?.chart_data);
    } catch { return []; }
  }, [year, month, selectedReading]);

  // ── Active window for selected date ──
  const selectedActiveWindow = useMemo<TransitWindow | undefined>(() => {
    if (!selectedDate || !isPremium) return undefined;
    return windowDateMap.get(selectedDate)?.[0];
  }, [selectedDate, windowDateMap, isPremium]);

  // ── Is selected date an exact day? ──
  const selectedIsExactDay = useMemo(
    () => !!selectedDate && exactDaysThisMonth.has(selectedDate),
    [selectedDate, exactDaysThisMonth]
  );

  // ── Today's active window (for TodayBar) ──
  const todayStr = now.toISOString().slice(0, 10);
  const todayWindow = useMemo<TransitWindow | null>(() => {
    if (!isPremium) return null;
    return windowDateMap.get(todayStr)?.[0] ?? null;
  }, [windowDateMap, todayStr, isPremium]);

  const selectedDayData = useMemo(
    () => days.find(d => d.date === selectedDate) ?? undefined,
    [days, selectedDate]
  );

  const solarReturnDays = useMemo(
    () => selectedReading?.birth_date ? nextBirthdayDaysUntil(selectedReading.birth_date) : null,
    [selectedReading]
  );

  const loadReadings = useCallback(async () => {
    if (!session) return;
    setLoadingHistory(true);
    setLoadError("");
    try {
      const [readingsRes, subData] = await Promise.all([
        fetch("/api/get-readings", { headers: authHeader }),
        supabase.from("subscriptions").select("status").eq("user_id", session.user.id).maybeSingle(),
      ]);
      const { readings: data } = await readingsRes.json() as { readings: SavedReading[] };
      setReadings(data || []);
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

  function renderDayPanel() {
    if (!selectedDate || !selectedReading) return null;
    return (
      <DayPanel
        date={selectedDate}
        dayData={selectedDayData}
        chart={selectedReading.chart_data}
        readingId={selectedReading.id}
        isPremium={isPremium}
        activeWindow={selectedActiveWindow}
        isExactDay={selectedIsExactDay}
        skyEvents={skyEvents}
        onClose={() => setSelectedDate(null)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#03010d] text-white">
      <div className="fixed inset-0 star-bg pointer-events-none" aria-hidden="true" />
      <div aria-hidden="true" className="fixed top-0 left-1/2 -translate-x-1/2 w-[700px] h-[500px] nebula-orb opacity-40 pointer-events-none" />

      <Navbar />

      <main className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 pt-24 pb-20">
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-2">
            <h1 className="text-3xl sm:text-4xl font-semibold text-white font-brand">
              Cosmo <span className="gradient-text text-glow">Kalendarz</span>
            </h1>
          </div>
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

        {loadError && <p className="text-center text-red-400 text-sm mb-4">{loadError}</p>}

        {!loadingHistory && readings.length > 0 && (
          <>
            {solarReturnDays !== null && solarReturnDays <= 14 && (
              <Link
                href={`${ROUTES.app.solarReturn.path}${selectedId ? `?reading_id=${selectedId}` : ""}`}
                className="flex items-center gap-3 glass-card rounded-2xl px-5 py-3.5 mb-5 border border-amber-700/40 bg-gradient-to-r from-amber-950/30 to-transparent hover:border-amber-600/60 transition-colors group"
              >
                <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-amber-200">
                    {solarReturnDays === 0 ? "Twój Solar Return — Dziś!"
                      : solarReturnDays === 1 ? "Twój Solar Return jutro — odkryj energię nadchodzącego roku."
                      : `Twój Solar Return za ${solarReturnDays} dni — odkryj energię nadchodzącego roku.`}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-amber-500 group-hover:text-amber-400 transition-colors shrink-0" />
              </Link>
            )}
          </>
        )}

        {!loadingHistory && readings.length > 0 && (
          <div className={`${selectedDate ? "lg:flex lg:gap-5 lg:items-start" : ""}`}>

            {/* ── Left column ── */}
            <div className={`${selectedDate ? "lg:flex-1 lg:min-w-0" : ""} space-y-4`}>

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

                {/* Compare mode */}
                {readings.length >= 2 && (
                  <div className="mt-3 pt-3 border-t border-white/8">
                    {!compareMode ? (
                      <button
                        onClick={() => { setCompareMode(true); setCompareId(readings.find(r => r.id !== selectedId)?.id ?? null); }}
                        className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors"
                      >
                        <GitCompare className="w-3.5 h-3.5" /> Porównaj z innym kosmogramem
                      </button>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">Porównanie z:</p>
                          <button onClick={() => { setCompareMode(false); setCompareId(null); }} className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 transition-colors">
                            <X className="w-3.5 h-3.5" /> Zakończ
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {readings.filter(r => r.id !== selectedId).map(r => (
                            <button key={r.id} onClick={() => setCompareId(r.id)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${compareId === r.id ? "bg-violet-700/50 border-violet-500/60 text-violet-200" : "bg-white/5 border-white/10 text-slate-400 hover:bg-white/10"}`}
                            >
                              {r.name || r.birth_date}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* ── LAYER 3: Today bar ── */}
              {selectedReading?.chart_data && (
                <TodayBar
                  chart={selectedReading.chart_data}
                  isPremium={isPremium}
                  activeWindow={todayWindow}
                  skyEvents={skyEvents}
                  onWindowClick={() => { setSelectedDate(todayStr); }}
                />
              )}

              {/* ── No birth time CTA ── */}
              {selectedReading?.chart_data?.birthData?.timeUnknown && (
                <div className="glass-card rounded-2xl px-4 py-3 flex items-center gap-3"
                  style={{ border: "0.5px solid rgba(148,163,184,0.15)" }}>
                  <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                  <p className="text-sm text-slate-400 flex-1 leading-snug">
                    Uzupełnij godzinę urodzenia, żeby odblokować domy natalne i pełnię kalendarza.
                  </p>
                  <Link href={ROUTES.app.cosmogram.path}
                    className="text-xs text-amber-400 hover:text-amber-300 font-medium transition-colors shrink-0">
                    Uzupełnij →
                  </Link>
                </div>
              )}

              {/* ── LAYER 1: Seasons — DESKTOP default collapsed; MOBILE after grid ── */}
              {selectedReading?.chart_data && seasons.length > 0 && (
                <div className="hidden lg:block">
                  <SeasonsCard
                    seasons={seasons}
                    isPremium={isPremium}
                    readingId={selectedId}
                    defaultExpanded={false}
                  />
                </div>
              )}

              {/* ── Month navigator + grid ── */}
              <div className="glass-card rounded-2xl p-4">
                <div className="flex items-center justify-between mb-4">
                  <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <h2 className="text-base font-semibold text-white">
                    {MONTH_NAMES[month - 1]} {year}
                    {compareMode && compareReading && (
                      <span className="ml-2 text-xs font-normal text-violet-400">
                        Ty vs {compareReading.name || compareReading.birth_date}
                      </span>
                    )}
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
                    compareDays={compareDays}
                    selectedDate={selectedDate}
                    onSelect={(date) => setSelectedDate(prev => prev === date ? null : date)}
                    isPremium={isPremium}
                    fastWindows={fastWindows}
                    windowDateMap={windowDateMap}
                    exactDays={exactDaysThisMonth}
                    skyEvents={skyEvents}
                    moonSignChangeDates={moonSignChangeDates}
                  />
                ) : (
                  <div className="text-center py-8 text-slate-500 text-sm">Wybierz kosmogram, aby zobaczyć siatkę.</div>
                )}
              </div>

              {/* ── LAYER 2: Month summary — fast windows + sky events ── */}
              {selectedReading?.chart_data && (
                <MonthSummary
                  year={year}
                  month={month}
                  isPremium={isPremium}
                  readingId={selectedId}
                  skyEvents={skyEvents}
                  onWindowClick={(peakDate) => {
                    const d = new Date(peakDate + "T12:00:00Z");
                    setYear(d.getUTCFullYear());
                    setMonth(d.getUTCMonth() + 1);
                    setSelectedDate(peakDate);
                  }}
                />
              )}

              {/* ── LAYER 1: Seasons — MOBILE (after grid) ── */}
              {selectedReading?.chart_data && seasons.length > 0 && (
                <div className="lg:hidden">
                  <SeasonsCard
                    seasons={seasons}
                    isPremium={isPremium}
                    readingId={selectedId}
                    defaultExpanded={false}
                  />
                </div>
              )}
            </div>

            {/* ── Right column: Day Panel (desktop) ── */}
            {selectedDate && selectedReading && (
              <div className="hidden lg:block lg:w-[420px] lg:shrink-0 lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto">
                {renderDayPanel()}
              </div>
            )}
          </div>
        )}

        {/* ── Mobile bottom sheet ── */}
        {selectedDate && selectedReading && (
          <div className="lg:hidden fixed inset-0 z-50 flex items-end">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedDate(null)} />
            <div className="relative w-full max-h-[85vh] overflow-y-auto rounded-t-2xl bg-[#07050f] border-t border-white/10 shadow-2xl">
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full bg-white/20" />
              </div>
              {renderDayPanel()}
            </div>
          </div>
        )}

        {/* ── Onboarding coachmarks ── */}
        {showOnboarding && (
          <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm px-4">
            <div className="glass-card rounded-2xl p-5 border border-white/12 shadow-2xl space-y-3">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Jak czytać kalendarz</p>
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
                  <strong>dzień dokładności</strong> — sezon w najciaśniejszym orbie (rzadkie, ważne)
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
