"use client";

import { useState, useEffect, useCallback } from "react";
import { Star } from "lucide-react";
import Navbar from "@/components/Navbar";
import BirthForm from "@/components/generate/BirthForm";
import NatalChartSVG from "@/components/generate/NatalChartSVG";
import PlanetTable from "@/components/generate/PlanetTable";
import Interpretation from "@/components/generate/Interpretation";
import HistorySelector, { type HistoryItem } from "@/components/HistorySelector";
import { NatalChart } from "@/lib/astro-types";
import { useAuth } from "@/components/AuthContext";
import { track } from "@/components/PostHogProvider";

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

export default function GeneratePage() {
  const { session, loading: authLoading } = useAuth();

  // History
  const [readings, setReadings]     = useState<SavedReading[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Live generation state
  const [chart, setChart]                       = useState<NatalChart | null>(null);
  const [interpretation, setInterpretation]     = useState("");
  const [chartLoading, setChartLoading]         = useState(false);
  const [interpretLoading, setInterpretLoading] = useState(false);
  const [error, setError]                       = useState("");
  const [showForm, setShowForm]                 = useState(false);

  const authHeader: Record<string, string> = session
    ? { Authorization: `Bearer ${session.access_token}` }
    : {};

  const loadReadings = useCallback(async () => {
    if (!session) return;
    setLoadingHistory(true);
    try {
      const res = await fetch("/api/get-readings", { headers: authHeader });
      const { readings: data } = await res.json() as { readings: SavedReading[] };
      setReadings(data);
      if (data.length > 0 && !selectedId) {
        const first = data[0];
        setSelectedId(first.id);
        displayReading(first);
        setShowForm(false);
      } else if (data.length === 0) {
        setShowForm(true);
      }
    } finally {
      setLoadingHistory(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  useEffect(() => {
    if (authLoading) return;
    if (!session) {
      setShowForm(true);
      return;
    }
    loadReadings();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, authLoading]);

  function displayReading(r: SavedReading) {
    setChart(r.chart_data);
    setInterpretation(r.interpretation);
  }

  function handleSelect(id: string) {
    setSelectedId(id);
    setShowForm(false);
    setError("");
    const r = readings.find(r => r.id === id);
    if (r) displayReading(r);
  }

  async function handleDelete(id: string) {
    await fetch(`/api/delete-reading?id=${id}`, {
      method: "DELETE",
      headers: authHeader,
    });
    const updated = readings.filter(r => r.id !== id);
    setReadings(updated);
    if (id === selectedId) {
      if (updated.length > 0) {
        setSelectedId(updated[0].id);
        displayReading(updated[0]);
      } else {
        setSelectedId(null);
        setChart(null);
        setInterpretation("");
        setShowForm(true);
      }
    }
  }

  async function handleRename(id: string, name: string) {
    await fetch("/api/rename-reading", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...authHeader },
      body: JSON.stringify({ id, name }),
    });
    setReadings(prev => prev.map(r => r.id === id ? { ...r, name } : r));
  }

  function handleNew() {
    setSelectedId(null);
    setChart(null);
    setInterpretation("");
    setError("");
    setShowForm(true);
  }

  async function handleFormSubmit(data: {
    name: string; date: string; time: string; place: string; lat: number; lng: number; timeUnknown: boolean;
  }) {
    setChartLoading(true);
    setError("");
    setChart(null);
    setInterpretation("");
    setShowForm(false);

    try {
      const chartRes = await fetch("/api/chart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!chartRes.ok) {
        const e = await chartRes.json() as { error: string };
        throw new Error(e.error ?? "Błąd obliczania kosmogramu");
      }
      const { chart: newChart, promptContext } = await chartRes.json() as {
        chart: NatalChart; promptContext: string;
      };
      setChart(newChart);
      setChartLoading(false);

      setInterpretLoading(true);
      let interpretationText = "";
      const interpRes = await fetch("/api/interpret", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ promptContext }),
      });
      if (interpRes.ok) {
        const { interpretation: text } = await interpRes.json() as { interpretation: string };
        interpretationText = text;
        setInterpretation(text);
      }

      track("first_natal_view", { has_time: !!data.time, place: data.place.split(",")[0] });

      // Save and refresh list
      if (session) {
        const saveRes = await fetch("/api/save-reading", {
          method: "POST",
          headers: { "Content-Type": "application/json", ...authHeader },
          body: JSON.stringify({
            name: data.name.trim() || undefined,
            birthDate: data.date,
            birthTime: data.time,
            birthPlace: data.place,
            chart: newChart,
            interpretation: interpretationText,
            dailyReading: "",
          }),
        });
        if (saveRes.ok) {
          const { id } = await saveRes.json() as { id: string };
          const defaultName = data.name.trim() || `${data.place.split(",")[0]} · ${data.date}`;
          const newEntry: SavedReading = {
            id, name: defaultName,
            birth_date: data.date, birth_time: data.time, birth_place: data.place,
            chart_data: newChart, interpretation: interpretationText,
            daily_reading: "", created_at: new Date().toISOString(),
          };
          setReadings(prev => [newEntry, ...prev]);
          setSelectedId(id);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nieznany błąd");
      setChartLoading(false);
      setShowForm(true);
    } finally {
      setInterpretLoading(false);
    }
  }

  function getDominantElement(c: NatalChart): { label: string; emoji: string; color: string } {
    const ELEMENTS: Record<string, string> = {
      "Baran": "Ogień", "Lew": "Ogień", "Strzelec": "Ogień",
      "Byk": "Ziemia", "Panna": "Ziemia", "Koziorożec": "Ziemia",
      "Bliźnięta": "Powietrze", "Waga": "Powietrze", "Wodnik": "Powietrze",
      "Rak": "Woda", "Skorpion": "Woda", "Ryby": "Woda",
    };
    const counts: Record<string, number> = { "Ogień": 0, "Ziemia": 0, "Powietrze": 0, "Woda": 0 };
    c.planets.forEach(p => { const el = ELEMENTS[p.sign]; if (el) counts[el]++; });
    const top = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    const dominant = top[0][0];
    const map: Record<string, { emoji: string; color: string }> = {
      "Ogień":     { emoji: "🔥", color: "border-red-800/30 text-red-300/80 bg-red-900/10" },
      "Ziemia":    { emoji: "🌿", color: "border-green-800/30 text-green-300/80 bg-green-900/10" },
      "Powietrze": { emoji: "💨", color: "border-sky-800/30 text-sky-300/80 bg-sky-900/10" },
      "Woda":      { emoji: "💧", color: "border-blue-800/30 text-blue-300/80 bg-blue-900/10" },
    };
    return { label: dominant, ...map[dominant] };
  }

  const selectorItems: HistoryItem[] = readings.map(r => ({
    id: r.id,
    name: r.name || `${r.birth_place.split(",")[0]} · ${r.birth_date}`,
    subtitle: r.birth_date,
  }));

  const hasResults = chart && !chartLoading;

  return (
    <div className="min-h-screen bg-[#03010d] text-white">
      <div className="fixed inset-0 star-bg pointer-events-none" aria-hidden="true" />
      <div aria-hidden="true" className="fixed top-0 left-1/2 -translate-x-1/2 w-[700px] h-[500px] nebula-orb opacity-40 pointer-events-none" />
      <Star className="fixed top-[18%] left-[8%] w-2 h-2 text-amber-400/40 animate-pulse pointer-events-none" style={{ animationDuration: "3.5s" }} />
      <Star className="fixed top-[55%] right-[4%] w-2 h-2 text-amber-400/40 animate-pulse pointer-events-none" style={{ animationDuration: "4s" }} />

      <Navbar />

      <main className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 pt-24 pb-20">

        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2 font-brand">
            Twój <span className="gradient-text text-glow">Kosmogram Natalny</span>
          </h1>
          <p className="text-slate-500 text-sm">Obliczenia astronomiczne · Swiss Ephemeris · Interpretacja AI</p>
        </div>

        {/* History selector */}
        {session && !loadingHistory && readings.length > 0 && (
          <div className="glass-card rounded-2xl px-4 py-3 mb-4">
            <HistorySelector
              items={selectorItems}
              selectedId={selectedId}
              onSelect={handleSelect}
              onDelete={handleDelete}
              onRename={handleRename}
              onNew={handleNew}
              newLabel="Nowy kosmogram"
            />
          </div>
        )}

        {/* Loading history */}
        {loadingHistory && (
          <div className="glass-card rounded-2xl p-10 text-center mb-6">
            <div className="w-8 h-8 border-2 border-amber-600/30 border-t-amber-400 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-slate-500 text-sm">Wczytuję kosmogramy…</p>
          </div>
        )}

        {/* Form */}
        {!loadingHistory && showForm && (
          <div className="glass-card rounded-2xl p-5 mb-8">
            <BirthForm onSubmit={handleFormSubmit} loading={chartLoading} />
            {error && (
              <div className="mt-3 p-3 rounded-xl bg-red-900/20 border border-red-700/30 text-red-300 text-sm">
                {error}
              </div>
            )}
          </div>
        )}

        {/* Computing */}
        {chartLoading && (
          <div className="glass-card rounded-2xl p-16 text-center mb-8">
            <div className="w-14 h-14 border-2 border-amber-600/30 border-t-amber-400 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-400 text-sm">Obliczam pozycje planet…</p>
          </div>
        )}

        {/* Results */}
        {hasResults && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-slate-500">
              <span className="px-3 py-1 rounded-full bg-amber-900/15 border border-amber-800/25 text-slate-400">
                📅 {chart.birthData.date}
              </span>
              <span className="px-3 py-1 rounded-full bg-amber-900/15 border border-amber-800/25 text-slate-400">
                🕐 {chart.birthData.timeUnknown ? "godzina nieznana" : chart.birthData.time}
              </span>
              <span className="px-3 py-1 rounded-full bg-amber-900/15 border border-amber-800/25 text-slate-400 max-w-[240px] truncate">
                📍 {chart.birthData.place}
              </span>
              {!chart.birthData.timeUnknown && (
                <span className="px-3 py-1 rounded-full bg-amber-900/15 border border-amber-800/25 text-slate-500">
                  🌐 {chart.birthData.timezone}
                </span>
              )}
            </div>

            {/* Sun / Moon / dominant element */}
            {(() => {
              const sun  = chart.planets.find(p => p.name === "Słońce");
              const moon = chart.planets.find(p => p.name === "Księżyc");
              const el   = getDominantElement(chart);
              return (
                <div className="flex flex-wrap items-center justify-center gap-2">
                  {sun && (
                    <span className="px-3 py-1 rounded-full text-xs border border-amber-700/40 text-amber-200/90 bg-amber-900/15">
                      ☀️ {sun.sign}
                    </span>
                  )}
                  {moon && (
                    <span className="px-3 py-1 rounded-full text-xs border border-slate-700/40 text-slate-300/80 bg-slate-900/20">
                      🌙 {moon.sign}
                    </span>
                  )}
                  <span className={`px-3 py-1 rounded-full text-xs border ${el.color}`}>
                    {el.emoji} Dominuje {el.label}
                  </span>
                </div>
              );
            })()}

            {chart.birthData.timeUnknown && (
              <p className="text-center text-xs text-amber-500/60">
                Bez godziny urodzenia — wyniki bez Ascendentu, MC i domów.
              </p>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
              <div className="glass-card rounded-3xl p-4 sm:p-5 flex flex-col">
                <NatalChartSVG chart={chart} />
                {!chart.birthData.timeUnknown && (
                  <div className="flex flex-wrap justify-center gap-3 text-xs text-slate-500 mt-4 pt-3 border-t border-amber-900/15">
                    {[
                      { color: "bg-amber-400/60", label: "Koniunkcja (0°)" },
                      { color: "bg-green-400/60",  label: "Trygon (120°)" },
                      { color: "bg-red-400/60",    label: "Opozycja (180°)" },
                      { color: "bg-orange-400/60", label: "Kwadrat (90°)" },
                      { color: "bg-blue-400/60",   label: "Sekstyl (60°)" },
                    ].map(({ color, label }) => (
                      <span key={label} className="flex items-center gap-1.5">
                        <span className={`inline-block w-3 h-1.5 rounded-full ${color}`} />
                        {label}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="h-full"><PlanetTable chart={chart} /></div>
            </div>

            <Interpretation text={interpretation} loading={interpretLoading} />

            {!session && (
              <p className="text-center text-xs text-slate-600">
                Zaloguj się, żeby Twój kosmogram był zapamiętany po odświeżeniu strony.
              </p>
            )}
          </div>
        )}

      </main>
    </div>
  );
}
