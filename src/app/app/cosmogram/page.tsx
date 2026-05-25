"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Star, Share2, Baby, Plus, RefreshCw } from "lucide-react";
import Navbar from "@/components/Navbar";
import BirthForm from "@/components/generate/BirthForm";
import NatalChartSVG from "@/components/generate/NatalChartSVG";
import PlanetTable from "@/components/generate/PlanetTable";
import Interpretation from "@/components/generate/Interpretation";
import HistorySelector, { type HistoryItem } from "@/components/HistorySelector";
import AddChildModal, { type ChildFormData } from "@/components/children/AddChildModal";
import ChildCard from "@/components/children/ChildCard";
import { NatalChart } from "@/lib/astro-types";
import type { ChartPlacement, NatalAspect, ChartNodes } from "@/lib/chart-engine";
import { useAuth } from "@/components/AuthContext";
import { useSubscription } from "@/components/SubscriptionContext";
import { track } from "@/components/PostHogProvider";
import { getPersonalityTags } from "@/lib/personality-tags";
import PaywallModal from "@/components/PaywallModal";
import ShareModal from "@/components/ShareModal";

// ---------------------------------------------------------------------------

type SavedReading = {
  id: string; name: string;
  birth_date: string; birth_time: string; birth_place: string;
  chart_data: NatalChart; interpretation: string; daily_reading: string; created_at: string;
};

type SavedChild = {
  id: string; name: string;
  birth_date: string; birth_time: string; birth_place: string;
  age_at_creation: number; chart_data: NatalChart; interpretation: string; created_at: string;
};

type Tab = "natal" | "child";

