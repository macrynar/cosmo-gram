"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Star, Share2, Baby, Plus, CalendarDays, Clock, MapPin, Globe } from "lucide-react";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import BirthForm from "@/components/generate/BirthForm";
import NatalChartAltarView from "@/components/generate/NatalChartAltarView";
import PlanetTable from "@/components/generate/PlanetTable";
import KartaZawodnika from "@/components/generate/KartaZawodnika";
import KartaDziecka from "@/components/generate/KartaDziecka";
import HistorySelector, { type HistoryItem } from "@/components/HistorySelector";
import AddChildModal, { type ChildFormData } from "@/components/children/AddChildModal";
import { NatalChart } from "@/lib/astro-types";
import type { ChartPlacement, NatalAspect, ChartNodes } from "@/lib/chart-engine";
import type { ChildModule } from "@/lib/schemas/childModule";
import { SIGN_TO_KEY } from "@/components/astro/zodiacGlyphs";
import { useAuth } from "@/components/AuthContext";
import { useSubscription } from "@/components/SubscriptionContext";
import { track } from "@/components/PostHogProvider";
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

/** Extract Sun sign key from chart_data for portrait thumbnail. */
function sunSignKey(chart: NatalChart | null | undefined): string | undefined {
  if (!chart) return undefined;
  const sun = chart.planets.find(p => p.name === "Słońce");
  if (!sun?.sign) return undefined;
  return SIGN_TO_KEY[sun.sign] ?? undefined;
}

