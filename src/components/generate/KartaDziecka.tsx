"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sun, Moon, Sprout, Star, Heart, Users, Lock, Baby } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import ModuleCard from "./ModuleCard";
import ModuleNav from "./ModuleNav";
import LockedModulePlaceholder from "./LockedModulePlaceholder";
import PaywallModal from "@/components/PaywallModal";
import { useAuth } from "@/components/AuthContext";
import {
  ALL_CHILD_MODULE_IDS, CHILD_MODULE_SPECS,
  type ChildModule, type ChildModuleId,
} from "@/lib/schemas/childModule";
import type { AstroModule } from "@/lib/schemas/astroModule";
import type { NatalChart } from "@/lib/astro-types";
import type { ChartPlacement, NatalAspect, ChartNodes } from "@/lib/chart-engine";

type ChildData = {
  id:             string;
  name:           string;
  chart_data:     NatalChart;
  interpretation: string;
};

interface Props {
  child:            ChildData;
  isPremiumUser:    boolean;
  onChildUpdated?:  (childId: string, interpretation: string) => void;
}

// ── Config ────────────────────────────────────────────────────────────────────

const CHILD_SHORT_NAMES: Record<ChildModuleId, string> = {
  temperament: "Temperament",
  emotions:    "Emocje",
  learning:    "Poznawanie",
  talents:     "Talenty",
  parenting:   "Rodzic",
  peers:       "Rówieśnicy",
};

const CHILD_ICON: Record<ChildModuleId, LucideIcon> = {
  temperament: Sun,
  emotions:    Moon,
  learning:    Sprout,
  talents:     Star,
  parenting:   Heart,
  peers:       Users,
};

const CHILD_SOURCE_PLANETS: Record<ChildModuleId, string[]> = {
  temperament: ["Słońce", "Ascendent"],
  emotions:    ["Księżyc"],
  learning:    ["Merkury"],
  talents:     ["Słońce", "Jowisz"],
  parenting:   ["Księżyc", "Saturn"],
  peers:       ["Wenus", "Mars"],
};

function getSourceChips(moduleId: ChildModuleId, chart: NatalChart): string[] {
  return (CHILD_SOURCE_PLANETS[moduleId] ?? [])
    .map(name => {
      const p = chart.planets.find(pl => pl.name === name);
      return p ? `${name} w ${p.sign}` : null;
    })
    .filter((s): s is string => s !== null);
}

// ── Parse ────────────────────────────────────────────────────────────────────