function ageFromDate(dateStr: string): number | null {
  if (!dateStr) return null;
  const birth = new Date(dateStr);
  if (isNaN(birth.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  if (now.getMonth() < birth.getMonth() || (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate())) age--;
  return age;
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
  const dominant = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
  const map: Record<string, { emoji: string; color: string }> = {
    "Ogień":     { emoji: "🔥", color: "border-red-800/30 text-red-300/80 bg-red-900/10" },
    "Ziemia":    { emoji: "🌿", color: "border-green-800/30 text-green-300/80 bg-green-900/10" },
    "Powietrze": { emoji: "💨", color: "border-sky-800/30 text-sky-300/80 bg-sky-900/10" },
    "Woda":      { emoji: "💧", color: "border-blue-800/30 text-blue-300/80 bg-blue-900/10" },
  };
  return { label: dominant, ...map[dominant] };
}

// ---------------------------------------------------------------------------

export default function CosmogramPage() {
  const { session, loading: authLoading } = useAuth();
  const { isPro, isLoading: subLoading } = useSubscription();

  const [activeTab, setActiveTab] = useState<Tab>("natal");
  const [childNudge, setChildNudge] = useState(false);
  const childTabRef = useRef<HTMLButtonElement>(null);

  // ── Natal state ──────────────────────────────────────────────────────────
  const [showPaywall, setShowPaywall] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [readings, setReadings] = useState<SavedReading[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [chart, setChart] = useState<NatalChart | null>(null);
  const [interpretation, setInterpretation] = useState("");
  const [chartLoading, setChartLoading] = useState(false);
  const [interpretLoading, setInterpretLoading] = useState(false);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);

  // ── Children state ───────────────────────────────────────────────────────
  const [children, setChildren] = useState<SavedChild[]>([]);
  const [loadingChildren, setLoadingChildren] = useState(false);
  const [showChildModal, setShowChildModal] = useState(false);
  const [generatingChild, setGeneratingChild] = useState(false);
  const [childError, setChildError] = useState("");
  const [regenProgress, setRegenProgress] = useState<{ current: number; total: number } | null>(null);

  const authHeader: Record<string, string> = session
    ? { Authorization: `Bearer ${session.access_token}` }
    : {};

  // ── Load natal readings ──────────────────────────────────────────────────
  const loadReadings = useCallback(async () => {
    if (!session) return;
    setLoadingHistory(true);
    try {
      const res = await fetch("/api/get-readings", { headers: authHeader });
      const { readings: data } = await res.json() as { readings: SavedReading[] };
      setReadings(data);
      if (data.length > 0 && !selectedId) {
        setSelectedId(data[0].id);
        displayReading(data[0]);
        setShowForm(false);
      } else if (data.length === 0) {
        setShowForm(true);
      }
    } finally {
      setLoadingHistory(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  // ── Load children ────────────────────────────────────────────────────────
  const loadChildren = useCallback(async () => {
    if (!session) return;
    setLoadingChildren(true);
    try {
      const res = await fetch("/api/get-children", { headers: authHeader });
      const { children: data } = await res.json() as { children: SavedChild[] };
      setChildren(data ?? []);
    } finally {
      setLoadingChildren(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  useEffect(() => {
    if (authLoading) return;
    if (!session) { setShowForm(true); return; }
    loadReadings();
    loadChildren();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, authLoading]);

  // ── Age nudge ────────────────────────────────────────────────────────────
  function handleDateChange(dateStr: string) {
    const age = ageFromDate(dateStr);
    if (age !== null && age < 13) {
      setChildNudge(true);
    } else {
      setChildNudge(false);
    }
  }

  function switchToChildTab() {
    setActiveTab("child");
    setChildNudge(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // ── Natal handlers ───────────────────────────────────────────────────────
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
    await fetch(`/api/delete-reading?id=${id}`, { method: "DELETE", headers: authHeader });
    const updated = readings.filter(r => r.id !== id);
    setReadings(updated);
    if (id === selectedId) {
      if (updated.length > 0) { setSelectedId(updated[0].id); displayReading(updated[0]); }
      else { setSelectedId(null); setChart(null); setInterpretation(""); setShowForm(true); }
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
    if (session && !subLoading && !isPro && readings.length >= 1) { setShowPaywall(true); return; }
    setSelectedId(null); setChart(null); setInterpretation(""); setError(""); setShowForm(true);
  }

  async function handleFormSubmit(data: {
    name: string; date: string; time: string; place: string; lat: number; lng: number; timeUnknown: boolean;
  }) {
    const age = ageFromDate(data.date);
    if (age !== null && age < 13) {
      setChildNudge(true);
    }

    if (session && !subLoading && !isPro && readings.length >= 1) { setShowPaywall(true); return; }

    setChartLoading(true); setError(""); setChart(null); setInterpretation(""); setShowForm(false);
    try {
      const chartRes = await fetch("/api/chart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!chartRes.ok) { const e = await chartRes.json() as { error: string }; throw new Error(e.error ?? "Błąd obliczania kosmogramu"); }
      const { chart: newChart, promptContext, placements, aspects, nodes } = await chartRes.json() as {
        chart: NatalChart; promptContext: string;
        placements: ChartPlacement[]; aspects: NatalAspect[]; nodes: ChartNodes;
      };
      setChart(newChart);
      setChartLoading(false);
      setInterpretLoading(true);
      let interpretationText = "";
      const interpRes = await fetch("/api/interpret", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          promptContext,
          placements,
          aspects,
          nodes,
          firstName: data.name.trim() || undefined,
          grammaticalForm: "impersonal",
          userId: session?.user?.id,
        }),
      });
      if (interpRes.ok && interpRes.body) {
        const reader = interpRes.body.getReader();
        const decoder = new TextDecoder();
        let acc = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          acc += decoder.decode(value, { stream: true });
          setInterpretation(acc);
        }
        interpretationText = acc;
      }
      track("first_natal_view", { has_time: !!data.time, place: data.place.split(",")[0] });
      if (session) {
        const saveRes = await fetch("/api/save-reading", {
          method: "POST",
          headers: { "Content-Type": "application/json", ...authHeader },
          body: JSON.stringify({
            name: data.name.trim() || undefined,
            birthDate: data.date, birthTime: data.time, birthPlace: data.place,
            chart: newChart, interpretation: interpretationText, dailyReading: "",
          }),
        });
        if (saveRes.ok) {
          const { id } = await saveRes.json() as { id: string };
          const defaultName = data.name.trim() || `${data.place.split(",")[0]} · ${data.date}`;
          setReadings(prev => [{ id, name: defaultName, birth_date: data.date, birth_time: data.time, birth_place: data.place, chart_data: newChart, interpretation: interpretationText, daily_reading: "", created_at: new Date().toISOString() }, ...prev]);
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

  // ── Child handlers ───────────────────────────────────────────────────────
  async function handleAddChild(data: ChildFormData) {
    if (!session) return;
    setGeneratingChild(true); setChildError("");
    try {
      const chartRes = await fetch("/api/chart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: data.date, time: data.time, lat: data.lat, lng: data.lng, place: data.place }),
      });
      if (!chartRes.ok) throw new Error("Błąd obliczania kosmogramu");
      const { chart, promptContext } = await chartRes.json() as { chart: NatalChart; promptContext: string };

      const aiRes = await fetch("/api/ai-child", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: data.name, birthDate: data.date, promptContext }),
      });
      if (!aiRes.ok) throw new Error("Błąd generowania interpretacji");
      const { interpretation } = await aiRes.json() as { interpretation: string };

      const saveRes = await fetch("/api/save-child", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader },
        body: JSON.stringify({
          name: data.name, birthDate: data.date, birthTime: data.time, birthPlace: data.place,
          lat: data.lat, lng: data.lng, timezone: chart.birthData.timezone, chartData: chart, interpretation,
        }),
      });
      if (!saveRes.ok) throw new Error("Błąd zapisu");
      const { id } = await saveRes.json() as { id: string };
      setChildren(prev => [{ id, name: data.name, birth_date: data.date, birth_time: data.time, birth_place: data.place, age_at_creation: 0, chart_data: chart, interpretation, created_at: new Date().toISOString() }, ...prev]);
      track("child_chart_added", { birth_date: data.date, birth_place: data.place });
      setShowChildModal(false);
    } catch (err) {
      setChildError(err instanceof Error ? err.message : "Nieznany błąd");
    } finally {
      setGeneratingChild(false);
    }
  }

  async function handleRegenAll() {
    if (!session || children.length === 0) return;
    setRegenProgress({ current: 0, total: children.length }); setChildError("");
    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      const bd = child.chart_data.birthData;
      try {
        const chartRes = await fetch("/api/chart", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ date: bd.date, time: bd.time, lat: bd.lat, lng: bd.lng, place: bd.place }),
        });
        if (!chartRes.ok) throw new Error("chart");
        const { promptContext } = await chartRes.json() as { promptContext: string };
        const aiRes = await fetch("/api/ai-child", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: child.name, birthDate: child.birth_date, promptContext }),
        });
        if (!aiRes.ok) throw new Error("ai");
        const { interpretation } = await aiRes.json() as { interpretation: string };
        await fetch("/api/update-child", {
          method: "POST",
          headers: { "Content-Type": "application/json", ...authHeader },
          body: JSON.stringify({ id: child.id, interpretation }),
        });
        setChildren(prev => prev.map(c => c.id === child.id ? { ...c, interpretation } : c));
      } catch {
        setChildError(`Blad przy regeneracji karty ${child.name}`);
      }
      setRegenProgress({ current: i + 1, total: children.length });
    }
    setRegenProgress(null);
  }

  async function handleDeleteChild(id: string) {
    await fetch(`/api/delete-child?id=${id}`, { method: "DELETE", headers: authHeader });
    setChildren(prev => prev.filter(c => c.id !== id));
  }

  // ── Render ───────────────────────────────────────────────────────────────
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

        {/* ── Tab bar ── */}
        <div className="flex items-center justify-center gap-1 p-1 rounded-2xl bg-white/4 border border-white/6 w-fit mx-auto mb-8">
          <button
            onClick={() => setActiveTab("natal")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
              activeTab === "natal"
                ? "bg-amber-600/20 border border-amber-500/30 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200 hover:bg-white/4"
            }`}
          >
            ✨ Twój kosmogram
          </button>
          <button
            ref={childTabRef}
            onClick={() => { setActiveTab("child"); setChildNudge(false); }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
              activeTab === "child"
                ? "bg-green-600/20 border border-green-500/30 text-white shadow-sm"
                : childNudge
                  ? "text-green-300 bg-green-900/20 border border-green-500/40 animate-pulse"
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/4"
            }`}
          >
            <Baby className="w-3.5 h-3.5" />
            Kosmogram dziecka
          </button>
        </div>

        {/* ── NATAL TAB ─────────────────────────────────────────────────── */}
        {activeTab === "natal" && (
          <>
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

            {loadingHistory && (
              <div className="glass-card rounded-2xl p-10 text-center mb-6">
                <div className="w-8 h-8 border-2 border-amber-600/30 border-t-amber-400 rounded-full animate-spin mx-auto mb-3" />
                <p className="text-slate-500 text-sm">Wczytuję kosmogramy…</p>
              </div>
            )}

            {/* Child nudge banner */}
            {childNudge && activeTab === "natal" && (
              <div
                onClick={switchToChildTab}
                className="mb-4 flex items-start gap-3 p-4 rounded-2xl bg-green-900/20 border border-green-500/30 cursor-pointer hover:bg-green-900/30 transition-colors group"
              >
                <Baby className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-green-200 text-sm font-medium">Wygląda na datę urodzenia dziecka (poniżej 13 lat)</p>
                  <p className="text-green-400/70 text-xs mt-0.5">
                    Kosmogram dziecka zawiera interpretację skupioną na temperamencie, potrzebach emocjonalnych i wskazówkach dla rodzica.
                    <span className="ml-1 underline group-hover:text-green-300 transition-colors">Przejdź do zakładki →</span>
                  </p>
                </div>
              </div>
            )}

            {/* Form */}
            {!loadingHistory && showForm && (
              <div className="glass-card rounded-2xl p-5 mb-8">
                <BirthForm onSubmit={handleFormSubmit} loading={chartLoading} onDateChange={handleDateChange} />
                {error && (
                  <div className="mt-3 p-3 rounded-xl bg-red-900/20 border border-red-700/30 text-red-300 text-sm">{error}</div>
                )}
              </div>
            )}

            {chartLoading && (
              <div className="glass-card rounded-2xl p-16 text-center mb-8">
                <div className="w-14 h-14 border-2 border-amber-600/30 border-t-amber-400 rounded-full animate-spin mx-auto mb-4" />
                <p className="text-slate-400 text-sm">Obliczam pozycje planet…</p>
              </div>
            )}

            {hasResults && (
              <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-slate-500">
                  <span className="px-3 py-1 rounded-full bg-amber-900/15 border border-amber-800/25 text-slate-400">📅 {chart.birthData.date}</span>
                  <span className="px-3 py-1 rounded-full bg-amber-900/15 border border-amber-800/25 text-slate-400">
                    🕐 {chart.birthData.timeUnknown ? "godzina nieznana" : chart.birthData.time}
                  </span>
                  <span className="px-3 py-1 rounded-full bg-amber-900/15 border border-amber-800/25 text-slate-400 max-w-[240px] truncate">
                    📍 {chart.birthData.place}
                  </span>
                  {!chart.birthData.timeUnknown && (
                    <span className="px-3 py-1 rounded-full bg-amber-900/15 border border-amber-800/25 text-slate-500">🌐 {chart.birthData.timezone}</span>
                  )}
                </div>
                {chart.birthData.timeUnknown && (
                  <p className="text-center text-xs text-amber-500/60">Bez godziny urodzenia — wyniki bez Ascendentu, MC i domów.</p>
                )}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
                  <div className="glass-card rounded-3xl p-4 sm:p-5 flex flex-col">
                    <NatalChartSVG chart={chart} />
                    {(() => {
                      const sun  = chart.planets.find(p => p.name === "Słońce");
                      const moon = chart.planets.find(p => p.name === "Księżyc");
                      const el   = getDominantElement(chart);
                      return (
                        <div className="flex flex-wrap items-center justify-center gap-2 mt-4 pt-3 border-t border-amber-900/15">
                          {sun && <span className="px-3 py-1 rounded-full text-xs border border-amber-700/40 text-amber-200/90 bg-amber-900/15">☀️ {sun.sign}</span>}
                          {moon && <span className="px-3 py-1 rounded-full text-xs border border-slate-700/40 text-slate-300/80 bg-slate-900/20">🌙 {moon.sign}</span>}
                          <span className={`px-3 py-1 rounded-full text-xs border ${el.color}`}>{el.emoji} Dominuje {el.label}</span>
                        </div>
                      );
                    })()}
                    {!chart.birthData.timeUnknown && (
                      <div className="flex flex-wrap justify-center gap-3 text-xs text-slate-500 mt-3 pt-3 border-t border-amber-900/15">
                        {[
                          { color: "bg-amber-400/60",  label: "Koniunkcja (0°)" },
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
                {(() => {
                  const tags = getPersonalityTags(chart);
                  return tags.length > 0 ? (
                    <div className="flex flex-wrap items-center justify-center gap-2">
                      {tags.map(tag => (
                        <span key={tag} className="px-3 py-1 rounded-full text-xs border border-amber-700/35 text-amber-200/80 bg-amber-900/15">{tag}</span>
                      ))}
                    </div>
                  ) : null;
                })()}
                <Interpretation text={interpretation} loading={interpretLoading} />
                {!interpretLoading && interpretation && selectedId && (
                  <div className="flex justify-center">
                    <button
                      onClick={() => setShowShare(true)}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-amber-700/40 text-amber-300 text-sm hover:bg-amber-900/20 transition-colors"
                    >
                      <Share2 className="w-4 h-4" />
                      Udostępnij kosmogram
                    </button>
                  </div>
                )}
                {!session && (
                  <p className="text-center text-xs text-slate-600">Zaloguj się, żeby Twój kosmogram był zapamiętany po odświeżeniu strony.</p>
                )}
              </div>
            )}
          </>
        )}

        {/* ── CHILD TAB ─────────────────────────────────────────────────── */}
        {activeTab === "child" && (
          <>
            <div className="mb-8 text-center">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-4 rounded-full border border-green-500/30 bg-green-900/20 text-green-300 text-xs font-medium">
                <Baby className="w-3.5 h-3.5" />
                Karta urodzeniowa dziecka
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2 font-brand">
                Kosmogram <span className="bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">Dziecka</span>
              </h1>
              <p className="text-slate-500 text-sm max-w-md mx-auto">
                Interpretacja skupiona na temperamencie, potrzebach emocjonalnych i wskazówkach dla rodzica — dla dzieci poniżej 13 lat.
              </p>
            </div>

            {/* Add button (always visible) */}
            {session && (
              <div className="flex items-center justify-between mb-5">
                <span className="text-slate-600 text-xs">{children.length > 0 ? `${children.length} ${children.length === 1 ? "karta" : children.length < 5 ? "karty" : "kart"}` : ""}</span>
                <div className="flex items-center gap-2">
                  {children.length > 0 && (
                    <button
                      onClick={handleRegenAll}
                      disabled={!!regenProgress || generatingChild}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-dashed border-slate-700 text-slate-500 hover:text-white hover:border-slate-500 text-xs transition-all disabled:opacity-40"
                    >
                      <RefreshCw className={`w-3 h-3 ${regenProgress ? "animate-spin" : ""}`} />
                      {regenProgress ? `${regenProgress.current}/${regenProgress.total}` : "Regeneruj"}
                    </button>
                  )}
                  <button
                    onClick={() => {
                      if (subLoading) return;
                      if (!isPro) { setShowPaywall(true); return; }
                      setChildError(""); setShowChildModal(true);
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-green-600 to-emerald-600 text-white text-sm font-semibold shadow-lg shadow-green-900/40 hover:scale-[1.02] transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    Dodaj dziecko
                  </button>
                </div>
              </div>
            )}

            {childError && (
              <div className="mb-4 p-3 rounded-xl bg-red-900/20 border border-red-700/30 text-red-300 text-sm text-center">{childError}</div>
            )}

            {loadingChildren && (
              <div className="glass-card rounded-2xl p-10 text-center">
                <div className="w-8 h-8 border-2 border-green-500/30 border-t-green-500 rounded-full animate-spin mx-auto mb-3" />
                <p className="text-slate-500 text-sm">Wczytuję karty…</p>
              </div>
            )}

            {!loadingChildren && children.length === 0 && (
              <div className="glass-card rounded-2xl p-12 text-center border border-green-900/20">
                <Baby className="w-12 h-12 text-green-400/30 mx-auto mb-4" />
                <h3 className="text-white font-semibold mb-2 font-brand">Brak kart dzieci</h3>
                <p className="text-slate-500 text-sm mb-6 max-w-xs mx-auto">
                  Dodaj pierwsze dziecko, żeby wygenerować interpretację jego karty urodzeniowej — temperament, potrzeby, wskazówki.
                </p>
                <button
                  onClick={() => {
                    if (subLoading) return;
                    if (!isPro) { setShowPaywall(true); return; }
                    setChildError(""); setShowChildModal(true);
                  }}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-green-600 to-emerald-600 text-white text-sm font-semibold shadow-lg shadow-green-900/50 hover:scale-[1.02] transition-all"
                >
                  <Plus className="w-4 h-4" />
                  Dodaj pierwsze dziecko
                </button>
              </div>
            )}

            {!loadingChildren && children.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {children.map(child => (
                  <ChildCard
                    key={child.id}
                    id={child.id}
                    name={child.name}
                    birthDate={child.birth_date}
                    birthPlace={child.birth_place}
                    chartData={child.chart_data}
                    onDelete={handleDeleteChild}
                  />
                ))}
              </div>
            )}

            {!session && (
              <div className="glass-card rounded-2xl p-10 text-center border border-green-900/20">
                <Baby className="w-10 h-10 text-green-400/40 mx-auto mb-3" />
                <p className="text-slate-400 text-sm mb-1">Zaloguj sie, zeby dodac karte dziecka</p>
                <p className="text-slate-600 text-xs">Historia kart jest zapisywana w Twoim koncie</p>
              </div>
            )}
          </>
        )}

      </main>

      {showPaywall && <PaywallModal onClose={() => setShowPaywall(false)} reason="Karty dzieci sa dostepne w planie Plus." />}
      {showShare && selectedId && <ShareModal type="natal" readingId={selectedId} onClose={() => setShowShare(false)} />}
      {showChildModal && (
        <AddChildModal
          onClose={() => !generatingChild && setShowChildModal(false)}
          onSubmit={handleAddChild}
          loading={generatingChild}
          error={childError}
        />
      )}
    </div>
  );
}