/** Polish sign name from chart for portraitSrc. */
function sunSignName(chart: NatalChart | null | undefined): string | undefined {
  if (!chart) return undefined;
  return chart.planets.find(p => p.name === "Słońce")?.sign;
}

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
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);

  // ── Auto-start (from signup flow) ───────────────────────────────────────
  const autoStartRef = useRef(false);

  useEffect(() => {
    if (authLoading || !session || loadingHistory || autoStartRef.current) return;
    if (!window.location.search.includes("autostart=true")) return;

    const raw = localStorage.getItem("cosmogram_pending_chart");
    if (!raw) return;

    try {
      const pending = JSON.parse(raw) as {
        name: string; date: string; time: string; timeUnknown: boolean;
        place: string; lat: number; lng: number;
      };
      localStorage.removeItem("cosmogram_pending_chart");
      autoStartRef.current = true;
      handleFormSubmit(pending);
    } catch {
      // ignore corrupt data
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, session, loadingHistory]);

  // ── Children state ───────────────────────────────────────────────────────
  const [children, setChildren] = useState<SavedChild[]>([]);
  const [loadingChildren, setLoadingChildren] = useState(false);
  const [showChildModal, setShowChildModal] = useState(false);
  const [generatingChild, setGeneratingChild] = useState(false);
  const [childError, setChildError] = useState("");
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);

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
        if (!autoStartRef.current) setShowForm(true);
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
      const loaded = data ?? [];
      setChildren(loaded);
      if (loaded.length > 0 && !selectedChildId) {
        setSelectedChildId(loaded[0].id);
      }
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
    setChildNudge(age !== null && age < 13);
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
    const res = await fetch(`/api/delete-reading?id=${id}`, { method: "DELETE", headers: authHeader });
    if (!res.ok) { setError("Nie udało się usunąć kosmogramu."); return; }
    setReadings(prev => {
      const updated = prev.filter(r => r.id !== id);
      if (id === selectedId) {
        if (updated.length > 0) { setSelectedId(updated[0].id); displayReading(updated[0]); }
        else { setSelectedId(null); setChart(null); setInterpretation(""); setShowForm(true); }
      }
      return updated;
    });
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
    if (age !== null && age < 13) setChildNudge(true);

    if (session && !subLoading && !isPro && readings.length >= 1) { setShowPaywall(true); return; }

    setChartLoading(true); setError(""); setChart(null); setInterpretation(""); setShowForm(false);
    try {
      const chartRes = await fetch("/api/chart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!chartRes.ok) { const e = await chartRes.json() as { error: string }; throw new Error(e.error ?? "Błąd obliczania kosmogramu"); }
      const { chart: newChart } = await chartRes.json() as { chart: NatalChart };
      setChart(newChart);
      setChartLoading(false);
      track("first_natal_view", { has_time: !!data.time, place: data.place.split(",")[0] });
      if (session) {
        const saveRes = await fetch("/api/save-reading", {
          method: "POST",
          headers: { "Content-Type": "application/json", ...authHeader },
          body: JSON.stringify({
            name: data.name.trim() || undefined,
            birthDate: data.date, birthTime: data.time, birthPlace: data.place,
            chart: newChart, interpretation: "", dailyReading: "",
          }),
        });
        if (saveRes.ok) {
          const { id } = await saveRes.json() as { id: string };
          const defaultName = data.name.trim() || `${data.place.split(",")[0]} · ${data.date}`;
          setReadings(prev => [{ id, name: defaultName, birth_date: data.date, birth_time: data.time, birth_place: data.place, chart_data: newChart, interpretation: "", daily_reading: "", created_at: new Date().toISOString() }, ...prev]);
          setSelectedId(id);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nieznany błąd");
      setChartLoading(false);
      setShowForm(true);
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
      const { chart, placements, aspects, nodes } = await chartRes.json() as {
        chart: NatalChart;
        placements: ChartPlacement[]; aspects: NatalAspect[]; nodes: ChartNodes;
      };

      const aiRes = await fetch("/api/ai-child", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader },
        body: JSON.stringify({ name: data.name, birthDate: data.date, placements, aspects, nodes }),
      });
      if (!aiRes.ok) {
        const e = await aiRes.json().catch(() => ({})) as { error?: string };
        throw new Error(e.error ?? "Błąd generowania interpretacji");
      }
      const { modules } = await aiRes.json() as { modules: ChildModule[] };
      if (!modules || modules.length === 0) throw new Error("Błąd generowania interpretacji");

      // Store modules as JSON string in interpretation column (v2 format)
      const interpretation = JSON.stringify(modules);

      const saveRes = await fetch("/api/save-child", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader },
        body: JSON.stringify({
          name: data.name, birthDate: data.date, birthTime: data.time, birthPlace: data.place,
          lat: data.lat, lng: data.lng, timezone: chart.birthData.timezone,
          chartData: chart, modules, promptVersion: "child-v2.0",
        }),
      });
      if (!saveRes.ok) throw new Error("Błąd zapisu");
      const { id } = await saveRes.json() as { id: string };
      const newChild: SavedChild = {
        id, name: data.name, birth_date: data.date, birth_time: data.time, birth_place: data.place,
        age_at_creation: 0, chart_data: chart, interpretation, created_at: new Date().toISOString(),
      };
      setChildren(prev => [newChild, ...prev]);
      setSelectedChildId(id);
      track("child_chart_added", { birth_date: data.date, birth_place: data.place });
      setShowChildModal(false);
    } catch (err) {
      setChildError(err instanceof Error ? err.message : "Nieznany błąd");
    } finally {
      setGeneratingChild(false);
    }
  }

  async function handleDeleteChild(id: string) {
    await fetch(`/api/delete-child?id=${id}`, { method: "DELETE", headers: authHeader });
    setChildren(prev => {
      const updated = prev.filter(c => c.id !== id);
      if (id === selectedChildId) {
        setSelectedChildId(updated.length > 0 ? updated[0].id : null);
      }
      return updated;
    });
  }

  // ── Derived data ─────────────────────────────────────────────────────────
  const selectorItems: HistoryItem[] = readings.map(r => ({
    id:       r.id,
    name:     r.name || `${r.birth_place.split(",")[0]} · ${r.birth_date}`,
    subtitle: r.birth_date,
    sunSign:  sunSignName(r.chart_data),
  }));

  const childSelectorItems: HistoryItem[] = children.map(c => ({
    id:       c.id,
    name:     c.name,
    subtitle: c.birth_date,
    sunSign:  sunSignName(c.chart_data),
  }));

  const displayedChild = children.find(c => c.id === selectedChildId) ?? null;
  const hasResults = chart && !chartLoading;

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen text-white" style={{ background: "var(--bg-base)" }}>
      <div className="fixed inset-0 star-bg pointer-events-none" aria-hidden="true" />
      <div aria-hidden="true" className="fixed top-0 left-1/2 -translate-x-1/2 w-[700px] h-[500px] pointer-events-none"
        style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(88,60,140,0.18) 0%, transparent 70%)", filter: "blur(2px)" }} />
      <Star className="fixed top-[18%] left-[8%] w-2 h-2 text-amber-400/40 animate-pulse pointer-events-none" style={{ animationDuration: "3.5s" }} />
      <Star className="fixed top-[55%] right-[4%] w-2 h-2 text-amber-400/40 animate-pulse pointer-events-none" style={{ animationDuration: "4s" }} />

      <Navbar />

      <main className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 pt-24 pb-20">

        {/* ── Tab bar (DS — amber only, no green) ── */}
        <div
          className="flex items-center p-1 rounded-[13px] w-fit mx-auto mb-8 gap-0.5"
          style={{ background: "var(--bg-elevated)", border: "0.5px solid var(--line)" }}
        >
          <button
            onClick={() => setActiveTab("natal")}
            className="px-5 py-2.5 rounded-[10px] text-sm font-medium transition-all duration-300"
            style={activeTab === "natal" ? {
              background: "rgba(224,181,102,0.12)",
              border:     "0.5px solid rgba(224,181,102,0.30) inset",
              color:      "var(--voice)",
            } : { color: "var(--text-muted)", border: "0.5px solid transparent" }}
          >
            Twój kosmogram
          </button>
          <button
            ref={childTabRef}
            onClick={() => { setActiveTab("child"); setChildNudge(false); }}
            className={`px-5 py-2.5 rounded-[10px] text-sm font-medium transition-all duration-300${childNudge && activeTab !== "child" ? " animate-pulse" : ""}`}
            style={activeTab === "child" ? {
              background: "rgba(224,181,102,0.12)",
              border:     "0.5px solid rgba(224,181,102,0.30) inset",
              color:      "var(--voice)",
            } : childNudge ? {
              color:  "var(--voice)",
              border: "0.5px solid rgba(224,181,102,0.35)",
            } : { color: "var(--text-muted)", border: "0.5px solid transparent" }}
          >
            Kosmogram dziecka
          </button>
        </div>

        {/* ── NATAL TAB ─────────────────────────────────────────────────── */}
        {activeTab === "natal" && (
          <>
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
              className="mb-8 text-center"
            >
              <h1
                className="text-3xl sm:text-4xl font-bold mb-2"
                style={{ fontFamily: "var(--font-fraunces), serif", color: "var(--text-primary)" }}
              >
                Twój{" "}
                <span style={{
                  background: "var(--grad-text)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}>
                  kosmogram natalny
                </span>
              </h1>
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>Obliczenia astronomiczne · Swiss Ephemeris · Interpretacja Astrei</p>
            </motion.div>

            {/* History selector */}
            {session && !loadingHistory && readings.length > 0 && (
              <div className="rounded-2xl px-4 py-3 mb-4" style={{ background: "rgba(11,9,18,0.65)", border: "0.5px solid rgba(224,181,102,0.14)", backdropFilter: "blur(18px)" }}>
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
              <div className="rounded-2xl p-10 text-center mb-6" style={{ background: "rgba(11,9,18,0.65)", border: "0.5px solid rgba(224,181,102,0.14)" }}>
                <div className="w-8 h-8 rounded-full animate-spin border-t-2 mx-auto mb-3" style={{ borderColor: "transparent", borderTopColor: "#E0B566" }} />
                <p className="text-slate-500 text-sm">Wczytuję kosmogramy…</p>
              </div>
            )}

            {/* Child nudge banner — DS amber, no green */}
            {childNudge && activeTab === "natal" && (
              <div
                onClick={switchToChildTab}
                className="mb-4 flex items-start gap-3 p-4 rounded-2xl cursor-pointer transition-all duration-300 group"
                style={{ background: "rgba(224,181,102,0.07)", border: "0.5px solid rgba(224,181,102,0.22)" }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(224,181,102,0.11)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(224,181,102,0.07)"; }}
              >
                <Baby className="w-5 h-5 shrink-0 mt-0.5" style={{ color: "#E0B566" }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium" style={{ color: "#E9DCC0" }}>Wygląda na datę urodzenia dziecka (poniżej 13 lat)</p>
                  <p className="text-xs mt-0.5" style={{ color: "rgba(224,181,102,0.65)" }}>
                    Kosmogram dziecka zawiera interpretację skupioną na temperamencie, potrzebach emocjonalnych i wskazówkach dla rodzica.
                    <span className="ml-1 underline group-hover:text-amber-300 transition-colors">Przejdź do zakładki →</span>
                  </p>
                </div>
              </div>
            )}

            {/* Form */}
            {!loadingHistory && showForm && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="rounded-2xl p-5 mb-8"
                style={{ background: "rgba(11,9,18,0.72)", border: "0.5px solid rgba(224,181,102,0.18)", backdropFilter: "blur(24px)" }}
              >
                <BirthForm onSubmit={handleFormSubmit} loading={chartLoading} onDateChange={handleDateChange} />
                {error && (
                  <div className="mt-3 p-3 rounded-xl text-sm" style={{ background: "rgba(239,68,68,0.08)", border: "0.5px solid rgba(239,68,68,0.25)", color: "#fca5a5" }}>{error}</div>
                )}
              </motion.div>
            )}

            {chartLoading && (
              <div className="rounded-2xl p-16 text-center mb-8" style={{ background: "rgba(11,9,18,0.65)", border: "0.5px solid rgba(224,181,102,0.14)" }}>
                <div className="w-14 h-14 rounded-full animate-spin border-2 mx-auto mb-4" style={{ borderColor: "rgba(224,181,102,0.15)", borderTopColor: "#E0B566" }} />
                <p className="text-slate-400 text-sm">Obliczam pozycje planet…</p>
              </div>
            )}

            {hasResults && (
              <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-slate-400">
                  {([
                    { Icon: CalendarDays, label: chart.birthData.date },
                    { Icon: Clock,        label: chart.birthData.timeUnknown ? "godzina nieznana" : chart.birthData.time },
                    { Icon: MapPin,       label: chart.birthData.place },
                    ...(!chart.birthData.timeUnknown ? [{ Icon: Globe, label: chart.birthData.timezone }] : []),
                  ] as { Icon: React.ElementType; label: string }[]).map(({ Icon, label }) => (
                    <span key={label} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full max-w-[240px] truncate" style={{ background: "rgba(224,181,102,0.07)", border: "0.5px solid rgba(224,181,102,0.18)" }}>
                      <Icon className="w-3 h-3 shrink-0" style={{ color: "rgba(224,181,102,0.55)" }} />
                      {label}
                    </span>
                  ))}
                </div>
                {chart.birthData.timeUnknown && (
                  <p className="text-center text-xs" style={{ color: "rgba(224,181,102,0.55)" }}>Bez godziny urodzenia — wyniki bez Ascendentu, MC i domów.</p>
                )}
                <div className="space-y-6">
                  <NatalChartAltarView chart={chart} />
                  <PlanetTable chart={chart} />
                </div>
                {selectedId && (() => {
                  const r = readings.find(x => x.id === selectedId);
                  return r ? (
                    <div id="interpretacja" style={{ scrollMarginTop: 96 }}>
                      <KartaZawodnika reading={r} isPremiumUser={isPro} />
                    </div>
                  ) : null;
                })()}

                {selectedId && (
                  <div className="flex justify-center">
                    <button
                      onClick={() => setShowShare(true)}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm transition-all duration-300"
                      style={{ border: "0.5px solid rgba(224,181,102,0.35)", color: "#E9DCC0" }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(224,181,102,0.08)"; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
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
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
              className="mb-8 text-center"
            >
              <h1
                className="text-3xl sm:text-4xl font-bold mb-2"
                style={{ fontFamily: "var(--font-fraunces), serif", color: "var(--text-primary)" }}
              >
                Kosmogram{" "}
                <span style={{
                  background: "var(--grad-text)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}>
                  {displayedChild ? displayedChild.name : "dziecka"}
                </span>
              </h1>
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                Temperament, potrzeby emocjonalne i wskazówki dla rodzica — dla dzieci poniżej 13 lat
              </p>
            </motion.div>

            {childError && (
              <div className="mb-4 p-3 rounded-xl text-sm text-center" style={{ background: "rgba(239,68,68,0.08)", border: "0.5px solid rgba(239,68,68,0.25)", color: "#fca5a5" }}>
                {childError}
              </div>
            )}

            {/* ── Children selector bar ── */}
            {session && (
              <div className="rounded-2xl px-4 py-3 mb-6" style={{ background: "rgba(11,9,18,0.65)", border: "0.5px solid rgba(224,181,102,0.14)", backdropFilter: "blur(18px)" }}>
                {loadingChildren ? (
                  <div className="flex items-center gap-2 py-2">
                    <div className="w-5 h-5 rounded-full animate-spin border-t-2 shrink-0" style={{ borderColor: "transparent", borderTopColor: "#E0B566" }} />
                    <span className="text-sm" style={{ color: "var(--text-muted)" }}>Wczytuję karty…</span>
                  </div>
                ) : (
                  <HistorySelector
                    items={childSelectorItems}
                    selectedId={selectedChildId}
                    onSelect={setSelectedChildId}
                    onDelete={handleDeleteChild}
                    onNew={() => {
                      if (subLoading) return;
                      if (!isPro) { setShowPaywall(true); return; }
                      setChildError(""); setShowChildModal(true);
                    }}
                    newLabel="Dodaj dziecko"
                  />
                )}
              </div>
            )}

            {/* ── Loading children ── */}
            {loadingChildren && children.length === 0 && (
              <div className="rounded-2xl p-10 text-center" style={{ background: "rgba(11,9,18,0.65)", border: "0.5px solid rgba(224,181,102,0.14)" }}>
                <div className="w-8 h-8 rounded-full animate-spin border-2 mx-auto mb-3" style={{ borderColor: "rgba(224,181,102,0.15)", borderTopColor: "#E0B566" }} />
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>Wczytuję karty…</p>
              </div>
            )}

            {/* ── Empty state ── */}
            {!loadingChildren && children.length === 0 && session && (
              <div
                className="rounded-2xl p-12 text-center"
                style={{ background: "rgba(11,9,18,0.65)", border: "0.5px solid rgba(224,181,102,0.14)" }}
              >
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
                  style={{ background: "rgba(224,181,102,0.08)", border: "0.5px solid rgba(224,181,102,0.22)" }}
                >
                  <Baby className="w-7 h-7" style={{ color: "rgba(224,181,102,0.50)" }} />
                </div>
                <h3
                  className="font-medium mb-2"
                  style={{ color: "var(--text-primary)", fontFamily: "var(--font-fraunces), serif" }}
                >
                  Brak kart dzieci
                </h3>
                <p className="text-sm mb-6 max-w-xs mx-auto" style={{ color: "var(--text-muted)" }}>
                  Dodaj pierwsze dziecko, żeby wygenerować interpretację jego kosmogramu — temperament, potrzeby i wskazówki dla Ciebie.
                </p>
                <button
                  onClick={() => {
                    if (subLoading) return;
                    if (!isPro) { setShowPaywall(true); return; }
                    setChildError(""); setShowChildModal(true);
                  }}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold transition-all duration-200"
                  style={{
                    background: "rgba(224,181,102,0.92)",
                    color:      "#0B0912",
                    border:     "0.5px solid rgba(224,181,102,0.65)",
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(224,181,102,1)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(224,181,102,0.92)"; }}
                >
                  <Plus className="w-4 h-4" />
                  Dodaj pierwsze dziecko
                </button>
              </div>
            )}

            {/* ── Child chart (same anatomy as adult) ── */}
            {!loadingChildren && displayedChild && (
              <div className="space-y-6">
                {/* Birth data chips */}
                <div className="flex flex-wrap items-center justify-center gap-2 text-xs" style={{ color: "var(--text-muted)" }}>
                  {([
                    { Icon: CalendarDays, label: displayedChild.chart_data.birthData.date },
                    { Icon: Clock,        label: displayedChild.chart_data.birthData.timeUnknown ? "godzina nieznana" : displayedChild.chart_data.birthData.time },
                    { Icon: MapPin,       label: displayedChild.chart_data.birthData.place },
                    ...(!displayedChild.chart_data.birthData.timeUnknown ? [{ Icon: Globe, label: displayedChild.chart_data.birthData.timezone }] : []),
                  ] as { Icon: React.ElementType; label: string }[]).map(({ Icon, label }) => (
                    <span key={label} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full max-w-[240px] truncate" style={{ background: "rgba(224,181,102,0.07)", border: "0.5px solid rgba(224,181,102,0.18)" }}>
                      <Icon className="w-3 h-3 shrink-0" style={{ color: "rgba(224,181,102,0.55)" }} />
                      {label}
                    </span>
                  ))}
                </div>
                {displayedChild.chart_data.birthData.timeUnknown && (
                  <p className="text-center text-xs" style={{ color: "rgba(224,181,102,0.55)" }}>Bez godziny urodzenia — wyniki bez Ascendentu, MC i domów.</p>
                )}

                {/* Natal chart wheel + Big Three — reuse 1:1 */}
                <NatalChartAltarView chart={displayedChild.chart_data} />
                <PlanetTable chart={displayedChild.chart_data} />

                {/* Child interpretation modules */}
                <KartaDziecka
                  child={displayedChild}
                  isPremiumUser={isPro}
                  onChildUpdated={(childId, interpretation) => {
                    setChildren(prev => prev.map(c => c.id === childId ? { ...c, interpretation } : c));
                  }}
                />
              </div>
            )}

            {/* ── Not logged in ── */}
            {!session && (
              <div className="rounded-2xl p-10 text-center" style={{ background: "rgba(11,9,18,0.65)", border: "0.5px solid rgba(224,181,102,0.14)" }}>
                <Baby className="w-10 h-10 mx-auto mb-3" style={{ color: "rgba(224,181,102,0.30)" }} />
                <p className="text-sm mb-1" style={{ color: "var(--text-secondary)" }}>Zaloguj się, żeby dodać kartę dziecka</p>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>Historia kart jest zapisywana w Twoim koncie</p>
              </div>
            )}
          </>
        )}

      </main>

      {showPaywall && <PaywallModal onClose={() => setShowPaywall(false)} reason="Karty dzieci są dostępne w planie Plus." />}
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