function parseModules(interpretation: string): ChildModule[] | null {
  if (!interpretation?.trim()) return null;
  try {
    const parsed = JSON.parse(interpretation) as unknown;
    if (Array.isArray(parsed) && parsed.length > 0 && typeof (parsed[0] as { id?: unknown }).id === "string") {
      return parsed as ChildModule[];
    }
    return null;
  } catch {
    return null;
  }
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function KartaDziecka({ child, isPremiumUser, onChildUpdated }: Props) {
  const { session } = useAuth();
  const [showPaywall,   setShowPaywall]   = useState(false);
  const [localModules,  setLocalModules]  = useState<ChildModule[] | null>(null);
  const [generating,    setGenerating]    = useState(false);
  const [genError,      setGenError]      = useState("");

  const modules     = localModules ?? parseModules(child.interpretation);
  const isStructured = modules !== null;

  const generatedIds = isStructured ? modules.map(m => m.id) : [];
  const lockedPlaceholderIds = isStructured
    ? ALL_CHILD_MODULE_IDS.filter(id => CHILD_MODULE_SPECS[id].isPremium && !generatedIds.includes(id))
    : [];

  const visibleIds = isStructured
    ? modules.filter(m => !m.isPremium || isPremiumUser).map(m => m.id)
    : [];

  // ── Generate v2 from legacy/empty record ─────────────────────────────────

  async function handleGenerate() {
    if (!session) return;
    setGenerating(true);
    setGenError("");

    const authHeader = { Authorization: `Bearer ${session.access_token}` };
    const bd = child.chart_data.birthData;

    try {
      const chartRes = await fetch("/api/chart", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ date: bd.date, time: bd.time, lat: bd.lat, lng: bd.lng, place: bd.place }),
      });
      if (!chartRes.ok) throw new Error("Błąd obliczania kosmogramu");
      const { placements, aspects, nodes } = await chartRes.json() as {
        placements: ChartPlacement[]; aspects: NatalAspect[]; nodes: ChartNodes;
      };

      const aiRes = await fetch("/api/ai-child", {
        method:  "POST",
        headers: { "Content-Type": "application/json", ...authHeader },
        body:    JSON.stringify({ name: child.name, birthDate: bd.date, placements, aspects, nodes }),
      });
      if (!aiRes.ok) {
        const e = await aiRes.json().catch(() => ({})) as { error?: string };
        throw new Error(e.error ?? "Błąd generowania interpretacji");
      }
      const { modules: newModules } = await aiRes.json() as { modules: ChildModule[] };
      if (!newModules?.length) throw new Error("Brak wyników — spróbuj ponownie");

      const interpretation = JSON.stringify(newModules);

      await fetch("/api/update-child", {
        method:  "POST",
        headers: { "Content-Type": "application/json", ...authHeader },
        body:    JSON.stringify({ id: child.id, interpretation }),
      });

      setLocalModules(newModules);
      onChildUpdated?.(child.id, interpretation);
    } catch (err) {
      setGenError(err instanceof Error ? err.message : "Nieznany błąd");
    } finally {
      setGenerating(false);
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5">

      {/* ── Eyebrow + heading ── */}
      <div className="text-center">
        <p className="text-[10px] uppercase tracking-[0.28em]" style={{ color: "rgba(224,181,102,0.45)" }}>
          Karta dziecka
        </p>
        <h3
          className="text-xl font-medium mt-1"
          style={{ fontFamily: "var(--font-fraunces), serif", color: "var(--text-primary)" }}
        >
          Co mówi niebo o {child.name}
        </h3>
      </div>

      {/* ── Module nav (structured mode only) ── */}
      <AnimatePresence>
        {isStructured && visibleIds.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <ModuleNav
              visibleIds={visibleIds}
              allIds={ALL_CHILD_MODULE_IDS}
              shortNames={CHILD_SHORT_NAMES}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col gap-5 max-w-[70ch] mx-auto">

        {/* ── STRUCTURED MODE — 6 ModuleCards ── */}
        {isStructured && modules.map((mod, i) => {
          const isLocked = mod.isPremium && !isPremiumUser;
          const icon     = CHILD_ICON[mod.id as ChildModuleId];
          const chips    = getSourceChips(mod.id as ChildModuleId, child.chart_data);

          if (isLocked) {
            return (
              <div key={mod.id} id={`module-${mod.id}`}>
                <LockedModulePlaceholder
                  title={mod.title}
                  index={i}
                  onPaywall={() => setShowPaywall(true)}
                />
              </div>
            );
          }

          return (
            <ModuleCard
              key={mod.id}
              module={mod as unknown as AstroModule}
              isPremiumUser={isPremiumUser}
              index={i}
              sourceChips={chips}
              iconOverride={icon}
              onPaywall={() => setShowPaywall(true)}
            />
          );
        })}

        {/* Any remaining locked placeholders (structured, not-yet-generated premium) */}
        {isStructured && lockedPlaceholderIds.map((id, i) => (
          <div key={`locked-${id}`} id={`module-${id}`}>
            <LockedModulePlaceholder
              title={CHILD_MODULE_SPECS[id].title}
              index={modules.length + i}
              onPaywall={() => setShowPaywall(true)}
            />
          </div>
        ))}

        {/* ── LEGACY / EMPTY MODE — CTA to generate v2 ── */}
        {!isStructured && !generating && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="rounded-2xl p-8 sm:p-10 text-center"
            style={{
              background:     "radial-gradient(ellipse at 50% 0%, rgba(224,181,102,0.07) 0%, rgba(11,9,18,0.70) 100%)",
              border:         "0.5px solid rgba(224,181,102,0.18)",
              backdropFilter: "blur(18px)",
            }}
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.15, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5"
              style={{
                background: "rgba(224,181,102,0.10)",
                border:     "0.5px solid rgba(224,181,102,0.35)",
              }}
            >
              <Baby className="w-6 h-6" style={{ color: "#E0B566" }} />
            </motion.div>

            <h3
              className="text-xl font-medium text-white mb-2"
              style={{ fontFamily: "var(--font-fraunces), serif" }}
            >
              Karta dziecka
            </h3>
            <p className="text-slate-500 text-sm mb-2 max-w-xs mx-auto">
              Temperament · Emocje · Uczenie się · Talenty
            </p>
            <p className="text-slate-600 text-xs mb-7 max-w-xs mx-auto">
              1 moduł bezpłatny · 5 odblokowanych w planie Plus
            </p>

            {genError && (
              <p className="text-red-400 text-xs mb-4">{genError}</p>
            )}

            <motion.button
              onClick={handleGenerate}
              whileHover={{ boxShadow: "0 0 32px rgba(224,181,102,0.30), 0 0 64px rgba(224,181,102,0.10)", y: -1 }}
              whileTap={{ scale: 0.98 }}
              className="px-8 py-3.5 rounded-2xl text-sm font-semibold tracking-wide"
              style={{
                background: "linear-gradient(135deg, rgba(224,181,102,0.92), rgba(224,181,102,0.92))",
                color:      "#0B0912",
                border:     "0.5px solid rgba(224,181,102,0.65)",
              }}
            >
              Generuj Kartę dziecka
            </motion.button>
          </motion.div>
        )}

        {/* ── Generating spinner ── */}
        {!isStructured && generating && (
          <div
            className="rounded-2xl p-16 text-center"
            style={{ background: "rgba(11,9,18,0.65)", border: "0.5px solid rgba(224,181,102,0.14)" }}
          >
            <div
              className="w-12 h-12 rounded-full animate-spin border-2 mx-auto mb-4"
              style={{ borderColor: "rgba(224,181,102,0.12)", borderTopColor: "#E0B566" }}
            />
            <p className="text-slate-400 text-sm mb-1">Generuję Kartę dziecka…</p>
            <p className="text-slate-600 text-xs">6 modułów · może zająć 20–40 s</p>
          </div>
        )}
      </div>

      {/* ── Upgrade nudge (structured + free user) ── */}
      {isStructured && !isPremiumUser && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="rounded-2xl p-5 text-center"
          style={{ background: "rgba(224,181,102,0.05)", border: "0.5px solid rgba(224,181,102,0.18)" }}
        >
          <div className="flex items-center justify-center gap-1.5 mb-2">
            <Lock className="w-3.5 h-3.5" style={{ color: "#E0B566" }} />
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              Odblokuj <span style={{ color: "#E0B566" }}>5 modułów</span> — emocje, poznawanie, talenty, wskazówki dla rodzica i rówieśnicy.
            </p>
          </div>
          <button
            onClick={() => setShowPaywall(true)}
            className="mt-2 px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-200"
            style={{ background: "linear-gradient(135deg, rgba(224,181,102,0.85), rgba(224,181,102,0.85))", color: "#0B0912" }}
          >
            Przejdź na Plus →
          </button>
        </motion.div>
      )}

      {showPaywall && (
        <PaywallModal onClose={() => setShowPaywall(false)} reason="Odblokuj wszystkie 6 modułów Karty dziecka." />
      )}
    </div>
  );
}
