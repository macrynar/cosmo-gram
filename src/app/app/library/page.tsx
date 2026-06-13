"use client";

import { useState, useEffect, useCallback } from "react";
import { Baby, Plus, Star, RefreshCw } from "lucide-react";
import Navbar from "@/components/Navbar";
import AddChildModal, { type ChildFormData } from "@/components/children/AddChildModal";
import ChildCard from "@/components/children/ChildCard";
import { useAuth } from "@/components/AuthContext";
import { useSubscription } from "@/components/SubscriptionContext";
import { track } from "@/components/PostHogProvider";
import type { NatalChart } from "@/lib/astro-types";
import type { ChartPlacement, NatalAspect, ChartNodes } from "@/lib/chart-engine";
import type { ChildModule } from "@/lib/schemas/childModule";
import PaywallModal from "@/components/PaywallModal";

type SavedChild = {
  id: string;
  name: string;
  birth_date: string;
  birth_time: string;
  birth_place: string;
  age_at_creation: number;
  chart_data: NatalChart;
  interpretation: string;
  created_at: string;
};

export default function ChildrenPage() {
  const { session } = useAuth();
  const { isPro, isLoading: subLoading } = useSubscription();

  const [children, setChildren]       = useState<SavedChild[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [showModal, setShowModal]     = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [generating, setGenerating]   = useState(false);
  const [error, setError]             = useState("");
  const [regenProgress, setRegenProgress] = useState<{ current: number; total: number } | null>(null);

  const authHeader: Record<string, string> = session
    ? { Authorization: `Bearer ${session.access_token}` }
    : {};

  const loadChildren = useCallback(async () => {
    if (!session) return;
    setLoadingHistory(true);
    try {
      const res = await fetch("/api/get-children", { headers: authHeader });
      const { children: data } = await res.json() as { children: SavedChild[] };
      setChildren(data ?? []);
    } finally {
      setLoadingHistory(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  useEffect(() => {
    loadChildren();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  async function handleAddChild(data: ChildFormData) {
    if (!session) return;

    setGenerating(true);
    setError("");

    try {
      // 1. Calculate chart server-side
      const chartRes = await fetch("/api/chart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: data.date, time: data.time, lat: data.lat, lng: data.lng, place: data.place }),
      });
      if (!chartRes.ok) throw new Error("Błąd obliczania kosmogramu");
      const { chart, placements, aspects, nodes } = await chartRes.json() as {
        chart: NatalChart; placements: ChartPlacement[]; aspects: NatalAspect[]; nodes: ChartNodes;
      };

      // 2. Generate AI interpretation
      const aiRes = await fetch("/api/ai-child", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader },
        body: JSON.stringify({ name: data.name, birthDate: data.date, placements, aspects, nodes }),
      });
      if (!aiRes.ok) throw new Error("Błąd generowania interpretacji");
      const { modules } = await aiRes.json() as { modules: ChildModule[] };
      if (!modules || modules.length === 0) throw new Error("Błąd generowania interpretacji");
      const interpretation = JSON.stringify(modules);

      // 3. Save
      const saveRes = await fetch("/api/save-child", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader },
        body: JSON.stringify({
          name: data.name,
          birthDate: data.date,
          birthTime: data.time,
          birthPlace: data.place,
          lat: data.lat,
          lng: data.lng,
          timezone: chart.birthData.timezone,
          chartData: chart,
          modules,
          promptVersion: "child-v2.0",
        }),
      });
      if (!saveRes.ok) throw new Error("Błąd zapisu");
      const { id } = await saveRes.json() as { id: string };

      const newEntry: SavedChild = {
        id,
        name: data.name,
        birth_date: data.date,
        birth_time: data.time,
        birth_place: data.place,
        age_at_creation: 0,
        chart_data: chart,
        interpretation,
        created_at: new Date().toISOString(),
      };
      setChildren(prev => [newEntry, ...prev]);
      track("child_chart_added", { birth_date: data.date, birth_place: data.place });
      setShowModal(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nieznany błąd");
    } finally {
      setGenerating(false);
    }
  }

  async function handleRegenAll() {
    if (!session || children.length === 0) return;
    setRegenProgress({ current: 0, total: children.length });
    setError("");

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
        const { placements, aspects, nodes } = await chartRes.json() as {
          placements: ChartPlacement[]; aspects: NatalAspect[]; nodes: ChartNodes;
        };

        const aiRes = await fetch("/api/ai-child", {
          method: "POST",
          headers: { "Content-Type": "application/json", ...authHeader },
          body: JSON.stringify({ name: child.name, birthDate: child.birth_date, placements, aspects, nodes }),
        });
        if (!aiRes.ok) throw new Error("ai");
        const { modules } = await aiRes.json() as { modules: ChildModule[] };
        if (!modules || modules.length === 0) throw new Error("ai");
        const interpretation = JSON.stringify(modules);

        await fetch("/api/update-child", {
          method: "POST",
          headers: { "Content-Type": "application/json", ...authHeader },
          body: JSON.stringify({ id: child.id, interpretation, modules }),
        });

        setChildren(prev => prev.map(c => c.id === child.id ? { ...c, interpretation } : c));
      } catch {
        setError(`Błąd przy regeneracji karty ${child.name}`);
      }
      setRegenProgress({ current: i + 1, total: children.length });
    }

    setRegenProgress(null);
  }

  async function handleDelete(id: string) {
    await fetch(`/api/delete-child?id=${id}`, { method: "DELETE", headers: authHeader });
    setChildren(prev => prev.filter(c => c.id !== id));
  }

  return (
    <div className="min-h-screen bg-[#03010d] text-white">
      <div className="fixed inset-0 star-bg pointer-events-none" aria-hidden="true" />
      <div aria-hidden="true" className="fixed top-0 left-1/2 -translate-x-1/2 w-[700px] h-[500px] nebula-orb opacity-25 pointer-events-none" style={{ background: "radial-gradient(ellipse at center, #064d2a 0%, transparent 70%)" }} />
      <Star className="fixed top-[20%] left-[7%] w-2 h-2 text-green-400/40 animate-pulse pointer-events-none" style={{ animationDuration: "3.8s" }} />
      <Star className="fixed top-[65%] right-[6%] w-2 h-2 text-emerald-400/40 animate-pulse pointer-events-none" style={{ animationDuration: "4.2s" }} />

      <Navbar />

      <main className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 pt-24 pb-20">

        {session && children.length > 0 && (
          <div className="flex justify-end mb-4">
            <button
              onClick={handleRegenAll}
              disabled={!!regenProgress || generating}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-dashed border-slate-700 text-slate-500 hover:text-white hover:border-slate-500 text-xs transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${regenProgress ? "animate-spin" : ""}`} />
              {regenProgress
                ? `Regeneruję ${regenProgress.current}/${regenProgress.total}…`
                : "Regeneruj wszystkie interpretacje"}
            </button>
          </div>
        )}

        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-4 rounded-full border border-green-500/30 bg-green-900/20 text-green-300 text-xs font-medium tracking-wide">
            <Baby className="w-3.5 h-3.5 text-green-400" />
            Karta urodzeniowa dziecka
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2 font-brand">
            Kosmogram <span className="bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">Dziecka</span>
          </h1>
          <p className="text-slate-500 text-sm">Tendencje · Potrzeby · Wskazówki dla rodzica · Interpretacja AI</p>
        </div>

        {!session && (
          <div className="glass-card rounded-2xl p-10 text-center border border-green-900/20">
            <Baby className="w-10 h-10 text-green-400/40 mx-auto mb-3" />
            <p className="text-slate-400 text-sm mb-1">Zaloguj się, żeby dodać kartę dziecka</p>
            <p className="text-slate-600 text-xs">Historia kart jest zapisywana w Twoim koncie</p>
          </div>
        )}

        {session && loadingHistory && (
          <div className="glass-card rounded-2xl p-10 text-center">
            <div className="w-8 h-8 border-2 border-green-500/30 border-t-green-500 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-slate-500 text-sm">Wczytuję karty…</p>
          </div>
        )}

        {session && !loadingHistory && (
          <>
            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-900/20 border border-red-700/30 text-red-300 text-sm text-center">
                {error}
              </div>
            )}

            {children.length === 0 ? (
              <div className="glass-card rounded-2xl p-12 text-center border border-green-900/20">
                <Baby className="w-12 h-12 text-green-400/30 mx-auto mb-4" />
                <h3 className="text-white font-semibold mb-2">Brak kart dzieci</h3>
                <p className="text-slate-500 text-sm mb-6">Dodaj pierwsze dziecko żeby wygenerować interpretację jego karty urodzeniowej</p>
                <button
                  onClick={() => {
                    if (subLoading) return;
                    if (!isPro) { setShowPaywall(true); return; }
                    setError("");
                    setShowModal(true);
                  }}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-green-600 to-emerald-600 text-white text-sm font-semibold shadow-lg shadow-green-900/50 hover:scale-[1.02] transition-all"
                >
                  <Plus className="w-4 h-4" />
                  Dodaj dziecko
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                  {children.map(child => (
                    <ChildCard
                      key={child.id}
                      id={child.id}
                      name={child.name}
                      birthDate={child.birth_date}
                      birthPlace={child.birth_place}
                      chartData={child.chart_data}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>

                <div className="text-center">
                  <button
                    onClick={() => {
                      if (subLoading) return;
                      if (!isPro) { setShowPaywall(true); return; }
                      setError("");
                      setShowModal(true);
                    }}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-dashed border-green-800/40 text-slate-500 hover:text-white hover:border-green-500/50 text-sm transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    Dodaj kolejne dziecko
                  </button>
                </div>
              </>
            )}
          </>
        )}
      </main>

      {showModal && (
        <AddChildModal
          onClose={() => !generating && setShowModal(false)}
          onSubmit={handleAddChild}
          loading={generating}
          error={error}
        />
      )}

      {showPaywall && (
        <PaywallModal
          onClose={() => setShowPaywall(false)}
          reason="Karty dzieci są dostępne w planie Plus."
        />
      )}
    </div>
  );
}
