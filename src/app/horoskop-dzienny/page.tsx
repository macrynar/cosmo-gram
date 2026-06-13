"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarDays } from "lucide-react";
import { CosmoIcon } from "@/components/CosmoIcon";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import HistorySelector, { type HistoryItem } from "@/components/HistorySelector";
import DailyReading from "@/components/generate/DailyReading";
import { useAuth } from "@/components/AuthContext";
import { track } from "@/components/PostHogProvider";
import type { NatalChart } from "@/lib/astro-types";

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

export default function DailyHoroscopePage() {
  const router = useRouter();
  const { session, loading: authLoading } = useAuth();

  const [readings, setReadings] = useState<SavedReading[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const [dailyReading, setDailyReading] = useState("");
  const [dailyDateLabel, setDailyDateLabel] = useState("Dzisiaj");
  const [dailyLoading, setDailyLoading] = useState(false);
  const [error, setError] = useState("");

  const authHeader: Record<string, string> = session
    ? { Authorization: `Bearer ${session.access_token}` }
    : {};

  const selectedReading = useMemo(
    () => readings.find((r) => r.id === selectedId) ?? null,
    [readings, selectedId],
  );

  const selectorItems: HistoryItem[] = readings.map((r) => ({
    id:      r.id,
    name:    r.name || `${r.birth_place.split(",")[0]} · ${r.birth_date}`,
    subtitle: r.birth_date,
    sunSign: r.chart_data?.planets?.find((p: { name: string }) => p.name === "Słońce")?.sign,
  }));

  const loadReadings = useCallback(async () => {
    if (!session) {
      setReadings([]);
      return;
    }

    setLoadingHistory(true);
    setError("");

    try {
      const res = await fetch("/api/get-readings", { headers: authHeader });
      const { readings: data } = (await res.json()) as { readings: SavedReading[] };
      setReadings(data || []);

      if (data && data.length > 0) {
        const first = data[0];
        setSelectedId(first.id);
        setDailyReading(first.daily_reading || "");
        setDailyDateLabel("Dzisiaj");
      }
    } catch {
      setError("Nie udało się wczytać kosmogramów.");
    } finally {
      setLoadingHistory(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  useEffect(() => {
    if (authLoading) return;
    loadReadings();
  }, [authLoading, loadReadings]);

  function handleSelect(id: string) {
    setSelectedId(id);
    setError("");

    const selected = readings.find((r) => r.id === id);
    if (selected) {
      setDailyReading(selected.daily_reading || "");
      setDailyDateLabel("Dzisiaj");
    }
  }

  async function handleDelete(id: string) {
    await fetch(`/api/delete-reading?id=${id}`, {
      method: "DELETE",
      headers: authHeader,
    });

    const updated = readings.filter((r) => r.id !== id);
    setReadings(updated);

    if (id === selectedId) {
      if (updated.length > 0) {
        setSelectedId(updated[0].id);
        setDailyReading(updated[0].daily_reading || "");
      } else {
        setSelectedId(null);
        setDailyReading("");
      }
    }
  }

  async function handleRename(id: string, name: string) {
    await fetch("/api/rename-reading", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...authHeader },
      body: JSON.stringify({ id, name }),
    });

    setReadings((prev) => prev.map((r) => (r.id === id ? { ...r, name } : r)));
  }

  async function handleGenerateDaily() {
    if (!selectedReading) return;

    const birth = selectedReading.chart_data.birthData;

    if (typeof birth.lat !== "number" || typeof birth.lng !== "number") {
      setError("Brakuje współrzędnych dla tego kosmogramu. Wygeneruj go ponownie.");
      return;
    }

    setDailyLoading(true);
    setError("");

    try {
      const chartRes = await fetch("/api/chart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: birth.date,
          time: birth.time,
          place: birth.place,
          lat: birth.lat,
          lng: birth.lng,
          timeUnknown: birth.timeUnknown,
        }),
      });

      if (!chartRes.ok) {
        throw new Error("Nie udało się przygotować danych kosmogramu.");
      }

      const { promptContext } = (await chartRes.json()) as { promptContext: string };

      const dailyRes = await fetch("/api/daily-reading", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          promptContext,
          interpretationContext: selectedReading.interpretation,
          timezone: birth.timezone,
          chartData: selectedReading.chart_data,
        }),
      });

      if (!dailyRes.ok) {
        throw new Error("Nie udało się wygenerować dziennego horoskopu.");
      }

      const { dailyReading: readingText, dateLabel } = (await dailyRes.json()) as {
        dailyReading: string;
        dateLabel: string;
      };

      setDailyReading(readingText);
      setDailyDateLabel(dateLabel || "Dzisiaj");
      track("daily_reading_generated", { chart_id: selectedReading.id });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nieznany błąd podczas generowania.");
    } finally {
      setDailyLoading(false);
    }
  }

  const emptyState = !loadingHistory && readings.length === 0;

  return (
    <div className="min-h-screen bg-[#03010d] text-white">
      <div className="fixed inset-0 star-bg pointer-events-none" aria-hidden="true" />
      <div aria-hidden="true" className="fixed top-0 left-1/2 -translate-x-1/2 w-[700px] h-[500px] nebula-orb opacity-40 pointer-events-none" />

      <Navbar />

      <main className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 pt-24 pb-20">
        <div className="mb-8 text-center">
          <h1 className="text-3xl sm:text-4xl font-semibold text-white mb-2 font-brand">
            Horoskop <span className="gradient-text text-glow">Dzienny</span>
          </h1>
          <p className="text-slate-500 text-sm">Wybierz zapisany kosmogram i wygeneruj dzienny wgląd na dziś</p>
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
              Żeby wygenerować horoskop dzienny, potrzebujemy co najmniej jednego zapisanego kosmogramu.
            </p>
            <Link
              href="/generate"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-medium text-sm bg-gradient-to-r from-amber-700 to-amber-500 text-white shadow-lg shadow-amber-950/40 hover:shadow-amber-800/40 transition-all"
            >
              <CosmoIcon className="w-4 h-4" />
              Przejdź do tworzenia kosmogramu
            </Link>
          </div>
        )}

        {!loadingHistory && readings.length > 0 && (
          <div className="space-y-5">
            <div className="glass-card rounded-2xl px-4 py-3">
              <HistorySelector
                items={selectorItems}
                selectedId={selectedId}
                onSelect={handleSelect}
                onDelete={handleDelete}
                onRename={handleRename}
                onNew={() => router.push("/generate")}
                newLabel="Nowy kosmogram"
              />
            </div>

            <div className="glass-card rounded-2xl p-4 sm:p-5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <span className="px-3 py-1 rounded-full bg-amber-900/15 border border-amber-800/25">
                    📍 {selectedReading?.birth_place}
                  </span>
                  <span className="px-3 py-1 rounded-full bg-amber-900/15 border border-amber-800/25 inline-flex items-center gap-1.5">
                    <CalendarDays className="w-3.5 h-3.5" />
                    {selectedReading?.birth_date}
                  </span>
                </div>

                <button
                  onClick={handleGenerateDaily}
                  disabled={!selectedReading || dailyLoading}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-amber-900/25 border border-amber-700/45 text-amber-100 hover:bg-amber-800/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {dailyLoading ? (
                    <span className="w-4 h-4 border-2 border-amber-200/25 border-t-amber-200 rounded-full animate-spin" />
                  ) : (
                    <CosmoIcon className="w-4 h-4" />
                  )}
                  {dailyLoading ? "Generuję..." : "Generuj dzienny horoskop"}
                </button>
              </div>

              {error && (
                <div className="mt-4 p-3 rounded-xl bg-red-900/20 border border-red-700/30 text-red-300 text-sm">
                  {error}
                </div>
              )}
            </div>

            <DailyReading text={dailyReading} loading={dailyLoading} dateLabel={dailyDateLabel} />
          </div>
        )}
      </main>
    </div>
  );
}
