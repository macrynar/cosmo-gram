"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles } from "lucide-react";
import { supabase } from "@/lib/supabase";
import ModuleCard from "./ModuleCard";
import ModuleNav from "./ModuleNav";
import LockedModulePlaceholder from "./LockedModulePlaceholder";
import FailedModulePlaceholder from "./FailedModulePlaceholder";
import PaywallModal from "@/components/PaywallModal";
import type { AstroModule, ModuleId } from "@/lib/schemas/astroModule";
import type { NatalChart } from "@/lib/astro-types";
import type { ChartPlacement, NatalAspect, ChartNodes } from "@/lib/chart-engine";
import { PREMIUM_MODULE_IDS, MODULE_SPECS } from "@/lib/moduleSpecs";
import { getSourceChips } from "@/lib/astro/sourceChips";

type ReadingMeta = {
  id:           string;
  birth_date:   string;
  birth_time:   string;
  birth_place:  string;
  chart_data:   NatalChart;
};

interface Props {
  reading:       ReadingMeta;
  isPremiumUser: boolean;
}

const LS_KEY = (id: string) => `karta_v2_${id}`;

function saveLocal(readingId: string, mods: AstroModule[]) {
  try { localStorage.setItem(LS_KEY(readingId), JSON.stringify(mods)); } catch {}
}

function loadLocal(readingId: string): AstroModule[] | null {
  try {
    const raw = localStorage.getItem(LS_KEY(readingId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AstroModule[];
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : null;
  } catch { return null; }
}

export default function KartaZawodnika({ reading, isPremiumUser }: Props) {
  const [modules,      setModules]      = useState<AstroModule[]>([]);
  const [failedIds,    setFailedIds]    = useState<ModuleId[]>([]);
  const [loading,      setLoading]      = useState(false);
  const [cacheLoading, setCacheLoading] = useState(true);
  const [error,        setError]        = useState<string | null>(null);
  const [generated,    setGenerated]    = useState(false);
  const [showPaywall,  setShowPaywall]  = useState(false);
  const upgradeTriggeredRef = useRef(false);

  useEffect(() => {
    // 1. Check localStorage first (instant, no network)
    const local = loadLocal(reading.id);
    if (local) {
      setModules(local);
      setGenerated(true);
      setCacheLoading(false);
      return;
    }

    // 2. Fallback: check server cache
    let cancelled = false;
    async function tryLoadServer() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session || cancelled) return;
        const res = await fetch(`/api/natal-karta?chart_id=${reading.id}`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (!res.ok || cancelled) return;
        const { modules: mods } = await res.json() as { modules: AstroModule[]; failedIds?: ModuleId[] };
        if (mods && mods.length > 0 && !cancelled) {
          setModules(mods);
          setGenerated(true);
          saveLocal(reading.id, mods);
        }
      } finally {
        if (!cancelled) setCacheLoading(false);
      }
    }
    tryLoadServer();
    return () => { cancelled = true; };
  }, [reading.id]);

  // Auto-trigger full generation after upgrade (free→premium)
  useEffect(() => {
    if (
      isPremiumUser &&
      generated &&
      !loading &&
      modules.length > 0 &&
      modules.length < 8 &&
      !upgradeTriggeredRef.current
    ) {
      upgradeTriggeredRef.current = true;
      // Clear local cache so fresh 8-module result is stored
      try { localStorage.removeItem(LS_KEY(reading.id)); } catch {}
      handleGenerate();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPremiumUser, generated, modules.length]);

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Brak sesji — zaloguj się ponownie.");

      const bd = reading.chart_data.birthData;

      const chartRes = await fetch("/api/chart", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date:        reading.birth_date,
          time:        reading.birth_time,
          lat:         bd.lat,
          lng:         bd.lng,
          place:       reading.birth_place,
          timeUnknown: bd.timeUnknown,
        }),
      });
      if (!chartRes.ok) throw new Error("Błąd pobierania danych wykresu");

      const { placements, aspects, nodes } = await chartRes.json() as {
        placements: ChartPlacement[];
        aspects:    NatalAspect[];
        nodes:      ChartNodes;
      };

      const kartaRes = await fetch("/api/natal-karta", {
        method:  "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({
          chart_id:            reading.id,
          natal_data:          { placements, aspects, nodes },
          hasExactTime:        !bd.timeUnknown,
          birthYear:           new Date(reading.birth_date).getFullYear(),
          grammatical_form:    "neutralna",
          locationPrecisionKm: 10,
        }),
      });
      if (!kartaRes.ok) {
        const body = await kartaRes.json().catch(() => ({})) as { error?: string; detail?: string };
        throw new Error(body.detail ?? body.error ?? `HTTP ${kartaRes.status} — błąd serwera`);
      }

      const { modules: mods, failedIds: failed } = await kartaRes.json() as { modules: AstroModule[]; failedIds?: ModuleId[] };
      setModules(mods);
      setFailedIds(failed ?? []);
      setGenerated(true);
      saveLocal(reading.id, mods);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nieznany błąd");
    } finally {
      setLoading(false);
    }
  }

  async function handleRetryModule(moduleId: ModuleId) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const bd = reading.chart_data.birthData;
      const chartRes = await fetch("/api/chart", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: reading.birth_date, time: reading.birth_time, lat: bd.lat, lng: bd.lng, place: reading.birth_place, timeUnknown: bd.timeUnknown }),
      });
      if (!chartRes.ok) return;
      const { placements, aspects, nodes } = await chartRes.json() as { placements: unknown; aspects: unknown; nodes: unknown };

      const kartaRes = await fetch("/api/natal-karta", {
        method:  "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({
          chart_id:            reading.id,
          natal_data:          { placements, aspects, nodes },
          hasExactTime:        !bd.timeUnknown,
          birthYear:           new Date(reading.birth_date).getFullYear(),
          grammatical_form:    "neutralna",
          locationPrecisionKm: 10,
          onlyModuleIds:       [moduleId],
        }),
      });
      if (!kartaRes.ok) return;

      const { modules: mods } = await kartaRes.json() as { modules: AstroModule[] };
      if (mods.length > 0) {
        setModules(prev => {
          const exists = prev.some(m => m.id === moduleId);
          const updated = exists ? prev.map(m => m.id === moduleId ? mods[0] : m) : [...prev, mods[0]];
          saveLocal(reading.id, updated);
          return updated;
        });
        setFailedIds(prev => prev.filter(id => id !== moduleId));
      }
    } catch {
      // silent — user can retry again
    }
  }

  // Locked module IDs not yet generated (shown as placeholders for free users)
  const generatedIds = new Set(modules.map(m => m.id));
  const lockedPlaceholders = !isPremiumUser
    ? PREMIUM_MODULE_IDS.filter(id => !generatedIds.has(id))
    : [];

  return (
    <div className="space-y-5">

      {/* ── Cache loading spinner ── */}
      {cacheLoading && !generated && !loading && (
        <div className="rounded-2xl p-10 text-center" style={{ background: "rgba(5,4,14,0.65)", border: "0.5px solid rgba(212,175,55,0.14)" }}>
          <div className="w-8 h-8 rounded-full animate-spin border-t-2 mx-auto" style={{ borderColor: "transparent", borderTopColor: "#D4AF37" }} />
        </div>
      )}

      {/* ── Entry CTA ── */}
      {!generated && !loading && !cacheLoading && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="rounded-2xl p-8 sm:p-10 text-center"
          style={{
            background:    "radial-gradient(ellipse at 50% 0%, rgba(91,44,143,0.15) 0%, rgba(5,4,14,0.70) 100%)",
            border:        "0.5px solid rgba(212,175,55,0.18)",
            backdropFilter: "blur(18px)",
          }}
        >
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.15, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5"
            style={{
              background: "linear-gradient(135deg, rgba(212,175,55,0.22), rgba(91,44,143,0.28))",
              border:     "0.5px solid rgba(212,175,55,0.40)",
              boxShadow:  "0 0 32px rgba(212,175,55,0.12)",
            }}
          >
            <Sparkles className="w-6 h-6" style={{ color: "#D4AF37" }} />
          </motion.div>

          <h3
            className="text-2xl font-medium text-white mb-2"
            style={{ fontFamily: "var(--font-cormorant), serif" }}
          >
            Karta Astrologiczna
          </h3>
          {isPremiumUser ? (
            <p className="text-slate-500 text-sm mb-7 max-w-sm mx-auto">
              8 głębokich modułów interpretacji Twojego kosmogramu.
            </p>
          ) : (
            <>
              <p className="text-slate-500 text-sm mb-1 max-w-sm mx-auto">
                3 moduły dostępne bezpłatnie · 5 odblokowanych w planie Plus
              </p>
              <p className="text-slate-600 text-xs mb-7 max-w-xs mx-auto">
                Tożsamość · Supermoce · Korzenie
              </p>
            </>
          )}

          <motion.button
            onClick={handleGenerate}
            whileHover={{ boxShadow: "0 0 32px rgba(212,175,55,0.32), 0 0 64px rgba(212,175,55,0.10)", y: -1 }}
            whileTap={{ scale: 0.98 }}
            className="px-8 py-3.5 rounded-2xl text-sm font-semibold tracking-wide"
            style={{
              background: "linear-gradient(135deg, rgba(212,175,55,0.92), rgba(197,160,89,0.92))",
              color:      "#050508",
              border:     "0.5px solid rgba(212,175,55,0.65)",
            }}
          >
            {isPremiumUser ? "Generuj Kartę Astrologiczną" : "Generuj 3 moduły"}
          </motion.button>
        </motion.div>
      )}

      {/* ── Loading ── */}
      {loading && (
        <div
          className="rounded-2xl p-16 text-center"
          style={{ background: "rgba(5,4,14,0.65)", border: "0.5px solid rgba(212,175,55,0.14)" }}
        >
          <div
            className="w-12 h-12 rounded-full animate-spin border-2 mx-auto mb-4"
            style={{ borderColor: "rgba(212,175,55,0.12)", borderTopColor: "#D4AF37" }}
          />
          <p className="text-slate-400 text-sm mb-1">Generuję Twoją Kartę Astrologiczną…</p>
          <p className="text-slate-600 text-xs">
            {isPremiumUser ? "8 modułów · może zająć 20–40 s" : "3 moduły · może zająć 10–20 s"}
          </p>
        </div>
      )}

      {/* ── Error ── */}
      {error && !loading && !generated && (
        <div className="p-3 rounded-xl text-xs text-center" style={{ background: "rgba(239,68,68,0.07)", border: "0.5px solid rgba(239,68,68,0.20)", color: "#fca5a5" }}>
          {error}
        </div>
      )}

      {/* ── Module grid ── */}
      <AnimatePresence>
        {generated && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center mb-2"
            >
              <p className="text-[10px] uppercase tracking-[0.28em]" style={{ color: "rgba(212,175,55,0.45)" }}>
                8 rozdziałów o Tobie
              </p>
            </motion.div>

            <ModuleNav visibleIds={modules.map(m => m.id as ModuleId)} />

            <div className="flex flex-col gap-5 max-w-[70ch] mx-auto">
              {/* Generated modules */}
              {modules.map((mod, i) => (
                <ModuleCard
                  key={mod.id}
                  module={mod}
                  isPremiumUser={isPremiumUser}
                  index={i}
                  sourceChips={getSourceChips(mod.id as ModuleId, reading.chart_data)}
                  onPaywall={() => setShowPaywall(true)}
                />
              ))}

              {/* Failed modules — partial failure */}
              {failedIds.map((id, i) => (
                <FailedModulePlaceholder
                  key={`failed-${id}`}
                  title={MODULE_SPECS[id].title_pl}
                  index={modules.length + i}
                  onRetry={() => handleRetryModule(id)}
                />
              ))}

              {/* Locked placeholders for free users */}
              {lockedPlaceholders.map((id, i) => (
                <LockedModulePlaceholder
                  key={id}
                  title={MODULE_SPECS[id].title_pl}
                  index={modules.length + failedIds.length + i}
                  onPaywall={() => setShowPaywall(true)}
                />
              ))}
            </div>

            {/* Upgrade nudge for free users */}
            {!isPremiumUser && lockedPlaceholders.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="rounded-2xl p-5 text-center"
                style={{ background: "rgba(212,175,55,0.05)", border: "0.5px solid rgba(212,175,55,0.18)" }}
              >
                <p className="text-sm text-slate-400 mb-3">
                  Odblokuj <span style={{ color: "#D4AF37" }}>5 pozostałych modułów</span> — Miłość, Karierę, Cienie, Korzenie i Misję życia.
                </p>
                <button
                  onClick={() => setShowPaywall(true)}
                  className="px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-200"
                  style={{
                    background: "linear-gradient(135deg, rgba(212,175,55,0.85), rgba(197,160,89,0.85))",
                    color: "#050508",
                  }}
                >
                  Przejdź na Plus →
                </button>
              </motion.div>
            )}
          </>
        )}
      </AnimatePresence>

      {showPaywall && (
        <PaywallModal
          onClose={() => setShowPaywall(false)}
          reason="Odblokuj wszystkie 8 modułów Karty Astrologicznej."
        />
      )}
    </div>
  );
}
